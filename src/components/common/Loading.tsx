import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppColors, AppFontSize, AppSpacing } from '@/constants';

export interface LoadingProps {
  message?: string;
  /** Ocupa toda a área disponível, centralizando o indicador. */
  fullScreen?: boolean;
}

export function Loading({ message, fullScreen = false }: LoadingProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={AppColors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppSpacing.lg,
    gap: AppSpacing.sm,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  message: {
    fontSize: AppFontSize.md,
    color: AppColors.textSecondary,
  },
});
