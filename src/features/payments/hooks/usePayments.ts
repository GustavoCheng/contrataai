import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGigCharge, releaseGigPayment } from '../services/payments.service';

/** Gera (ou recupera) o Pix; o freela muda de estado sozinho quando o pagamento cai (Realtime). */
export function useGigCharge(gigId: string) {
  return useMutation({ mutationFn: () => createGigCharge(gigId) });
}

export function useReleaseGigPayment(gigId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => releaseGigPayment(gigId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gig', gigId] }),
        queryClient.invalidateQueries({ queryKey: ['restaurant-gigs'] }),
      ]),
  });
}
