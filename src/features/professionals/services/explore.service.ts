import { pageRange } from '@/shared/hooks/usePagedQuery';
import { toAppError } from '@/shared/lib/errors';
import { normalizeSearch } from '@/shared/lib/format';
import type { JobRole } from '@/shared/lib/labels';
import { isPresent, requireFields } from '@/shared/lib/rows';
import { supabase } from '@/shared/lib/supabase';

export type ProfessionalFilters = { role: JobRole | null; query: string };

/** Vitrine do restaurante: mais perto primeiro (distância calculada no banco). */
export async function searchProfessionals(filters: ProfessionalFilters, page: number) {
  let request = supabase
    .from('professional_cards')
    .select(
      'id, full_name, photo_path, main_role, neighborhood, city, state, available_for_gigs, rating_avg, rating_count, distance_km',
    )
    .order('distance_km', { ascending: true, nullsFirst: false })
    .order('rating_avg', { ascending: false })
    .range(...pageRange(page));

  if (filters.role) {
    request = request.or(`main_role.eq.${filters.role},secondary_roles.cs.{${filters.role}}`);
  }
  const query = normalizeSearch(filters.query);
  if (query) request = request.ilike('search_name', `%${query}%`);

  const { data, error } = await request;
  if (error) throw await toAppError(error);
  return data
    .map((row) =>
      requireFields(row, [
        'id',
        'full_name',
        'main_role',
        'city',
        'state',
        'available_for_gigs',
        'rating_avg',
        'rating_count',
      ]),
    )
    .filter(isPresent);
}

export type ProfessionalCardData = Awaited<ReturnType<typeof searchProfessionals>>[number];
