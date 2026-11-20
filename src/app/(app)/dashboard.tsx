import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/cards';
import { Button, Container, Header } from '@/components/common';
import { AppColors, AppFontSize, AppRadius, AppSpacing } from '@/constants';
import { useAuth } from '@/hooks/use-auth';
import { useFinance } from '@/hooks/use-finance';
import { calculateGoalProgress, formatCurrency, formatDate, formatPercentage } from '@/utils';

// ─── Resumo Financeiro ───────────────────────────────────────────────
function SummaryCards() {
  const { summary } = useFinance();
  return (
    <View style={styles.summaryRow}>
      <Card variant="highlight" style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Saldo total</Text>
        <Text style={styles.summaryValueWhite}>{formatCurrency(summary.balance)}</Text>
      </Card>
      <View style={styles.summarySmallColumn}>
        <Card style={styles.summarySmallCard}>
          <Text style={styles.summarySmallLabel}>Receitas</Text>
          <Text style={[styles.summarySmallValue, { color: AppColors.income }]}>
            {formatCurrency(summary.totalIncome)}
          </Text>
        </Card>
        <Card style={styles.summarySmallCard}>
          <Text style={styles.summarySmallLabel}>Despesas</Text>
          <Text style={[styles.summarySmallValue, { color: AppColors.expense }]}>
            {formatCurrency(summary.totalExpense)}
          </Text>
        </Card>
      </View>
    </View>
  );
}

// ─── Gráfico de despesas por categoria ───────────────────────────────
const CHART_COLORS = ['#087F5B', '#0CA678', '#38D9A9', '#63E6BE', '#96F2D7', '#C3FAE8'];

function ExpenseByCategoryChart() {
  const { expenses, getCategoryById } = useFinance();

  const categoryTotals = expenses.reduce<Record<string, { name: string; total: number }>>(
    (acc, t) => {
      const cat = getCategoryById(t.categoryId);
      const name = cat?.name ?? 'Outros';
      if (!acc[name]) acc[name] = { name, total: 0 };
      acc[name].total += t.amount;
      return acc;
    },
    {}
  );

  const sorted = Object.values(categoryTotals).sort((a, b) => b.total - a.total);
  const totalExpense = sorted.reduce((s, c) => s + c.total, 0);
  if (totalExpense === 0) return null;

  return (
    <Card title="Despesas por categoria">
      {/* Simple horizontal bars */}
      <View style={styles.chartContainer}>
        {sorted.map((cat, i) => {
          const pct = (cat.total / totalExpense) * 100;
          const color = CHART_COLORS[i % CHART_COLORS.length];
          return (
            <View key={cat.name} style={styles.chartRow}>
              <View style={styles.chartLabelRow}>
                <View style={[styles.chartDot, { backgroundColor: color }]} />
                <Text style={styles.chartCategoryName} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={styles.chartPct}>{formatPercentage(pct)}</Text>
              </View>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              <Text style={styles.chartValue}>{formatCurrency(cat.total)}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

// ─── Movimentações recentes ──────────────────────────────────────────
function RecentTransactions() {
  const { transactions, getCategoryById } = useFinance();
  const recent = transactions.slice(0, 5);

  return (
    <Card title="Movimentações recentes">
      {recent.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma movimentação registrada.</Text>
      ) : (
        <>
          {recent.map((t) => {
            const cat = getCategoryById(t.categoryId);
            const isIncome = t.type === 'income';
            return (
              <View key={t.id} style={styles.transactionRow}>
                <View
                  style={[
                    styles.transactionIcon,
                    { backgroundColor: isIncome ? AppColors.primaryLight : '#FDECED' },
                  ]}>
                  <Ionicons
                    name={isIncome ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color={isIncome ? AppColors.income : AppColors.expense}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDesc} numberOfLines={1}>
                    {t.description}
                  </Text>
                  <Text style={styles.transactionMeta}>
                    {cat?.name ?? '—'} · {formatDate(t.date)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: isIncome ? AppColors.income : AppColors.expense },
                  ]}>
                  {isIncome ? '+ ' : '- '}
                  {formatCurrency(t.amount)}
                </Text>
              </View>
            );
          })}
          <Button
            title="Ver todas"
            variant="secondary"
            onPress={() => router.navigate('/movimentacoes')}
          />
        </>
      )}
    </Card>
  );
}

// ─── Meta em destaque ────────────────────────────────────────────────
function FeaturedGoal() {
  const { goals } = useFinance();
  if (goals.length === 0) return null;

  // Pick the goal with the highest progress that isn't 100%
  const sorted = [...goals].sort((a, b) => {
    const pa = calculateGoalProgress(a);
    const pb = calculateGoalProgress(b);
    if (pa >= 100 && pb < 100) return 1;
    if (pb >= 100 && pa < 100) return -1;
    return pb - pa;
  });
  const goal = sorted[0];
  const progress = calculateGoalProgress(goal);

  return (
    <Card title="Meta em destaque">
      <Text style={styles.goalTitle}>{goal.title}</Text>
      <View style={styles.goalAmounts}>
        <Text style={styles.goalAmountLabel}>
          {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
        </Text>
        <Text style={styles.goalPct}>{formatPercentage(progress)}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
      </View>
    </Card>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, logout, isLoading } = useAuth();

  return (
    <Container scrollable>
      <Header
        title={`Olá, ${user?.name ?? 'Usuário'}!`}
        subtitle="Veja como estão suas finanças hoje."
        right={
          <View style={styles.headerRight}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={AppColors.white} />
            </View>
            <Pressable onPress={logout} disabled={isLoading} hitSlop={8}>
              <Ionicons name="log-out-outline" size={24} color={AppColors.textSecondary} />
            </Pressable>
          </View>
        }
      />
      <SummaryCards />
      <ExpenseByCategoryChart />
      <RecentTransactions />
      <FeaturedGoal />
    </Container>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  /* Header */
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Summary */
  summaryRow: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
  },
  summaryCard: {
    flex: 1,
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: AppFontSize.sm,
    color: AppColors.primaryLight,
    fontWeight: '500',
  },
  summaryValueWhite: {
    fontSize: AppFontSize.xl,
    fontWeight: '800',
    color: AppColors.white,
  },
  summarySmallColumn: {
    flex: 1,
    gap: AppSpacing.sm,
  },
  summarySmallCard: {
    flex: 1,
    justifyContent: 'center',
  },
  summarySmallLabel: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textSecondary,
  },
  summarySmallValue: {
    fontSize: AppFontSize.lg,
    fontWeight: '700',
  },

  /* Chart */
  chartContainer: {
    gap: AppSpacing.sm,
  },
  chartRow: {
    gap: 4,
  },
  chartLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartCategoryName: {
    flex: 1,
    fontSize: AppFontSize.sm,
    color: AppColors.textPrimary,
  },
  chartPct: {
    fontSize: AppFontSize.sm,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  barBackground: {
    height: 8,
    backgroundColor: AppColors.primaryLight,
    borderRadius: AppRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: AppRadius.full,
  },
  chartValue: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textSecondary,
  },

  /* Transactions */
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingVertical: AppSpacing.xs,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionDesc: {
    fontSize: AppFontSize.md,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  transactionMeta: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textSecondary,
  },
  transactionAmount: {
    fontSize: AppFontSize.md,
    fontWeight: '700',
  },

  /* Goal */
  goalTitle: {
    fontSize: AppFontSize.lg,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalAmountLabel: {
    fontSize: AppFontSize.sm,
    color: AppColors.textSecondary,
  },
  goalPct: {
    fontSize: AppFontSize.sm,
    fontWeight: '700',
    color: AppColors.primary,
  },
  progressBar: {
    height: 10,
    backgroundColor: AppColors.primaryLight,
    borderRadius: AppRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: AppColors.primary,
    borderRadius: AppRadius.full,
  },

  /* Empty */
  emptyText: {
    fontSize: AppFontSize.md,
    color: AppColors.textSecondary,
    textAlign: 'center',
    paddingVertical: AppSpacing.lg,
  },
});
