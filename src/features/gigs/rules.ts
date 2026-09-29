import type { GigStatus } from '@/shared/lib/labels';

// Espelham as regras do back-end, que é quem valida: cancel-gig, open_gig_dispute e a RLS de reviews.
export const CANCELLABLE: GigStatus[] = ['open', 'confirmed', 'paid_held'];
export const DISPUTABLE: GigStatus[] = ['paid_held', 'checked_in', 'checked_out'];
export const REVIEWABLE: GigStatus[] = ['checked_out', 'released'];
