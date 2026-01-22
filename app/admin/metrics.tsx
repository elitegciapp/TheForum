import { StyleSheet, View } from 'react-native';
import AdminCard from '../../components/AdminCard';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function Metrics() {
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
        <AdminCard title="Daily Active Members" value="412" />
        <AdminCard title="Posts Today" value="86" />
        <AdminCard title="Comments / Post" value="4.2" />
        <AdminCard title="Invite Conversion Rate" value="68%" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 14 },
});
