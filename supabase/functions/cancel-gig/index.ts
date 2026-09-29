import { deleteCharge } from '../_shared/asaas.ts';
import { loadOwnGig, moveGig, refundPayment } from '../_shared/gig.ts';
import { handle, HttpError } from '../_shared/http.ts';

const CANCELLABLE = ['open', 'confirmed', 'paid_held'] as const;

/**
 * Só o restaurante cancela, até o check-in. Cobrança pendente é cancelada no Asaas;
 * se já foi paga, o estorno é integral.
 */
export default handle('user', async (req, ctx) => {
  const admin = ctx.supabaseAdmin;
  const gig = await loadOwnGig(req, ctx);
  const status = CANCELLABLE.find((allowed) => allowed === gig.status);
  if (!status) throw new HttpError(409, 'gig_not_cancellable');

  const payment = gig.payments;
  if (payment?.status === 'received') {
    await refundPayment(admin, payment.charge_id);
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
});
