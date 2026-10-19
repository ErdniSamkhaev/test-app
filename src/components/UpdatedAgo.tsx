import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

type Props = {
  // Момент последней успешной загрузки данных.
  since: Date;
};

export function UpdatedAgo({ since }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const timestamp = since.getTime();

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  return <Text style={styles.text}>Обновлено {seconds} сек назад</Text>;
}

const styles = StyleSheet.create({
  text: { fontSize: 13, color: '#6b7280' },
});
