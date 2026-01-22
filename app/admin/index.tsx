import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import AdminCard from '../../components/AdminCard';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';

export default function AdminHome() {
  return (
    <Screen>
      <Button
        title="Back"
        variant="secondary"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(app)/settings');
        }}
      />

      <Text style={styles.h1}>Council Console</Text>
      <Text style={styles.sub}>Administrative tools for invites, members, rooms, and moderation.</Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Link href="/admin/invites" asChild>
          <Pressable style={styles.item}>
            <AdminCard title="Access Codes" subtitle="Create and manage access" value="Manage" />
          </Pressable>
        </Link>

        <Link href="/admin/users" asChild>
          <Pressable style={styles.item}>
            <AdminCard title="Members" subtitle="Roles, suspensions, trust" value="View" />
          </Pressable>
        </Link>

        <Link href="/admin/room-requests" asChild>
          <Pressable style={styles.item}>
            <AdminCard title="Room Requests" subtitle="Review and approve new rooms" value="Review" />
          </Pressable>
        </Link>

        <Link href="/admin/content" asChild>
          <Pressable style={styles.item}>
            <AdminCard title="Content" subtitle="Moderation and reports" value="Review" />
          </Pressable>
        </Link>

        <Link href="/admin/moderation" asChild>
          <Pressable style={styles.item}>
            <AdminCard title="Moderation Log" subtitle="Internal actions (admin-only)" value="View" />
          </Pressable>
        </Link>

        <Link href="/admin/metrics" asChild>
          <Pressable style={styles.item}>
            <AdminCard title="Metrics" subtitle="Engagement health" value="Analyze" />
          </Pressable>
        </Link>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 14, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 8, color: '#6B6257', lineHeight: 18 },
  list: { paddingTop: 14, paddingBottom: 18 },
  item: { marginTop: 10 },
});
