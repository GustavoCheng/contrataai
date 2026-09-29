import { z } from 'zod';
import { refundCharge } from './asaas.ts';
import type { Database } from './database.types.ts';
import { type Admin, type Context, HttpError, readBody } from './http.ts';

const bodySchema = z.object({ gigId: z.guid() });

/** Só o restaurante dono do chamado passa daqui. */
export async function loadOwnGig(req: Request, ctx: Context) {
  const { gigId } = await readBody(req, bodySchema);
  const { data, error } = await ctx.supabaseAdmin
    .from('gigs')
    .select(
      'id, restaurant_id, professional_id, amount_cents, status, restaurants(cnpj, legal_name), payments(charge_id, status, platform_fee_cents, payout_id)',
    )
    .eq('id', gigId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'gig_not_found');
  if (!ctx.userClaims) throw new HttpError(401, 'unauthorized');
  if (data.restaurant_id !== ctx.userClaims.id) throw new HttpError(403, 'forbidden');
  return data;
}

/** Troca de estado condicional: só vale se o chamado ainda estiver no estado esperado. */
export async function moveGig(
  admin: Admin,
  gigId: string,
  from: Database['public']['Enums']['gig_status'],
  to: Database['public']['Enums']['gig_status'],
): Promise<boolean> {
  const { data, error } = await admin
    .from('gigs')
    .update({ status: to })
    .eq('id', gigId)
    .eq('status', from)
    .select('id');
  if (error) throw error;
  return data.length > 0;
}

export async function refundPayment(admin: Admin, chargeId: string) {
  await refundCharge(chargeId);
  await admin.from('payments').update({ status: 'refunded' }).eq('charge_id', chargeId);
}
