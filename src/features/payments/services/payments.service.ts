import { AppError, unwrap } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

/** Resposta da Edge Function create-gig-charge (imagem do QR em PNG base64). */
export type PixCharge = { copyPaste: string; qrCodeImage: string };

/** Cobrança Pix do freela confirmado; chamar de novo devolve a mesma cobrança pendente. */
export async function createGigCharge(gigId: string): Promise<PixCharge> {
  const charge = await unwrap(
    supabase.functions.invoke<PixCharge>('create-gig-charge', { body: { gigId } }),
  );
  if (!charge) throw new AppError('unknown');
  return charge;
}

/** Depois do check-out: o valor retido vai por Pix para a chave do freelancer. */
export async function releaseGigPayment(gigId: string): Promise<void> {
  await unwrap(supabase.functions.invoke('release-gig-payment', { body: { gigId } }));
}
