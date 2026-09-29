import { FlashList } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ErrorView, LoadingView } from './QueryStates';
import { colors, spacing } from './theme';

type PagedListProps<T> = {
  items: T[];
  isPending: boolean;
  error: { message: string } | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  renderItem: (item: T) => ReactElement;
  keyExtractor: (item: T) => string;
  empty: ReactElement;
};

/** FlashList com carregando, vazio, erro e próxima página. */
export function PagedList<T>({
  items,
  isPending,
  error,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  renderItem,
  keyExtractor,
  empty,
}: PagedListProps<T>) {
  if (isPending) return <LoadingView />;
  if (error && items.length === 0) return <ErrorView message={error.message} onRetry={refetch} />;

  return (
    <FlashList
      data={items}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={empty}
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={colors.primary} />
        ) : null
      }
      keyboardShouldPersistTaps="handled"
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  separator: { height: spacing.xxl },
  footer: { marginTop: spacing.xl },
});
