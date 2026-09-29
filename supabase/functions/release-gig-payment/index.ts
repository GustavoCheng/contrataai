import '@supabase/functions-js/edge-runtime.d.ts';
import { type SupabaseContext, withSupabase } from '@supabase/server';
import { createPixTransfer } from '../_shared/asaas.ts';
import type { Database } from '../_shared/database.types.ts';
import { loadGig, moveGig } from '../_shared/gig.ts';
import { callerId, handleErrors, HttpError, readGigId } from '../_shared/http.ts';

/**
 * Restaurante libera o pagamento depois do check-out: transferência Pix do valor retido
 * (menos a taxa da plataforma, hoje 0) para a chave do freelancer.
 */
export default {
  fetch: withSupabase<Database>(
    { auth: 'user' },
    handleErrors(async (req, ctx: SupabaseContext<Database>) => {
      const admin = ctx.supabaseAdmin;
      const gig = await loadGig(admin, await readGigId(req));
      if (gig.restaurant_id !== callerId(ctx)) throw new HttpError(403, 'forbidden');
      if (gig.status !== 'checked_out' || !gig.professional_id) {
        throw new HttpError(409, 'gig_not_releasable');
      }
      const payment = gig.payments;
      if (payment?.status !== 'received') throw new HttpError(409, 'gig_not_releasable');

      // Se a transferência já foi criada (tentativa anterior), não cria outra.
      if (!payment.payout_id) {
        const { data: account, error } = await admin
          .from('payout_accounts')
          .select('pix_key, pix_key_type')
          .eq('professional_id', gig.professional_id)
          .maybeSingle();
        if (error) throw error;
        if (!account) throw new HttpError(422, 'payout_account_missing');

        const transfer = await createPixTransfer({
          amountCents: gig.amount_cents - payment.platform_fee_cents,
          pixKey: account.pix_key,
          pixKeyType: account.pix_key_type,
          description: 'Pagamento de freela ContrataAí',
          externalReference: gig.id,
        });
        const { error: updateError } = await admin
          .from('payments')
          .update({
            payout_id: transfer.id,
            payout_status: transfer.status === 'DONE' ? 'done' : 'pending',
          })
          .eq('gig_id', gig.id);
        if (updateError) throw updateError;
      }

      await moveGig(admin, gig.id, 'checked_out', 'released');
      return Response.json({ status: 'released' });
    }),
  ),
};
