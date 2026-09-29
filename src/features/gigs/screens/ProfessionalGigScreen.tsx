import { router, useLocalSearchParams } from 'expo-router';
import { ChatButton } from '@/features/chat';
import { useProfessionalSettings } from '@/features/professionals';
import { GigReview } from '@/features/reviews';
import { useUserId } from '@/shared/hooks/useSession';
import { formatPlace } from '@/shared/lib/location';
import { imageUrl } from '@/shared/lib/storage';
import { Button, ErrorView, LoadingView, Notice, ProfileRow, Screen, Section } from '@/shared/ui';
import { AcceptGigAction } from '../components/AcceptGigAction';
import { GigIssueActions } from '../components/GigIssueActions';
import { ProfessionalGigStage } from '../components/GigStage';
import { GigSummary } from '../components/GigSummary';
import { GigTimeline } from '../components/GigTimeline';
import { PixKeyRequired } from '../components/PixKeyRequired';
import { useAcceptGig, useGig, useGigRealtime, useMyGigApplications } from '../hooks/useGigs';
import { REVIEWABLE } from '../rules';

/** Freela visto pelo profissional: aceitar e, se confirmado, check-in/out e pagamento. */
export function ProfessionalGigScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const professionalId = useUserId();
  const gig = useGig(id);
  const mine = useMyGigApplications(professionalId);
  const settings = useProfessionalSettings(professionalId);
  const accept = useAcceptGig(professionalId);
  useGigRealtime(id);

  if (gig.isPending) return <LoadingView />;
  if (gig.isError) return <ErrorView message={gig.error.message} onRetry={() => gig.refetch()} />;

  const restaurant = gig.data.restaurants;
  const status = mine.data?.find((application) => application.gigs.id === id)?.status;
  const hasPixKey = Boolean(settings.data?.payout_accounts);
  const isMine = gig.data.professional_id === professionalId;
  const isOpen = gig.data.status === 'open';
  const scan =
    isMine && gig.data.status === 'paid_held'
      ? 'Ler QR de check-in'
      : isMine && gig.data.status === 'checked_in'
        ? 'Ler QR de check-out'
        : null;

  return (
    <Screen
      edges={['bottom']}
      footer={scan && <Button title={scan} onPress={() => router.push('/professional/scan')} />}
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
          <ProfessionalGigStage gig={gig.data} />
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
