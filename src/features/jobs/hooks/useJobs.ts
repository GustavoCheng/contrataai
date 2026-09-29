import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyToJob,
  closeJob,
  decideApplication,
  getJob,
  getMyJobApplication,
  listJobApplications,
  listMyJobApplications,
  listRestaurantJobs,
  saveJob,
} from '../services/jobs.service';

const jobKeys = {
  restaurantJobs: (restaurantId: string) => ['restaurant-jobs', restaurantId] as const,
  detail: (id: string | undefined) => ['job', id] as const,
  applications: (jobId: string) => ['job-applications', jobId] as const,
  myApplication: (jobId: string, professionalId: string) =>
    ['my-job-application', jobId, professionalId] as const,
  mine: (professionalId: string) => ['my-applications', 'jobs', professionalId] as const,
};

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
    mutationFn: saveJob,
    onSuccess: (jobId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: jobKeys.restaurantJobs(restaurantId) }),
        queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) }),
        queryClient.invalidateQueries({ queryKey: ['openings'] }),
      ]),
  });
}

export function useCloseJob(jobId: string, restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => closeJob(jobId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: jobKeys.restaurantJobs(restaurantId) }),
        queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) }),
        queryClient.invalidateQueries({ queryKey: ['openings'] }),
      ]),
  });
}

export function useDecideApplication(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decideApplication,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: jobKeys.applications(jobId) }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]),
  });
}

export function useMyJobApplication(jobId: string, professionalId: string) {
  return useQuery({
    queryKey: jobKeys.myApplication(jobId, professionalId),
    queryFn: () => getMyJobApplication(jobId, professionalId),
  });
}

export function useApplyToJob(jobId: string, professionalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => applyToJob({ jobId, professionalId }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: jobKeys.myApplication(jobId, professionalId) }),
        queryClient.invalidateQueries({ queryKey: ['my-applications'] }),
      ]),
  });
}
