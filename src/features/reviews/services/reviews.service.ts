import { unwrap } from '@/shared/lib/errors';
import { requireRows } from '@/shared/lib/rows';
import { supabase } from '@/shared/lib/supabase';
import type { ReviewValues } from '../schemas';

const REVIEWS_SHOWN = 20;

/** Avaliações recebidas, mais recentes primeiro, com o nome e a foto de quem avaliou. */
export async function listReviews(revieweeId: string) {
  const rows = await unwrap(
    supabase
      .from('review_cards')
      .select('id, rating, comment, created_at, by_restaurant, reviewer_name, reviewer_photo_path')
      .eq('reviewee_id', revieweeId)
      .order('created_at', { ascending: false })
      .limit(REVIEWS_SHOWN),
  );
  return requireRows(rows, ['id', 'rating', 'created_at', 'by_restaurant', 'reviewer_name']);
}

/** A avaliação que a pessoa já deixou neste freela, se houver. */
export function getMyGigReview({ gigId, reviewerId }: { gigId: string; reviewerId: string }) {
  return unwrap(
    supabase
      .from('reviews')
      .select('rating, comment')
      .eq('gig_id', gigId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle(),
  );
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
  await unwrap(
    supabase.from('reviews').insert({
      gig_id: gigId,
      reviewee_id: revieweeId,
      rating: values.rating,
      comment: values.comment || null,
    }),
    { '23505': 'already_reviewed' },
  );
}
