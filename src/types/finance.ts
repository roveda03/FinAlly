export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
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

export type NewTransaction = Omit<Transaction, 'id'>;
export type NewGoal = Omit<Goal, 'id'>;

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
