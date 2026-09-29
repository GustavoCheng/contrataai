import { router } from 'expo-router';
import { useUserId } from '@/shared/hooks/useSession';
import { Button, ErrorView, LoadingView, Notice, Screen } from '@/shared/ui';
import { StoreFormFields } from '../components/StoreFormFields';
import { StorePhotosEditor } from '../components/StorePhotosEditor';
import { useRestaurant, useUpdateStore } from '../hooks/useRestaurant';
import { useStoreForm } from '../hooks/useStoreForm';
import type { Restaurant } from '../services/restaurants.service';

export function EditStoreScreen() {
  const userId = useUserId();
  const restaurant = useRestaurant(userId);

  if (restaurant.isPending) return <LoadingView />;
  if (restaurant.isError) {
    return <ErrorView message={restaurant.error.message} onRetry={() => restaurant.refetch()} />;
  }
  return <EditStoreForm restaurant={restaurant.data} />;
}

/** Separado para o formulário nascer com os dados já carregados. */
function EditStoreForm({ restaurant }: { restaurant: Restaurant }) {
  const form = useStoreForm(restaurant);
  const update = useUpdateStore(restaurant.id);

  const submit = form.handleSubmit((values) =>
    update.mutate(values, { onSuccess: () => router.back() }),
  );

  return (
    <Screen
      edges={['bottom']}
      footer={<Button title="Salvar alterações" loading={update.isPending} onPress={submit} />}
    >
      <StorePhotosEditor restaurant={restaurant} />
      {update.error && <Notice message={update.error.message} />}
      <StoreFormFields form={form} />
    </Screen>
  );
}
