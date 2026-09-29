import Ionicons from '@expo/vector-icons/Ionicons';
import { Children, type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native';
import { type StatusTone, Text, colors, radius, spacing, toneStyles } from '@/shared/ui';

type StatusCardProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description?: string;
  tone?: StatusTone;
  /** Momento de pico (ex.: "Pagamento liberado"): layout em destaque e ícone animado. */
  celebrate?: boolean;
  children?: ReactNode;
};

/** Em que pé está o processo e o que vem a seguir, com as ações da etapa logo abaixo. */
export function StatusCard({
  icon,
  title,
  description,
  tone = 'neutral',
  celebrate = false,
  children,
}: StatusCardProps) {
  const [scale] = useState(() => new Animated.Value(celebrate ? 0.4 : 1));

  useEffect(() => {
    if (!celebrate) return;
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      if (reduceMotion) return scale.setValue(1);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
    return () => {
      active = false;
    };
  }, [celebrate, scale]);

  const { background, text: iconColor } = toneStyles[tone];
  const content = Children.toArray(children);
  const iconSize = celebrate ? 32 : 20;

  return (
    <View
      style={[styles.card, celebrate && styles.celebrate, { backgroundColor: background }]}
      accessibilityRole={celebrate ? 'alert' : undefined}
    >
      <View style={[styles.top, celebrate && styles.topCelebrate]}>
        <Animated.View
          style={[
            styles.icon,
            celebrate && styles.iconCelebrate,
            {
              opacity: scale.interpolate({ inputRange: [0.4, 1], outputRange: [0, 1] }),
              transform: [{ scale }],
            },
          ]}
        >
          <Ionicons name={icon} size={iconSize} color={iconColor} />
        </Animated.View>
        <View style={[styles.texts, celebrate ? styles.textsCelebrate : styles.textsRow]}>
          <Text
            variant={celebrate ? 'heading' : 'body'}
            weight="semibold"
            tone="default"
            style={celebrate && styles.center}
          >
            {title}
          </Text>
          {description && (
            <Text variant="caption" tone="body" style={celebrate && styles.center}>
              {description}
            </Text>
          )}
        </View>
      </View>
      {content.length > 0 && (
        <View style={[styles.content, celebrate && styles.contentCelebrate]}>{content}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg },
  celebrate: { paddingVertical: spacing.xl },
  top: { flexDirection: 'row', gap: spacing.md },
  topCelebrate: { flexDirection: 'column', alignItems: 'center' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  iconCelebrate: { width: 64, height: 64, borderRadius: 32 },
  texts: { gap: spacing.xs, justifyContent: 'center' },
  textsRow: { flex: 1 },
  textsCelebrate: { alignItems: 'center' },
  content: { gap: spacing.lg },
  contentCelebrate: { alignSelf: 'center' },
  center: { textAlign: 'center' },
});
