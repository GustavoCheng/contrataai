import { unwrap } from '@/shared/lib/errors';
import { reaisToCents } from '@/shared/lib/format';
import type { ApplicationStatus } from '@/shared/lib/labels';
import { supabase } from '@/shared/lib/supabase';
import type { JobFormValues } from '../schemas';

export function listRestaurantJobs(restaurantId: string) {
  return unwrap(
    supabase
      .from('jobs')
      .select(
        'id, role, shift, salary_min_cents, salary_max_cents, status, job_applications(count)',
      )
      .eq('restaurant_id', restaurantId)
      .order('status')
      .order('created_at', { ascending: false }),
  );
}

export type RestaurantJob = Awaited<ReturnType<typeof listRestaurantJobs>>[number];

export function getJob(id: string) {
  return unwrap(
    supabase
      .from('jobs')
      .select(
        'id, role, description, salary_min_cents, salary_max_cents, shift, status, restaurants(id, name, cover_path, neighborhood, city, state, rating_avg, rating_count)',
      )
      .eq('id', id)
      .single(),
  );
}

export type Job = Awaited<ReturnType<typeof getJob>>;

export function listJobApplications(jobId: string) {
  return unwrap(
    supabase
      .from('job_applications')
      .select(
        'id, status, professionals(id, full_name, photo_path, main_role, neighborhood, city, rating_avg, rating_count)',
      )
      .eq('job_id', jobId)
      .order('created_at'),
  );
}

export type JobApplication = Awaited<ReturnType<typeof listJobApplications>>[number];

type SaveJobInput = { restaurantId: string; jobId: string | null; values: JobFormValues };

/** Cria ou edita a vaga; devolve o id. */
export async function saveJob({ restaurantId, jobId, values }: SaveJobInput): Promise<string> {
  const row = {
    role: values.role,
    shift: values.shift,
    description: values.description,
    salary_min_cents: reaisToCents(values.salaryMin),
    salary_max_cents: values.salaryMax ? reaisToCents(values.salaryMax) : null,
  };
  if (jobId) {
    await unwrap(supabase.from('jobs').update(row).eq('id', jobId));
    return jobId;
  }
  const { id } = await unwrap(
    supabase
      .from('jobs')
      .insert({ ...row, restaurant_id: restaurantId })
      .select('id')
      .single(),
  );
  return id;
}

export async function closeJob(jobId: string): Promise<void> {
  await unwrap(supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId));
}

export type ApplicationDecision = Exclude<ApplicationStatus, 'sent'>;

/** Aceitar cria a conversa entre as partes (trigger no banco). */
export async function decideApplication({
  id,
  status,
}: {
  id: string;
  status: ApplicationDecision;
}): Promise<void> {
  await unwrap(supabase.from('job_applications').update({ status }).eq('id', id));
}

export function listMyJobApplications(professionalId: string) {
  return unwrap(
    supabase
      .from('job_applications')
      .select(
        'id, status, jobs(id, role, shift, salary_min_cents, salary_max_cents, status, restaurants(name, cover_path))',
      )
      .eq('professional_id', professionalId)
      .order('created_at', { ascending: false }),
  );
}

export async function applyToJob({
  jobId,
  professionalId,
}: {
  jobId: string;
  professionalId: string;
}): Promise<void> {
  await unwrap(
    supabase.from('job_applications').insert({ job_id: jobId, professional_id: professionalId }),
    { '23505': 'already_applied' },
  );
}
