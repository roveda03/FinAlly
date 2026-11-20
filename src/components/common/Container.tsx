import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { AppColors, AppSpacing } from '@/constants';

export interface ContainerProps {
  children: ReactNode;
  /** Habilita rolagem vertical do conteúdo. */
  scrollable?: boolean;
  /** Bordas que devem respeitar a área segura. */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Container({
  children,
  scrollable = false,
  edges = ['top', 'left', 'right'],
  style,
  contentStyle,
}: ContainerProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.lg,
    gap: AppSpacing.md,
  },
  fill: {
    flex: 1,
  },
});
