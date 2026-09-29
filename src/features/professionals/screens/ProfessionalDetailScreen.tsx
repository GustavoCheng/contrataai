import { useLocalSearchParams } from 'expo-router';
import { ReviewList } from '@/features/reviews';
import { ErrorView, LoadingView, Screen } from '@/shared/ui';
import { ProfessionalProfileView } from '../components/ProfessionalProfileView';
import { useProfessional } from '../hooks/useProfessional';

/** Perfil público do profissional, aberto pelo restaurante. */
export function ProfessionalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const professional = useProfessional(id);

  if (professional.isPending) return <LoadingView />;
  if (professional.isError) {
    return (
      <ErrorView message={professional.error.message} onRetry={() => professional.refetch()} />
    );
  }
  return (
    <Screen edges={['bottom']}>
      <ProfessionalProfileView professional={professional.data} />
      <ReviewList revieweeId={id} />
    </Screen>
  );
}
