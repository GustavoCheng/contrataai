import { z } from 'zod';
import { HttpError } from './http.ts';

const BASE_URL = Deno.env.get('ASAAS_API_URL') ?? 'https://api-sandbox.asaas.com/v3';
const TIMEOUT_MS = 15000;

async function request<T>(
  schema: z.ZodType<T>,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const apiKey = Deno.env.get('ASAAS_API_KEY');
  if (!apiKey) throw new Error('ASAAS_API_KEY não configurada');
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        access_token: apiKey,
        'User-Agent': 'ContrataAi',
        'Content-Type': 'application/json',
      },
      body: body && JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(502, 'payment_provider_error');
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('Asaas', method, path, response.status, JSON.stringify(data));
    throw new HttpError(502, 'payment_provider_error');
  }
  return schema.parse(data);
}

const idSchema = z.object({ id: z.string() });

export async function findOrCreateCustomer(customer: { name: string; cnpj: string }) {
  const found = await request(
    z.object({ data: z.array(idSchema) }),
    'GET',
    `/customers?cpfCnpj=${customer.cnpj}`,
  );
  if (found.data[0]) return found.data[0].id;
  const created = await request(idSchema, 'POST', '/customers', {
    name: customer.name,
    cpfCnpj: customer.cnpj,
  });
  return created.id;
}

/** Hoje no fuso de São Paulo (o vencimento da cobrança não pode ser no passado). */
const todayInBrazil = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

export async function createPixCharge(charge: {
  customerId: string;
  amountCents: number;
  description: string;
  externalReference: string;
}) {
  return request(idSchema, 'POST', '/payments', {
    customer: charge.customerId,
    billingType: 'PIX',
    value: charge.amountCents / 100,
    dueDate: todayInBrazil(),
    description: charge.description,
    externalReference: charge.externalReference,
  });
}

export async function getPixQrCode(chargeId: string) {
  return request(
    z.object({ payload: z.string(), encodedImage: z.string() }),
    'GET',
    `/payments/${chargeId}/pixQrCode`,
  );
}

/** Cancela uma cobrança ainda não paga. */
export async function deleteCharge(chargeId: string) {
  await request(z.object({ deleted: z.boolean() }), 'DELETE', `/payments/${chargeId}`);
}

/** Estorno integral de uma cobrança paga. */
export async function refundCharge(chargeId: string) {
  await request(idSchema, 'POST', `/payments/${chargeId}/refund`, {});
}

const pixKeyTypes = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'EMAIL',
  phone: 'PHONE',
  random: 'EVP',
} as const;

export async function createPixTransfer(transfer: {
  amountCents: number;
  pixKey: string;
  pixKeyType: keyof typeof pixKeyTypes;
  description: string;
  externalReference: string;
}) {
  return request(z.object({ id: z.string(), status: z.string() }), 'POST', '/transfers', {
    value: transfer.amountCents / 100,
    operationType: 'PIX',
    pixAddressKey: transfer.pixKeyType === 'phone' ? `+55${transfer.pixKey}` : transfer.pixKey,
    pixAddressKeyType: pixKeyTypes[transfer.pixKeyType],
    description: transfer.description,
    externalReference: transfer.externalReference,
  });
}
