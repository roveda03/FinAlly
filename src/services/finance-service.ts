import type {
    Category,
    DashboardData,
    Goal,
    NewGoal,
    NewTransaction,
    Transaction,
} from '@/types';

import { apiRequest } from './api-client';

export const financeService = {
  getDashboard: () => apiRequest<DashboardData>('/dashboard/'),
  getCategories: () => apiRequest<Category[]>('/categories/'),
  getTransactions: () => apiRequest<Transaction[]>('/transactions/'),
  createTransaction: (data: NewTransaction) =>
    apiRequest<Transaction>('/transactions/', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: Partial<NewTransaction>) =>
    apiRequest<Transaction>(`/transactions/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) =>
    apiRequest<void>(`/transactions/${id}/`, { method: 'DELETE' }),
  getGoals: () => apiRequest<Goal[]>('/goals/'),
  createGoal: (data: NewGoal) =>
    apiRequest<Goal>('/goals/', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id: string, data: Partial<NewGoal>) =>
    apiRequest<Goal>(`/goals/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteGoal: (id: string) => apiRequest<void>(`/goals/${id}/`, { method: 'DELETE' }),
};