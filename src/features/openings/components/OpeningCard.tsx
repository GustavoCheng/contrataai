import { formatGigPay, formatSalary } from '@/shared/lib/format';
import { roleLabels } from '@/shared/lib/labels';
import { formatNearby } from '@/shared/lib/location';
import { imageUrl } from '@/shared/lib/storage';
import { ListingCard } from '@/shared/ui';
import type { Opening } from '../services/openings.service';

export function OpeningCard({ opening, onPress }: { opening: Opening; onPress: () => void }) {
  const place = formatNearby(opening);
  const role = roleLabels[opening.role];
  const kind = opening.kind === 'job' ? 'Vaga fixa' : 'Freela';

  return (
    <ListingCard
      imageUri={opening.cover_path && imageUrl('restaurant-photos', opening.cover_path)}
      placeholderIcon="storefront-outline"
      badge={kind}
      title={role}
      rating={{ average: opening.rating_avg, count: opening.rating_count }}
      lines={[opening.restaurant_name, place]}
      highlight={
        opening.kind === 'gig' && opening.starts_at && opening.ends_at
          ? formatGigPay(opening.pay_cents, opening.starts_at, opening.ends_at)
          : formatSalary(opening.pay_cents, opening.pay_max_cents, opening.shift)
      }
      accessibilityLabel={`${kind} de ${role} em ${opening.restaurant_name}, ${place}`}
      onPress={onPress}
    />
  );
}
