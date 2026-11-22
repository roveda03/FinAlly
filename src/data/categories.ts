import type { Category } from '@/types';

export const categories: Category[] = [
  { id: 'cat-salario', name: 'Salário', type: 'income', icon: 'cash' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', icon: 'laptop' },
  { id: 'cat-investimentos', name: 'Investimentos', type: 'income', icon: 'trending-up' },
  { id: 'cat-alimentacao', name: 'Alimentação', type: 'expense', icon: 'restaurant' },
  { id: 'cat-moradia', name: 'Moradia', type: 'expense', icon: 'home' },
  { id: 'cat-transporte', name: 'Transporte', type: 'expense', icon: 'car' },
  { id: 'cat-lazer', name: 'Lazer', type: 'expense', icon: 'game-controller' },
  { id: 'cat-saude', name: 'Saúde', type: 'expense', icon: 'medkit' },
  { id: 'cat-educacao', name: 'Educação', type: 'expense', icon: 'school' },
];
