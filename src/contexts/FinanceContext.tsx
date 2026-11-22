import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

import {
  categories as initialCategories,
  expenses,
  goals as initialGoals,
  incomes,
  limits as initialLimits,
} from '@/data';
import type {
  Category,
  FinanceSummary,
  Goal,
  LimitUsage,
  NewGoal,
  NewSpendingLimit,
  NewTransaction,
  SpendingLimit,
  Transaction,
} from '@/types';
import { calculateLimitUsage, calculateSummary, generateId } from '@/utils';

export interface FinanceContextValue {
  transactions: Transaction[];
  incomes: Transaction[];
  expenses: Transaction[];
  categories: Category[];
  goals: Goal[];
  limits: SpendingLimit[];
  /** Uso de cada limite no mês corrente, do maior para o menor percentual. */
  limitUsages: LimitUsage[];
  /** Limites próximos (>= 80%) ou acima do valor definido. */
  limitAlerts: LimitUsage[];
  summary: FinanceSummary;
  addTransaction: (data: NewTransaction) => Transaction;
  updateTransaction: (id: string, data: Partial<NewTransaction>) => void;
  removeTransaction: (id: string) => void;
  addGoal: (data: NewGoal) => Goal;
  updateGoal: (id: string, data: Partial<NewGoal>) => void;
  removeGoal: (id: string) => void;
  addLimit: (data: NewSpendingLimit) => SpendingLimit;
  updateLimit: (id: string, data: Partial<NewSpendingLimit>) => void;
  removeLimit: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
}

export const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => [
    ...incomes,
    ...expenses,
  ]);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [limits, setLimits] = useState<SpendingLimit[]>(initialLimits);
  const [categories] = useState<Category[]>(initialCategories);

  const addTransaction = useCallback((data: NewTransaction) => {
    const transaction: Transaction = { ...data, id: generateId('trx') };
    setTransactions((prev) => [transaction, ...prev]);
    return transaction;
  }, []);

  const updateTransaction = useCallback((id: string, data: Partial<NewTransaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addGoal = useCallback((data: NewGoal) => {
    const goal: Goal = { ...data, id: generateId('goal') };
    setGoals((prev) => [...prev, goal]);
    return goal;
  }, []);

  const updateGoal = useCallback((id: string, data: Partial<NewGoal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));
  }, []);

  const removeGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const addLimit = useCallback((data: NewSpendingLimit) => {
    const limit: SpendingLimit = { ...data, id: generateId('lim') };
    setLimits((prev) => [...prev, limit]);
    return limit;
  }, []);

  const updateLimit = useCallback((id: string, data: Partial<NewSpendingLimit>) => {
    setLimits((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
  }, []);

  const removeLimit = useCallback((id: string) => {
    setLimits((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  const limitUsages = useMemo(
    () =>
      limits
        .map((limit) => calculateLimitUsage(limit, transactions, categories))
        .sort((a, b) => b.percentage - a.percentage),
    [limits, transactions, categories]
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      transactions,
      incomes: transactions.filter((t) => t.type === 'income'),
      expenses: transactions.filter((t) => t.type === 'expense'),
      categories,
      goals,
      limits,
      limitUsages,
      limitAlerts: limitUsages.filter((u) => u.status !== 'ok'),
      summary: calculateSummary(transactions),
      addTransaction,
      updateTransaction,
      removeTransaction,
      addGoal,
      updateGoal,
      removeGoal,
      addLimit,
      updateLimit,
      removeLimit,
      getCategoryById,
    }),
    [
      transactions,
      categories,
      goals,
      limits,
      limitUsages,
      addTransaction,
      updateTransaction,
      removeTransaction,
      addGoal,
      updateGoal,
      removeGoal,
      addLimit,
      updateLimit,
      removeLimit,
      getCategoryById,
    ]
  );

  return <FinanceContext value={value}>{children}</FinanceContext>;
}
