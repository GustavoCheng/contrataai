import { z } from 'zod';

const RATING_MESSAGE = 'Escolha de 1 a 5 estrelas.';

export const reviewSchema = z.object({
  rating: z.number().int().min(1, RATING_MESSAGE).max(5, RATING_MESSAGE),
  comment: z.string().trim().max(1000, 'Use no máximo 1000 caracteres.'),
});

export type ReviewInput = z.input<typeof reviewSchema>;
export type ReviewValues = z.output<typeof reviewSchema>;
