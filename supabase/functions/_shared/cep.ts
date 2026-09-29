import { z } from 'zod';
import { HttpError } from './http.ts';

const TIMEOUT_MS = 8000;

export const optionalText = z
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

interface Address {
  postalCode: string;
  street: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * AwesomeAPI, a única com coordenadas por CEP (sem AWESOMEAPI_KEY a cota é por IP e estoura na
 * nuvem); se falhar, BrasilAPI só com o endereço, e o card fica sem distância.
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
      'cep',
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
    await getJson(`https://brasilapi.com.br/api/cep/v1/${postalCode}`, 'cep'),
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

export async function getJson(
  url: string,
  subject: 'cep' | 'cnpj',
  headers?: Record<string, string>,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    console.error(url, error);
    throw new HttpError(502, `${subject}_lookup_failed`);
  }
  if (response.status === 404) throw new HttpError(422, `${subject}_not_found`);
  if (response.status === 400) throw new HttpError(422, `${subject}_invalid`);
  if (!response.ok) {
    console.error(url, response.status, (await response.text()).slice(0, 300));
    throw new HttpError(502, `${subject}_lookup_failed`);
  }
  return await response.json();
}
