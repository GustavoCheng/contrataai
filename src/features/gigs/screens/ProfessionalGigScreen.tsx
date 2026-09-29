import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ChatButton } from '@/features/chat';
import { useProfessionalSettings } from '@/features/professionals';
import { GigReview } from '@/features/reviews';
import { useUserId } from '@/shared/hooks/useSession';
import { formatPlace } from '@/shared/lib/location';
import { imageUrl } from '@/shared/lib/storage';
import { Button, ErrorView, LoadingView, Notice, ProfileRow, Screen, Section } from '@/shared/ui';
import { AcceptGigAction } from '../components/AcceptGigAction';
import { CHECKPOINT_CODE_LENGTH, CheckpointCodeField } from '../components/CheckpointCodeField';
import { GigIssueActions } from '../components/GigIssueActions';
import { ProfessionalGigStage } from '../components/GigStage';
import { GigSummary } from '../components/GigSummary';
import { GigTimeline } from '../components/GigTimeline';
import { PixKeyRequired } from '../components/PixKeyRequired';
import {
  useAcceptGig,
  useGig,
  useGigRealtime,
  useMyGigApplications,
  useRedeemCheckpoint,
} from '../hooks/useGigs';
import { REVIEWABLE } from '../rules';

/** Freela visto pelo profissional: aceitar e, se confirmado, check-in/out e pagamento. */
export function ProfessionalGigScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const professionalId = useUserId();
  const gig = useGig(id);
  const mine = useMyGigApplications(professionalId);
  const settings = useProfessionalSettings(professionalId);
  const accept = useAcceptGig(professionalId);
  const redeem = useRedeemCheckpoint(id);
  const [code, setCode] = useState('');
  useGigRealtime(id);

  if (gig.isPending) return <LoadingView />;
  if (gig.isError) return <ErrorView message={gig.error.message} onRetry={() => gig.refetch()} />;

  const restaurant = gig.data.restaurants;
  const status = mine.data?.find((application) => application.gigs.id === id)?.status;
  const hasPixKey = Boolean(settings.data?.payout_accounts);
  const isMine = gig.data.professional_id === professionalId;
  const isOpen = gig.data.status === 'open';
  const checkpoint = !isMine
    ? null
    : gig.data.status === 'paid_held'
      ? 'check_in'
      : gig.data.status === 'checked_in'
        ? 'check_out'
        : null;

  const changeCode = (value: string) => {
    setCode(value);
    if (redeem.isError) redeem.reset();
  };
  // Sem envio automático no 4º dígito: cada erro conta, então a pessoa confere antes de confirmar.
  const submitCode = () => {
    if (code.length < CHECKPOINT_CODE_LENGTH || redeem.isPending) return;
    redeem.mutate(code, { onSuccess: () => setCode('') });
  };

  return (
    <Screen
      edges={['bottom']}
      footer={
        checkpoint && (
          <Button
            title={checkpoint === 'check_in' ? 'Confirmar check-in' : 'Confirmar check-out'}
            disabled={code.length < CHECKPOINT_CODE_LENGTH}
            loading={redeem.isPending}
            onPress={submitCode}
          />
        )
      }
    >
      <ProfileRow
        imageUri={restaurant.cover_path && imageUrl('restaurant-photos', restaurant.cover_path)}
        placeholderIcon="storefront-outline"
        shape="square"
        title={restaurant.name}
        subtitle={formatPlace(restaurant)}
        rating={{ average: restaurant.rating_avg, count: restaurant.rating_count }}
        onPress={() => router.push(`/professional/restaurants/${restaurant.id}`)}
      />
      <GigSummary gig={gig.data} />

      {isMine ? (
        <>
          <ProfessionalGigStage gig={gig.data}>
            {checkpoint && (
              <CheckpointCodeField
                kind={checkpoint}
                value={code}
                onChange={changeCode}
                onSubmit={submitCode}
                error={redeem.error?.message}
              />
            )}
          </ProfessionalGigStage>
          <ChatButton
            area="professional"
            restaurantId={restaurant.id}
            professionalId={professionalId}
          />
          {REVIEWABLE.includes(gig.data.status) && (
            <GigReview gigId={id} revieweeId={restaurant.id} revieweeName={restaurant.name} />
          )}
          <Section title="Linha do tempo">
            <GigTimeline gig={gig.data} />
          </Section>
          <GigIssueActions gig={gig.data} viewer="professional" />
        </>
      ) : (
        <>
          {accept.error && <Notice message={accept.error.message} />}
          {isOpen && !status && !hasPixKey && settings.isSuccess && <PixKeyRequired />}
          {(isOpen || (status && gig.data.status !== 'cancelled')) && (
            <AcceptGigAction
              status={status}
              canAccept={hasPixKey && isOpen}
              loading={accept.isPending}
              onAccept={() => accept.mutate(id)}
            />
          )}
        </>
      )}
    </Screen>
  );
}
