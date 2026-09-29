import { type AuthConfig, type SupabaseContext, withSupabase } from '@supabase/server';
import type { z } from 'zod';
import type { Database } from './database.types.ts';

export type Context = SupabaseContext<Database>;
export type Admin = Context['supabaseAdmin'];

/** Erro de negócio com código estável; o app traduz o código para a mensagem em português. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly details: Record<string, string> = {},
  ) {
    super(code);
  }
}

/** Entrada de uma função: clientes do Supabase no ctx e todo erro como JSON `{ code, ...details }`. */
export function handle(
  auth: AuthConfig,
  handler: (req: Request, ctx: Context) => Promise<Response>,
) {
  return {
    fetch: withSupabase<Database>({ auth }, async (req, ctx) => {
      try {
        return await handler(req, ctx);
      } catch (error) {
        if (error instanceof HttpError) {
          return Response.json({ code: error.code, ...error.details }, { status: error.status });
        }
        console.error(error);
        return Response.json({ code: 'internal_error' }, { status: 500 });
      }
    }),
  };
}

/** Corpo JSON validado pelo schema. */
export async function readBody<T>(
  req: Request,
  schema: z.ZodType<T>,
  error = new HttpError(400, 'invalid_input'),
): Promise<T> {
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) throw error;
  return body.data;
}
