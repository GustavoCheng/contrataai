import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from './theme';

type ScreenProps = {
  children: ReactNode;
  /** Ação principal fixa no rodapé (zona do polegar). */
  footer?: ReactNode;
  /** Bordas seguras a respeitar; telas com header nativo usam só a de baixo. */
  edges?: Edge[];
};

export function Screen({ children, footer, edges = ['top', 'bottom'] }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.xl, gap: spacing.xl },
  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.md },
});
