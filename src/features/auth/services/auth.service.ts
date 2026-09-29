import { AppError, toAppError, unwrap } from '@/shared/lib/errors';
import type { AccountType } from '@/shared/lib/labels';
import { supabase } from '@/shared/lib/supabase';
import type {
  SignInInput,
  SignUpProfessionalInput,
  SignUpRestaurantInput,
  VerifyEmailInput,
} from '../schemas';

export async function signIn(input: SignInInput): Promise<void> {
  await unwrap(supabase.auth.signInWithPassword(input));
}

export async function signUpProfessional(input: SignUpProfessionalInput): Promise<void> {
  const { user } = await unwrap(supabase.auth.signUp(input));
  // Com confirmação ligada, e-mail já confirmado volta sem identidades (proteção contra enumeração).
  if (user?.identities?.length === 0) throw new AppError('email_taken');
}

export async function registerRestaurant(input: SignUpRestaurantInput): Promise<void> {
  await unwrap(supabase.functions.invoke('register-restaurant', { body: input }));
}

export async function verifyEmail({ email, code }: VerifyEmailInput): Promise<void> {
  await unwrap(supabase.auth.verifyOtp({ email, token: code, type: 'signup' }));
}

export async function resendCode(email: string): Promise<void> {
  await unwrap(supabase.auth.resend({ type: 'signup', email }));
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw await toAppError(error);
}

export async function getAccountType(userId: string): Promise<AccountType> {
  const { account_type } = await unwrap(
    supabase.from('profiles').select('account_type').eq('id', userId).single(),
  );
  return account_type;
}
