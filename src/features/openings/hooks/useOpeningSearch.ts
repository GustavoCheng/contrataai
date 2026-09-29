import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { searchOpenings, type OpeningFilters } from '../services/openings.service';

export function useOpeningSearch(filters: OpeningFilters) {
  return usePagedQuery(['openings', filters], (page) => searchOpenings(filters, page));
}
