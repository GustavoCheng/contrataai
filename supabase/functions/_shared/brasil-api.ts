import { z } from 'zod';
import { lookupCep } from './cep.ts';
import { HttpError } from './http.ts';

const TIMEOUT_MS = 8000;

const optionalText = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || null);

const companySchema = z.object({
  razao_social: z.string(),
  nome_fantasia: optionalText,
  descricao_situacao_cadastral: z.string(),
  data_inicio_atividade: optionalText,
  descricao_tipo_de_logradouro: optionalText,
  logradouro: z.string(),
  numero: optionalText,
  complemento: optionalText,
  bairro: optionalText,
  cep: optionalText,
  municipio: z.string(),
  uf: z.string(),
});

export interface Company {
  legalName: string;
  name: string;
  status: string;
  openedOn: string | null;
  street: string;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  postalCode: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

/** Consulta o CNPJ na Receita (via BrasilAPI) e completa o endereço pelo CEP. */
export async function fetchCompany(cnpj: string): Promise<Company> {
  let response: Response;
  try {
    response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error('CNPJ', error);
    throw new HttpError(502, 'cnpj_lookup_failed');
  }
  if (response.status === 404) throw new HttpError(422, 'cnpj_not_found');
  if (response.status === 400) throw new HttpError(422, 'cnpj_invalid');
  if (!response.ok) {
    console.error('CNPJ', response.status, (await response.text()).slice(0, 300));
    throw new HttpError(502, 'cnpj_lookup_failed');
  }

  const data = companySchema.parse(await response.json());
  const postalCode = data.cep?.replace(/\D/g, '') || null;
  // Pelo CEP vêm acentos e coordenadas; se falhar, fica o endereço da Receita sem coordenadas.
  const cep = postalCode ? await lookupCep(postalCode).catch(() => null) : null;

  return {
    legalName: data.razao_social,
    name: titleCase(data.nome_fantasia ?? data.razao_social),
    status: data.descricao_situacao_cadastral,
    openedOn: data.data_inicio_atividade,
    street:
      cep?.street ??
      titleCase([data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' ')),
    number: data.numero,
    complement: data.complemento && titleCase(data.complemento),
    neighborhood: cep?.neighborhood ?? (data.bairro && titleCase(data.bairro)),
    postalCode,
    city: cep?.city ?? titleCase(data.municipio),
    state: data.uf,
    latitude: cep?.latitude ?? null,
    longitude: cep?.longitude ?? null,
  };
}

const LOWERCASE_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/** "BISTRO DA ESQUINA, LOJA 2A" -> "Bistro da Esquina, Loja 2A" (a Receita devolve tudo em maiúsculas). */
function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word, index) => {
      if (/\d/.test(word)) return word; // códigos como "17A20" ficam como vieram
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
