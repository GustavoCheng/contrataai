import { AppError, unwrap } from '@/shared/lib/errors';
import { removeImage, uploadImage, type PickedImage } from '@/shared/lib/storage';
import { supabase } from '@/shared/lib/supabase';
import { normalizePixKey } from '../pix';
import type { ProfessionalFormValues } from '../schemas';

/** Perfil público: o que restaurantes veem. */
export function getProfessional(id: string) {
  return unwrap(
    supabase
      .from('professionals')
      .select(
        'full_name, photo_path, main_role, secondary_roles, experience, neighborhood, city, state, available_for_gigs, rating_avg, rating_count',
      )
      .eq('id', id)
      .single(),
  );
}

export type Professional = Awaited<ReturnType<typeof getProfessional>>;

/** Dados editáveis do próprio perfil, incluindo os privados. `null` = onboarding pendente. */
export function getProfessionalSettings(userId: string) {
  return unwrap(
    supabase
      .from('professionals')
      .select(
        'full_name, photo_path, main_role, secondary_roles, experience, neighborhood, city, state, available_for_gigs, professional_locations(postal_code, latitude, longitude), payout_accounts(pix_key, pix_key_type)',
      )
      .eq('id', userId)
      .maybeSingle(),
  );
}

export type ProfessionalSettings = NonNullable<Awaited<ReturnType<typeof getProfessionalSettings>>>;

export function uploadAvatar(userId: string, image: PickedImage): Promise<string> {
  return uploadImage('avatars', userId, image);
}

type SaveInput = {
  userId: string;
  values: ProfessionalFormValues;
  previousPhotoPath: string | null;
};

export async function saveProfessional({
  userId,
  values,
  previousPhotoPath,
}: SaveInput): Promise<void> {
  const { address } = values;
  if (!address) throw new AppError('cep_invalid'); // o schema já garante; aqui só estreita o tipo

  await unwrap(
    supabase.from('professionals').upsert({
      id: userId,
      full_name: values.fullName,
      photo_path: values.photoPath,
      main_role: values.mainRole,
      secondary_roles: values.secondaryRoles.filter((role) => role !== values.mainRole),
      experience: values.experience || null,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      available_for_gigs: values.availableForGigs,
    }),
  );
  await unwrap(
    supabase.from('professional_locations').upsert({
      professional_id: userId,
      postal_code: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude,
    }),
  );
  await unwrap(
    values.pixKey && values.pixKeyType
      ? supabase.from('payout_accounts').upsert({
          professional_id: userId,
          pix_key: normalizePixKey(values.pixKeyType, values.pixKey),
          pix_key_type: values.pixKeyType,
        })
      : supabase.from('payout_accounts').delete().eq('professional_id', userId),
  );

  if (previousPhotoPath && previousPhotoPath !== values.photoPath) {
    await removeImage('avatars', previousPhotoPath);
  }
}
