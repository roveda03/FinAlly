import type { Transaction } from '@/types';

export const incomes: Transaction[] = [
  {
    id: 'inc-1',
    description: 'Salário mensal',
    amount: 4500,
    type: 'income',
    categoryId: 'cat-salario',
    date: '2026-11-05',
  },
  {
    id: 'inc-2',
    description: 'Projeto freelance',
    amount: 1200,
    type: 'income',
    categoryId: 'cat-freelance',
    date: '2026-11-12',
  },
  {
    id: 'inc-3',
    description: 'Rendimento CDB',
    amount: 85.4,
    type: 'income',
    categoryId: 'cat-investimentos',
    date: '2026-11-15',
  },
];
