import { formatDay, pad } from '@/shared/lib/format';

const toDayValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function dayOptions(now = new Date()) {
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + index);
    const label = index === 0 ? 'Hoje' : index === 1 ? 'Amanhã' : formatDay(date);
    return { value: toDayValue(date), label };
  });
}

/** Início e fim no fuso do aparelho; se o fim for antes do início, o turno vira a noite. */
export function toShiftDates(day: string, startTime: string, endTime: string) {
  const [year, month, date] = day.split('-').map(Number);
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startsAt = new Date(year, month - 1, date, startHour, startMinute);
  const endsAt = new Date(year, month - 1, date, endHour, endMinute);
  if (endsAt <= startsAt) endsAt.setDate(endsAt.getDate() + 1);
  return { startsAt, endsAt };
}
