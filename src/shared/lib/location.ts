import { toAppError } from './errors';
import { supabase } from './supabase';

/** Resposta da Edge Function lookup-cep. */
export type CepAddress = {
  postalCode: string;
  street: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
};

export async function lookupCep(postalCode: string): Promise<CepAddress> {
  const { data, error } = await supabase.functions.invoke<CepAddress>('lookup-cep', {
    body: { postalCode },
  });
  if (error || !data) throw await toAppError(error);
  return data;
}

export const cepDigits = (value: string) => value.replace(/\D/g, '').slice(0, 8);

/** "04538133" -> "04538-133" (máscara enquanto digita). */
export function formatCep(value: string): string {
  const digits = cepDigits(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/** "Pinheiros, São Paulo - SP" */
export function formatPlace(place: Pick<CepAddress, 'neighborhood' | 'city' | 'state'>): string {
  return [place.neighborhood, `${place.city} - ${place.state}`].filter(Boolean).join(', ');
}
