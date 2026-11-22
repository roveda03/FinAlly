import { DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppColors, Routes } from '@/constants';
import { AuthProvider, ChatProvider, FinanceProvider } from '@/contexts';
import { useAuth } from '@/hooks/use-auth';

const FinAllyTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: AppColors.primary,
    background: AppColors.background,
    card: AppColors.white,
    text: AppColors.textPrimary,
    border: AppColors.border,
    notification: AppColors.expense,
  },
};

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: AppColors.background } }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={!isAuthenticated} redirectTo={Routes.dashboard}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated} redirectTo={Routes.login}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={FinAllyTheme}>
      <AuthProvider>
        <FinanceProvider>
          <ChatProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </ChatProvider>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
