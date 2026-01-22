import { Pressable, StyleSheet, View } from 'react-native';
import { Sidebar } from '../Sidebar';
import { useDrawer } from './DrawerContext';

export function DrawerOverlay() {
  const { open, enabled, closeDrawer } = useDrawer();

  if (!enabled || !open) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Pressable style={styles.backdrop} onPress={closeDrawer} accessibilityLabel="Close navigation" />
      <View style={styles.panel}>
        <Sidebar variant="drawer" onNavigate={closeDrawer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 2000,
    elevation: 2000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    width: 300,
    height: '100%',
    backgroundColor: '#F7F4EF',
  },
});
