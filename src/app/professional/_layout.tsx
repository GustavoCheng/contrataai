import { Stack } from 'expo-router';
import { useProfessionalSettings } from '@/features/professionals';
import { useUserId } from '@/shared/hooks/useSession';
import { ErrorView, LoadingView, stackScreenOptions } from '@/shared/ui';

/** Sem perfil profissional, a área só tem o onboarding; salvo o perfil, entram as abas. */
export default function ProfessionalLayout() {
  const userId = useUserId();
  const settings = useProfessionalSettings(userId);

  if (settings.isPending) return <LoadingView />;
  if (settings.isError) {
    return <ErrorView message={settings.error.message} onRetry={() => settings.refetch()} />;
  }
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
        <Stack.Screen name="scan" options={{ headerShown: true, title: 'Ler QR' }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: '' }} />
      </Stack.Protected>
    </Stack>
  );
}
