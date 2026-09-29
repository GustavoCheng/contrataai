import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAccountType, useSignOut } from '@/features/auth';
import { SessionProvider, useSession } from '@/shared/hooks/useSession';
import { queryClient } from '@/shared/lib/query-client';
import { Button, EmptyState, LoadingView, colors } from '@/shared/ui';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </SessionProvider>
    </QueryClientProvider>
  );
}

/** Cada área só existe para a sessão certa: sem sessão, restaurante ou profissional. */
function RootNavigator() {
  const { session, isLoading } = useSession();
  const accountType = useAccountType(session?.user.id);
  const signOut = useSignOut();
  const ready = !isLoading && (!session || !accountType.isPending);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (!ready) return isLoading ? null : <LoadingView />;

  if (session && accountType.isError) {
    return (
      <View style={styles.fill}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Não conseguimos carregar sua conta"
          description={accountType.error.message}
          action={
            <>
              <Button title="Tentar de novo" onPress={() => accountType.refetch()} />
              <Button variant="ghost" title="Sair" onPress={() => signOut.mutate()} />
            </>
          }
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={accountType.data === 'restaurant'}>
        <Stack.Screen name="restaurant" />
      </Stack.Protected>
      <Stack.Protected guard={accountType.data === 'professional'}>
        <Stack.Screen name="professional" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
});
