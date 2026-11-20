import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

import { categories as initialCategories, expenses, goals as initialGoals, incomes } from '@/data';
import type {
  Category,
  FinanceSummary,
  Goal,
  NewGoal,
  NewTransaction,
  Transaction,
} from '@/types';
import { calculateSummary, generateId } from '@/utils';

export interface FinanceContextValue {
  transactions: Transaction[];
  incomes: Transaction[];
  expenses: Transaction[];
  categories: Category[];
  goals: Goal[];
  summary: FinanceSummary;
  addTransaction: (data: NewTransaction) => Transaction;
  updateTransaction: (id: string, data: Partial<NewTransaction>) => void;
  removeTransaction: (id: string) => void;
  addGoal: (data: NewGoal) => Goal;
  updateGoal: (id: string, data: Partial<NewGoal>) => void;
  removeGoal: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
}

export const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => [
    ...incomes,
    ...expenses,
  ]);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
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

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      transactions,
      incomes: transactions.filter((t) => t.type === 'income'),
      expenses: transactions.filter((t) => t.type === 'expense'),
      categories,
      goals,
      summary: calculateSummary(transactions),
      addTransaction,
      updateTransaction,
      removeTransaction,
      addGoal,
      updateGoal,
      removeGoal,
      getCategoryById,
    }),
    [
      transactions,
      categories,
      goals,
      addTransaction,
      updateTransaction,
      removeTransaction,
      addGoal,
      updateGoal,
      removeGoal,
      getCategoryById,
    ]
  );

  return <FinanceContext value={value}>{children}</FinanceContext>;
}
