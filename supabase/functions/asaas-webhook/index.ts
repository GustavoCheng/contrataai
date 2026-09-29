import { z } from 'zod';
import { moveGig, refundPayment } from '../_shared/gig.ts';
import { type Admin, handle, HttpError, readBody } from '../_shared/http.ts';

const eventSchema = z.object({
  event: z.string(),
  payment: z.object({ id: z.string() }).optional(),
  transfer: z.object({ id: z.string() }).optional(),
});

/**
 * Eventos do Asaas, autenticados pelo token do webhook (header asaas-access-token). O Asaas
 * entrega "pelo menos uma vez": o Pix recebido só vale a partir de "pendente" e os demais
 * eventos gravam um estado final, então um evento repetido não muda nada.
 */
export default handle('none', async (req, ctx) => {
  const expected = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
  const received = req.headers.get('asaas-access-token');
  if (!expected || !received || !sameToken(received, expected)) {
    throw new HttpError(401, 'unauthorized');
  }

  const { event, payment, transfer } = await readBody(req, eventSchema);
  const admin = ctx.supabaseAdmin;

  if ((event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') && payment) {
    await onPaymentReceived(admin, payment.id);
  } else if (event === 'PAYMENT_REFUNDED' && payment) {
    await admin.from('payments').update({ status: 'refunded' }).eq('charge_id', payment.id);
  } else if (event === 'TRANSFER_DONE' && transfer) {
    await admin.from('payments').update({ payout_status: 'done' }).eq('payout_id', transfer.id);
  } else if ((event === 'TRANSFER_FAILED' || event === 'TRANSFER_CANCELLED') && transfer) {
    await admin.from('payments').update({ payout_status: 'failed' }).eq('payout_id', transfer.id);
  }
  return Response.json({ received: true });
});

async function onPaymentReceived(admin: Admin, chargeId: string) {
  const { data: payment, error } = await admin
    .from('payments')
    .update({ status: 'received' })
    .eq('charge_id', chargeId)
    .eq('status', 'pending')
    .select('gig_id')
    .maybeSingle();
  if (error) throw error;
  if (!payment) return; // evento repetido ou cobrança que não é nossa

  // O chamado foi cancelado enquanto o Pix era pago: o dinheiro volta ao restaurante.
  if (!(await moveGig(admin, payment.gig_id, 'confirmed', 'paid_held'))) {
    await refundPayment(admin, chargeId);
  }
}

/** Comparação em tempo constante, para o token não vazar por tempo de resposta. */
function sameToken(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  return left.reduce((diff, byte, index) => diff | (byte ^ right[index]), 0) === 0;
}
