import {
  type QueryClient,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
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

export const gigKeys = {
  restaurantGigs: (restaurantId: string) => ['restaurant-gigs', restaurantId] as const,
  detail: (id: string | undefined) => ['gig', id] as const,
  applications: (gigId: string) => ['gig-applications', gigId] as const,
  mine: (professionalId: string) => ['my-applications', 'gigs', professionalId] as const,
  checkpoint: (gigId: string, kind: CheckpointKind) => ['gig-checkpoint', gigId, kind] as const,
};

/** Depois de uma troca de estado: o detalhe e as listas que mostram o status, nas duas áreas. */
function invalidateGig(queryClient: QueryClient, gigId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: gigKeys.detail(gigId) }),
    queryClient.invalidateQueries({ queryKey: gigKeys.applications(gigId) }),
    queryClient.invalidateQueries({ queryKey: ['restaurant-gigs'] }),
    queryClient.invalidateQueries({ queryKey: ['my-applications', 'gigs'] }),
  ]);
}

export function useRestaurantGigs(restaurantId: string) {
  return useQuery({
    queryKey: gigKeys.restaurantGigs(restaurantId),
    queryFn: () => listRestaurantGigs(restaurantId),
  });
}

export function useGig(id: string | undefined) {
  return useQuery({ queryKey: gigKeys.detail(id), queryFn: id ? () => getGig(id) : skipToken });
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

/** Mantém o chamado e os aceites atualizados enquanto a tela está aberta. */
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
    mutationFn: createGig,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: gigKeys.restaurantGigs(restaurantId) }),
        queryClient.invalidateQueries({ queryKey: ['openings'] }),
      ]),
  });
}

export function useConfirmGig(gigId: string, restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (professionalId: string) => confirmGigProfessional({ gigId, professionalId }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: gigKeys.detail(gigId) }),
        queryClient.invalidateQueries({ queryKey: gigKeys.applications(gigId) }),
        queryClient.invalidateQueries({ queryKey: gigKeys.restaurantGigs(restaurantId) }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]),
  });
}

export function useAcceptGig(professionalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gigId: string) => acceptGig({ gigId, professionalId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gigKeys.mine(professionalId) }),
  });
}

/** O token vence em 5 minutos: renova antes disso enquanto o QR está na tela. */
const CHECKPOINT_REFRESH_MS = 4 * 60_000;

export function useCheckpoint(gigId: string, kind: CheckpointKind) {
  return useQuery({
    queryKey: gigKeys.checkpoint(gigId, kind),
    queryFn: () => issueCheckpoint(gigId),
    gcTime: 0,
    staleTime: CHECKPOINT_REFRESH_MS,
    refetchInterval: CHECKPOINT_REFRESH_MS,
  });
}

export function useRedeemCheckpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: redeemCheckpoint,
    onSuccess: ({ gigId }) => invalidateGig(queryClient, gigId),
  });
}

export function useCancelGig(gigId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelGig(gigId),
    onSuccess: () =>
      Promise.all([
        invalidateGig(queryClient, gigId),
        queryClient.invalidateQueries({ queryKey: ['openings'] }),
      ]),
  });
}

export function useOpenGigDispute(gigId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => openGigDispute(gigId),
    onSuccess: () => invalidateGig(queryClient, gigId),
  });
}
