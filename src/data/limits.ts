import type { SpendingLimit } from '@/types';

export const limits: SpendingLimit[] = [
  { id: 'lim-alimentacao', categoryId: 'cat-alimentacao', amount: 700 },
  { id: 'lim-moradia', categoryId: 'cat-moradia', amount: 1800 },
  { id: 'lim-transporte', categoryId: 'cat-transporte', amount: 500 },
  { id: 'lim-lazer', categoryId: 'cat-lazer', amount: 300 },
];
