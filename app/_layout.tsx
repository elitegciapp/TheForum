import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from '@expo-google-fonts/playfair-display';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="settings/account" options={{ headerShown: true, title: 'Account' }} />
    </Stack>
  );
}
