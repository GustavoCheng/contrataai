import {
  formatDistance,
  formatMoney,
  formatPayRange,
  formatShiftWindow,
} from '@/shared/lib/format';
import { roleLabels, shiftLabels } from '@/shared/lib/labels';
import { imageUrl } from '@/shared/lib/storage';
import { ListingCard } from '@/shared/ui';
import type { Opening } from '../services/openings.service';

export function OpeningCard({ opening, onPress }: { opening: Opening; onPress: () => void }) {
  const place = [
    opening.neighborhood ?? opening.city,
    opening.distance_km != null && formatDistance(opening.distance_km),
  ]
    .filter(Boolean)
    .join(' · ');
  const role = roleLabels[opening.role];

  return (
    <ListingCard
      imageUri={opening.cover_path && imageUrl('restaurant-photos', opening.cover_path)}
      placeholderIcon="storefront-outline"
      badge={opening.kind === 'job' ? 'Vaga fixa' : 'Freela'}
      title={role}
      rating={{ average: opening.rating_avg, count: opening.rating_count }}
      lines={[opening.restaurant_name, place]}
      highlight={payLine(opening)}
      accessibilityLabel={`${opening.kind === 'job' ? 'Vaga fixa' : 'Freela'} de ${role} em ${opening.restaurant_name}, ${place}`}
      onPress={onPress}
    />
  );
}

function payLine(opening: Opening): string {
  if (opening.kind === 'gig' && opening.starts_at && opening.ends_at) {
    return `${formatMoney(opening.pay_cents)} · ${formatShiftWindow(opening.starts_at, opening.ends_at)}`;
  }
  const shift = opening.shift ? ` · ${shiftLabels[opening.shift]}` : '';
  return `${formatPayRange(opening.pay_cents, opening.pay_max_cents)}/mês${shift}`;
}
