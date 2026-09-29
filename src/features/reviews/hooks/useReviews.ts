import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidate, sharedKeys } from '@/shared/lib/query-client';
import type { ReviewValues } from '../schemas';
import { createReview, getMyGigReview, listReviews } from '../services/reviews.service';

const reviewKeys = {
  list: (revieweeId: string) => ['reviews', revieweeId] as const,
  mine: (gigId: string, reviewerId: string) => ['my-review', gigId, reviewerId] as const,
};

export function useReviews(revieweeId: string) {
  return useQuery({
    queryKey: reviewKeys.list(revieweeId),
    queryFn: () => listReviews(revieweeId),
  });
}

export function useMyGigReview(gigId: string, reviewerId: string) {
  return useQuery({
    queryKey: reviewKeys.mine(gigId, reviewerId),
    queryFn: () => getMyGigReview({ gigId, reviewerId }),
  });
}

/** Ao avaliar, a nota média do perfil avaliado muda (trigger no banco). */
export function useCreateReview({
  gigId,
  reviewerId,
  revieweeId,
}: {
  gigId: string;
  reviewerId: string;
  revieweeId: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ReviewValues) => createReview({ gigId, revieweeId, values }),
    onSuccess: () =>
      invalidate(queryClient, [
        reviewKeys.mine(gigId, reviewerId),
        reviewKeys.list(revieweeId),
        sharedKeys.restaurant(revieweeId),
        sharedKeys.professional(revieweeId),
        sharedKeys.gig(gigId),
      ]),
  });
}
