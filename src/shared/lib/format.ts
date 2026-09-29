/** "2016-03-10" -> "há 8 anos" (tempo desde a data, em anos completos). */
export function formatTimeSince(isoDate: string, now = new Date()): string {
  const start = new Date(`${isoDate}T00:00:00`);
  let years = now.getFullYear() - start.getFullYear();
  const beforeAnniversary =
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
  if (beforeAnniversary) years -= 1;

  if (years < 1) return 'há menos de 1 ano';
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}

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

/** Salário fixo ou faixa: "R$ 3.500" / "R$ 3.500 – R$ 4.500". */
export function formatPayRange(minCents: number, maxCents: number | null): string {
  return maxCents && maxCents !== minCents
    ? `${formatMoney(minCents)} – ${formatMoney(maxCents)}`
    : formatMoney(minCents);
}

/** 0.4 -> "400 m"; 2.35 -> "2,4 km"; 12.2 -> "12 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 100) * 100)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const pad = (value: number) => String(value).padStart(2, '0');
const hourLabel = (date: Date) =>
  `${pad(date.getHours())}h${date.getMinutes() ? pad(date.getMinutes()) : ''}`;

/** "sáb, 27/09" */
export function formatDay(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** Turno do freela no horário do aparelho: "sáb, 27/09 · 18h–00h". */
export function formatShiftWindow(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  return `${formatDay(start)} · ${hourLabel(start)}–${hourLabel(new Date(endsAt))}`;
}

const clock = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** "18:05" */
export const formatTime = (iso: string) => clock(new Date(iso));

/** Momento de um evento do freela: "sáb, 27/09 às 18:05". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${formatDay(date)} às ${clock(date)}`;
}

const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

/** Data de uma avaliação: "setembro de 2026". */
export const formatMonthYear = (iso: string) => monthYear.format(new Date(iso));

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

/** Máscara de horário enquanto digita: "1830" -> "18:30". */
export function formatTimeInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

/** Máscara de valor em reais inteiros enquanto digita: "3500" -> "3.500". */
export function formatReaisInput(text: string): string {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, 7);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const reaisToCents = (text: string) => Number(text.replace(/\D/g, '') || 0) * 100;

export const centsToReaisInput = (cents: number) =>
  formatReaisInput(String(Math.round(cents / 100)));

/** Mesma normalização das colunas de busca do banco: sem acento e em minúsculas. */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[%_*,()]/g, '')
    .trim()
    .toLowerCase();
}
