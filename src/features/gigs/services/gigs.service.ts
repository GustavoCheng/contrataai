import type { Enums } from '@/shared/lib/database.types';
import { AppError, toAppError } from '@/shared/lib/errors';
import { reaisToCents } from '@/shared/lib/format';
import { supabase } from '@/shared/lib/supabase';
import { toShiftDates } from '../schedule';
import type { GigFormValues } from '../schemas';

export async function listRestaurantGigs(restaurantId: string) {
  const { data, error } = await supabase
    .from('gigs')
    .select(
      'id, role, starts_at, ends_at, amount_cents, status, gig_applications(count), professionals!gigs_professional_id_fkey(full_name)',
    )
    .eq('restaurant_id', restaurantId)
    .order('starts_at', { ascending: false });
  if (error) throw await toAppError(error);
  return data;
}

export type RestaurantGig = Awaited<ReturnType<typeof listRestaurantGigs>>[number];

export async function getGig(id: string) {
  const { data, error } = await supabase
    .from('gigs')
    .select(
      'id, restaurant_id, role, starts_at, ends_at, amount_cents, status, professional_id, created_at, confirmed_at, paid_at, checked_in_at, checked_out_at, released_at, cancelled_at, disputed_at, restaurants(id, name, cover_path, neighborhood, city, state, rating_avg, rating_count), professionals!gigs_professional_id_fkey(id, full_name, photo_path, main_role, rating_avg, rating_count), payments(status, payout_status)',
    )
    .eq('id', id)
    .single();
  if (error) throw await toAppError(error);
  return data;
}

export type Gig = Awaited<ReturnType<typeof getGig>>;

export async function listGigApplications(gigId: string) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      'status, created_at, professionals(id, full_name, photo_path, main_role, neighborhood, city, rating_avg, rating_count)',
    )
    .eq('gig_id', gigId)
    .order('created_at');
  if (error) throw await toAppError(error);
  return data;
}

export async function createGig({
  restaurantId,
  values,
}: {
  restaurantId: string;
  values: GigFormValues;
}): Promise<string> {
  const { startsAt, endsAt } = toShiftDates(values.day, values.startTime, values.endTime);
  const { data, error } = await supabase
    .from('gigs')
    .insert({
      restaurant_id: restaurantId,
      role: values.role,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      amount_cents: reaisToCents(values.amount),
    })
    .select('id')
    .single();
  if (error) throw await toAppError(error);
  return data.id;
}

/** Confirma um dos aceites: recusa os demais e abre a conversa (RPC no banco). */
export async function confirmGigProfessional({
  gigId,
  professionalId,
}: {
  gigId: string;
  professionalId: string;
}): Promise<void> {
  const { error } = await supabase.rpc('confirm_gig_professional', {
    p_gig_id: gigId,
    p_professional_id: professionalId,
  });
  if (error) throw await toAppError(error);
}

/** Aceite em um toque. A RLS exige chamado aberto e chave Pix cadastrada. */
export async function acceptGig({
  gigId,
  professionalId,
}: {
  gigId: string;
  professionalId: string;
}): Promise<void> {
  const { error } = await supabase
    .from('gig_applications')
    .insert({ gig_id: gigId, professional_id: professionalId });
  if (error?.code === '23505') throw new AppError('already_accepted');
  if (error?.code === '42501') throw new AppError('gig_unavailable');
  if (error) throw await toAppError(error);
}

export async function listMyGigApplications(professionalId: string) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      'status, created_at, gigs(id, role, starts_at, ends_at, amount_cents, status, restaurants(name, cover_path))',
    )
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false });
  if (error) throw await toAppError(error);
  return data;
}

export type CheckpointKind = Enums<'checkpoint_kind'>;

/** Código de 4 dígitos que o restaurante mostra e o freelancer digita. */
export type Checkpoint = { kind: CheckpointKind; code: string; expiresAt: string };

/**
 * Código da etapa: check-in com o pagamento retido, check-out depois do check-in (RPC no banco).
 * Devolve o mesmo código enquanto ele valer (10 minutos); `renew` pede outro.
 */
export async function issueCheckpoint({
  gigId,
  renew = false,
}: {
  gigId: string;
  renew?: boolean;
}): Promise<Checkpoint> {
  const { data, error } = await supabase
    .rpc('issue_gig_checkpoint', { p_gig_id: gigId, p_renew: renew })
    .single();
  if (error) throw await toAppError(error);
  return { kind: data.kind, code: data.code, expiresAt: data.expires_at };
}

const checkpointErrors = {
  invalid_code: 'checkpoint_invalid',
  locked: 'checkpoint_locked',
  expired: 'checkpoint_expired',
} as const;

/** Freelancer confirmado digita o código; o banco confere, conta os erros e avança o freela. */
export async function redeemCheckpoint({
  gigId,
  code,
}: {
  gigId: string;
  code: string;
}): Promise<void> {
  const { data: outcome, error } = await supabase.rpc('redeem_gig_checkpoint', {
    p_gig_id: gigId,
    p_code: code,
  });
  if (error) throw await toAppError(error);
  if (outcome !== 'checked_in' && outcome !== 'checked_out') {
    throw new AppError(checkpointErrors[outcome]);
  }
}

/** Só o restaurante, até o check-in. Se o Pix já foi pago, o estorno é integral. */
export async function cancelGig(gigId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('cancel-gig', { body: { gigId } });
  if (error) throw await toAppError(error);
}

/** Qualquer das partes, entre o pagamento e a liberação: o valor fica retido (RPC no banco). */
export async function openGigDispute(gigId: string): Promise<void> {
  const { error } = await supabase.rpc('open_gig_dispute', { p_gig_id: gigId });
  if (error) throw await toAppError(error);
}

/**
 * Avisa quando o chamado, os aceites ou o pagamento (repasse) mudam (Realtime com RLS).
 * Devolve o cancelamento.
 */
export function subscribeToGig(gigId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`gig-${gigId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'gigs', filter: `id=eq.${gigId}` },
      onChange,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'gig_applications', filter: `gig_id=eq.${gigId}` },
      onChange,
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'payments', filter: `gig_id=eq.${gigId}` },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
