import { Stack } from 'expo-router';
import { useProfessionalSettings } from '@/features/professionals';
import { useUserId } from '@/shared/hooks/useSession';
import { QueryFallback, stackScreenOptions } from '@/shared/ui';

export default function ProfessionalLayout() {
  const userId = useUserId();
  const settings = useProfessionalSettings(userId);

  if (!settings.isSuccess) return <QueryFallback queries={[settings]} />;
  const hasProfile = settings.data !== null;

  return (
    <Stack screenOptions={{ ...stackScreenOptions, headerShown: false }}>
      <Stack.Protected guard={!hasProfile}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={hasProfile}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-profile" options={{ headerShown: true, title: 'Editar perfil' }} />
        <Stack.Screen name="restaurants/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="jobs/[id]" options={{ headerShown: true, title: 'Vaga' }} />
        <Stack.Screen name="gigs/[id]" options={{ headerShown: true, title: 'Freela' }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: '' }} />
      </Stack.Protected>
    </Stack>
  );
}
