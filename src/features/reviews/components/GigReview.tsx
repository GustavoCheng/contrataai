import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useUserId } from '@/shared/hooks/useSession';
import { Button, FormTextField, Notice, Section, Text } from '@/shared/ui';
import { useCreateReview, useMyGigReview } from '../hooks/useReviews';
import { reviewSchema, type ReviewInput, type ReviewValues } from '../schemas';
import { ReviewStars, StarRatingInput } from './Stars';

type GigReviewProps = { gigId: string; revieweeId: string; revieweeName: string };

/** Depois do check-out, cada parte avalia a outra uma vez; depois disso, mostra a nota dada. */
export function GigReview({ gigId, revieweeId, revieweeName }: GigReviewProps) {
  const reviewerId = useUserId();
  const mine = useMyGigReview(gigId, reviewerId);

  if (mine.isPending) return null;
  if (mine.isError) return <Notice message={mine.error.message} />;
  if (mine.data) {
    return (
      <Section title="Sua avaliação">
        <ReviewStars rating={mine.data.rating} />
        {mine.data.comment && <Text>{mine.data.comment}</Text>}
      </Section>
    );
  }
  return (
    <ReviewForm
      gigId={gigId}
      reviewerId={reviewerId}
      revieweeId={revieweeId}
      revieweeName={revieweeName}
    />
  );
}

function ReviewForm({
  gigId,
  reviewerId,
  revieweeId,
  revieweeName,
}: GigReviewProps & { reviewerId: string }) {
  const create = useCreateReview({ gigId, reviewerId, revieweeId });
  const form = useForm<ReviewInput, unknown, ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  });
  const submit = form.handleSubmit((values) => create.mutate(values));

  return (
    <Section
      title={`Avalie ${revieweeName}`}
      hint="A nota vai para o perfil e ajuda nas próximas contratações. Dá para avaliar uma vez."
    >
      {create.error && <Notice message={create.error.message} />}
      <Controller
        control={form.control}
        name="rating"
        render={({ field, fieldState }) => (
          <StarRatingInput
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <FormTextField
        control={form.control}
        name="comment"
        label="Comentário (opcional)"
        placeholder="Conte como foi o turno"
        multiline
        maxLength={1000}
      />
      <Button
        variant="secondary"
        title="Enviar avaliação"
        loading={create.isPending}
        onPress={submit}
      />
    </Section>
  );
}
