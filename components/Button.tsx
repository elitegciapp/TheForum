import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function Button(props: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const { title, onPress, disabled, loading, variant = 'primary' } = props;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.textSecondary]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primary: { backgroundColor: '#1E1A14' },
  secondary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8D1C7' },
  disabled: { opacity: 0.6 },
  text: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  textSecondary: { color: '#1E1A14' },
});
