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

/** Id de quem chamou (modo de auth 'user' do withSupabase). */
export function callerId(ctx: { userClaims: { id: string } | null }): string {
  if (!ctx.userClaims) throw new HttpError(401, 'unauthorized');
  return ctx.userClaims.id;
}

/** Corpo `{ gigId }`, comum às funções do fluxo do freela. */
export async function readGigId(req: Request): Promise<string> {
  const body: unknown = await req.json().catch(() => null);
  const gigId = typeof body === 'object' && body && 'gigId' in body ? body.gigId : null;
  if (typeof gigId !== 'string' || !UUID.test(gigId)) throw new HttpError(400, 'invalid_input');
  return gigId;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Envolve o handler para que todo erro vire uma resposta JSON `{ code, ...details }`. */
export function handleErrors<Ctx>(handler: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ code: error.code, ...error.details }, { status: error.status });
      }
      console.error(error);
      return Response.json({ code: 'internal_error' }, { status: 500 });
    }
  };
}
