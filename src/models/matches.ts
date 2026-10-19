export type Match = {
  id: string;
  startsAt: string | null;
  status: string;
  minute?: number;
  home: { id: string; name: string; city: string };
  away: { id: string; name: string; city: string };
  score: { home: number; away: number } | null;
};

export type MatchesResponse = { round: number; matches: Match[] };
export type MatchFilter = 'all' | 'upcoming' | 'finished';

export function filterMatches(matches: Match[], filter: MatchFilter): Match[] {
  if (filter === 'finished') return matches.filter((match) => match.status === 'finished');
  if (filter === 'upcoming') {
    return matches.filter((match) => ['scheduled', 'postponed'].includes(match.status));
  }
  return matches;
}

export function formatStart(startsAt: string | null): string {
  if (!startsAt) return 'Дата уточняется';
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return 'Дата уточняется';
  // Без timeZone Intl использует часовой пояс устройства.
  return date.toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

export function formatStatus(match: Match): string {
  const labels: Record<string, string> = {
    scheduled: 'Предстоящий', finished: 'Завершён',
    live: 'Идёт матч', postponed: 'Перенесён', cancelled: 'Отменён',
  };
  const label = labels[match.status] ?? 'Статус уточняется';
  return match.status === 'live' && match.minute != null
    ? `${label} · ${match.minute} мин` : label;
}
