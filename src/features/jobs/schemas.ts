import { z } from 'zod';
import { reaisToCents } from '@/shared/lib/format';
import { jobRoles, workShifts } from '@/shared/lib/labels';

export const jobFormSchema = z
  .object({
    role: z.enum(jobRoles, 'Escolha o cargo.'),
    shift: z.enum(workShifts, 'Escolha o turno.'),
    salaryMin: z.string().refine((value) => reaisToCents(value) > 0, 'Informe o salário.'),
    salaryMax: z.string(),
    description: z
      .string()
      .trim()
      .min(20, 'Conte um pouco mais sobre a vaga (mínimo de 20 caracteres).')
      .max(1000, 'Use no máximo 1000 caracteres.'),
  })
  .superRefine(
    (values, ctx) => {
      if (values.salaryMax && reaisToCents(values.salaryMax) < reaisToCents(values.salaryMin)) {
        ctx.addIssue({
          code: 'custom',
          path: ['salaryMax'],
          message: 'O máximo precisa ser maior que o mínimo.',
        });
      }
    },
    { when: () => true },
  );

export type JobFormInput = z.input<typeof jobFormSchema>;
export type JobFormValues = z.output<typeof jobFormSchema>;
