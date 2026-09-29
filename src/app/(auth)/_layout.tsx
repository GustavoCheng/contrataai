import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/shared/ui';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ ...stackScreenOptions, headerTitle: '' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
