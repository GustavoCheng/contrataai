import { roleLabels } from '@/shared/lib/labels';
import { formatNearby } from '@/shared/lib/location';
import { imageUrl } from '@/shared/lib/storage';
import { ListingCard } from '@/shared/ui';
import type { ProfessionalCardData } from '../services/explore.service';

type Props = { professional: ProfessionalCardData; onPress: () => void };

export function ProfessionalCard({ professional, onPress }: Props) {
  const place = formatNearby(professional);
  return (
    <ListingCard
      imageUri={professional.photo_path && imageUrl('avatars', professional.photo_path)}
      placeholderIcon="person-outline"
      badge={professional.available_for_gigs ? 'Disponível para freelas' : undefined}
      title={professional.full_name}
      rating={{ average: professional.rating_avg, count: professional.rating_count }}
      lines={[roleLabels[professional.main_role], place]}
      accessibilityLabel={`${professional.full_name}, ${roleLabels[professional.main_role]}, ${place}`}
      onPress={onPress}
    />
  );
}
