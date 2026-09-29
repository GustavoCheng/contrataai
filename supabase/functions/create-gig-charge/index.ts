import '@supabase/functions-js/edge-runtime.d.ts';
import { type SupabaseContext, withSupabase } from '@supabase/server';
import { createPixCharge, findOrCreateCustomer, getPixQrCode } from '../_shared/asaas.ts';
import type { Database } from '../_shared/database.types.ts';
import { loadGig } from '../_shared/gig.ts';
import { callerId, handleErrors, HttpError, readGigId } from '../_shared/http.ts';

/**
 * Restaurante paga o freela confirmado: cobrança Pix no Asaas cujo valor fica retido na
 * plataforma até a liberação. Chamar de novo devolve a mesma cobrança pendente.
 */
export default {
  fetch: withSupabase<Database>(
    { auth: 'user' },
    handleErrors(async (req, ctx: SupabaseContext<Database>) => {
      const admin = ctx.supabaseAdmin;
      const gig = await loadGig(admin, await readGigId(req));
      if (gig.restaurant_id !== callerId(ctx)) throw new HttpError(403, 'forbidden');
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
        const { error } = await admin.from('payments').insert({
          gig_id: gig.id,
          amount_cents: gig.amount_cents,
          charge_id: chargeId,
          pix_copy_paste: qr.payload,
        });
        if (error) throw error;
      }

      return Response.json({
        copyPaste: qr.payload,
        qrCodeImage: qr.encodedImage,
        expiresAt: qr.expirationDate,
      });
    }),
  ),
};
