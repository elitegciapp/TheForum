import { ScrollView, StyleSheet, Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function ScreenshotNotice() {
  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.h1}>Screenshot & Redistribution</Text>
        <Text style={styles.p}>
          The Forum is a private community. Content is intended to remain within the community.
        </Text>

        <Text style={styles.p}>- Do not record, scrape, mass-copy, or redistribute content from The Forum.</Text>
        <Text style={styles.p}>- Screenshots or redistribution may result in restricted access or loss of access.</Text>
        <Text style={styles.p}>- Enforcement may be manual and/or automated.</Text>
        <Text style={styles.p}>- We do not guarantee detection of every violation.</Text>
        <Text style={styles.p}>- Decisions related to access and enforcement are final.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 28 },
  h1: { marginTop: 30, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  p: { marginTop: 10, color: '#3A332A', lineHeight: 19 },
});
