import { QueryClient } from '@tanstack/react-query';
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
