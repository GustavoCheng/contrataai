import { z } from 'zod';
import { reaisToCents } from '@/shared/lib/format';
import { jobRoles } from '@/shared/lib/labels';
import { toShiftDates } from './schedule';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const gigFormSchema = z
  .object({
    role: z.enum(jobRoles, 'Escolha o cargo.'),
    day: z.string().min(1, 'Escolha o dia.'),
    startTime: z.string().regex(TIME, 'Use o formato 18:00.'),
    endTime: z.string().regex(TIME, 'Use o formato 23:30.'),
    amount: z.string().refine((value) => reaisToCents(value) > 0, 'Informe o valor do freela.'),
  })
  .superRefine(
    (values, ctx) => {
      if (!values.day || !TIME.test(values.startTime) || !TIME.test(values.endTime)) return;
      const { startsAt } = toShiftDates(values.day, values.startTime, values.endTime);
      if (startsAt <= new Date()) {
        ctx.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: 'O início precisa ser daqui para frente.',
        });
      }
    },
    { when: () => true },
  );

export type GigFormInput = z.input<typeof gigFormSchema>;
export type GigFormValues = z.output<typeof gigFormSchema>;
