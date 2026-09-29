import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { roleOptions, type JobRole } from '@/shared/lib/labels';
import { ChipSelect, EmptyState, PagedList, SearchField, colors, spacing } from '@/shared/ui';
import { OpeningCard } from '../components/OpeningCard';
import { useOpeningSearch } from '../hooks/useOpeningSearch';
import type { OpeningKind } from '../services/openings.service';

const kindOptions = [
  { value: 'job', label: 'Vagas fixas' },
  { value: 'gig', label: 'Freelas' },
] as const satisfies readonly { value: OpeningKind; label: string }[];

export function ExploreOpeningsScreen() {
  const [city, setCity] = useState('');
  const [kind, setKind] = useState<OpeningKind | null>(null);
  const [role, setRole] = useState<JobRole | null>(null);
  const openings = useOpeningSearch({ kind, role, city: useDebouncedValue(city) });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.filters}>
        <SearchField value={city} onChangeText={setCity} placeholder="Filtrar por cidade" />
        <ChipSelect
          horizontal
          options={kindOptions}
          selected={kind ? [kind] : []}
          onToggle={(value) => setKind((current) => (current === value ? null : value))}
        />
        <ChipSelect
          horizontal
          options={roleOptions}
          selected={role ? [role] : []}
          onToggle={(value) => setRole((current) => (current === value ? null : value))}
        />
      </View>
      <PagedList
        {...openings}
        renderItem={(opening) => (
          <OpeningCard
            opening={opening}
            onPress={() =>
              router.push(
                opening.kind === 'job'
                  ? `/professional/jobs/${opening.id}`
                  : `/professional/gigs/${opening.id}`,
              )
            }
          />
        )}
        keyExtractor={(opening) => `${opening.kind}-${opening.id}`}
        empty={
          <EmptyState
            icon="search-outline"
            title="Nenhuma vaga com esses filtros"
            description="Tire um filtro ou tente outra cidade. Vagas novas aparecem aqui primeiro."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  filters: { gap: spacing.md, padding: spacing.xl, paddingBottom: spacing.lg },
});
