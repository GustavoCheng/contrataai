import { shiftLabels, type WorkShift } from './labels';

// Mínimo e máximo juntos: há motores que recusam só o máximo abaixo do padrão da moeda (2 casas).
const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const moneyWithCents = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 350000 -> "R$ 3.500"; 25050 -> "R$ 250,50". */
export function formatMoney(cents: number): string {
  return (cents % 100 === 0 ? money : moneyWithCents).format(cents / 100);
}

/** "R$ 3.500 – R$ 4.500/mês · Noite" (faixa só quando o máximo difere; turno quando houver). */
export function formatSalary(
  minCents: number,
  maxCents: number | null,
  shift?: WorkShift | null,
): string {
  const range =
    maxCents && maxCents !== minCents
      ? `${formatMoney(minCents)} – ${formatMoney(maxCents)}`
      : formatMoney(minCents);
  return shift ? `${range}/mês · ${shiftLabels[shift]}` : `${range}/mês`;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const pad = (value: number) => String(value).padStart(2, '0');
const hourLabel = (date: Date) =>
  `${pad(date.getHours())}h${date.getMinutes() ? pad(date.getMinutes()) : ''}`;

export function formatDay(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** Valor e turno do freela no horário do aparelho: "R$ 250 · sáb, 27/09 · 18h–00h". */
export function formatGigPay(cents: number, startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  return `${formatMoney(cents)} · ${formatDay(start)} · ${hourLabel(start)}–${hourLabel(new Date(endsAt))}`;
}

const clock = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const formatTime = (iso: string) => clock(new Date(iso));

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${formatDay(date)} às ${clock(date)}`;
}

/** Hora de mensagem: "18:05" hoje, "ontem" ou "25/09". */
export function formatMessageTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86_400_000,
  );
  if (days === 0) return clock(date);
  if (days === 1) return 'ontem';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** Máscara de valor em reais inteiros enquanto digita: "3500" -> "3.500". */
export function formatReaisInput(text: string): string {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, 7);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const reaisToCents = (text: string) => Number(text.replace(/\D/g, '') || 0) * 100;

export const firstName = (fullName: string) => fullName.split(' ')[0];

/**
 * Mesma normalização das colunas de busca do banco: sem acento e em minúsculas. Os caracteres
 * removidos teriam significado especial no filtro `ilike` do PostgREST.
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[%_*,()]/g, '')
    .trim()
    .toLowerCase();
}
