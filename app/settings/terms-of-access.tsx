import { ScrollView, StyleSheet, Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function TermsOfAccess() {
  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.h1}>Terms of Access</Text>
        <Text style={styles.p}>
          By using The Forum, you agree to these Terms of Access.
        </Text>

        <Text style={styles.h2}>Invite-only access</Text>
        <Text style={styles.p}>- The Forum is not a public forum. Access is provided only through invitations or access codes.</Text>
        <Text style={styles.p}>- Codes may be revoked, expire, or be limited in use at any time.</Text>

        <Text style={styles.h2}>No right to access</Text>
        <Text style={styles.p}>- Access to The Forum is a privilege, not a right.</Text>
        <Text style={styles.p}>- We may deny, restrict, suspend, or terminate access at our discretion, with or without notice.</Text>

        <Text style={styles.h2}>Content and conduct</Text>
        <Text style={styles.p}>- You are responsible for what you post and share.</Text>
        <Text style={styles.p}>- You agree not to use The Forum for prohibited or unlawful activities.</Text>
        <Text style={styles.p}>- You agree not to circumvent or interfere with platform safeguards, moderation, or access controls.</Text>

        <Text style={styles.h2}>Visibility and availability</Text>
        <Text style={styles.p}>- We may limit content visibility, remove content, or lock discussions.</Text>
        <Text style={styles.p}>- We do not guarantee availability, uptime, or permanent access to any content.</Text>

        <Text style={styles.h2}>No guaranteed appeals</Text>
        <Text style={styles.p}>- We may review decisions, but we are not obligated to offer an appeals process or reverse any decision.</Text>

        <Text style={styles.h2}>Changes</Text>
        <Text style={styles.p}>- We may update these terms. Continued use indicates acceptance of updated terms.</Text>
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
