import { errors, jwtVerify, SignJWT } from 'jose';
import { HttpError } from './http.ts';

export type CheckpointKind = 'check_in' | 'check_out';

const TTL_SECONDS = 5 * 60;

function secret(): Uint8Array {
  const value = Deno.env.get('CHECKPOINT_SECRET');
  if (!value) throw new Error('CHECKPOINT_SECRET não configurado');
  return new TextEncoder().encode(value);
}

/** Token do QR: assinado (HS256), com validade curta e preso ao chamado e à etapa. */
export async function signCheckpoint(gigId: string, kind: CheckpointKind) {
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);
  const token = await new SignJWT({ gig: gigId, kind })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secret());
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function verifyCheckpoint(
  token: string,
): Promise<{ gigId: string; kind: CheckpointKind }> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    if (
      typeof payload.gig !== 'string' ||
      (payload.kind !== 'check_in' && payload.kind !== 'check_out')
    ) {
      throw new HttpError(422, 'checkpoint_invalid');
    }
    return { gigId: payload.gig, kind: payload.kind };
  } catch (error) {
    if (error instanceof errors.JWTExpired) throw new HttpError(422, 'checkpoint_expired');
    if (error instanceof HttpError) throw error;
    throw new HttpError(422, 'checkpoint_invalid');
  }
}
