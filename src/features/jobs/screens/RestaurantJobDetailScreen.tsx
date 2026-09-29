import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ChatButton } from '@/features/chat';
import { useUserId } from '@/shared/hooks/useSession';
import { applicationStatusLabels, applicationStatusTones, roleLabels } from '@/shared/lib/labels';
import { imageUrl } from '@/shared/lib/storage';
import {
  Button,
  ConfirmButton,
  ErrorView,
  LoadingView,
  Notice,
  ProfileRow,
  Screen,
  Section,
  StatusPill,
  Text,
  spacing,
} from '@/shared/ui';
import { JobSummary } from '../components/JobSummary';
import { useCloseJob, useDecideApplication, useJob, useJobApplications } from '../hooks/useJobs';
import type { JobApplication } from '../services/jobs.service';

/** Vaga do próprio restaurante: candidaturas para aceitar ou recusar, editar e encerrar. */
export function RestaurantJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurantId = useUserId();
  const job = useJob(id);
  const applications = useJobApplications(id);
  const close = useCloseJob(id, restaurantId);
  const decide = useDecideApplication(id);

  if (job.isPending || applications.isPending) return <LoadingView />;
  if (job.isError) return <ErrorView message={job.error.message} onRetry={() => job.refetch()} />;
  if (applications.isError) {
    return (
      <ErrorView message={applications.error.message} onRetry={() => applications.refetch()} />
    );
  }

  const isOpen = job.data.status === 'open';
  const error = close.error ?? decide.error;

  return (
    <Screen
      edges={['bottom']}
      footer={
        isOpen && (
          <>
            <Button
              variant="secondary"
              title="Editar vaga"
              onPress={() => router.push(`/restaurant/jobs/${id}/edit`)}
            />
            <ConfirmButton
              title="Encerrar vaga"
              confirmTitle="Toque de novo para encerrar"
              loading={close.isPending}
              onConfirm={() => close.mutate()}
            />
          </>
        )
      }
    >
      {error && <Notice message={error.message} />}
      <JobSummary job={job.data} />
      <Section
        title={`Candidaturas (${applications.data.length})`}
        hint={isOpen ? 'Ao aceitar, o chat com a pessoa é aberto.' : undefined}
      >
        {applications.data.length === 0 ? (
          <Text tone="muted">
            Ninguém se candidatou ainda. A vaga aparece para profissionais perto da loja.
          </Text>
        ) : (
          applications.data.map((application) => (
            <ApplicantRow
              key={application.id}
              application={application}
              restaurantId={restaurantId}
              deciding={decide.isPending}
              onDecide={(status) => decide.mutate({ id: application.id, status })}
            />
          ))
        )}
      </Section>
    </Screen>
  );
}

type ApplicantRowProps = {
  application: JobApplication;
  restaurantId: string;
  deciding: boolean;
  onDecide: (status: 'accepted' | 'rejected') => void;
};

function ApplicantRow({ application, restaurantId, deciding, onDecide }: ApplicantRowProps) {
  const professional = application.professionals;
  return (
    <View style={styles.applicant}>
      <ProfileRow
        imageUri={professional.photo_path && imageUrl('avatars', professional.photo_path)}
        placeholderIcon="person-outline"
        title={professional.full_name}
        subtitle={`${roleLabels[professional.main_role]} · ${professional.neighborhood ?? professional.city}`}
        rating={{ average: professional.rating_avg, count: professional.rating_count }}
        trailing={
          <StatusPill
            label={applicationStatusLabels[application.status]}
            tone={applicationStatusTones[application.status]}
          />
        }
        onPress={() => router.push(`/restaurant/professionals/${professional.id}`)}
      />
      {application.status === 'sent' && (
        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              title="Recusar"
              disabled={deciding}
              onPress={() => onDecide('rejected')}
            />
          </View>
          <View style={styles.flex}>
            <Button title="Aceitar" disabled={deciding} onPress={() => onDecide('accepted')} />
          </View>
        </View>
      )}
      {application.status === 'accepted' && (
        <ChatButton
          area="restaurant"
          restaurantId={restaurantId}
          professionalId={professional.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  applicant: { gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
