import '@supabase/functions-js/edge-runtime.d.ts';
import { type SupabaseContext, withSupabase } from '@supabase/server';
import { signCheckpoint } from '../_shared/checkpoint-token.ts';
import type { Database } from '../_shared/database.types.ts';
import { loadGig } from '../_shared/gig.ts';
import { callerId, handleErrors, HttpError, readGigId } from '../_shared/http.ts';

/**
 * QR que o restaurante mostra ao freelancer: check-in depois do pagamento retido,
 * check-out depois do check-in. Vale 5 minutos e só na etapa em que foi gerado.
 */
export default {
  fetch: withSupabase<Database>(
    { auth: 'user' },
    handleErrors(async (req, ctx: SupabaseContext<Database>) => {
      const gig = await loadGig(ctx.supabaseAdmin, await readGigId(req));
      if (gig.restaurant_id !== callerId(ctx)) throw new HttpError(403, 'forbidden');

      const kind =
        gig.status === 'paid_held' ? 'check_in' : gig.status === 'checked_in' ? 'check_out' : null;
      if (!kind) throw new HttpError(409, 'checkpoint_unavailable');

      const { token, expiresAt } = await signCheckpoint(gig.id, kind);
      return Response.json({ token, kind, expiresAt });
    }),
  ),
};
