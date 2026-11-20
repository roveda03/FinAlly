import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors, AppFontSize, AppSpacing } from '@/constants';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Elemento opcional exibido à direita (ex.: botão de logout). */
  right?: ReactNode;
}

export function Header({ title, subtitle, right }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: AppSpacing.md,
    gap: AppSpacing.md,
  },
  texts: {
    flex: 1,
    gap: AppSpacing.xs,
  },
  title: {
    fontSize: AppFontSize.xxl,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  subtitle: {
    fontSize: AppFontSize.md,
    color: AppColors.textSecondary,
  },
});
