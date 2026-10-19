import { StyleSheet, Text, View } from 'react-native';
import { formatStart, formatStatus, type Match } from '../models/matches';

type Props = { match: Match; children?: React.ReactNode };

export function MatchCard({ match, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.status, match.status === 'live' && styles.live]}>
          {formatStatus(match)}
        </Text>
        {children}
      </View>
      <Text style={styles.teams}>{match.home.name} — {match.away.name}</Text>
      <Text style={styles.score}>
        {match.score != null ? `${match.score.home} : ${match.score.away}` : 'Счёт пока отсутствует'}
      </Text>
      <Text style={styles.date}>{formatStart(match.startsAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f3f4f6', gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { fontSize: 13, color: '#4b5563' },
  live: { color: '#b91c1c', fontWeight: '700' },
  teams: { fontSize: 17, fontWeight: '600', color: '#111827' },
  score: { fontSize: 18, fontWeight: '600', color: '#111827' },
  date: { fontSize: 14, color: '#4b5563' },
});
