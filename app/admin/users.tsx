import { View, StyleSheet } from 'react-native';
import AdminCard from '../../components/AdminCard';
import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { deriveRankFromTrustScore } from '../../lib/rank';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function Users() {
  const [me, setMe] = useState<{ trustScore: number; rank: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isSupabaseConfigured) {
          if (!cancelled) setMe(null);
          return;
        }

        const session = (await supabase.auth.getSession()).data.session;
        const userId = session?.user?.id;
        if (!userId) {
          if (!cancelled) setMe(null);
          return;
        }

        const { getGovernanceState } = await import('../../lib/governanceStore');
        const g = await getGovernanceState(userId);
        const rank = deriveRankFromTrustScore(g.trustScore);
        if (!cancelled) setMe({ trustScore: g.trustScore, rank });
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      <AdminCard
        title="Rank Badges"
        subtitle={
          me
            ? `Admin view: Trust ${me.trustScore} · Rank ${me.rank}`
            : 'Admin view: Trust score and derived rank (rank is never stored)'
        }
      />

      <AdminCard title="Alex Morgan" subtitle="Role: Member · Rank Member" />

      <AdminCard title="Jordan Lee" subtitle="Role: Moderator · Rank Eligible Moderator" />

      <AdminCard title="Sam Patel" subtitle="Role: Member · Rank Contributor" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 14 },
});
