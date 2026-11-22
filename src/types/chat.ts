export type ChatSender = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  content: string;
  /** Data/hora no formato ISO 8601. */
  createdAt: string;
}
