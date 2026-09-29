import { StyleSheet, View } from 'react-native';
import { formatMoney, formatShiftWindow } from '@/shared/lib/format';
import { gigStatusLabels, gigStatusTones, roleLabels } from '@/shared/lib/labels';
import { StatusPill, Text, spacing } from '@/shared/ui';
import type { Gig } from '../services/gigs.service';

/** Cargo, dia/horário, valor e status do chamado. */
export function GigSummary({ gig }: { gig: Gig }) {
  return (
    <View style={styles.header}>
      <StatusPill label={gigStatusLabels[gig.status]} tone={gigStatusTones[gig.status]} />
      <Text variant="title">{roleLabels[gig.role]}</Text>
      <Text weight="semibold" tone="default">
        {formatMoney(gig.amount_cents)} · {formatShiftWindow(gig.starts_at, gig.ends_at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
});
