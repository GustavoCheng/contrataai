import { useLocalSearchParams } from 'expo-router';
import { ReviewList } from '@/features/reviews';
import { QueryFallback, Screen } from '@/shared/ui';
import { ProfessionalProfileView } from '../components/ProfessionalProfileView';
import { useProfessional } from '../hooks/useProfessional';

export function ProfessionalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const professional = useProfessional(id);

  if (!professional.isSuccess) return <QueryFallback queries={[professional]} />;
  return (
    <Screen edges={['bottom']}>
      <ProfessionalProfileView professional={professional.data} />
      <ReviewList revieweeId={id} />
    </Screen>
  );
}
