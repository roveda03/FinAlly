import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AppColors, AppFontSize, AppRadius, AppSpacing } from '@/constants';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, onFocus, onBlur, ...rest }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={AppColors.textSecondary}
        accessibilityLabel={label}
        style={[
          styles.input,
          isFocused && styles.focused,
          error ? styles.inputError : null,
          style,
        ]}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: AppSpacing.xs,
  },
  label: {
    fontSize: AppFontSize.sm,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.white,
    fontSize: AppFontSize.md,
    color: AppColors.textPrimary,
  },
  focused: {
    borderColor: AppColors.primary,
  },
  inputError: {
    borderColor: AppColors.expense,
  },
  error: {
    fontSize: AppFontSize.sm,
    color: AppColors.expense,
  },
});
