import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type TransactionType = 'income' | 'expense';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  /** Ícone (Ionicons) usado nas listas. */
  icon: IconName;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  /** Data no formato ISO 8601 (ex.: 2026-11-05). */
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  /** Data limite no formato ISO 8601. */
  deadline?: string;
}

/** Limite mensal de gastos para uma categoria de despesa. */
export interface SpendingLimit {
  id: string;
  categoryId: string;
  amount: number;
}

export type LimitStatus = 'ok' | 'warning' | 'exceeded';

export interface LimitUsage {
  limit: SpendingLimit;
  category: Category | undefined;
  /** Total gasto na categoria no mês corrente. */
  spent: number;
  /** Percentual utilizado (pode passar de 100). */
  percentage: number;
  /** Quanto falta para atingir o limite (negativo se ultrapassado). */
  remaining: number;
  status: LimitStatus;
}

export type NewTransaction = Omit<Transaction, 'id'>;
export type NewGoal = Omit<Goal, 'id'>;
export type NewSpendingLimit = Omit<SpendingLimit, 'id'>;

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
