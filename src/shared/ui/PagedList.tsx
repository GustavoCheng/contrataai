import { FlashList } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import { ErrorView, LoadingView } from './QueryStates';
import { colors, spacing } from './theme';
import { useLayout, useRefresh } from './useLayout';

type PagedListProps<T> = {
  items: T[];
  isPending: boolean;
  error: { message: string } | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => Promise<unknown>;
  renderItem: (item: T) => ReactElement;
  keyExtractor: (item: T) => string;
  empty: ReactElement;
};

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
  const { gutter, column } = useLayout();
  const refresh = useRefresh(refetch);

  if (isPending) return <LoadingView />;
  if (error && items.length === 0) return <ErrorView message={error.message} onRetry={refetch} />;

  return (
    <View style={[styles.list, column]}>
      <FlashList
        data={items}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: gutter }}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={empty}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} color={colors.primary} />
          ) : null
        }
        refreshControl={
          refresh && (
            <RefreshControl
              refreshing={refresh.refreshing}
              onRefresh={refresh.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          )
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  separator: { height: spacing.xxl },
  footer: { marginTop: spacing.xl },
});
