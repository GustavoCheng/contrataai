import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pickImage } from '@/shared/lib/image-picker';
import {
  addStorePhoto,
  getRestaurant,
  removeStorePhoto,
  replaceCover,
  updateStore,
} from '../services/restaurants.service';

const STORE_PHOTO_ASPECT: [number, number] = [4, 3];

const restaurantKeys = {
  detail: (id: string | undefined) => ['restaurant', id] as const,
};

export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: restaurantKeys.detail(id),
    queryFn: id ? () => getRestaurant(id) : skipToken,
  });
}

/** Mutations da própria loja; todas atualizam a loja em cache ao terminar. */
function useStoreMutation<Input, Output>(
  id: string,
  mutationFn: (input: Input) => Promise<Output>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: restaurantKeys.detail(id) }),
  });
}

export const useUpdateStore = (id: string) => useStoreMutation(id, updateStore);

export const useRemoveStorePhoto = (id: string) => useStoreMutation(id, removeStorePhoto);

/** Abre câmera/galeria e troca a capa; cancelar não faz nada. */
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
