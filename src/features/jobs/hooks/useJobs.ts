import {
  type QueryClient,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { invalidate, sharedKeys } from '@/shared/lib/query-client';
import type { JobFormValues } from '../schemas';
import {
  applyToJob,
  closeJob,
  decideApplication,
  getJob,
  listJobApplications,
  listMyJobApplications,
  listRestaurantJobs,
  saveJob,
} from '../services/jobs.service';

const jobKeys = {
  restaurantJobs: (restaurantId: string) => ['restaurant-jobs', restaurantId] as const,
  detail: (id: string | undefined) => ['job', id] as const,
  applications: (jobId: string) => ['job-applications', jobId] as const,
  mine: (professionalId: string) => [...sharedKeys.myApplications, 'jobs', professionalId] as const,
};

/** Depois de criar, editar ou encerrar: a lista da loja, o detalhe e a vitrine dos profissionais. */
const invalidateJob = (queryClient: QueryClient, restaurantId: string, jobId: string) =>
  invalidate(queryClient, [
    jobKeys.restaurantJobs(restaurantId),
    jobKeys.detail(jobId),
    sharedKeys.openings,
  ]);

export function useMyJobApplications(professionalId: string) {
  return useQuery({
    queryKey: jobKeys.mine(professionalId),
    queryFn: () => listMyJobApplications(professionalId),
  });
}

export function useRestaurantJobs(restaurantId: string) {
  return useQuery({
    queryKey: jobKeys.restaurantJobs(restaurantId),
    queryFn: () => listRestaurantJobs(restaurantId),
  });
}

export function useJob(id: string | undefined) {
  return useQuery({ queryKey: jobKeys.detail(id), queryFn: id ? () => getJob(id) : skipToken });
}

export function useJobApplications(jobId: string) {
  return useQuery({
    queryKey: jobKeys.applications(jobId),
    queryFn: () => listJobApplications(jobId),
  });
}

export function useSaveJob(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { jobId: string | null; values: JobFormValues }) =>
      saveJob({ restaurantId, ...input }),
    onSuccess: (jobId) => invalidateJob(queryClient, restaurantId, jobId),
  });
}

export function useCloseJob(jobId: string, restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => closeJob(jobId),
    onSuccess: () => invalidateJob(queryClient, restaurantId, jobId),
  });
}

export function useDecideApplication(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decideApplication,
    onSuccess: () =>
      invalidate(queryClient, [jobKeys.applications(jobId), sharedKeys.conversations]),
  });
}

export function useApplyToJob(jobId: string, professionalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => applyToJob({ jobId, professionalId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharedKeys.myApplications }),
  });
}
