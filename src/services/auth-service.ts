import { demoPassword, demoUser } from '@/data';
import type { LoginCredentials, User } from '@/types';

const SIMULATED_DELAY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Autenticação simulada em memória. Pode ser substituída futuramente
 * por uma integração real sem alterar o AuthContext.
 */
export const authService = {
  async login({ email, password }: LoginCredentials): Promise<User> {
    await wait(SIMULATED_DELAY_MS);
    const isValid =
      email.trim().toLowerCase() === demoUser.email && password === demoPassword;
    if (!isValid) {
      throw new Error('E-mail ou senha inválidos.');
    }
    return demoUser;
  },

  async logout(): Promise<void> {
    await wait(SIMULATED_DELAY_MS / 2);
  },
};
