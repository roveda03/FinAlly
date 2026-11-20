import type { Transaction } from '@/types';

export const expenses: Transaction[] = [
  {
    id: 'exp-1',
    description: 'Aluguel',
    amount: 1500,
    type: 'expense',
    categoryId: 'cat-moradia',
    date: '2026-11-06',
  },
  {
    id: 'exp-2',
    description: 'Supermercado',
    amount: 620.75,
    type: 'expense',
    categoryId: 'cat-alimentacao',
    date: '2026-11-08',
  },
  {
    id: 'exp-3',
    description: 'Combustível',
    amount: 250,
    type: 'expense',
    categoryId: 'cat-transporte',
    date: '2026-11-10',
  },
  {
    id: 'exp-4',
    description: 'Cinema',
    amount: 60,
    type: 'expense',
    categoryId: 'cat-lazer',
    date: '2026-11-14',
  },
  {
    id: 'exp-5',
    description: 'Curso online',
    amount: 149.9,
    type: 'expense',
    categoryId: 'cat-educacao',
    date: '2026-11-16',
  },
];
