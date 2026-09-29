import { router } from 'expo-router';
import { useUserId } from '@/shared/hooks/useSession';
import { formatGigPay } from '@/shared/lib/format';
import { gigStatusLabels, gigStatusTones, roleLabels } from '@/shared/lib/labels';
import { Button, EmptyState, ListRow, QueryFallback, Screen, ScreenTitle } from '@/shared/ui';
import { useRestaurantGigs } from '../hooks/useGigs';
import type { RestaurantGig } from '../services/gigs.service';

export function RestaurantGigsScreen() {
  const restaurantId = useUserId();
  const gigs = useRestaurantGigs(restaurantId);

  if (!gigs.isSuccess) return <QueryFallback queries={[gigs]} />;

  return (
    <Screen
      edges={['top']}
      footer={
        <Button title="Publicar freela" onPress={() => router.push('/restaurant/gigs/new')} />
      }
    >
      <ScreenTitle title="Freelas" subtitle="Chamados de um turno, pagos com garantia." />
      {gigs.data.length === 0 ? (
        <EmptyState
          icon="flash-outline"
          title="Precisa de alguém para um turno?"
          description="Publique um chamado: profissionais disponíveis aceitam em um toque e você escolhe quem vai."
        />
      ) : (
        gigs.data.map((gig) => <GigRow key={gig.id} gig={gig} />)
      )}
    </Screen>
  );
}

function GigRow({ gig }: { gig: RestaurantGig }) {
  const acceptances = gig.gig_applications[0]?.count ?? 0;
  const detail =
    gig.status === 'open'
      ? acceptances === 1
        ? '1 profissional aceitou'
        : `${acceptances} profissionais aceitaram`
      : gig.professionals?.full_name;
  return (
    <ListRow
      title={roleLabels[gig.role]}
      status={{ label: gigStatusLabels[gig.status], tone: gigStatusTones[gig.status] }}
      subtitle={formatGigPay(gig.amount_cents, gig.starts_at, gig.ends_at)}
      detail={detail ? { text: detail, highlight: acceptances > 0 } : undefined}
      accessibilityLabel={`${roleLabels[gig.role]}, ${gigStatusLabels[gig.status]}`}
      onPress={() => router.push(`/restaurant/gigs/${gig.id}`)}
    />
  );
}
