import { StyleSheet, View } from 'react-native';
import { formatPayRange } from '@/shared/lib/format';
import { roleLabels, shiftLabels, type JobRole, type WorkShift } from '@/shared/lib/labels';
import { Section, StatusPill, Text, spacing } from '@/shared/ui';

type JobSummaryProps = {
  job: {
    role: JobRole;
    shift: WorkShift;
    salary_min_cents: number;
    salary_max_cents: number | null;
    description: string;
    status: 'open' | 'closed';
  };
};

/** Cargo, salário, turno e descrição da vaga fixa. */
export function JobSummary({ job }: JobSummaryProps) {
  return (
    <>
      <View style={styles.header}>
        {job.status === 'closed' && <StatusPill label="Vaga encerrada" />}
        <Text variant="title">{roleLabels[job.role]}</Text>
        <Text weight="semibold" tone="default">
          {formatPayRange(job.salary_min_cents, job.salary_max_cents)}/mês ·{' '}
          {shiftLabels[job.shift]}
        </Text>
      </View>
      <Section title="Sobre a vaga">
        <Text>{job.description}</Text>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
});
