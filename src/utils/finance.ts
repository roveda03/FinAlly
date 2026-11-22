import type {
  Category,
  FinanceSummary,
  Goal,
  LimitStatus,
  LimitUsage,
  SpendingLimit,
  Transaction,
} from '@/types';

/** Percentual a partir do qual um limite passa a gerar aviso. */
export const LIMIT_WARNING_THRESHOLD = 80;

export function calculateSummary(transactions: Transaction[]): FinanceSummary {
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.totalIncome += t.amount;
      else acc.totalExpense += t.amount;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 }
  );
  return { ...totals, balance: totals.totalIncome - totals.totalExpense };
}

export function calculateGoalProgress(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

/** Verifica se uma data ISO (AAAA-MM-DD) pertence ao mesmo mês/ano da data de referência. */
export function isSameMonth(isoDate: string, refDate: Date = new Date()): boolean {
  const [year, month] = isoDate.split('-').map(Number);
  return year === refDate.getFullYear() && month === refDate.getMonth() + 1;
}

/** Soma as despesas de uma categoria no mês da data de referência. */
export function getMonthlyExpenseByCategory(
  transactions: Transaction[],
  categoryId: string,
  refDate: Date = new Date()
): number {
  return transactions
    .filter(
      (t) => t.type === 'expense' && t.categoryId === categoryId && isSameMonth(t.date, refDate)
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getLimitStatus(percentage: number): LimitStatus {
  if (percentage > 100) return 'exceeded';
  if (percentage >= LIMIT_WARNING_THRESHOLD) return 'warning';
  return 'ok';
}

export function calculateLimitUsage(
  limit: SpendingLimit,
  transactions: Transaction[],
  categories: Category[],
  refDate: Date = new Date()
): LimitUsage {
  const spent = getMonthlyExpenseByCategory(transactions, limit.categoryId, refDate);
  const percentage = limit.amount > 0 ? (spent / limit.amount) * 100 : 0;
  return {
    limit,
    category: categories.find((c) => c.id === limit.categoryId),
    spent,
    percentage,
    remaining: limit.amount - spent,
    status: getLimitStatus(percentage),
  };
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
