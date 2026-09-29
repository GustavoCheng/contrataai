import { router } from 'expo-router';
import { useSignOut } from '@/features/auth';
import { ReviewList } from '@/features/reviews';
import { useUserId } from '@/shared/hooks/useSession';
import { Button, Notice, QueryFallback, Screen } from '@/shared/ui';
import { PixKeyStatus } from '../components/PixKeyStatus';
import { ProfessionalProfileView } from '../components/ProfessionalProfileView';
import { useProfessional, useProfessionalSettings } from '../hooks/useProfessional';

export function ProfileScreen() {
  const userId = useUserId();
  const professional = useProfessional(userId);
  const settings = useProfessionalSettings(userId);
  const signOut = useSignOut();

  if (!professional.isSuccess || settings.isPending) {
    return <QueryFallback queries={[professional, settings]} />;
  }

  return (
    <Screen
      edges={['top']}
      onRefresh={() => Promise.all([professional.refetch(), settings.refetch()])}
      footer={
        <>
          <Button
            variant="secondary"
            title="Editar perfil"
            onPress={() => router.push('/professional/edit-profile')}
          />
          <Button
            variant="ghost"
            title="Sair da conta"
            loading={signOut.isPending}
            onPress={() => signOut.mutate()}
          />
        </>
      }
    >
      <ProfessionalProfileView professional={professional.data} />
      {settings.isError ? (
        <Notice message={settings.error.message} />
      ) : (
        <PixKeyStatus payout={settings.data?.payout_accounts ?? null} />
      )}
      <ReviewList revieweeId={userId} />
      {signOut.error && <Notice message={signOut.error.message} />}
    </Screen>
  );
}
