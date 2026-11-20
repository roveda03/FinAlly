import type { Category } from '@/types';

export const categories: Category[] = [
  { id: 'cat-salario', name: 'Salário', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income' },
  { id: 'cat-investimentos', name: 'Investimentos', type: 'income' },
  { id: 'cat-alimentacao', name: 'Alimentação', type: 'expense' },
  { id: 'cat-moradia', name: 'Moradia', type: 'expense' },
  { id: 'cat-transporte', name: 'Transporte', type: 'expense' },
  { id: 'cat-lazer', name: 'Lazer', type: 'expense' },
  { id: 'cat-saude', name: 'Saúde', type: 'expense' },
  { id: 'cat-educacao', name: 'Educação', type: 'expense' },
];
