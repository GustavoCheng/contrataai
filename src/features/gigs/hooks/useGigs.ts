import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { invalidate, sharedKeys } from '@/shared/lib/query-client';
import type { GigFormValues } from '../schemas';
import {
  acceptGig,
  cancelGig,
  type CheckpointKind,
  confirmGigProfessional,
  createGig,
  getGig,
  issueCheckpoint,
  listGigApplications,
  listMyGigApplications,
  listRestaurantGigs,
  openGigDispute,
  redeemCheckpoint,
  subscribeToGig,
} from '../services/gigs.service';

const gigKeys = {
  restaurantGigs: (restaurantId: string) => [...sharedKeys.restaurantGigs, restaurantId] as const,
  applications: (gigId: string) => ['gig-applications', gigId] as const,
  mine: (professionalId: string) => [...sharedKeys.myApplications, 'gigs', professionalId] as const,
  checkpoint: (gigId: string, kind: CheckpointKind) => ['gig-checkpoint', gigId, kind] as const,
};

/** Depois de uma troca de estado: o detalhe e as listas que mostram o status, nas duas áreas. */
const gigStatusKeys = (gigId: string) => [
  sharedKeys.gig(gigId),
  gigKeys.applications(gigId),
  sharedKeys.restaurantGigs,
  [...sharedKeys.myApplications, 'gigs'],
];

const invalidateGig = (queryClient: QueryClient, gigId: string) =>
  invalidate(queryClient, gigStatusKeys(gigId));

export function useRestaurantGigs(restaurantId: string) {
  return useQuery({
    queryKey: gigKeys.restaurantGigs(restaurantId),
    queryFn: () => listRestaurantGigs(restaurantId),
  });
}

export function useGig(id: string) {
  return useQuery({ queryKey: sharedKeys.gig(id), queryFn: () => getGig(id) });
}

export function useGigApplications(gigId: string) {
  return useQuery({
    queryKey: gigKeys.applications(gigId),
    queryFn: () => listGigApplications(gigId),
  });
}

export function useMyGigApplications(professionalId: string) {
  return useQuery({
    queryKey: gigKeys.mine(professionalId),
    queryFn: () => listMyGigApplications(professionalId),
  });
}

export function useGigRealtime(gigId: string) {
  const queryClient = useQueryClient();
  useEffect(
    () => subscribeToGig(gigId, () => void invalidateGig(queryClient, gigId)),
    [gigId, queryClient],
  );
}

export function useCreateGig(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: GigFormValues) => createGig({ restaurantId, values }),
    onSuccess: () =>
      invalidate(queryClient, [gigKeys.restaurantGigs(restaurantId), sharedKeys.openings]),
  });
}

export function useConfirmGig(gigId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (professionalId: string) => confirmGigProfessional({ gigId, professionalId }),
    onSuccess: () => invalidate(queryClient, [...gigStatusKeys(gigId), sharedKeys.conversations]),
  });
}

export function useAcceptGig(professionalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gigId: string) => acceptGig({ gigId, professionalId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gigKeys.mine(professionalId) }),
  });
}

/** Código que o restaurante mostra. Quando vence, a tela pede de novo e já recebe um código novo. */
export function useCheckpoint(gigId: string, kind: CheckpointKind) {
  return useQuery({
    queryKey: gigKeys.checkpoint(gigId, kind),
    queryFn: () => issueCheckpoint({ gigId }),
    gcTime: 0,
    staleTime: Infinity,
    refetchInterval: ({ state }) =>
      state.data ? Math.max(1000, Date.parse(state.data.expires_at) - Date.now()) : false,
  });
}

/** Troca o código na hora (o anterior deixa de valer), por exemplo depois de muitos erros. */
export function useRenewCheckpoint(gigId: string, kind: CheckpointKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => issueCheckpoint({ gigId, renew: true }),
    onSuccess: (checkpoint) =>
      queryClient.setQueryData(gigKeys.checkpoint(gigId, kind), checkpoint),
  });
}

export function useRedeemCheckpoint(gigId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => redeemCheckpoint({ gigId, code }),
    onSuccess: () => invalidateGig(queryClient, gigId),
  });
}

export function useCancelGig(gigId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelGig(gigId),
    onSuccess: () => invalidate(queryClient, [...gigStatusKeys(gigId), sharedKeys.openings]),
  });
}

export function useOpenGigDispute(gigId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => openGigDispute(gigId),
    onSuccess: () => invalidateGig(queryClient, gigId),
  });
}
