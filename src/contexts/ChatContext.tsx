import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useFinance } from '@/hooks/use-finance';
import { buildFinanceSnapshot, chatService } from '@/services';
import type { ChatMessage, ChatSender } from '@/types';
import { generateId } from '@/utils';

const GREETING = 'Olá! Eu sou o FinAlly, seu assistente financeiro com IA. Como posso ajudar você hoje?';

const ERROR_REPLY =
  'Não consegui responder agora. Verifique sua conexão e tente novamente em instantes.';

function createMessage(sender: ChatSender, content: string): ChatMessage {
  return { id: generateId('msg'), sender, content, createdAt: new Date().toISOString() };
}

export interface ChatContextValue {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => void;
}

export const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { transactions, getCategoryById, limitAlerts } = useFinance();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createMessage('assistant', GREETING),
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Mantém os dados financeiros mais recentes sem recriar sendMessage a cada mudança.
  const financeRef = useRef({ transactions, getCategoryById, limitAlerts });
  useEffect(() => {
    financeRef.current = { transactions, getCategoryById, limitAlerts };
  }, [transactions, getCategoryById, limitAlerts]);

  const sendMessage = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content) return;

    setMessages((prev) => [...prev, createMessage('user', content)]);
    setIsTyping(true);
    try {
      const finance = financeRef.current;
      const snapshot = buildFinanceSnapshot(
        finance.transactions,
        (id) => finance.getCategoryById(id)?.name ?? 'Outros',
        finance.limitAlerts
      );
      const reply = await chatService.getAssistantReply(content, snapshot);
      setMessages((prev) => [...prev, createMessage('assistant', reply)]);
    } catch {
      setMessages((prev) => [...prev, createMessage('assistant', ERROR_REPLY)]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([createMessage('assistant', GREETING)]);
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({ messages, isTyping, sendMessage, clearHistory }),
    [messages, isTyping, sendMessage, clearHistory]
  );

  return <ChatContext value={value}>{children}</ChatContext>;
}
