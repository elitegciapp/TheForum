import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F4EF' },
  inner: { flex: 1, padding: 16 },
});
