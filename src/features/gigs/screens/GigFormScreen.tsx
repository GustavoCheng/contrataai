import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useUserId } from '@/shared/hooks/useSession';
import { Button, Notice, Screen } from '@/shared/ui';
import { GigFormFields } from '../components/GigFormFields';
import { useCreateGig } from '../hooks/useGigs';
import { gigFormSchema, type GigFormInput, type GigFormValues } from '../schemas';

export function GigFormScreen() {
  const restaurantId = useUserId();
  const create = useCreateGig(restaurantId);
  const form = useForm<GigFormInput, unknown, GigFormValues>({
    resolver: zodResolver(gigFormSchema),
    defaultValues: { day: '', startTime: '', endTime: '', amount: '' },
  });

  const submit = form.handleSubmit((values) =>
    create.mutate(values, { onSuccess: (gigId) => router.replace(`/restaurant/gigs/${gigId}`) }),
  );

  return (
    <Screen
      edges={['bottom']}
      footer={<Button title="Publicar freela" loading={create.isPending} onPress={submit} />}
    >
      {create.error && <Notice message={create.error.message} />}
      <GigFormFields form={form} />
    </Screen>
  );
}
