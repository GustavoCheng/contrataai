import { toAppError } from './errors';
import { supabase } from './supabase';

export type ImageBucket = 'avatars' | 'restaurant-photos';
export type PickedImage = { uri: string; mimeType: string };

/** Envia a foto para a pasta do usuário (`{userId}/...`, exigido pelas policies) e devolve o caminho. */
export async function uploadImage(
  bucket: ImageBucket,
  userId: string,
  image: PickedImage,
): Promise<string> {
  const body = await (await fetch(image.uri)).arrayBuffer();
  const extension = image.mimeType.split('/')[1] ?? 'jpg';
  const path = `${userId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType: image.mimeType });
  if (error) throw await toAppError(error);
  return path;
}

export function imageUrl(bucket: ImageBucket, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Apaga uma foto substituída. Se falhar, só sobra um arquivo órfão: quem salva não é afetado. */
export async function removeImage(bucket: ImageBucket, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}
