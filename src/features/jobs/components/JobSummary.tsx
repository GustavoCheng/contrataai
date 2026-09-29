import { StyleSheet, View } from 'react-native';
import { formatSalary } from '@/shared/lib/format';
import { roleLabels } from '@/shared/lib/labels';
import { Section, StatusPill, Text, spacing } from '@/shared/ui';
import type { Job } from '../services/jobs.service';

export function JobSummary({ job }: { job: Job }) {
  return (
    <>
      <View style={styles.header}>
        {job.status === 'closed' && <StatusPill label="Vaga encerrada" />}
        <Text variant="title">{roleLabels[job.role]}</Text>
        <Text weight="semibold" tone="default">
          {formatSalary(job.salary_min_cents, job.salary_max_cents, job.shift)}
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
