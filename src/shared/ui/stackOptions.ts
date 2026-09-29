import { colors, fontSize, fontWeight } from './theme';

/** Cabeçalho limpo e igual em todas as pilhas de telas. */
export const stackScreenOptions = {
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  headerTintColor: colors.text,
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  contentStyle: { backgroundColor: colors.background },
} as const;
