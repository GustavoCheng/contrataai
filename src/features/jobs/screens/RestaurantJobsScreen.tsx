import { router } from 'expo-router';
import { useUserId } from '@/shared/hooks/useSession';
import { formatSalary } from '@/shared/lib/format';
import { roleLabels } from '@/shared/lib/labels';
import { Button, EmptyState, ListRow, QueryFallback, Screen, ScreenTitle } from '@/shared/ui';
import { useRestaurantJobs } from '../hooks/useJobs';
import type { RestaurantJob } from '../services/jobs.service';

export function RestaurantJobsScreen() {
  const restaurantId = useUserId();
  const jobs = useRestaurantJobs(restaurantId);

  if (!jobs.isSuccess) return <QueryFallback queries={[jobs]} />;

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
    <ListRow
      title={roleLabels[job.role]}
      status={
        job.status === 'open' ? { label: 'Aberta', tone: 'positive' } : { label: 'Encerrada' }
      }
      subtitle={formatSalary(job.salary_min_cents, job.salary_max_cents, job.shift)}
      detail={{
        text: applications === 1 ? '1 candidatura' : `${applications} candidaturas`,
        highlight: applications > 0,
      }}
      accessibilityLabel={`${roleLabels[job.role]}, ${applications} candidaturas`}
      onPress={() => router.push(`/restaurant/jobs/${job.id}`)}
    />
  );
}
