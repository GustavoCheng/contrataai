import { AppError, toAppError } from '@/shared/lib/errors';
import { removeImage, uploadImage, type PickedImage } from '@/shared/lib/storage';
import { supabase } from '@/shared/lib/supabase';
import type { StoreFormValues } from '../schemas';

export async function getRestaurant(id: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'id, name, legal_name, cnpj, description, founded_on, cover_path, street, number, complement, neighborhood, postal_code, city, state, latitude, longitude, rating_avg, rating_count, restaurant_photos(id, path, sort_order)',
    )
    .eq('id', id)
    .order('sort_order', { referencedTable: 'restaurant_photos' })
    .single();
  if (error) throw await toAppError(error);
  return data;
}

export type Restaurant = Awaited<ReturnType<typeof getRestaurant>>;
export type StorePhoto = Restaurant['restaurant_photos'][number];

export async function updateStore({ id, values }: { id: string; values: StoreFormValues }) {
  const { address } = values;
  if (!address) throw new AppError('cep_invalid'); // o schema já garante; aqui só estreita o tipo

  const { error } = await supabase
    .from('restaurants')
    .update({
      name: values.name,
      description: values.description || null,
      street: values.street,
      number: values.number || null,
      complement: values.complement || null,
      neighborhood: values.neighborhood || null,
      postal_code: address.postalCode || null,
      city: address.city,
      state: address.state,
      latitude: address.latitude,
      longitude: address.longitude,
    })
    .eq('id', id);
  if (error) throw await toAppError(error);
}

type CoverInput = { restaurantId: string; previousPath: string | null; image: PickedImage };

export async function replaceCover({ restaurantId, previousPath, image }: CoverInput) {
  const path = await uploadImage('restaurant-photos', restaurantId, image);
  const { error } = await supabase
    .from('restaurants')
    .update({ cover_path: path })
    .eq('id', restaurantId);
  if (error) throw await toAppError(error);
  if (previousPath) await removeImage('restaurant-photos', previousPath);
}

type PhotoInput = { restaurantId: string; sortOrder: number; image: PickedImage };

export async function addStorePhoto({ restaurantId, sortOrder, image }: PhotoInput) {
  const path = await uploadImage('restaurant-photos', restaurantId, image);
  const { error } = await supabase
    .from('restaurant_photos')
    .insert({ restaurant_id: restaurantId, path, sort_order: sortOrder });
  if (error) {
    await removeImage('restaurant-photos', path);
    throw await toAppError(error);
  }
}

export async function removeStorePhoto(photo: StorePhoto) {
  const { error } = await supabase.from('restaurant_photos').delete().eq('id', photo.id);
  if (error) throw await toAppError(error);
  await removeImage('restaurant-photos', photo.path);
}
