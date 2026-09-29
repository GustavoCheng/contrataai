import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from './theme';
import { useLayout, useRefresh } from './useLayout';

type ScreenProps = {
  children: ReactNode;
  /** Ação principal fixa no rodapé (zona do polegar). */
  footer?: ReactNode;
  /** Bordas seguras a respeitar; telas com header nativo usam só a de baixo. */
  edges?: Edge[];
  /** Puxar para atualizar (listas e perfis). */
  onRefresh?: () => Promise<unknown>;
};

export function Screen({ children, footer, edges = ['top', 'bottom'], onRefresh }: ScreenProps) {
  const { gutter, column } = useLayout();
  const refresh = useRefresh(onRefresh);
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.grow}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            refresh && (
              <RefreshControl
                refreshing={refresh.refreshing}
                onRefresh={refresh.refresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            )
          }
        >
          <View style={[styles.content, column, { padding: gutter }]}>{children}</View>
        </ScrollView>
        {footer && (
          <View style={[styles.footer, column, { paddingHorizontal: gutter }]}>{footer}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  content: { flexGrow: 1, gap: spacing.xl },
  footer: { paddingVertical: spacing.lg, gap: spacing.md },
});
