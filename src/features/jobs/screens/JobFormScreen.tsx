import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useUserId } from '@/shared/hooks/useSession';
import { centsToReaisInput } from '@/shared/lib/format';
import { Button, ErrorView, LoadingView, Notice, Screen } from '@/shared/ui';
import { JobFormFields } from '../components/JobFormFields';
import { useJob, useSaveJob } from '../hooks/useJobs';
import { jobFormSchema, type JobFormInput, type JobFormValues } from '../schemas';
import type { Job } from '../services/jobs.service';

/** Criar (sem id) ou editar (com id) uma vaga fixa. */
export function JobFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const job = useJob(id);

  if (!id) return <JobForm job={null} />;
  if (job.isPending) return <LoadingView />;
  if (job.isError) return <ErrorView message={job.error.message} onRetry={() => job.refetch()} />;
  return <JobForm job={job.data} />;
}

function JobForm({ job }: { job: Job | null }) {
  const restaurantId = useUserId();
  const save = useSaveJob(restaurantId);
  const form = useForm<JobFormInput, unknown, JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: job
      ? {
          role: job.role,
          shift: job.shift,
          salaryMin: centsToReaisInput(job.salary_min_cents),
          salaryMax: job.salary_max_cents ? centsToReaisInput(job.salary_max_cents) : '',
          description: job.description,
        }
      : { salaryMin: '', salaryMax: '', description: '' },
  });

  const submit = form.handleSubmit((values) =>
    save.mutate(
      { restaurantId, jobId: job?.id ?? null, values },
      {
        onSuccess: (jobId) => (job ? router.back() : router.replace(`/restaurant/jobs/${jobId}`)),
      },
    ),
  );

  return (
    <Screen
      edges={['bottom']}
      footer={
        <Button
          title={job ? 'Salvar alterações' : 'Publicar vaga'}
          loading={save.isPending}
          onPress={submit}
        />
      }
    >
      {save.error && <Notice message={save.error.message} />}
      <JobFormFields form={form} />
    </Screen>
  );
}
