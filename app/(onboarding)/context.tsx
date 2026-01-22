import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { router } from 'expo-router';

export default function Context() {
  // Deprecated route (kept for safety): redirect to the new Profession screen.
  useEffect(() => {
    router.replace('/(onboarding)/profession');
  }, []);

  return (
    <Screen>
      <Text style={styles.h1}>Redirecting…</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 20, fontSize: 24, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
});
