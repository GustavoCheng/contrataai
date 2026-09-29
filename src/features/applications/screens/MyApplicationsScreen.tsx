import { router } from 'expo-router';
import { useMyGigApplications } from '@/features/gigs';
import { useMyJobApplications } from '@/features/jobs';
import { useUserId } from '@/shared/hooks/useSession';
import { formatMoney, formatPayRange, formatShiftWindow } from '@/shared/lib/format';
import {
  applicationStatusLabels,
  applicationStatusTones,
  gigStatusLabels,
  gigStatusTones,
  roleLabels,
} from '@/shared/lib/labels';
import { imageUrl } from '@/shared/lib/storage';
import {
  Button,
  EmptyState,
  ErrorView,
  LoadingView,
  ProfileRow,
  Screen,
  ScreenTitle,
  Section,
  StatusPill,
} from '@/shared/ui';

/** Aba "Candidaturas": freelas (com o histórico) e vagas fixas, cada um com seu status. */
export function MyApplicationsScreen() {
  const professionalId = useUserId();
  const gigs = useMyGigApplications(professionalId);
  const jobs = useMyJobApplications(professionalId);

  if (gigs.isPending || jobs.isPending) return <LoadingView />;
  if (gigs.isError || jobs.isError) {
    return (
      <ErrorView
        message={(gigs.error ?? jobs.error)?.message ?? ''}
        onRetry={() => {
          void gigs.refetch();
          void jobs.refetch();
        }}
      />
    );
  }

  return (
    <Screen edges={['top']}>
      <ScreenTitle title="Candidaturas" />
      {gigs.data.length === 0 && jobs.data.length === 0 && (
        <EmptyState
          icon="paper-plane-outline"
          title="Você ainda não se candidatou"
          description="Aceite freelas ou candidate-se a vagas fixas perto de você."
          action={
            <Button
              title="Explorar vagas"
              onPress={() => router.navigate('/professional/explore')}
            />
          }
        />
      )}

      {gigs.data.length > 0 && (
        <Section title="Freelas">
          {gigs.data.map(({ status, gigs: gig }) => {
            // Confirmado ou cancelado: o que importa é o andamento do freela; senão, o do aceite.
            const pill =
              status === 'accepted' || gig.status === 'cancelled'
                ? { label: gigStatusLabels[gig.status], tone: gigStatusTones[gig.status] }
                : status === 'sent'
                  ? { label: 'Aguardando', tone: 'attention' as const }
                  : { label: 'Não confirmado', tone: 'neutral' as const };
            return (
              <ProfileRow
                key={gig.id}
                imageUri={
                  gig.restaurants.cover_path &&
                  imageUrl('restaurant-photos', gig.restaurants.cover_path)
                }
                placeholderIcon="storefront-outline"
                shape="square"
                title={`${roleLabels[gig.role]} · ${gig.restaurants.name}`}
                subtitle={`${formatMoney(gig.amount_cents)} · ${formatShiftWindow(gig.starts_at, gig.ends_at)}`}
                trailing={<StatusPill label={pill.label} tone={pill.tone} />}
                onPress={() => router.push(`/professional/gigs/${gig.id}`)}
              />
            );
          })}
        </Section>
      )}

      {jobs.data.length > 0 && (
        <Section title="Vagas fixas">
          {jobs.data.map(({ id, status, jobs: job }) => (
            <ProfileRow
              key={id}
              imageUri={
                job.restaurants.cover_path &&
                imageUrl('restaurant-photos', job.restaurants.cover_path)
              }
              placeholderIcon="storefront-outline"
              shape="square"
              title={`${roleLabels[job.role]} · ${job.restaurants.name}`}
              subtitle={
                job.status === 'closed'
                  ? 'Vaga encerrada'
                  : `${formatPayRange(job.salary_min_cents, job.salary_max_cents)}/mês`
              }
              trailing={
                <StatusPill
                  label={applicationStatusLabels[status]}
                  tone={applicationStatusTones[status]}
                />
              }
              onPress={() => router.push(`/professional/jobs/${job.id}`)}
            />
          ))}
        </Section>
      )}
    </Screen>
  );
}
