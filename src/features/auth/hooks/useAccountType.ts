import { skipToken, useQuery } from '@tanstack/react-query';
import { getAccountType } from '../services/auth.service';

export function useAccountType(userId: string | undefined) {
  return useQuery({
    queryKey: ['account-type', userId],
    queryFn: userId ? () => getAccountType(userId) : skipToken,
    staleTime: Infinity, // o tipo de conta não muda depois do cadastro
  });
}
