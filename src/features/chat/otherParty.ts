import { imageUrl } from '@/shared/lib/storage';
import type { Conversation } from './services/chat.service';

/** Quem está do outro lado da conversa, para quem está vendo. */
export function otherParty(conversation: Conversation, userId: string) {
  if (conversation.restaurants.id === userId) {
    const { full_name, photo_path } = conversation.professionals;
    return {
      name: full_name,
      imageUri: photo_path && imageUrl('avatars', photo_path),
      placeholderIcon: 'person-outline',
      shape: 'round',
    } as const;
  }
  const { name, cover_path } = conversation.restaurants;
  return {
    name,
    imageUri: cover_path && imageUrl('restaurant-photos', cover_path),
    placeholderIcon: 'storefront-outline',
    shape: 'square',
  } as const;
}
