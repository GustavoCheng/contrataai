import { usePagedQuery } from '@/shared/hooks/usePagedQuery';
import { searchProfessionals, type ProfessionalFilters } from '../services/explore.service';

export function useProfessionalSearch(filters: ProfessionalFilters) {
  return usePagedQuery(['professional-search', filters], (page) =>
    searchProfessionals(filters, page),
  );
}
