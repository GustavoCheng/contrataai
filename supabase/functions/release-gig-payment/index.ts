import { createPixTransfer } from '../_shared/asaas.ts';
import { loadOwnGig, moveGig } from '../_shared/gig.ts';
import { handle, HttpError } from '../_shared/http.ts';

/** Após o check-out: Pix do valor retido (menos a taxa, hoje 0) para a chave do freelancer. */
export default handle('user', async (req, ctx) => {
  const admin = ctx.supabaseAdmin;
  const gig = await loadOwnGig(req, ctx);
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
});
