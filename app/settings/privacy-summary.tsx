import { ScrollView, StyleSheet, Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function PrivacySummary() {
  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.h1}>Privacy Summary</Text>
        <Text style={styles.p}>
          The Forum is designed to collect minimal data needed to operate a private community.
        </Text>

        <Text style={styles.h2}>What we collect</Text>
        <Text style={styles.p}>- Account/session information needed to provide access.</Text>
        <Text style={styles.p}>- Content you submit (posts, replies) and related metadata (e.g., timestamps).</Text>
        <Text style={styles.p}>- Operational data needed for safety and reliability (e.g., moderation actions, integrity signals).</Text>

        <Text style={styles.h2}>How we use it</Text>
        <Text style={styles.p}>- To operate the service and provide core functionality.</Text>
        <Text style={styles.p}>- To enforce community standards and protect the community.</Text>
        <Text style={styles.p}>- To maintain security, prevent abuse, and improve reliability.</Text>

        <Text style={styles.h2}>What we don’t do</Text>
        <Text style={styles.p}>- We do not sell your personal data.</Text>
        <Text style={styles.p}>- We do not provide public engagement metrics tied to your activity.</Text>

        <Text style={styles.h2}>Storage</Text>
        <Text style={styles.p}>
          Some data may be stored locally on your device and/or on remote systems depending on configuration.
        </Text>
        <Text style={styles.p}>
          We may retain certain records (including moderation and safety logs) as needed for operational integrity and risk
          management.
        </Text>

        <Text style={styles.h2}>Deletion</Text>
        <Text style={styles.p}>- Access and accounts may be restricted or terminated at the administrator’s discretion.</Text>
        <Text style={styles.p}>- We do not promise immediate or complete deletion in all circumstances.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 28 },
  h1: { marginTop: 30, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  h2: { marginTop: 16, fontSize: 16, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_600SemiBold' },
  p: { marginTop: 10, color: '#3A332A', lineHeight: 19 },
});
