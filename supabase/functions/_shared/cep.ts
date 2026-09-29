import { z } from 'zod';
import { HttpError } from './http.ts';

const TIMEOUT_MS = 8000;

const optionalText = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || null);

const awesomeApiSchema = z.object({
  address: optionalText,
  district: optionalText,
  city: z.string(),
  state: z.string(),
  lat: z.coerce.number().nullish(),
  lng: z.coerce.number().nullish(),
});

const brasilApiSchema = z.object({
  street: optionalText,
  neighborhood: optionalText,
  city: z.string(),
  state: z.string(),
});

export interface Address {
  postalCode: string;
  street: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * CEP -> endereço com acentos e, quando possível, coordenadas do trecho do CEP.
 * Principal: AwesomeAPI, a única com coordenadas por CEP. Sem AWESOMEAPI_KEY a cota é por IP de
 * saída: basta no ambiente local, mas na nuvem o IP é compartilhado e a cota vive estourada.
 * Reserva: BrasilAPI, só com o endereço (sem coordenadas, o card não mostra a distância).
 */
export async function lookupCep(postalCode: string): Promise<Address> {
  try {
    return await fromAwesomeApi(postalCode);
  } catch (error) {
    // CEP inválido ou inexistente é resposta definitiva; cota ou serviço fora do ar, não.
    if (error instanceof HttpError && error.status === 422) throw error;
    return await fromBrasilApi(postalCode);
  }
}

async function fromAwesomeApi(postalCode: string): Promise<Address> {
  const apiKey = Deno.env.get('AWESOMEAPI_KEY');
  const data = awesomeApiSchema.parse(
    await getJson(
      `https://cep.awesomeapi.com.br/json/${postalCode}`,
      apiKey ? { 'x-api-key': apiKey } : undefined,
    ),
  );
  return {
    postalCode,
    street: data.address,
    neighborhood: data.district,
    city: data.city,
    state: data.state,
    latitude: data.lat ?? null,
    longitude: data.lng ?? null,
  };
}

async function fromBrasilApi(postalCode: string): Promise<Address> {
  const data = brasilApiSchema.parse(
    await getJson(`https://brasilapi.com.br/api/cep/v1/${postalCode}`),
  );
  return {
    postalCode,
    street: data.street,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    latitude: null,
    longitude: null,
  };
}

/** GET que traduz as falhas do serviço de CEP para os códigos de erro do app. */
async function getJson(url: string, headers?: Record<string, string>): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    console.error('CEP', url, error);
    throw new HttpError(502, 'cep_lookup_failed');
  }
  if (response.status === 404) throw new HttpError(422, 'cep_not_found');
  if (response.status === 400) throw new HttpError(422, 'cep_invalid');
  if (!response.ok) {
    console.error('CEP', url, response.status, (await response.text()).slice(0, 300));
    throw new HttpError(502, 'cep_lookup_failed');
  }
  return await response.json();
}
