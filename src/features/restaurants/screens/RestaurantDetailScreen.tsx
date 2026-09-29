import { useLocalSearchParams } from 'expo-router';
import { ReviewList } from '@/features/reviews';
import { ErrorView, LoadingView, Screen } from '@/shared/ui';
import { StoreProfileView } from '../components/StoreProfileView';
import { useRestaurant } from '../hooks/useRestaurant';

/** Perfil público da loja, aberto pelo profissional. */
export function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurant = useRestaurant(id);

  if (restaurant.isPending) return <LoadingView />;
  if (restaurant.isError) {
    return <ErrorView message={restaurant.error.message} onRetry={() => restaurant.refetch()} />;
  }
  return (
    <Screen edges={['bottom']}>
      <StoreProfileView restaurant={restaurant.data} />
      <ReviewList revieweeId={id} />
    </Screen>
  );
}
