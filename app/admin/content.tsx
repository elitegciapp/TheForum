import { StyleSheet, View } from 'react-native';
import AdminCard from '../../components/AdminCard';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function Content() {
  return (
    <Screen>
      <Button
        title="Back"
        variant="secondary"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/admin');
        }}
      />

      <View style={styles.list}>
      <AdminCard title="Reported Post" subtitle="3 reports · Finance Thread" />

      <AdminCard title="Flagged Comment" subtitle="Spam · Auto-detected" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 14 },
});
