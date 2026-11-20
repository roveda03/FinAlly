export const AppColors = {
  primaryDark: '#064B3D',
  primary: '#087B56',
  primaryLight: '#DDF4EA',
  background: '#F5F9F7',
  white: '#FFFFFF',
  textPrimary: '#153B35',
  textSecondary: '#687B75',
  expense: '#D64550',
  income: '#087F5B',
  border: '#E3ECE8',
} as const;

export type AppColor = keyof typeof AppColors;
