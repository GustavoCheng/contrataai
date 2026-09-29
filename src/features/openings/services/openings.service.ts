import { pageRange } from '@/shared/hooks/usePagedQuery';
import type { Enums } from '@/shared/lib/database.types';
import { toAppError } from '@/shared/lib/errors';
import { normalizeSearch } from '@/shared/lib/format';
import type { JobRole } from '@/shared/lib/labels';
import { isPresent, requireFields } from '@/shared/lib/rows';
import { supabase } from '@/shared/lib/supabase';

export type OpeningKind = Enums<'opening_kind'>;
export type OpeningFilters = { kind: OpeningKind | null; role: JobRole | null; city: string };

/** Vitrine do profissional: vagas fixas e freelas abertos, mais perto primeiro. */
export async function searchOpenings(filters: OpeningFilters, page: number) {
  let request = supabase
    .from('openings')
    .select(
      'kind, id, role, shift, pay_cents, pay_max_cents, starts_at, ends_at, created_at, restaurant_name, cover_path, neighborhood, city, rating_avg, rating_count, distance_km',
    )
    .order('distance_km', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(...pageRange(page));

  if (filters.kind) request = request.eq('kind', filters.kind);
  if (filters.role) request = request.eq('role', filters.role);
  const city = normalizeSearch(filters.city);
  if (city) request = request.ilike('city_key', `${city}%`);

  const { data, error } = await request;
  if (error) throw await toAppError(error);
  return data
    .map((row) =>
      requireFields(row, [
        'kind',
        'id',
        'role',
        'pay_cents',
        'restaurant_name',
        'city',
        'rating_avg',
        'rating_count',
      ]),
    )
    .filter(isPresent);
}

export type Opening = Awaited<ReturnType<typeof searchOpenings>>[number];
