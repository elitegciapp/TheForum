import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Sidebar } from '../Sidebar';
import { useDrawer } from './DrawerContext';

export function DrawerOverlay() {
  const { open, enabled, closeDrawer } = useDrawer();

  return (
    <Modal
      visible={enabled && open}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={closeDrawer}
    >
      <View style={styles.overlay} pointerEvents="auto">
        <Pressable style={styles.backdrop} onPress={closeDrawer} accessibilityLabel="Close navigation" />
        <View style={styles.panel}>
          <Sidebar variant="drawer" onNavigate={closeDrawer} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
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
