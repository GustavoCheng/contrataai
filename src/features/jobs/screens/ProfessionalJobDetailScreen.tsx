import { router, useLocalSearchParams } from 'expo-router';
import { ChatButton } from '@/features/chat';
import { useUserId } from '@/shared/hooks/useSession';
import { applicationStatusLabels, applicationStatusTones } from '@/shared/lib/labels';
import { formatPlace } from '@/shared/lib/location';
import { imageUrl } from '@/shared/lib/storage';
import {
  Button,
  ErrorView,
  LoadingView,
  Notice,
  ProfileRow,
  Screen,
  StatusPill,
  Text,
} from '@/shared/ui';
import { JobSummary } from '../components/JobSummary';
import { useApplyToJob, useJob, useMyJobApplications } from '../hooks/useJobs';

/** Vaga fixa vista pelo profissional, com "Candidatar-me". */
export function ProfessionalJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const professionalId = useUserId();
  const job = useJob(id);
  const applications = useMyJobApplications(professionalId);
  const apply = useApplyToJob(id, professionalId);

  if (job.isPending || applications.isPending) return <LoadingView />;
  if (job.isError) return <ErrorView message={job.error.message} onRetry={() => job.refetch()} />;
  if (applications.isError) {
    return (
      <ErrorView message={applications.error.message} onRetry={() => applications.refetch()} />
    );
  }

  const restaurant = job.data.restaurants;
  const status = applications.data.find((application) => application.jobs.id === id)?.status;
  const canApply = job.data.status === 'open' && !status;

  return (
    <Screen
      edges={['bottom']}
      footer={
        canApply && (
          <Button title="Candidatar-me" loading={apply.isPending} onPress={() => apply.mutate()} />
        )
      }
    >
      <ProfileRow
        imageUri={restaurant.cover_path && imageUrl('restaurant-photos', restaurant.cover_path)}
        placeholderIcon="storefront-outline"
        shape="square"
        title={restaurant.name}
        subtitle={formatPlace(restaurant)}
        rating={{ average: restaurant.rating_avg, count: restaurant.rating_count }}
        onPress={() => router.push(`/professional/restaurants/${restaurant.id}`)}
      />
      {apply.error && <Notice message={apply.error.message} />}
      {status && (
        <>
          <StatusPill
            label={`Candidatura ${applicationStatusLabels[status].toLowerCase()}`}
            tone={applicationStatusTones[status]}
          />
          {status === 'sent' && (
            <Text tone="muted">O restaurante responde por aqui. Se aceitar, o chat abre.</Text>
          )}
          {status === 'accepted' && (
            <ChatButton
              area="professional"
              restaurantId={restaurant.id}
              professionalId={professionalId}
            />
          )}
        </>
      )}
      <JobSummary job={job.data} />
    </Screen>
  );
}
