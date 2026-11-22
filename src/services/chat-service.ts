import type { LimitUsage, Transaction } from '@/types';
import { formatCurrency, formatPercentage, isSameMonth, normalizeSearch } from '@/utils';

const SIMULATED_DELAY_MS = 900;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resumo agregado dos dados financeiros enviado ao assistente.
 * Contém apenas totais por categoria — nenhum dado de identificação do usuário (LGPD).
 */
export interface FinanceSnapshot {
  monthIncome: number;
  monthExpense: number;
  /** Despesas do mês agrupadas por categoria, da maior para a menor. */
  expensesByCategory: { name: string; total: number }[];
  /** Limites em alerta (próximos ou ultrapassados). */
  limitAlerts: { name: string; percentage: number; remaining: number }[];
}

export function buildFinanceSnapshot(
  transactions: Transaction[],
  getCategoryName: (id: string) => string,
  limitAlerts: LimitUsage[],
  refDate: Date = new Date()
): FinanceSnapshot {
  const monthTransactions = transactions.filter((t) => isSameMonth(t.date, refDate));
  const totals: Record<string, number> = {};
  let monthIncome = 0;
  let monthExpense = 0;

  for (const t of monthTransactions) {
    if (t.type === 'income') {
      monthIncome += t.amount;
    } else {
      monthExpense += t.amount;
      const name = getCategoryName(t.categoryId);
      totals[name] = (totals[name] ?? 0) + t.amount;
    }
  }

  return {
    monthIncome,
    monthExpense,
    expensesByCategory: Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total),
    limitAlerts: limitAlerts.map((u) => ({
      name: u.category?.name ?? 'Categoria',
      percentage: u.percentage,
      remaining: u.remaining,
    })),
  };
}

// ─── Respostas ───────────────────────────────────────────────────────

function savingTips(): string {
  return [
    'Ótima pergunta! Aqui vão algumas dicas para economizar no dia a dia:',
    '• Evite compras por impulso: espere 24 horas antes de comprar algo não planejado;',
    '• Compare preços antes de comprar;',
    '• Controle seus gastos em categorias não essenciais, como lazer e delivery;',
    '• Revise assinaturas e serviços que você quase não usa.',
    'Você também pode definir um limite de gastos no app para se manter no controle!',
  ].join('\n');
}

function spendingAnalysis(snapshot: FinanceSnapshot): string {
  if (snapshot.monthExpense === 0) {
    return 'Ainda não encontrei despesas registradas neste mês. Cadastre suas movimentações para que eu consiga analisar seus hábitos de consumo.';
  }

  const top = snapshot.expensesByCategory.slice(0, 3);
  const lines = [
    `Analisei suas movimentações deste mês. Você gastou ${formatCurrency(snapshot.monthExpense)} até agora. As categorias com mais gastos foram:`,
    ...top.map(
      (c) =>
        `• ${c.name}: ${formatCurrency(c.total)} (${formatPercentage((c.total / snapshot.monthExpense) * 100)} das despesas);`
    ),
  ];

  const balance = snapshot.monthIncome - snapshot.monthExpense;
  if (snapshot.monthIncome > 0) {
    const savedPct = (balance / snapshot.monthIncome) * 100;
    lines.push(
      balance >= 0
        ? `Suas receitas superam as despesas em ${formatCurrency(balance)} (cerca de ${formatPercentage(savedPct)} da renda). Que tal direcionar parte desse valor para uma meta?`
        : `Atenção: suas despesas superam as receitas em ${formatCurrency(Math.abs(balance))}. Vale revisar os gastos não essenciais.`
    );
  }

  if (snapshot.limitAlerts.length > 0) {
    const alerts = snapshot.limitAlerts
      .map((a) =>
        a.remaining < 0
          ? `${a.name} (ultrapassado em ${formatCurrency(Math.abs(a.remaining))})`
          : `${a.name} (${formatPercentage(a.percentage)} utilizado)`
      )
      .join(', ');
    lines.push(`Fique de olho nos limites: ${alerts}.`);
  }

  return lines.join('\n');
}

function emergencyFund(): string {
  return [
    'A reserva de emergência é um valor guardado para imprevistos, como problemas de saúde, consertos ou perda de renda.',
    '• O ideal é acumular de 3 a 6 meses do seu custo de vida;',
    '• Guarde em aplicações seguras e com resgate rápido;',
    '• Comece com pouco: o importante é criar o hábito.',
    'Você pode criar uma meta "Reserva de Emergência" no app para acompanhar o progresso.',
  ].join('\n');
}

function interestAndCredit(): string {
  return [
    'Juros são o custo de usar dinheiro emprestado (ou o rendimento de quando você empresta, ao investir).',
    '• O rotativo do cartão de crédito tem um dos juros mais altos do mercado: evite pagar só o mínimo da fatura;',
    '• Parcelamentos "sem juros" ainda comprometem a renda dos próximos meses;',
    '• Antes de contratar crédito, compare o Custo Efetivo Total (CET).',
  ].join('\n');
}

function budgetTips(): string {
  return [
    'Uma forma simples de organizar o orçamento é a regra 50/30/20:',
    '• 50% da renda para necessidades (moradia, alimentação, transporte);',
    '• 30% para desejos (lazer, compras);',
    '• 20% para objetivos e reserva.',
    'Os percentuais podem ser ajustados à sua realidade. Use os limites por categoria do app para acompanhar.',
  ].join('\n');
}

function debtTips(): string {
  return [
    'Para sair das dívidas, algumas atitudes ajudam bastante:',
    '• Liste todas as dívidas com valor, juros e prazo;',
    '• Priorize as de juros mais altos, como cartão e cheque especial;',
    '• Tente negociar condições melhores com os credores;',
    '• Evite fazer novas dívidas enquanto quita as atuais.',
  ].join('\n');
}

function goalTips(): string {
  return [
    'Metas tornam a economia mais concreta! Algumas sugestões:',
    '• Defina um valor e um prazo realistas;',
    '• Divida o valor total pelo número de meses para saber quanto guardar por mês;',
    '• Atualize o valor acumulado sempre que guardar dinheiro.',
    'Use o atalho "Criar uma meta" abaixo para cadastrar a sua.',
  ].join('\n');
}

function defaultReply(): string {
  return [
    'Posso ajudar com dúvidas de educação financeira! Experimente perguntar sobre:',
    '• Dicas para economizar;',
    '• Reserva de emergência;',
    '• Juros e cartão de crédito;',
    '• Como organizar o orçamento;',
    '• Análise dos seus gastos.',
  ].join('\n');
}

const RULES: { keywords: string[]; reply: (snapshot: FinanceSnapshot) => string }[] = [
  { keywords: ['analise', 'meus gastos', 'gastando', 'habitos', 'consumo'], reply: spendingAnalysis },
  { keywords: ['reserva', 'emergencia', 'imprevisto'], reply: emergencyFund },
  { keywords: ['juro', 'cartao', 'credito', 'emprestimo', 'parcel'], reply: interestAndCredit },
  { keywords: ['divida', 'devendo', 'endivid'], reply: debtTips },
  { keywords: ['orcamento', '50/30/20', 'organizar', 'planejar'], reply: budgetTips },
  { keywords: ['meta', 'objetivo', 'juntar'], reply: goalTips },
  { keywords: ['econom', 'dica', 'poupar', 'gastar menos'], reply: savingTips },
];

/**
 * Assistente financeiro simulado.
 *
 * Futuramente esta função será substituída por uma chamada HTTPS à API (Laravel),
 * que montará o prompt e consultará o serviço de IA generativa mantendo a chave
 * apenas no servidor (RNF05). A assinatura pode ser mantida para não alterar a UI.
 */
export const chatService = {
  async getAssistantReply(message: string, snapshot: FinanceSnapshot): Promise<string> {
    await wait(SIMULATED_DELAY_MS);
    const text = normalizeSearch(message);
    const rule = RULES.find((r) => r.keywords.some((k) => text.includes(k)));
    return rule ? rule.reply(snapshot) : defaultReply();
  },
};
