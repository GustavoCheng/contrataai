import '@supabase/functions-js/edge-runtime.d.ts';
import { type SupabaseContext, withSupabase } from '@supabase/server';
import { z } from 'zod';
import { verifyCheckpoint } from '../_shared/checkpoint-token.ts';
import type { Database } from '../_shared/database.types.ts';
import { loadGig, moveGig } from '../_shared/gig.ts';
import { callerId, handleErrors, HttpError } from '../_shared/http.ts';

const bodySchema = z.object({ token: z.string().min(1) });

/**
 * Freelancer lê o QR: confere assinatura, validade, se é o freelancer confirmado e se o
 * chamado está na etapa do QR. Uso único: depois da troca de estado, o QR não vale mais.
 */
export default {
  fetch: withSupabase<Database>(
    { auth: 'user' },
    handleErrors(async (req, ctx: SupabaseContext<Database>) => {
      const body = bodySchema.safeParse(await req.json().catch(() => null));
      if (!body.success) throw new HttpError(400, 'invalid_input');

      const { gigId, kind } = await verifyCheckpoint(body.data.token);
      const admin = ctx.supabaseAdmin;
      const gig = await loadGig(admin, gigId);
      if (gig.professional_id !== callerId(ctx)) throw new HttpError(403, 'checkpoint_not_yours');

      const [from, to] =
        kind === 'check_in'
          ? (['paid_held', 'checked_in'] as const)
          : (['checked_in', 'checked_out'] as const);
      if (!(await moveGig(admin, gigId, from, to))) throw new HttpError(409, 'checkpoint_used');

      return Response.json({ gigId, status: to });
    }),
  ),
};
