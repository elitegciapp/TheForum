import { Drawer } from 'expo-router/drawer';
import { ActivityIndicator, View } from 'react-native';
import { DrawerContent } from '../components/DrawerContent';
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
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.25)',
      }}
    >
      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' }, swipeEnabled: false }} />
      <Drawer.Screen name="(auth)" options={{ drawerItemStyle: { display: 'none' }, swipeEnabled: false }} />
      <Drawer.Screen name="(onboarding)" options={{ drawerItemStyle: { display: 'none' }, swipeEnabled: false }} />
      <Drawer.Screen name="(app)" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="admin" options={{ drawerItemStyle: { display: 'none' }, swipeEnabled: false }} />
      <Drawer.Screen
        name="settings/account"
        options={{ drawerItemStyle: { display: 'none' }, swipeEnabled: false, headerShown: true, title: 'Account' }}
      />
    </Drawer>
  );
}
