import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { spacing } from './theme';

const MAX_CONTENT_WIDTH = 640;
const COMPACT_WIDTH = 360;

/** Coluna de conteúdo: margem menor em telas estreitas e largura limitada em telas largas (web). */
export function useLayout() {
  const { width } = useWindowDimensions();
  return {
    gutter: width < COMPACT_WIDTH ? spacing.lg : spacing.xl,
    column: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' } as const,
  };
}

/** Estado do "puxar para atualizar": só gira enquanto a atualização pedida pela pessoa dura. */
export function useRefresh(onRefresh: (() => Promise<unknown>) | undefined) {
  const [refreshing, setRefreshing] = useState(false);
  if (!onRefresh) return undefined;
  return {
    refreshing,
    refresh: async () => {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    },
  };
}
