export const AppColors = {
  primaryDark: '#075C49',
  primary: '#087F5B',
  primaryLight: '#DDF3EA',
  background: '#F7FAF8',
  white: '#FFFFFF',
  textPrimary: '#153B35',
  textSecondary: '#687B75',
  expense: '#D64550',
  income: '#087F5B',
  border: '#E3ECE8',
} as const;

export type AppColor = keyof typeof AppColors;
