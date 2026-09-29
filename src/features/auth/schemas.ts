import { z } from 'zod';
import { isValidCnpj, normalizeCnpj } from '@/shared/lib/cnpj';

const email = z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.'));
const newPassword = z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.');

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
});

export const signUpProfessionalSchema = z.object({ email, password: newPassword });

export const signUpRestaurantSchema = z.object({
  cnpj: z
    .string()
    .refine(isValidCnpj, 'CNPJ inválido. Confira os números.')
    .transform(normalizeCnpj),
  email,
  password: newPassword,
});

export type SignInInput = z.output<typeof signInSchema>;
export type SignUpProfessionalInput = z.output<typeof signUpProfessionalSchema>;
export type SignUpRestaurantInput = z.output<typeof signUpRestaurantSchema>;
export type VerifyEmailInput = { email: string; code: string };
