import { Text, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function OnboardingWelcome() {
  return (
    <Screen>
      <Text style={styles.h1}>Welcome to The Forum</Text>
      <Text style={styles.p}>
        This is a private space for thoughtful discussion among professionals.
      </Text>
      <Text style={styles.p}>Conversations are curated. Standards matter.</Text>

      <Button title="Continue" onPress={() => router.push('/(onboarding)/identity')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 30, fontSize: 24, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  p: { marginTop: 12, color: '#3A332A', lineHeight: 20 },
});
