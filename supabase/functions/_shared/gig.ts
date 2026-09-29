import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.ts';
import { HttpError } from './http.ts';

/** Carrega o chamado com o que as funções de pagamento precisam. */
export async function loadGig(admin: SupabaseClient<Database>, gigId: string) {
  const { data, error } = await admin
    .from('gigs')
    .select(
      'id, restaurant_id, professional_id, role, starts_at, amount_cents, status, restaurants(cnpj, legal_name), payments(charge_id, status, platform_fee_cents, payout_id)',
    )
    .eq('id', gigId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'gig_not_found');
  return data;
}

export type LoadedGig = Awaited<ReturnType<typeof loadGig>>;

/** Troca de estado condicional: só vale se o chamado ainda estiver no estado esperado. */
export async function moveGig(
  admin: SupabaseClient<Database>,
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
