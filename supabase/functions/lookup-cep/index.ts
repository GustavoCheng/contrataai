import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';
import { z } from 'zod';
import { lookupCep } from '../_shared/cep.ts';
import { handleErrors, HttpError } from '../_shared/http.ts';

const bodySchema = z.object({
  postalCode: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().length(8)),
});

/**
 * CEP -> endereço (com acentos) e coordenadas, para os perfis de loja e de profissional.
 * Só para usuários logados: evita que a cota do serviço de CEP seja usada por terceiros.
 */
export default {
  fetch: withSupabase(
    { auth: 'user' },
    handleErrors(async (req) => {
      const body = bodySchema.safeParse(await req.json().catch(() => null));
      if (!body.success) throw new HttpError(422, 'cep_invalid');
      return Response.json(await lookupCep(body.data.postalCode));
    }),
  ),
};
