import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/shared/ui';

export default function RestaurantLayout() {
  return (
    <Stack screenOptions={{ ...stackScreenOptions, headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-store" options={{ headerShown: true, title: 'Editar loja' }} />
      <Stack.Screen name="professionals/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="jobs/new" options={{ headerShown: true, title: 'Nova vaga' }} />
      <Stack.Screen name="jobs/[id]/index" options={{ headerShown: true, title: 'Vaga' }} />
      <Stack.Screen name="jobs/[id]/edit" options={{ headerShown: true, title: 'Editar vaga' }} />
      <Stack.Screen name="gigs/new" options={{ headerShown: true, title: 'Novo freela' }} />
      <Stack.Screen name="gigs/[id]" options={{ headerShown: true, title: 'Freela' }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: '' }} />
    </Stack>
  );
}
