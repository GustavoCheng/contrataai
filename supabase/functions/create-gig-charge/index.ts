import { createPixCharge, findOrCreateCustomer, getPixQrCode } from '../_shared/asaas.ts';
import { loadOwnGig } from '../_shared/gig.ts';
import { handle, HttpError } from '../_shared/http.ts';

/** Pix com o valor retido até a liberação; chamar de novo devolve a cobrança pendente. */
export default handle('user', async (req, ctx) => {
  const gig = await loadOwnGig(req, ctx);
  if (gig.payments?.status === 'received') throw new HttpError(409, 'already_paid');
  if (gig.status !== 'confirmed') throw new HttpError(409, 'gig_not_payable');

  let chargeId = gig.payments?.charge_id;
  if (!chargeId) {
    const customerId = await findOrCreateCustomer({
      name: gig.restaurants.legal_name,
      cnpj: gig.restaurants.cnpj,
    });
    const charge = await createPixCharge({
      customerId,
      amountCents: gig.amount_cents,
      description: 'Freela ContrataAí (valor retido até o fim do turno)',
      externalReference: gig.id,
    });
    chargeId = charge.id;
  }

  const qr = await getPixQrCode(chargeId);
  if (!gig.payments) {
    const { error } = await ctx.supabaseAdmin.from('payments').insert({
      gig_id: gig.id,
      amount_cents: gig.amount_cents,
      charge_id: chargeId,
      pix_copy_paste: qr.payload,
    });
    if (error) throw error;
  }

  return Response.json({ copyPaste: qr.payload, qrCodeImage: qr.encodedImage });
});
