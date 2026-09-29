import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';
import { colors, fontSize, fontWeight } from './theme';

type Variant = keyof typeof fontSize;
type Tone = 'default' | 'body' | 'muted' | 'primary' | 'danger' | 'onPrimary';

export type TextProps = RNTextProps & {
  variant?: Variant;
  weight?: keyof typeof fontWeight;
  tone?: Tone;
};

const toneColor: Record<Tone, string> = {
  default: colors.text,
  body: colors.textBody,
  muted: colors.textMuted,
  primary: colors.primary,
  danger: colors.danger,
  onPrimary: colors.onPrimary,
};

export function Text({
  variant = 'body',
  weight = variant === 'title' || variant === 'heading' ? 'semibold' : 'regular',
  tone = variant === 'body' ? 'body' : 'default',
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      style={[styles[variant], { fontWeight: fontWeight[weight], color: toneColor[tone] }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, lineHeight: 34 },
  heading: { fontSize: fontSize.heading, lineHeight: 26 },
  body: { fontSize: fontSize.body, lineHeight: 22 },
  caption: { fontSize: fontSize.caption, lineHeight: 18 },
});
