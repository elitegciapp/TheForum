import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { View } from 'react-native';
import { Sidebar } from './Sidebar';

export function DrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1 }}>
        <Sidebar variant="drawer" onNavigate={() => props.navigation.closeDrawer()} />
      </View>
    </DrawerContentScrollView>
  );
}
