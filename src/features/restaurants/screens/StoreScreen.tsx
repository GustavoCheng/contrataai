import { router } from 'expo-router';
import { useSignOut } from '@/features/auth';
import { ReviewList } from '@/features/reviews';
import { useUserId } from '@/shared/hooks/useSession';
import { Button, ErrorView, LoadingView, Notice, Screen } from '@/shared/ui';
import { StoreProfileView } from '../components/StoreProfileView';
import { useRestaurant } from '../hooks/useRestaurant';

/** Aba "Loja": a vitrine como os profissionais veem, com o atalho para editar. */
export function StoreScreen() {
  const userId = useUserId();
  const restaurant = useRestaurant(userId);
  const signOut = useSignOut();

  if (restaurant.isPending) return <LoadingView />;
  if (restaurant.isError) {
    return <ErrorView message={restaurant.error.message} onRetry={() => restaurant.refetch()} />;
  }

  return (
    <Screen
      edges={['top']}
      footer={
        <>
          <Button
            variant="secondary"
            title="Editar loja"
            onPress={() => router.push('/restaurant/edit-store')}
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
      <StoreProfileView restaurant={restaurant.data} />
      <ReviewList revieweeId={userId} />
      {signOut.error && <Notice message={signOut.error.message} />}
    </Screen>
  );
}
