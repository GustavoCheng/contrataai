import '@supabase/functions-js/edge-runtime.d.ts';
import { type SupabaseContext, withSupabase } from '@supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { refundCharge } from '../_shared/asaas.ts';
import type { Database } from '../_shared/database.types.ts';
import { moveGig } from '../_shared/gig.ts';
import { handleErrors, HttpError } from '../_shared/http.ts';

const eventSchema = z.object({
  event: z.string(),
  payment: z.object({ id: z.string() }).optional(),
  transfer: z.object({ id: z.string() }).optional(),
});

/**
 * Eventos do Asaas. Autenticado pelo token do webhook (header asaas-access-token).
 * O Asaas entrega "pelo menos uma vez": cada atualização só vale a partir do estado esperado.
 */
export default {
  fetch: withSupabase<Database>(
    { auth: 'none' },
    handleErrors(async (req, ctx: SupabaseContext<Database>) => {
      const expected = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
      const received = req.headers.get('asaas-access-token');
      if (!expected || !received || !sameToken(received, expected)) {
        throw new HttpError(401, 'unauthorized');
      }

      const body = eventSchema.safeParse(await req.json().catch(() => null));
      if (!body.success) throw new HttpError(400, 'invalid_input');
      const { event, payment, transfer } = body.data;
      const admin = ctx.supabaseAdmin;

      if ((event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') && payment) {
        await onPaymentReceived(admin, payment.id);
      } else if (event === 'PAYMENT_REFUNDED' && payment) {
        await admin.from('payments').update({ status: 'refunded' }).eq('charge_id', payment.id);
      } else if (event === 'TRANSFER_DONE' && transfer) {
        await admin.from('payments').update({ payout_status: 'done' }).eq('payout_id', transfer.id);
      } else if ((event === 'TRANSFER_FAILED' || event === 'TRANSFER_CANCELLED') && transfer) {
        await admin
          .from('payments')
          .update({ payout_status: 'failed' })
          .eq('payout_id', transfer.id);
      }
      return Response.json({ received: true });
    }),
  ),
};

async function onPaymentReceived(admin: SupabaseClient<Database>, chargeId: string) {
  const { data: payment, error } = await admin
    .from('payments')
    .update({ status: 'received' })
    .eq('charge_id', chargeId)
    .eq('status', 'pending')
    .select('gig_id')
    .maybeSingle();
  if (error) throw error;
  if (!payment) return; // evento repetido ou cobrança que não é nossa

  if (!(await moveGig(admin, payment.gig_id, 'confirmed', 'paid_held'))) {
    // O chamado foi cancelado enquanto o Pix era pago: o dinheiro volta ao restaurante.
    await refundCharge(chargeId);
    await admin.from('payments').update({ status: 'refunded' }).eq('charge_id', chargeId);
  }
}

/** Comparação em tempo constante, para o token não vazar por tempo de resposta. */
function sameToken(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  return left.reduce((diff, byte, index) => diff | (byte ^ right[index]), 0) === 0;
}
