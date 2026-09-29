import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { roleOptions, type JobRole } from '@/shared/lib/labels';
import { ChipSelect, EmptyState, PagedList, SearchField, colors, spacing } from '@/shared/ui';
import { ProfessionalCard } from '../components/ProfessionalCard';
import { useProfessionalSearch } from '../hooks/useProfessionalSearch';

export function ExploreProfessionalsScreen() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<JobRole | null>(null);
  const search = useProfessionalSearch({ role, query: useDebouncedValue(query) });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.filters}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Buscar por nome" />
        <ChipSelect
          horizontal
          options={roleOptions}
          selected={role ? [role] : []}
          onToggle={(value) => setRole((current) => (current === value ? null : value))}
        />
      </View>
      <PagedList
        {...search}
        renderItem={(professional) => (
          <ProfessionalCard
            professional={professional}
            onPress={() => router.push(`/restaurant/professionals/${professional.id}`)}
          />
        )}
        keyExtractor={(professional) => professional.id}
        empty={
          <EmptyState
            icon="people-outline"
            title="Ninguém por aqui ainda"
            description="Tente outro cargo ou limpe a busca para ver mais profissionais."
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
