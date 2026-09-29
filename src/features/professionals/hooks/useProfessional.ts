import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pickImage } from '@/shared/lib/image-picker';
import { invalidate, sharedKeys } from '@/shared/lib/query-client';
import type { ProfessionalFormValues } from '../schemas';
import {
  getProfessional,
  getProfessionalSettings,
  saveProfessional,
  uploadAvatar,
} from '../services/professionals.service';

const settingsKey = (userId: string) => ['professional-settings', userId] as const;

export function useProfessional(id: string) {
  return useQuery({ queryKey: sharedKeys.professional(id), queryFn: () => getProfessional(id) });
}

export function useProfessionalSettings(userId: string) {
  return useQuery({
    queryKey: settingsKey(userId),
    queryFn: () => getProfessionalSettings(userId),
  });
}

export function useSaveProfessional(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { values: ProfessionalFormValues; previousPhotoPath: string | null }) =>
      saveProfessional({ userId, ...input }),
    onSuccess: () =>
      invalidate(queryClient, [sharedKeys.professional(userId), settingsKey(userId)]),
  });
}

/** Abre câmera/galeria e já envia a foto; devolve o caminho no Storage (ou null se cancelar). */
export function useAvatarUpload(userId: string) {
  return useMutation({
    mutationFn: async () => {
      const image = await pickImage([1, 1]);
      return image ? uploadAvatar(userId, image) : null;
    },
  });
}
