import { use } from 'react';

import { ChatContext } from '@/contexts/ChatContext';

export function useChat() {
  const context = use(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser utilizado dentro de um ChatProvider.');
  }
  return context;
}
