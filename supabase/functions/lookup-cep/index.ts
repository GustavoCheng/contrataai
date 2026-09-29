import { z } from 'zod';
import { lookupCep } from '../_shared/cep.ts';
import { handle, HttpError, readBody } from '../_shared/http.ts';

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
export default handle('user', async (req) => {
  const { postalCode } = await readBody(req, bodySchema, new HttpError(422, 'cep_invalid'));
  return Response.json(await lookupCep(postalCode));
});
