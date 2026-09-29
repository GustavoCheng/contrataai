import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';
import { colors, fontSize, radius, spacing, touchHeight } from './theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, secureTextEntry, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={styles.container}>
      <Text variant="caption" weight="semibold">
        {label}
      </Text>
      <View
        style={[
          styles.box,
          inputProps.multiline && styles.boxMultiline,
          focused && styles.focused,
          !!error && styles.invalid,
        ]}
      >
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textMuted}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          style={[styles.input, inputProps.multiline && styles.inputMultiline]}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Esconder senha'}
            hitSlop={spacing.md}
            onPress={() => setHidden((value) => !value)}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : (
        hint && (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  box: {
    minHeight: touchHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  boxMultiline: { alignItems: 'flex-start' },
  focused: { borderColor: colors.text },
  invalid: { borderColor: colors.danger },
  input: { flex: 1, fontSize: fontSize.body, color: colors.text, paddingVertical: spacing.md },
  inputMultiline: { minHeight: 120, textAlignVertical: 'top' },
});
