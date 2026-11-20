import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BottomNavigation } from '@/components/navigation';
import { AppColors } from '@/constants';

export default function AppLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
  },
});
