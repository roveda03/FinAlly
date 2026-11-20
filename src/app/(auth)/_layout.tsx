import { Stack } from 'expo-router';

import { AppColors } from '@/constants';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: AppColors.background } }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
