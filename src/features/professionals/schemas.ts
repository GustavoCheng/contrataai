import { z } from 'zod';
import { jobRoles } from '@/shared/lib/labels';
import type { CepAddress } from '@/shared/lib/location';
import { isValidPixKey, pixKeyTypes } from './pix';

export const professionalFormSchema = z
  .object({
    photoPath: z.string().nullable(),
    fullName: z.string().trim().min(3, 'Informe seu nome completo.'),
    mainRole: z.enum(jobRoles, 'Escolha seu cargo principal.'),
    secondaryRoles: z.array(z.enum(jobRoles)),
    experience: z.string().trim().max(1000, 'Use no máximo 1000 caracteres.'),
    postalCode: z.string(),
    /** Endereço resolvido pelo CEP (lookup-cep); null enquanto o CEP não é encontrado. */
    address: z.custom<CepAddress | null>(),
    availableForGigs: z.boolean(),
    pixKeyType: z.enum(pixKeyTypes).nullable(),
    pixKey: z.string().trim(),
  })
  .superRefine(
    (values, ctx) => {
      if (!values.address) {
        ctx.addIssue({ code: 'custom', path: ['postalCode'], message: 'Informe um CEP válido.' });
      }
      if (values.pixKey && !values.pixKeyType) {
        ctx.addIssue({ code: 'custom', path: ['pixKeyType'], message: 'Escolha o tipo da chave.' });
      } else if (
        values.pixKey &&
        values.pixKeyType &&
        !isValidPixKey(values.pixKeyType, values.pixKey)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['pixKey'],
          message: 'Chave inválida para o tipo escolhido.',
        });
      }
    },
    // Roda mesmo com erros nos campos, para a pessoa ver todos de uma vez.
    { when: () => true },
  );

export type ProfessionalFormInput = z.input<typeof professionalFormSchema>;
export type ProfessionalFormValues = z.output<typeof professionalFormSchema>;
