import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { formatCep } from '@/shared/lib/location';
import { storeFormSchema } from '../schemas';
import type { Restaurant } from '../services/restaurants.service';

export function useStoreForm(restaurant: Restaurant) {
  return useForm({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: restaurant.name,
      description: restaurant.description ?? '',
      postalCode: restaurant.postal_code ? formatCep(restaurant.postal_code) : '',
      street: restaurant.street,
      number: restaurant.number ?? '',
      complement: restaurant.complement ?? '',
      neighborhood: restaurant.neighborhood ?? '',
      // Endereço atual já vale como resolvido; só muda se a pessoa trocar o CEP.
      address: {
        postalCode: restaurant.postal_code ?? '',
        street: restaurant.street,
        neighborhood: restaurant.neighborhood,
        city: restaurant.city,
        state: restaurant.state,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      },
    },
  });
}
