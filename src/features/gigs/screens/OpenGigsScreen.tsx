import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OpeningCard, useOpeningSearch } from '@/features/openings';
import { useProfessionalSettings } from '@/features/professionals';
import { useUserId } from '@/shared/hooks/useSession';
import {
  EmptyState,
  Notice,
  PagedList,
  ScreenTitle,
  colors,
  spacing,
  useLayout,
} from '@/shared/ui';
import { AcceptGigAction } from '../components/AcceptGigAction';
import { PixKeyRequired } from '../components/PixKeyRequired';
import { useAcceptGig, useMyGigApplications } from '../hooks/useGigs';

const FILTERS = { kind: 'gig', role: null, city: '' } as const;

export function OpenGigsScreen() {
  const professionalId = useUserId();
  const gigs = useOpeningSearch(FILTERS);
  const mine = useMyGigApplications(professionalId);
  const settings = useProfessionalSettings(professionalId);
  const accept = useAcceptGig(professionalId);
  const { gutter, column } = useLayout();
  const hasPixKey = Boolean(settings.data?.payout_accounts);
  const statusByGig = new Map(
    mine.data?.map((application) => [application.gigs.id, application.status]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.header, column, { paddingHorizontal: gutter }]}>
        <ScreenTitle title="Freelas" subtitle="Turnos avulsos com pagamento garantido." />
        {settings.isSuccess && !hasPixKey && <PixKeyRequired />}
        {accept.error && <Notice message={accept.error.message} />}
      </View>
      <PagedList
        {...gigs}
        renderItem={(gig) => (
          <View style={styles.item}>
            <OpeningCard
              opening={gig}
              onPress={() => router.push(`/professional/gigs/${gig.id}`)}
            />
            <AcceptGigAction
              status={statusByGig.get(gig.id)}
              canAccept={hasPixKey && !accept.isPending}
              loading={accept.isPending && accept.variables === gig.id}
              onAccept={() => accept.mutate(gig.id)}
            />
          </View>
        )}
        keyExtractor={(gig) => gig.id}
        empty={
          <EmptyState
            icon="flash-outline"
            title="Nenhum freela aberto agora"
            description="Novos chamados aparecem aqui. Deixe “Disponível para freelas” ligado no seu perfil."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { gap: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  item: { gap: spacing.md },
});
