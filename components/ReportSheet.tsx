import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { reportTarget } from '../lib/posts';
import { supabase } from '../lib/supabase';

const REASONS = ['Spam', 'Harassment', 'Hate', 'Sexual content', 'Illegal', 'Other'] as const;

export function ReportSheet(props: {
  visible: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'user';
  targetId: string | null;
}) {
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!props.targetId) return;
    if (!reason) {
      Alert.alert('Select a reason', 'Choose one reason to submit the report.');
      return;
    }

    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) throw new Error('Not authenticated');

      await reportTarget({
        reporterId: session.user.id,
        targetType: props.targetType,
        targetId: props.targetId,
        reason,
      });

      Alert.alert('Report submitted', 'Thank you. A host will review it.');
      setReason(null);
      props.onClose();
    } catch (e: any) {
      Alert.alert('Could not submit report', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={props.visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={props.onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Report</Text>
        <Text style={styles.sub}>Select a reason.</Text>

        <View style={{ marginTop: 10 }}>
          {REASONS.map((r) => (
            <Pressable key={r} onPress={() => setReason(r)} style={styles.reason}>
              <Text style={[styles.reasonText, reason === r && styles.reasonSelected]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Button title="Submit" onPress={submit} loading={loading} />
        <Button title="Cancel" variant="secondary" onPress={props.onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5DED3',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_600SemiBold' },
  sub: { marginTop: 4, color: '#6B6257' },
  reason: { paddingVertical: 10 },
  reasonText: { color: '#1E1A14', fontSize: 15, fontWeight: '600' },
  reasonSelected: { color: '#6B4E00' },
});
