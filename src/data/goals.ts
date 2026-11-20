import type { Goal } from '@/types';

export const goals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Reserva de emergência',
    description: 'Manter uma reserva para imprevistos e segurança financeira.',
    targetAmount: 10000,
    currentAmount: 3500,
    deadline: '2027-06-30',
  },
  {
    id: 'goal-2',
    title: 'Viagem de férias',
    description: 'Viagem para a praia no verão com a família.',
    targetAmount: 5000,
    currentAmount: 1800,
    deadline: '2027-01-15',
  },
  {
    id: 'goal-3',
    title: 'Notebook novo',
    description: 'Comprar um notebook para trabalho e estudos.',
    targetAmount: 4500,
    currentAmount: 4000,
  },
];
