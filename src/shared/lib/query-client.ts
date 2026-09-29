import { QueryClient, type QueryKey } from '@tanstack/react-query';
import type { AppError } from './errors';

// Todo serviço lança AppError; assim `error` chega tipado nos hooks e telas.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: AppError;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

/** Chaves de cache que mais de uma feature invalida; as demais ficam no hook da própria feature. */
export const sharedKeys = {
  gig: (id: string) => ['gig', id] as const,
  restaurantGigs: ['restaurant-gigs'] as const,
  restaurant: (id: string) => ['restaurant', id] as const,
  professional: (id: string) => ['professional', id] as const,
  openings: ['openings'] as const,
  conversations: ['conversations'] as const,
  myApplications: ['my-applications'] as const,
};

/** Invalida várias chaves de uma vez, ao terminar uma mutation. */
export const invalidate = (queryClient: QueryClient, keys: readonly QueryKey[]) =>
  Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
