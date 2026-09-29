import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pickImage } from '@/shared/lib/image-picker';
import { sharedKeys } from '@/shared/lib/query-client';
import type { StoreFormValues } from '../schemas';
import {
  addStorePhoto,
  getRestaurant,
  removeStorePhoto,
  replaceCover,
  updateStore,
} from '../services/restaurants.service';

const STORE_PHOTO_ASPECT: [number, number] = [4, 3];

export function useRestaurant(id: string) {
  return useQuery({ queryKey: sharedKeys.restaurant(id), queryFn: () => getRestaurant(id) });
}

/** Mutations da própria loja; todas atualizam a loja em cache ao terminar. */
function useStoreMutation<Input, Output>(
  id: string,
  mutationFn: (input: Input) => Promise<Output>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharedKeys.restaurant(id) }),
  });
}

export const useUpdateStore = (id: string) =>
  useStoreMutation(id, (values: StoreFormValues) => updateStore({ id, values }));

export const useRemoveStorePhoto = (id: string) => useStoreMutation(id, removeStorePhoto);

/** Abre câmera/galeria e troca a capa; cancelar não altera a loja. */
export const useReplaceCover = (id: string) =>
  useStoreMutation(id, async (previousPath: string | null) => {
    const image = await pickImage(STORE_PHOTO_ASPECT);
    if (image) await replaceCover({ restaurantId: id, previousPath, image });
  });

export const useAddStorePhoto = (id: string) =>
  useStoreMutation(id, async (sortOrder: number) => {
    const image = await pickImage(STORE_PHOTO_ASPECT);
    if (image) await addStorePhoto({ restaurantId: id, sortOrder, image });
  });
