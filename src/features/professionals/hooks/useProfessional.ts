import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pickImage } from '@/shared/lib/image-picker';
import {
  getProfessional,
  getProfessionalSettings,
  saveProfessional,
  uploadAvatar,
} from '../services/professionals.service';

export const professionalKeys = {
  profile: (id: string | undefined) => ['professional', id] as const,
  settings: (userId: string) => ['professional-settings', userId] as const,
};

export function useProfessional(id: string | undefined) {
  return useQuery({
    queryKey: professionalKeys.profile(id),
    queryFn: id ? () => getProfessional(id) : skipToken,
  });
}

export function useProfessionalSettings(userId: string) {
  return useQuery({
    queryKey: professionalKeys.settings(userId),
    queryFn: () => getProfessionalSettings(userId),
  });
}

export function useSaveProfessional(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveProfessional,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: professionalKeys.profile(userId) }),
        queryClient.invalidateQueries({ queryKey: professionalKeys.settings(userId) }),
      ]),
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
