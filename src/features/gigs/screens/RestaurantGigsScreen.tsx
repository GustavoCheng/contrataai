import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useUserId } from '@/shared/hooks/useSession';
import { formatMoney, formatShiftWindow } from '@/shared/lib/format';
import { gigStatusLabels, gigStatusTones, roleLabels } from '@/shared/lib/labels';
import {
  Button,
  EmptyState,
  ErrorView,
  LoadingView,
  Screen,
  ScreenTitle,
  StatusPill,
  Text,
  colors,
  radius,
  spacing,
} from '@/shared/ui';
import { useRestaurantGigs } from '../hooks/useGigs';
import type { RestaurantGig } from '../services/gigs.service';

/** Aba "Freelas" do restaurante: chamados publicados e o andamento de cada um. */
export function RestaurantGigsScreen() {
  const restaurantId = useUserId();
  const gigs = useRestaurantGigs(restaurantId);

  if (gigs.isPending) return <LoadingView />;
  if (gigs.isError) {
    return <ErrorView message={gigs.error.message} onRetry={() => gigs.refetch()} />;
  }

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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${roleLabels[gig.role]}, ${gigStatusLabels[gig.status]}`}
      onPress={() => router.push(`/restaurant/gigs/${gig.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowHeader}>
        <Text weight="semibold" tone="default" style={styles.flex}>
          {roleLabels[gig.role]}
        </Text>
        <StatusPill label={gigStatusLabels[gig.status]} tone={gigStatusTones[gig.status]} />
      </View>
      <Text tone="muted">
        {formatMoney(gig.amount_cents)} · {formatShiftWindow(gig.starts_at, gig.ends_at)}
      </Text>
      {detail && (
        <Text variant="caption" weight="semibold" tone={acceptances > 0 ? 'primary' : 'muted'}>
          {detail}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
