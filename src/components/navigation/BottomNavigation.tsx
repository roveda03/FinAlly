import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    AppColors,
    AppFontSize,
    AppSpacing,
    BottomNavigationHeight,
    MainNavigationItems,
    type NavigationItem,
} from '@/constants';

export interface BottomNavigationProps {
  items?: NavigationItem[];
}

export function BottomNavigation({ items = MainNavigationItems }: BottomNavigationProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, AppSpacing.sm) }]}>
      {items.map((item) => {
        const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);
        return (
          <Pressable
            key={item.route}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) router.navigate(item.route as any);
            }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <Ionicons
              name={isActive ? item.icon : (`${item.icon}-outline` as typeof item.icon)}
              size={22}
              color={isActive ? AppColors.primary : AppColors.textSecondary}
            />
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {item.label}
            </Text>
            {isActive ? <View style={styles.activeIndicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingTop: AppSpacing.xs,
  },
  item: {
    flex: 1,
    minHeight: BottomNavigationHeight - AppSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: AppFontSize.sm - 2,
    color: AppColors.textSecondary,
  },
  labelActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: AppColors.primary,
  },
});
