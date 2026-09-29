import { toAppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

/** Resposta da Edge Function create-gig-charge (imagem do QR em PNG base64). */
export type PixCharge = { copyPaste: string; qrCodeImage: string };

/** Cobrança Pix do freela confirmado; chamar de novo devolve a mesma cobrança pendente. */
export async function createGigCharge(gigId: string): Promise<PixCharge> {
  const { data, error } = await supabase.functions.invoke<PixCharge>('create-gig-charge', {
    body: { gigId },
  });
  if (error || !data) throw await toAppError(error);
  return data;
}

/** Depois do check-out: o valor retido vai por Pix para a chave do freelancer. */
export async function releaseGigPayment(gigId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('release-gig-payment', { body: { gigId } });
  if (error) throw await toAppError(error);
}
