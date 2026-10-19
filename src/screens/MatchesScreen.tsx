import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { MatchCard } from '../components/MatchCard';
import { MATCHES_URL } from '../config';
import type { MatchesResponse } from '../models/matches';

export function MatchesScreen() {
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Матчи тура{data ? ` · ${data.round}` : ''}</Text>
      {loading && <ActivityIndicator accessibilityLabel="Загрузка матчей" />}
      {error && (
        <View style={styles.message}>
          <Text accessibilityRole="alert">{error}</Text>
          <Button title="Повторить" onPress={() => void loadMatches()} disabled={loading} />
        </View>
      )}
      {data && (
        <FlatList
          data={data.matches}
          keyExtractor={(match) => match.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text>В этом туре пока нет матчей.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  list: { gap: 12, paddingBottom: 24 },
  message: { gap: 8 },
});
