import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { categories as initialCategories, limits as initialLimits } from '@/data';
import { useAuth } from '@/hooks/use-auth';
import { financeService } from '@/services';
import type {
    Category,
    DashboardData,
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Não foi possível carregar os dados financeiros.';
}

export interface FinanceContextValue {
  transactions: Transaction[];
  incomes: Transaction[];
  expenses: Transaction[];
  categories: Category[];
  goals: Goal[];
  limits: SpendingLimit[];
  dashboard: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** Uso de cada limite no mês corrente, do maior para o menor percentual. */
  limitUsages: LimitUsage[];
  /** Limites próximos (>= 80%) ou acima do valor definido. */
  limitAlerts: LimitUsage[];
  summary: FinanceSummary;
  addTransaction: (data: NewTransaction) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<NewTransaction>) => Promise<Transaction>;
  removeTransaction: (id: string) => Promise<void>;
  addGoal: (data: NewGoal) => Promise<Goal>;
  updateGoal: (id: string, data: Partial<NewGoal>) => Promise<Goal>;
  removeGoal: (id: string) => Promise<void>;
  addLimit: (data: NewSpendingLimit) => SpendingLimit;
  updateLimit: (id: string, data: Partial<NewSpendingLimit>) => void;
  removeLimit: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
}

export const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [limits, setLimits] = useState<SpendingLimit[]>(initialLimits);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setDashboard(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [nextTransactions, nextGoals, nextCategories, nextDashboard] = await Promise.all([
        financeService.getTransactions(),
        financeService.getGoals(),
        financeService.getCategories(),
        financeService.getDashboard(),
      ]);
      setTransactions(nextTransactions);
      setGoals(nextGoals);
      setCategories(nextCategories);
      setDashboard(nextDashboard);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  const refreshDashboard = useCallback(async () => {
    try {
      setDashboard(await financeService.getDashboard());
      setError(null);
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    }
  }, []);

  const addTransaction = useCallback(async (data: NewTransaction) => {
    const transaction = await financeService.createTransaction(data);
    setTransactions((prev) => [transaction, ...prev]);
    void refreshDashboard();
    return transaction;
  }, [refreshDashboard]);

  const updateTransaction = useCallback(async (id: string, data: Partial<NewTransaction>) => {
    const transaction = await financeService.updateTransaction(id, data);
    setTransactions((prev) => prev.map((item) => (item.id === id ? transaction : item)));
    void refreshDashboard();
    return transaction;
  }, [refreshDashboard]);

  const removeTransaction = useCallback(async (id: string) => {
    await financeService.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    void refreshDashboard();
  }, [refreshDashboard]);

  const addGoal = useCallback(async (data: NewGoal) => {
    const goal = await financeService.createGoal(data);
    setGoals((prev) => [...prev, goal]);
    return goal;
  }, []);

  const updateGoal = useCallback(async (id: string, data: Partial<NewGoal>) => {
    const goal = await financeService.updateGoal(id, data);
    setGoals((prev) => prev.map((item) => (item.id === id ? goal : item)));
    return goal;
  }, []);

  const removeGoal = useCallback(async (id: string) => {
    await financeService.deleteGoal(id);
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
      dashboard,
      isLoading,
      error,
      reload,
      limitUsages,
      limitAlerts: limitUsages.filter((u) => u.status !== 'ok'),
      summary: dashboard?.summary ?? calculateSummary(transactions),
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
      refreshDashboard,
    }),
    [
      transactions,
      categories,
      goals,
      limits,
      dashboard,
      isLoading,
      error,
      reload,
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
      refreshDashboard,
    ]
  );

  return <FinanceContext value={value}>{children}</FinanceContext>;
}
