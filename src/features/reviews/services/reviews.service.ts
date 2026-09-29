import { AppError, toAppError } from '@/shared/lib/errors';
import { isPresent, requireFields } from '@/shared/lib/rows';
import { supabase } from '@/shared/lib/supabase';
import type { ReviewValues } from '../schemas';

const REVIEWS_SHOWN = 20;

/** Avaliações recebidas, mais recentes primeiro, com o nome e a foto de quem avaliou. */
export async function listReviews(revieweeId: string) {
  const { data, error } = await supabase
    .from('review_cards')
    .select('id, rating, comment, created_at, by_restaurant, reviewer_name, reviewer_photo_path')
    .eq('reviewee_id', revieweeId)
    .order('created_at', { ascending: false })
    .limit(REVIEWS_SHOWN);
  if (error) throw await toAppError(error);
  return data
    .map((row) =>
      requireFields(row, ['id', 'rating', 'created_at', 'by_restaurant', 'reviewer_name']),
    )
    .filter(isPresent);
}

export type ReviewCard = Awaited<ReturnType<typeof listReviews>>[number];

/** A avaliação que a pessoa já deixou neste freela, se houver. */
export async function getMyGigReview({ gigId, reviewerId }: { gigId: string; reviewerId: string }) {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating, comment')
    .eq('gig_id', gigId)
    .eq('reviewer_id', reviewerId)
    .maybeSingle();
  if (error) throw await toAppError(error);
  return data;
}

/** A RLS só aceita depois do check-out, de uma parte do freela avaliando a outra. */
export async function createReview({
  gigId,
  revieweeId,
  values,
}: {
  gigId: string;
  revieweeId: string;
  values: ReviewValues;
}): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    gig_id: gigId,
    reviewee_id: revieweeId,
    rating: values.rating,
    comment: values.comment || null,
  });
  if (error?.code === '23505') throw new AppError('already_reviewed');
  if (error) throw await toAppError(error);
}
