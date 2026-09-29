import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { colors } from './theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const tabBarScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  // Cinco abas em 320pt: o rótulo usa a largura toda do item, no tamanho padrão do iOS (10pt).
  tabBarItemStyle: { paddingHorizontal: 0 },
} as const;

export function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}
