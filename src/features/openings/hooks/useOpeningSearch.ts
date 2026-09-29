import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { sharedKeys } from '@/shared/lib/query-client';
import { searchOpenings, type OpeningFilters } from '../services/openings.service';

export function useOpeningSearch(filters: OpeningFilters) {
  return usePagedQuery([...sharedKeys.openings, filters], (page) => searchOpenings(filters, page));
}
