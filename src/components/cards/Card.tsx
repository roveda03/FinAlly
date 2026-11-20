import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppColors, AppFontSize, AppRadius, AppSpacing } from '@/constants';

export type CardVariant = 'default' | 'highlight';

export interface CardProps {
  children?: ReactNode;
  title?: string;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, title, variant = 'default', style }: CardProps) {
  const isHighlight = variant === 'highlight';

  return (
    <View style={[styles.card, isHighlight && styles.highlight, style]}>
      {title ? (
        <Text style={[styles.title, isHighlight && styles.highlightTitle]}>{title}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.lg,
    padding: AppSpacing.md,
    gap: AppSpacing.sm,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  highlight: {
    backgroundColor: AppColors.primaryDark,
    borderColor: AppColors.primaryDark,
  },
  title: {
    fontSize: AppFontSize.md,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  highlightTitle: {
    color: AppColors.primaryLight,
  },
});
