import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  registerRestaurant,
  resendCode,
  signIn,
  signOut,
  signUpProfessional,
  verifyEmail,
} from '../services/auth.service';

export const useSignIn = () => useMutation({ mutationFn: signIn });

export const useSignUpProfessional = () => useMutation({ mutationFn: signUpProfessional });

export const useRegisterRestaurant = () => useMutation({ mutationFn: registerRestaurant });

export const useVerifyEmail = () => useMutation({ mutationFn: verifyEmail });

export const useResendCode = () => useMutation({ mutationFn: resendCode });

export function useSignOut() {
  const queryClient = useQueryClient();
  // Limpa o cache para nada de uma conta aparecer na próxima.
  return useMutation({ mutationFn: signOut, onSuccess: () => queryClient.clear() });
}
