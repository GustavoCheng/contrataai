import { StyleSheet, View } from 'react-native';
import { imageUrl } from '@/shared/lib/storage';
import { Button, Notice, ProfileRow, Section, Text, spacing } from '@/shared/ui';
import { useReviews } from '../hooks/useReviews';
import { ReviewStars } from './ReviewStars';

/** Avaliações recebidas por uma loja ou profissional, para o perfil. Sem avaliações, não aparece. */
export function ReviewList({ revieweeId }: { revieweeId: string }) {
  const reviews = useReviews(revieweeId);

  if (reviews.isPending) return null;
  if (reviews.isError) {
    return (
      <Section title="Avaliações">
        <Notice message={reviews.error.message} />
        <Button variant="ghost" title="Tentar de novo" onPress={() => reviews.refetch()} />
      </Section>
    );
  }
  if (reviews.data.length === 0) return null;

  return (
    <Section title="Avaliações">
      {reviews.data.map((review) => (
        <View key={review.id} style={styles.review}>
          <ProfileRow
            imageUri={
              review.reviewer_photo_path &&
              imageUrl(
                review.by_restaurant ? 'restaurant-photos' : 'avatars',
                review.reviewer_photo_path,
              )
            }
            placeholderIcon={review.by_restaurant ? 'storefront-outline' : 'person-outline'}
            shape={review.by_restaurant ? 'square' : 'round'}
            title={review.reviewer_name}
            subtitle={monthYear.format(new Date(review.created_at))}
          />
          <ReviewStars rating={review.rating} />
          {review.comment && <Text>{review.comment}</Text>}
        </View>
      ))}
    </Section>
  );
}

const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

const styles = StyleSheet.create({
  review: { gap: spacing.sm },
});
