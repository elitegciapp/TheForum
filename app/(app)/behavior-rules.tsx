import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';

export default function BehaviorRules() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.h1}>Behavior Rules</Text>
        <Text style={styles.sub}>Reference guidelines for moderation actions.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 10 },
  h1: { fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 6, color: '#6B6257', lineHeight: 18 },
});
