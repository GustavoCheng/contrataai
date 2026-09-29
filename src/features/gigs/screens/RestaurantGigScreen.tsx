import { router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChatButton } from '@/features/chat';
import {
  CopyPixButton,
  PixChargeCard,
  useGigCharge,
  useReleaseGigPayment,
} from '@/features/payments';
import { GigReview } from '@/features/reviews';
import { useUserId } from '@/shared/hooks/useSession';
import { formatMoney } from '@/shared/lib/format';
import { type GigStatus, roleLabels } from '@/shared/lib/labels';
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
  Text,
  spacing,
} from '@/shared/ui';
import { CheckpointQr } from '../components/CheckpointQr';
import { GigIssueActions } from '../components/GigIssueActions';
import { RestaurantGigStage } from '../components/GigStage';
import { GigSummary } from '../components/GigSummary';
import { GigTimeline } from '../components/GigTimeline';
import { useConfirmGig, useGig, useGigApplications, useGigRealtime } from '../hooks/useGigs';
import { REVIEWABLE } from '../rules';

/** Chamado do próprio restaurante: aceites, Pix, QR de check-in/out, liberação e histórico. */
export function RestaurantGigScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurantId = useUserId();
  const gig = useGig(id);
  const applications = useGigApplications(id);
  const confirm = useConfirmGig(id, restaurantId);
  const charge = useGigCharge(id);
  const release = useReleaseGigPayment(id);
  // Etapa em que o QR foi aberto: quando o chamado avança, o QR sai da tela sozinho.
  const [qrStage, setQrStage] = useState<GigStatus | null>(null);
  useGigRealtime(id);

  if (gig.isPending || applications.isPending) return <LoadingView />;
  if (gig.isError) return <ErrorView message={gig.error.message} onRetry={() => gig.refetch()} />;
  if (applications.isError) {
    return (
      <ErrorView message={applications.error.message} onRetry={() => applications.refetch()} />
    );
  }

  const { status } = gig.data;
  const freelancer = gig.data.professionals;
  const pending = applications.data.filter((application) => application.status === 'sent');
  const amount = formatMoney(gig.data.amount_cents);
  const checkpoint =
    status === 'paid_held' ? 'check_in' : status === 'checked_in' ? 'check_out' : null;
  const showQr = checkpoint !== null && qrStage === status;
  const error = confirm.error ?? charge.error ?? release.error;

  let footer: ReactNode = null;
  if (status === 'confirmed') {
    footer = charge.data ? (
      <CopyPixButton code={charge.data.copyPaste} />
    ) : (
      <Button
        title={`Pagar ${amount} com Pix`}
        loading={charge.isPending}
        onPress={() => charge.mutate()}
      />
    );
  } else if (checkpoint) {
    footer = showQr ? (
      <Button variant="secondary" title="Esconder QR" onPress={() => setQrStage(null)} />
    ) : (
      <Button
        title={checkpoint === 'check_in' ? 'Mostrar QR de check-in' : 'Mostrar QR de check-out'}
        onPress={() => setQrStage(status)}
      />
    );
  } else if (status === 'checked_out') {
    footer = (
      <ConfirmButton
        variant="primary"
        title={`Liberar ${amount}`}
        confirmTitle="Toque de novo para liberar"
        loading={release.isPending}
        onConfirm={() => release.mutate()}
      />
    );
  }

  return (
    <Screen edges={['bottom']} footer={footer}>
      <GigSummary gig={gig.data} />
      {error && <Notice message={error.message} />}

      <RestaurantGigStage gig={gig.data}>
        {status === 'confirmed' && charge.data && <PixChargeCard charge={charge.data} />}
        {showQr && <CheckpointQr gigId={id} kind={checkpoint} />}
      </RestaurantGigStage>

      {status === 'open' && (
        <Section
          title={`Quem aceitou (${pending.length})`}
          hint="Ao confirmar, você paga por Pix e o valor fica retido até o fim do turno."
        >
          {pending.length === 0 ? (
            <Text tone="muted">
              Ninguém aceitou ainda. O chamado aparece para profissionais perto da loja, e os
              aceites chegam aqui na hora.
            </Text>
          ) : (
            pending.map(({ professionals: professional }) => (
              <View key={professional.id} style={styles.applicant}>
                <ProfileRow
                  imageUri={professional.photo_path && imageUrl('avatars', professional.photo_path)}
                  placeholderIcon="person-outline"
                  title={professional.full_name}
                  subtitle={`${roleLabels[professional.main_role]} · ${professional.neighborhood ?? professional.city}`}
                  rating={{ average: professional.rating_avg, count: professional.rating_count }}
                  onPress={() => router.push(`/restaurant/professionals/${professional.id}`)}
                />
                <Button
                  title={`Confirmar ${professional.full_name.split(' ')[0]}`}
                  loading={confirm.isPending && confirm.variables === professional.id}
                  disabled={confirm.isPending}
                  onPress={() => confirm.mutate(professional.id)}
                />
              </View>
            ))
          )}
        </Section>
      )}

      {freelancer && (
        <Section title="Freelancer">
          <ProfileRow
            imageUri={freelancer.photo_path && imageUrl('avatars', freelancer.photo_path)}
            placeholderIcon="person-outline"
            title={freelancer.full_name}
            subtitle={roleLabels[freelancer.main_role]}
            rating={{ average: freelancer.rating_avg, count: freelancer.rating_count }}
            onPress={() => router.push(`/restaurant/professionals/${freelancer.id}`)}
          />
          <ChatButton
            area="restaurant"
            restaurantId={restaurantId}
            professionalId={freelancer.id}
          />
        </Section>
      )}

      {freelancer && REVIEWABLE.includes(status) && (
        <GigReview
          gigId={id}
          revieweeId={freelancer.id}
          revieweeName={freelancer.full_name.split(' ')[0]}
        />
      )}

      <Section title="Linha do tempo">
        <GigTimeline gig={gig.data} />
      </Section>

      <GigIssueActions gig={gig.data} viewer="restaurant" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  applicant: { gap: spacing.md },
});
