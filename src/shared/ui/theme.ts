/** 60/30/10 (destaque só em ações), grade de 8pt, 4 tamanhos e 2 pesos; texto por opacidade. */
export const colors = {
  background: '#FFFFFF',
  surface: '#F7F7F7',
  border: '#DDDDDD',
  text: '#222222',
  textBody: 'rgba(34, 34, 34, 0.8)',
  textMuted: 'rgba(34, 34, 34, 0.7)',
  primary: '#C24020',
  primarySoft: 'rgba(194, 64, 32, 0.08)',
  danger: '#C13515',
  dangerSoft: 'rgba(193, 53, 21, 0.08)',
  success: '#1E7B34',
  successSoft: 'rgba(30, 123, 52, 0.1)',
  onPrimary: '#FFFFFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { md: 12, lg: 16, pill: 999 } as const;

export const fontSize = { title: 28, heading: 20, body: 16, caption: 13 } as const;

export const fontWeight = { regular: '400', semibold: '600' } as const;

// Sombra suave, tingida com o tom do texto (nunca preto puro).
export const shadow = {
  card: { boxShadow: '0px 4px 12px rgba(34, 34, 34, 0.08)' },
} as const;

/** Altura mínima de alvos de toque (44pt) com folga para a zona do polegar. */
export const touchHeight = 52;
