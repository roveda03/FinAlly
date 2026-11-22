const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/** Converte uma data local em string ISO (AAAA-MM-DD) sem efeito de fuso horário. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Título de agrupamento por data, como no protótipo:
 * "Hoje, 22 de Novembro de 2026", "Ontem, 21 de Novembro de 2026" ou "03 de Novembro de 2026".
 */
export function formatDateHeading(isoDate: string, today: Date = new Date()): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  const monthName = MONTH_NAMES[Number(month) - 1];
  if (!year || !monthName || !day) return isoDate;
  const label = `${day} de ${monthName} de ${year}`;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isoDate.slice(0, 10) === toIsoDate(today)) return `Hoje, ${label}`;
  if (isoDate.slice(0, 10) === toIsoDate(yesterday)) return `Ontem, ${label}`;
  return label;
}

/** Hora no formato HH:mm a partir de uma data ISO completa. */
export function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Converte valores digitados como "1.000,50" ou "1000.5" em número. Retorna NaN se inválido. */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[R$\s]/g, '');
  if (!cleaned) return NaN;
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  return Number(normalized);
}

/** Normaliza texto para buscas: minúsculas e sem acentos. */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
