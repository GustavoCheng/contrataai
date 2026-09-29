import { StyleSheet, View } from 'react-native';
import { roleLabels } from '@/shared/lib/labels';
import { formatPlace } from '@/shared/lib/location';
import { imageUrl } from '@/shared/lib/storage';
import { Badge, ChipList, Rating, Section, Text, spacing } from '@/shared/ui';
import type { Professional } from '../services/professionals.service';
import { Avatar } from './Avatar';

/** Perfil como os restaurantes veem (também é a prévia no próprio perfil). */
export function ProfessionalProfileView({ professional }: { professional: Professional }) {
  const place = formatPlace(professional);
  return (
    <>
      <View style={styles.header}>
        <Avatar
          uri={professional.photo_path && imageUrl('avatars', professional.photo_path)}
          name={professional.full_name}
        />
        <View style={styles.headerText}>
          <Text variant="heading">{professional.full_name}</Text>
          <Text tone="default">{roleLabels[professional.main_role]}</Text>
          <Rating average={professional.rating_avg} count={professional.rating_count} />
          <Text variant="caption" tone="muted">
            {place}
          </Text>
        </View>
      </View>

      {professional.available_for_gigs && (
        <Badge icon="flash-outline" label="Disponível para freelas" />
      )}

      {professional.secondary_roles.length > 0 && (
        <Section title="Também atua como">
          <ChipList labels={professional.secondary_roles.map((role) => roleLabels[role])} />
        </Section>
      )}

      {professional.experience && (
        <Section title="Experiência">
          <Text>{professional.experience}</Text>
        </Section>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerText: { flex: 1, gap: spacing.xs },
});
