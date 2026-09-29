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
import { firstName, formatMoney } from '@/shared/lib/format';
import { type GigStatus, roleLabels } from '@/shared/lib/labels';
import { imageUrl } from '@/shared/lib/storage';
import {
  Button,
  ConfirmButton,
  Notice,
  ProfileRow,
  QueryFallback,
  Screen,
  Section,
  Text,
  spacing,
} from '@/shared/ui';
import { CheckpointCode } from '../components/CheckpointCode';
import { checkpointLabels } from '../components/CheckpointCodeField';
import { GigIssueActions } from '../components/GigIssueActions';
import { GigStage } from '../components/GigStage';
import { GigSummary } from '../components/GigSummary';
import { GigTimeline } from '../components/GigTimeline';
import { useConfirmGig, useGig, useGigApplications, useGigRealtime } from '../hooks/useGigs';
import { checkpointFor, REVIEWABLE } from '../rules';

export function RestaurantGigScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurantId = useUserId();
  const gig = useGig(id);
  const applications = useGigApplications(id);
  const confirm = useConfirmGig(id);
  const charge = useGigCharge(id);
  const release = useReleaseGigPayment(id);
  // Etapa em que o código foi aberto: quando o chamado avança, o código sai da tela sozinho.
  const [codeStage, setCodeStage] = useState<GigStatus | null>(null);
  useGigRealtime(id);

  if (!gig.isSuccess || !applications.isSuccess) {
    return <QueryFallback queries={[gig, applications]} />;
  }

  const { status } = gig.data;
  const freelancer = gig.data.professionals;
  const pending = applications.data.filter((application) => application.status === 'sent');
  const amount = formatMoney(gig.data.amount_cents);
  const checkpoint = checkpointFor(status);
  const showCode = checkpoint !== null && codeStage === status;
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
    footer = showCode ? (
      <Button variant="secondary" title="Esconder código" onPress={() => setCodeStage(null)} />
    ) : (
      <Button
        title={`Mostrar ${checkpointLabels[checkpoint].toLowerCase()}`}
        onPress={() => setCodeStage(status)}
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

      <GigStage gig={gig.data} viewer="restaurant">
        {status === 'confirmed' && charge.data && <PixChargeCard charge={charge.data} />}
        {showCode && freelancer && (
          <CheckpointCode
            gigId={id}
            kind={checkpoint}
            professionalName={firstName(freelancer.full_name)}
          />
        )}
      </GigStage>

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
                  title={`Confirmar ${firstName(professional.full_name)}`}
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
          revieweeName={firstName(freelancer.full_name)}
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
