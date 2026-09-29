import { AppError, unwrap } from './errors';
import { supabase } from './supabase';

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
  const address = await unwrap(
    supabase.functions.invoke<CepAddress>('lookup-cep', { body: { postalCode } }),
  );
  if (!address) throw new AppError('unknown');
  return address;
}

export const cepDigits = (value: string) => value.replace(/\D/g, '').slice(0, 8);

/** "04538133" -> "04538-133" (máscara enquanto digita). */
export function formatCep(value: string): string {
  const digits = cepDigits(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatPlace(place: Pick<CepAddress, 'neighborhood' | 'city' | 'state'>): string {
  return [place.neighborhood, `${place.city} - ${place.state}`].filter(Boolean).join(', ');
}

/** 0.4 -> "400 m"; 2.35 -> "2,4 km"; 12.2 -> "12 km". */
function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 100) * 100)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

/** "Pinheiros · 2,4 km": bairro (ou cidade) e a distância quando há coordenadas dos dois lados. */
export function formatNearby(place: {
  neighborhood: string | null;
  city: string;
  distance_km: number | null;
}): string {
  return [
    place.neighborhood ?? place.city,
    place.distance_km != null && formatDistance(place.distance_km),
  ]
    .filter(Boolean)
    .join(' · ');
}
