import { ScrollView, StyleSheet, Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function CommunityGuidelines() {
  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.h1}>Community Guidelines</Text>
        <Text style={styles.p}>
          The Forum is a private, invite-only professional community for thoughtful discussion. Participation is a
          privilege. To protect members and keep conversations constructive, we enforce these guidelines at the
          administrator’s discretion.
        </Text>

        <Text style={styles.h2}>What’s expected</Text>
        <Text style={styles.p}>- Be professional, respectful, and honest.</Text>
        <Text style={styles.p}>- Contribute with care: posts should be intentional; replies should be thoughtful.</Text>
        <Text style={styles.p}>- Protect privacy: share only what you have the right to share.</Text>

        <Text style={styles.h2}>Not allowed (non-exhaustive)</Text>
        <Text style={styles.p}>- Harassment, threats, intimidation, or sustained hostility.</Text>
        <Text style={styles.p}>- Hate speech, discriminatory content, or demeaning language.</Text>
        <Text style={styles.p}>- Political campaigning or partisan advocacy.</Text>
        <Text style={styles.p}>- Dating, matchmaking, or solicitation.</Text>
        <Text style={styles.p}>- Advertising or self-promotion without permission.</Text>
        <Text style={styles.p}>- Sharing or attempting to extract private user data.</Text>
        <Text style={styles.p}>- Circumventing access controls or moderation.</Text>
        <Text style={styles.p}>- Recording, scraping, or redistributing app content.</Text>
        <Text style={styles.p}>- Impersonation or deceptive identity practices.</Text>

        <Text style={styles.h2}>Moderation and enforcement</Text>
        <Text style={styles.p}>
          We may moderate content and participation to maintain quality and safety. This may include limiting
          visibility, removing content, locking discussions, restricting features, or terminating access. Actions may
          occur without prior notice. We may use a mix of manual review and automated signals. Decisions are final.
        </Text>
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
