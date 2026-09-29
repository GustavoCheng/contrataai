import { useLocalSearchParams } from 'expo-router';
import { ReviewList } from '@/features/reviews';
import { QueryFallback, Screen } from '@/shared/ui';
import { StoreProfileView } from '../components/StoreProfileView';
import { useRestaurant } from '../hooks/useRestaurant';

export function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurant = useRestaurant(id);

  if (!restaurant.isSuccess) return <QueryFallback queries={[restaurant]} />;
  return (
    <Screen edges={['bottom']}>
      <StoreProfileView restaurant={restaurant.data} />
      <ReviewList revieweeId={id} />
    </Screen>
  );
}
