import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { formatTime } from '@/shared/lib/format';
import { Button, Notice, Text, colors, radius, spacing } from '@/shared/ui';
import { useCheckpoint, useRenewCheckpoint } from '../hooks/useGigs';
import type { CheckpointKind } from '../services/gigs.service';

const labels: Record<CheckpointKind, string> = {
  check_in: 'Código de check-in',
  check_out: 'Código de check-out',
};

type CheckpointCodeProps = { gigId: string; kind: CheckpointKind; professionalName: string };

/** Código de 4 dígitos que o restaurante mostra ou dita para o freelancer digitar no app. */
export function CheckpointCode({ gigId, kind, professionalName }: CheckpointCodeProps) {
  const checkpoint = useCheckpoint(gigId, kind);
  const renew = useRenewCheckpoint(gigId, kind);

  if (checkpoint.isError) {
    return (
      <View style={styles.error}>
        <Notice message={checkpoint.error.message} />
        <Button variant="secondary" title="Tentar de novo" onPress={() => checkpoint.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {checkpoint.isPending ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <>
          <Text variant="caption" weight="semibold" tone="muted">
            {labels[kind]}
          </Text>
          <Text
            variant="title"
            style={styles.code}
            accessibilityLabel={`${labels[kind]}: ${checkpoint.data.code.split('').join(', ')}`}
          >
            {checkpoint.data.code}
          </Text>
          <Text variant="caption" tone="muted" style={styles.hint}>
            Diga este código para {professionalName} digitar no app. Vale até as{' '}
            {formatTime(checkpoint.data.expiresAt)} e serve uma vez.
          </Text>
        </>
      )}
      {renew.error && <Notice message={renew.error.message} />}
      <Button
        variant="ghost"
        title="Gerar novo código"
        loading={renew.isPending}
        disabled={checkpoint.isPending}
        onPress={() => renew.mutate()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  loading: { height: 64 },
  code: { letterSpacing: spacing.sm, fontVariant: ['tabular-nums'] },
  hint: { textAlign: 'center' },
  error: { gap: spacing.md },
});
