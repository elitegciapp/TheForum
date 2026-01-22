import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';

export function Input(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize ?? 'none'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  label: { color: '#3A332A', marginBottom: 6, fontWeight: '600' },
  input: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
  },
});
