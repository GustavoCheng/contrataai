import { AppError, toAppError } from '@/shared/lib/errors';
import { reaisToCents } from '@/shared/lib/format';
import { supabase } from '@/shared/lib/supabase';
import type { JobFormValues } from '../schemas';

export async function listRestaurantJobs(restaurantId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, role, shift, salary_min_cents, salary_max_cents, status, created_at, job_applications(count)',
    )
    .eq('restaurant_id', restaurantId)
    .order('status')
    .order('created_at', { ascending: false });
  if (error) throw await toAppError(error);
  return data;
}

export type RestaurantJob = Awaited<ReturnType<typeof listRestaurantJobs>>[number];

export async function getJob(id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, restaurant_id, role, description, salary_min_cents, salary_max_cents, shift, status, created_at, restaurants(id, name, cover_path, neighborhood, city, state, rating_avg, rating_count)',
    )
    .eq('id', id)
    .single();
  if (error) throw await toAppError(error);
  return data;
}

export type Job = Awaited<ReturnType<typeof getJob>>;

export async function listJobApplications(jobId: string) {
  const { data, error } = await supabase
    .from('job_applications')
    .select(
      'id, status, created_at, professionals(id, full_name, photo_path, main_role, neighborhood, city, rating_avg, rating_count)',
    )
    .eq('job_id', jobId)
    .order('created_at');
  if (error) throw await toAppError(error);
  return data;
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
    const { error } = await supabase.from('jobs').update(row).eq('id', jobId);
    if (error) throw await toAppError(error);
    return jobId;
  }
  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...row, restaurant_id: restaurantId })
    .select('id')
    .single();
  if (error) throw await toAppError(error);
  return data.id;
}

export async function closeJob(jobId: string): Promise<void> {
  const { error } = await supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId);
  if (error) throw await toAppError(error);
}

/** Aceitar cria a conversa entre as partes (trigger no banco). */
export async function decideApplication({
  id,
  status,
}: {
  id: string;
  status: 'accepted' | 'rejected';
}): Promise<void> {
  const { error } = await supabase.from('job_applications').update({ status }).eq('id', id);
  if (error) throw await toAppError(error);
}

export async function listMyJobApplications(professionalId: string) {
  const { data, error } = await supabase
    .from('job_applications')
    .select(
      'id, status, created_at, jobs(id, role, shift, salary_min_cents, salary_max_cents, status, restaurants(name, cover_path))',
    )
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false });
  if (error) throw await toAppError(error);
  return data;
}

export async function getMyJobApplication(jobId: string, professionalId: string) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, status')
    .eq('job_id', jobId)
    .eq('professional_id', professionalId)
    .maybeSingle();
  if (error) throw await toAppError(error);
  return data;
}

export async function applyToJob({
  jobId,
  professionalId,
}: {
  jobId: string;
  professionalId: string;
}): Promise<void> {
  const { error } = await supabase
    .from('job_applications')
    .insert({ job_id: jobId, professional_id: professionalId });
  if (error?.code === '23505') throw new AppError('already_applied');
  if (error) throw await toAppError(error);
}
