import type { Enums } from '@/shared/lib/database.types';
import { AppError, toAppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';
import type {
  SignInInput,
  SignUpProfessionalInput,
  SignUpRestaurantInput,
  VerifyEmailInput,
} from '../schemas';

export type AccountType = Enums<'account_type'>;

export async function signIn(input: SignInInput): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) throw await toAppError(error);
}

export async function signUpProfessional(input: SignUpProfessionalInput): Promise<void> {
  const { data, error } = await supabase.auth.signUp(input);
  if (error) throw await toAppError(error);
  // Com confirmação ligada, e-mail já confirmado volta sem identidades (proteção contra enumeração).
  if (data.user?.identities?.length === 0) throw new AppError('email_taken');
}

/** CNPJ é validado na Receita pela Edge Function antes de a conta existir. */
export async function registerRestaurant(input: SignUpRestaurantInput): Promise<void> {
  const { error } = await supabase.functions.invoke('register-restaurant', { body: input });
  if (error) throw await toAppError(error);
}

export async function verifyEmail({ email, code }: VerifyEmailInput): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
  if (error) throw await toAppError(error);
}

export async function resendCode(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw await toAppError(error);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw await toAppError(error);
}

export async function getAccountType(userId: string): Promise<AccountType> {
  const { data, error } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', userId)
    .single();
  if (error) throw await toAppError(error);
  return data.account_type;
}
