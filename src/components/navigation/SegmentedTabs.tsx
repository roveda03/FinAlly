import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors, AppFontSize, AppRadius, AppSpacing } from '@/constants';
import type { IconName } from '@/types';

export interface SegmentedTab {
  label: string;
  route: Href;
  icon: IconName;
}

export interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  /** Rótulo da aba ativa. */
  active: string;
}

/** Alternância em pílulas entre telas irmãs (ex.: Metas | Limites). */
export function SegmentedTabs({ tabs, active }: SegmentedTabsProps) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = tab.label === active;
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => {
              if (!isActive) router.replace(tab.route);
            }}>
            <Ionicons
              name={tab.icon}
              size={17}
              color={isActive ? AppColors.white : AppColors.primaryDark}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Abas compartilhadas pelas telas de Metas e Limites de Gastos. */
export const GoalsAndLimitsTabs: SegmentedTab[] = [
  { label: 'Metas', route: '/metas', icon: 'flag' },
  { label: 'Limites', route: '/limites', icon: 'speedometer' },
];

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#DDF3EA',
    borderRadius: AppRadius.full,
    padding: 3,
  },
  tab: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.xs,
    borderRadius: AppRadius.full,
  },
  tabActive: {
    backgroundColor: AppColors.primaryDark,
  },
  label: {
    fontSize: AppFontSize.sm + 1,
    fontWeight: '600',
    color: AppColors.primaryDark,
  },
  labelActive: {
    color: AppColors.white,
  },
});
