import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const Routes = {
  login: '/login',
  dashboard: '/dashboard',
  movimentacoes: '/movimentacoes',
  metas: '/metas',
  chatbot: '/chatbot',
} as const;

export type AppRoute = (typeof Routes)[keyof typeof Routes];

export interface NavigationItem {
  label: string;
  route: AppRoute;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export const MainNavigationItems: NavigationItem[] = [
  { label: 'Início', route: Routes.dashboard, icon: 'home' },
  { label: 'Movimentações', route: Routes.movimentacoes, icon: 'swap-horizontal' },
  { label: 'Metas', route: Routes.metas, icon: 'flag' },
  { label: 'Chatbot', route: Routes.chatbot, icon: 'chatbubble-ellipses' },
];
