import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useUserId } from '@/shared/hooks/useSession';
import { formatReaisInput } from '@/shared/lib/format';
import { Button, Notice, QueryFallback, Screen } from '@/shared/ui';
import { JobFormFields } from '../components/JobFormFields';
import { useJob, useSaveJob } from '../hooks/useJobs';
import { jobFormSchema, type JobFormInput, type JobFormValues } from '../schemas';
import type { Job } from '../services/jobs.service';

export function JobFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const job = useJob(id);

  if (!id) return <JobForm job={null} />;
  if (!job.isSuccess) return <QueryFallback queries={[job]} />;
  return <JobForm job={job.data} />;
}

const toReaisInput = (cents: number) => formatReaisInput(String(Math.round(cents / 100)));

function JobForm({ job }: { job: Job | null }) {
  const restaurantId = useUserId();
  const save = useSaveJob(restaurantId);
  const form = useForm<JobFormInput, unknown, JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: job
      ? {
          role: job.role,
          shift: job.shift,
          salaryMin: toReaisInput(job.salary_min_cents),
          salaryMax: job.salary_max_cents ? toReaisInput(job.salary_max_cents) : '',
          description: job.description,
        }
      : { salaryMin: '', salaryMax: '', description: '' },
  });

  const submit = form.handleSubmit((values) =>
    save.mutate(
      { jobId: job?.id ?? null, values },
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
