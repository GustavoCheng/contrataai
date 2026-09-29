import '@supabase/functions-js/edge-runtime.d.ts';
import { type SupabaseContext, withSupabase } from '@supabase/server';
import { deleteCharge, refundCharge } from '../_shared/asaas.ts';
import type { Database } from '../_shared/database.types.ts';
import { loadGig, moveGig } from '../_shared/gig.ts';
import { callerId, handleErrors, HttpError, readGigId } from '../_shared/http.ts';

const CANCELLABLE = ['open', 'confirmed', 'paid_held'] as const;

/**
 * Só o restaurante cancela, até o check-in. Cobrança pendente é cancelada no Asaas;
 * se já foi paga, o estorno é integral.
 */
export default {
  fetch: withSupabase<Database>(
    { auth: 'user' },
    handleErrors(async (req, ctx: SupabaseContext<Database>) => {
      const admin = ctx.supabaseAdmin;
      const gig = await loadGig(admin, await readGigId(req));
      if (gig.restaurant_id !== callerId(ctx)) throw new HttpError(403, 'forbidden');
      const status = CANCELLABLE.find((allowed) => allowed === gig.status);
      if (!status) throw new HttpError(409, 'gig_not_cancellable');

      const payment = gig.payments;
      if (payment?.status === 'received') {
        await refundCharge(payment.charge_id);
        await admin.from('payments').update({ status: 'refunded' }).eq('gig_id', gig.id);
      } else if (payment?.status === 'pending') {
        await deleteCharge(payment.charge_id);
        await admin.from('payments').delete().eq('gig_id', gig.id);
      }

      if (!(await moveGig(admin, gig.id, status, 'cancelled'))) {
        throw new HttpError(409, 'gig_not_cancellable');
      }
      await admin
        .from('gig_applications')
        .update({ status: 'rejected' })
        .eq('gig_id', gig.id)
        .eq('status', 'sent');
      return Response.json({ status: 'cancelled' });
    }),
  ),
};
