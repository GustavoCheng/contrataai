import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useUserId } from '@/shared/hooks/useSession';
import { formatPayRange } from '@/shared/lib/format';
import { roleLabels, shiftLabels } from '@/shared/lib/labels';
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
import { useRestaurantJobs } from '../hooks/useJobs';
import type { RestaurantJob } from '../services/jobs.service';

/** Aba "Vagas" do restaurante: vagas fixas abertas e encerradas. */
export function RestaurantJobsScreen() {
  const restaurantId = useUserId();
  const jobs = useRestaurantJobs(restaurantId);

  if (jobs.isPending) return <LoadingView />;
  if (jobs.isError)
    return <ErrorView message={jobs.error.message} onRetry={() => jobs.refetch()} />;

  return (
    <Screen
      edges={['top']}
      footer={<Button title="Nova vaga" onPress={() => router.push('/restaurant/jobs/new')} />}
    >
      <ScreenTitle title="Vagas" subtitle="Vagas fixas da sua loja e quem se candidatou." />
      {jobs.data.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title="Publique sua primeira vaga"
          description="Profissionais perto da sua loja veem a vaga na hora e se candidatam pelo app."
        />
      ) : (
        jobs.data.map((job) => <JobRow key={job.id} job={job} />)
      )}
    </Screen>
  );
}

function JobRow({ job }: { job: RestaurantJob }) {
  const applications = job.job_applications[0]?.count ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${roleLabels[job.role]}, ${applications} candidaturas`}
      onPress={() => router.push(`/restaurant/jobs/${job.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowHeader}>
        <Text weight="semibold" tone="default" style={styles.flex}>
          {roleLabels[job.role]}
        </Text>
        <StatusPill
          label={job.status === 'open' ? 'Aberta' : 'Encerrada'}
          tone={job.status === 'open' ? 'positive' : 'neutral'}
        />
      </View>
      <Text tone="muted">
        {formatPayRange(job.salary_min_cents, job.salary_max_cents)}/mês · {shiftLabels[job.shift]}
      </Text>
      <Text variant="caption" weight="semibold" tone={applications > 0 ? 'primary' : 'muted'}>
        {applications === 1 ? '1 candidatura' : `${applications} candidaturas`}
      </Text>
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
