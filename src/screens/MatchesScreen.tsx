import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { FavoriteButton } from '../components/FavoriteButton';
import { useFavorites } from '../hooks/useFavorites';
import { UpdatedAgo } from '../components/UpdatedAgo';
import { MATCHES_URL } from '../config';
import { filterMatches, type MatchFilter, type MatchesResponse } from '../models/matches';

const filters: { value: MatchFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'upcoming', label: 'Предстоящие' },
  { value: 'finished', label: 'Завершённые' },
];

export function MatchesScreen() {
  const { favorites, isFavorite, toggle } = useFavorites();
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MatchFilter>('all');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  const loadMatches = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError(null);
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(MATCHES_URL, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: MatchesResponse = await response.json();
      if (!Array.isArray(result.matches) || typeof result.round !== 'number') {
        throw new Error('Invalid response');
      }
      if (activeRequest.current !== controller) return;
      setData(result);
      setUpdatedAt(new Date());
    } catch {
      if (activeRequest.current !== controller) return;
      setError('Не удалось загрузить матчи. Проверьте подключение и попробуйте ещё раз.');
    } finally {
      clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadMatches();
    return () => {
      const controller = activeRequest.current;
      activeRequest.current = null;
      controller?.abort();
    };
  }, [loadMatches]);

  const visibleMatches = filterMatches(data?.matches ?? [], filter);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Матчи тура{data ? ` · ${data.round}` : ''}</Text>
      <View style={styles.toolbar}>
        <Text style={styles.hint}>Время начала — в часовом поясе устройства</Text>
        <Button title={loading ? 'Загрузка…' : 'Обновить'} onPress={() => void loadMatches()} disabled={loading} />
      </View>
      {updatedAt && <UpdatedAgo since={updatedAt} />}
      <View style={styles.filters}>
        {filters.map(({ value, label }) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === value }}
            onPress={() => setFilter(value)}
            style={[styles.filter, filter === value && styles.selectedFilter]}
          >
            <Text style={[styles.filterLabel, filter === value && styles.selectedLabel]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {loading && !data && <ActivityIndicator accessibilityLabel="Загрузка матчей" />}
      {error && (
        <View style={styles.message}>
          <Text accessibilityRole="alert">{error}</Text>
          {data && <Text style={styles.hint}>Показаны данные последней успешной загрузки.</Text>}
          <Button title="Повторить" onPress={() => void loadMatches()} disabled={loading} />
        </View>
      )}
      {data && (
        <FlatList
          data={visibleMatches}
          keyExtractor={(match) => match.id}
          extraData={favorites}
          renderItem={({ item }) => (
            <MatchCard match={item}>
              <FavoriteButton active={isFavorite(item.id)} onPress={() => toggle(item.id)} />
            </MatchCard>
          )}
          refreshing={loading}
          onRefresh={() => void loadMatches()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text>{data.matches.length === 0 ? 'В этом туре пока нет матчей.' : 'В этой категории нет матчей.'}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  hint: { fontSize: 13, color: '#6b7280', flexShrink: 1 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f3f4f6' },
  selectedFilter: { backgroundColor: '#1d4ed8' },
  filterLabel: { fontSize: 14, color: '#374151' },
  selectedLabel: { color: '#fff' },
  list: { gap: 12, paddingBottom: 24 },
  message: { gap: 8 },
});

