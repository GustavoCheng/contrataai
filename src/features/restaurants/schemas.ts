import { z } from 'zod';
import type { CepAddress } from '@/shared/lib/location';

export const storeFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome da loja.').max(80, 'Use até 80 caracteres.'),
    description: z.string().trim().max(1000, 'Use no máximo 1000 caracteres.'),
    postalCode: z.string(),
    street: z.string().trim().min(2, 'Informe a rua.'),
    number: z.string().trim().max(20),
    complement: z.string().trim().max(60),
    neighborhood: z.string().trim().max(60),
    /** Cidade, UF e coordenadas do CEP (lookup-cep); null enquanto o CEP não é encontrado. */
    address: z.custom<CepAddress | null>(),
  })
  .superRefine(
    (values, ctx) => {
      if (!values.address) {
        ctx.addIssue({ code: 'custom', path: ['postalCode'], message: 'Informe um CEP válido.' });
      }
    },
    // Roda mesmo com erros nos campos, para a pessoa ver todos de uma vez.
    { when: () => true },
  );

export type StoreFormInput = z.input<typeof storeFormSchema>;
export type StoreFormValues = z.output<typeof storeFormSchema>;
