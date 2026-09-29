import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';

export const PAGE_SIZE = 20;

/** Intervalo `.range(from, to)` do PostgREST para a página (começa em 0). */
export const pageRange = (page: number): [number, number] => [
  page * PAGE_SIZE,
  page * PAGE_SIZE + PAGE_SIZE - 1,
];

/** Lista paginada: busca a próxima página quando a anterior veio cheia. */
export function usePagedQuery<T>(queryKey: QueryKey, fetchPage: (page: number) => Promise<T[]>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length : undefined,
  });
  return { ...query, items: query.data?.pages.flat() ?? [] };
}
