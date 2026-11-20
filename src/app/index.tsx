import { Redirect } from 'expo-router';

import { Routes } from '@/constants';
import { useAuth } from '@/hooks/use-auth';

export default function Index() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? Routes.dashboard : Routes.login} />;
}
