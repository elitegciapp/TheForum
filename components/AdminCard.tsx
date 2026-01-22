import { View, Text, StyleSheet } from 'react-native';

export default function AdminCard({
  title,
  subtitle,
  value,
}: {
  title: string;
  subtitle?: string;
  value?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {value && <Text style={styles.value}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
});
