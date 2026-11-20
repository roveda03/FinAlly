import { use } from 'react';

import { FinanceContext } from '@/contexts/FinanceContext';

export function useFinance() {
  const context = use(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser utilizado dentro de um FinanceProvider.');
  }
  return context;
}
