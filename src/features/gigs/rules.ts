import type { GigStatus } from '@/shared/lib/labels';
import type { CheckpointKind } from './services/gigs.service';

// Espelham as regras do back-end, que é quem valida: cancel-gig, open_gig_dispute e a RLS de reviews.
export const CANCELLABLE: GigStatus[] = ['open', 'confirmed', 'paid_held'];
export const DISPUTABLE: GigStatus[] = ['paid_held', 'checked_in', 'checked_out'];
export const REVIEWABLE: GigStatus[] = ['checked_out', 'released'];

/** Código pendente no estado: check-in com o pagamento retido, check-out durante o turno. */
export const checkpointFor = (status: GigStatus): CheckpointKind | null =>
  status === 'paid_held' ? 'check_in' : status === 'checked_in' ? 'check_out' : null;
