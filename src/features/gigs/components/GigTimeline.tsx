import { StyleSheet, View } from 'react-native';
import { formatDateTime } from '@/shared/lib/format';
import type { GigStatus } from '@/shared/lib/labels';
import { Text, colors, spacing } from '@/shared/ui';
import type { Gig } from '../services/gigs.service';

type Step = { label: string; at: string | null };

/** Estados em que o caminho normal para: as próximas etapas deixam de aparecer. */
const ENDED: GigStatus[] = ['released', 'cancelled', 'disputed'];

export function GigTimeline({ gig }: { gig: Gig }) {
  const path: Step[] = [
    { label: 'Freela publicado', at: gig.created_at },
    { label: 'Freelancer confirmado', at: gig.confirmed_at },
    { label: 'Pagamento retido', at: gig.paid_at },
    { label: 'Check-in', at: gig.checked_in_at },
    { label: 'Check-out', at: gig.checked_out_at },
    { label: 'Pagamento liberado', at: gig.released_at },
  ];
  const done = [
    ...path,
    { label: 'Disputa aberta', at: gig.disputed_at },
    { label: 'Freela cancelado', at: gig.cancelled_at },
  ]
    .filter((step) => step.at !== null)
    .sort((a, b) => Date.parse(a.at ?? '') - Date.parse(b.at ?? ''));
  const next = ENDED.includes(gig.status) ? [] : path.filter((step) => step.at === null);
  const steps = [...done, ...next];

  return (
    <View>
      {steps.map((step, index) => (
        <View
          key={step.label}
          style={styles.row}
          accessible
          accessibilityLabel={`${step.label}: ${step.at ? formatDateTime(step.at) : 'pendente'}`}
        >
          <View style={styles.rail}>
            <View style={[styles.dot, step.at ? styles.dotDone : styles.dotNext]} />
            {index < steps.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.texts}>
            <Text weight={step.at ? 'semibold' : 'regular'} tone={step.at ? 'default' : 'muted'}>
              {step.label}
            </Text>
            {step.at && (
              <Text variant="caption" tone="muted">
                {formatDateTime(step.at)}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const DOT = 12;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { width: DOT, alignItems: 'center', paddingTop: spacing.xs },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  dotDone: { backgroundColor: colors.text },
  dotNext: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background },
  line: { flex: 1, width: 2, marginVertical: spacing.xs, backgroundColor: colors.border },
  texts: { flex: 1, gap: spacing.xs, paddingBottom: spacing.lg },
});
