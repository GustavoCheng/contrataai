import { isValidCnpj, normalizeCnpj } from '@/shared/lib/cnpj';
import { Constants, type Enums } from '@/shared/lib/database.types';

type PixKeyType = Enums<'pix_key_type'>;

export const pixKeyTypeLabels: Record<PixKeyType, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Celular',
  random: 'Aleatória',
};

export const pixKeyTypes = Constants.public.Enums.pix_key_type;
export const pixKeyTypeOptions = pixKeyTypes.map((value) => ({
  value,
  label: pixKeyTypeLabels[value],
}));

export const pixKeyPlaceholders: Record<PixKeyType, string> = {
  cpf: '000.000.000-00',
  cnpj: '00.000.000/0000-00',
  email: 'voce@email.com',
  phone: '(11) 91234-5678',
  random: '123e4567-e89b-12d3-a456-426614174000',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RANDOM_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Formato gravado no banco (e usado no repasse): só dígitos em CPF e celular. */
export function normalizePixKey(type: PixKeyType, key: string): string {
  const value = key.trim();
  switch (type) {
    case 'cpf':
    case 'phone':
      return value.replace(/\D/g, '');
    case 'cnpj':
      return normalizeCnpj(value);
    case 'email':
    case 'random':
      return value.toLowerCase();
  }
}

export function isValidPixKey(type: PixKeyType, key: string): boolean {
  const value = normalizePixKey(type, key);
  switch (type) {
    case 'cpf':
      return isValidCpf(value);
    case 'cnpj':
      return isValidCnpj(value);
    case 'email':
      return EMAIL.test(value);
    case 'phone':
      return /^\d{10,11}$/.test(value); // DDD + número
    case 'random':
      return RANDOM_KEY.test(value);
  }
}

/** Mostra só o suficiente para a pessoa reconhecer a própria chave. */
export function maskPixKey(type: PixKeyType, key: string): string {
  if (type === 'email') {
    const [user, domain] = key.split('@');
    return `${user.charAt(0)}•••@${domain}`;
  }
  return `•••• ${key.slice(-4)}`;
}

function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const checkDigit = (length: number) => {
    const sum = [...cpf.slice(0, length)].reduce(
      (total, digit, index) => total + Number(digit) * (length + 1 - index),
      0,
    );
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}
