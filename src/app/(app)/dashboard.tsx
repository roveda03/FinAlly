import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/cards';
import { Container, Header } from '@/components/common';
import { AppColors, AppFontSize, AppRadius, AppSpacing } from '@/constants';
import { useAuth } from '@/hooks/use-auth';
import { useFinance } from '@/hooks/use-finance';
import { calculateGoalProgress, formatCurrency, formatDate, formatPercentage } from '@/utils';

// ─── Resumo Financeiro ───────────────────────────────────────────────
function SummaryCards() {
  const { summary } = useFinance();
  return (
    <View style={styles.summaryStack}>
      <Card variant="highlight" style={styles.balanceCard}>
        <View style={styles.balanceHeading}>
          <Ionicons name="wallet" size={30} color={AppColors.white} />
          <View style={styles.balanceDivider} />
          <Text style={styles.summaryLabel}>Saldo Atual</Text>
          <Ionicons name="trending-up" size={20} color={AppColors.white} />
        </View>
        <Text style={styles.summaryValueWhite}>{formatCurrency(summary.balance)}</Text>
      </Card>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryTile, styles.incomeTile]}>
          <View style={[styles.summaryTileIcon, { backgroundColor: '#BDEBDD' }]}>
            <Ionicons name="arrow-down" size={18} color={AppColors.income} />
          </View>
          <View style={styles.summaryTileCopy}>
            <Text style={styles.summarySmallLabel}>Receitas</Text>
            <Text style={[styles.summarySmallValue, { color: AppColors.textPrimary }]}>
              {formatCurrency(summary.totalIncome)}
            </Text>
            <Text style={[styles.summaryChange, { color: AppColors.income }]}>↑ +12%</Text>
          </View>
        </View>
        <View style={[styles.summaryTile, styles.expenseTile]}>
          <View style={[styles.summaryTileIcon, { backgroundColor: '#FFD8DA' }]}>
            <Ionicons name="arrow-up" size={18} color={AppColors.expense} />
          </View>
          <View style={styles.summaryTileCopy}>
            <Text style={styles.summarySmallLabel}>Despesas</Text>
            <Text style={[styles.summarySmallValue, { color: AppColors.textPrimary }]}>
              {formatCurrency(summary.totalExpense)}
            </Text>
            <Text style={[styles.summaryChange, { color: AppColors.expense }]}>↑ +8%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Gráfico de despesas por categoria ───────────────────────────────
const CHART_COLORS = ['#087F5B', '#84BD5B', '#F6A12A', '#4E7CF6', '#9B3FC7', '#C3FAE8'];

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
      <View style={styles.chartContainer}>
        <View style={styles.donut}>
          {CHART_COLORS.slice(0, 4).map((color, index) => (
            <View
              key={color}
              style={[
                styles.donutSegment,
                index === 0 && { borderTopColor: color },
                index === 1 && { borderRightColor: color },
                index === 2 && { borderBottomColor: color },
                index === 3 && { borderLeftColor: color },
              ]}
            />
          ))}
          <View style={styles.donutCenter}>
            <Text style={styles.donutAmount}>{formatCurrency(totalExpense)}</Text>
          </View>
        </View>
        <View style={styles.chartLegend}>
          {sorted.slice(0, 5).map((cat, index) => {
            const pct = (cat.total / totalExpense) * 100;
            const color = CHART_COLORS[index % CHART_COLORS.length];
            return (
              <View key={cat.name} style={styles.legendRow}>
                <View style={[styles.chartDot, { backgroundColor: color }]} />
                <Text style={styles.chartCategoryName} numberOfLines={1}>{cat.name}</Text>
                <Text style={styles.chartPct}>{formatPercentage(pct)}</Text>
              </View>
            );
          })}
        </View>
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
          <Pressable style={styles.seeAllButton} onPress={() => router.navigate('/movimentacoes')}>
            <Text style={styles.seeAllText}>Ver todas</Text>
            <Ionicons name="arrow-forward" size={15} color={AppColors.primary} />
          </Pressable>
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
    <Pressable
      onPress={() => router.navigate({ pathname: '/metas', params: { goalId: goal.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Editar meta ${goal.title}`}>
      <Card style={styles.featuredGoal}>
        <View style={styles.goalHeading}>
          <Ionicons name="flag" size={22} color={AppColors.white} />
          <View style={styles.goalHeadingCopy}>
            <Text style={styles.featuredLabel}>Sua próxima meta</Text>
            <Text style={styles.featuredTitle} numberOfLines={1}>{goal.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={AppColors.white} />
        </View>
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
    </Pressable>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, logout, isLoading } = useAuth();

  return (
    <Container scrollable>
      <View style={styles.brandBar}>
        <View style={styles.brandLockup}>
          <Ionicons name="wallet" size={26} color={AppColors.primary} />
          <Text style={styles.brandName}>FinAlly</Text>
        </View>
        <Pressable onPress={() => Alert.alert('Notificações', 'Você está em dia!')} hitSlop={8}>
          <Ionicons name="notifications-outline" size={23} color={AppColors.primaryDark} />
        </Pressable>
      </View>
      <Header
        title={`Olá, ${user?.name?.split(' ')[0] ?? 'Usuário'}!`}
        subtitle="Aqui está um resumo das suas finanças:"
        right={
          <Pressable onPress={logout} disabled={isLoading} hitSlop={8} accessibilityLabel="Sair">
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{user?.name?.slice(0, 2).toUpperCase() ?? 'JV'}</Text>
            </View>
          </Pressable>
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
  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: AppSpacing.xs,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
  },
  brandName: {
    fontSize: AppFontSize.lg,
    fontWeight: '800',
    color: AppColors.primaryDark,
  },
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
  avatarInitials: {
    color: AppColors.white,
    fontSize: AppFontSize.sm,
    fontWeight: '700',
  },

  /* Summary */
  summaryStack: {
    gap: AppSpacing.sm,
  },
  balanceCard: {
    minHeight: 82,
    paddingVertical: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadius.md,
    gap: 2,
  },
  balanceHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  balanceDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
  },
  summaryTile: {
    flex: 1,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: AppSpacing.xs,
    gap: AppSpacing.xs,
    borderRadius: AppRadius.md,
  },
  incomeTile: { backgroundColor: '#E4F5EE' },
  expenseTile: { backgroundColor: '#FCE9E9' },
  summaryTileIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTileCopy: { flex: 1 },
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
    fontSize: AppFontSize.md,
    fontWeight: '700',
  },
  summaryChange: {
    fontSize: AppFontSize.sm - 2,
    fontWeight: '600',
  },

  /* Chart */
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
    minHeight: 108,
  },
  donut: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutSegment: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 14,
    borderColor: 'transparent',
  },
  donutCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutAmount: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  chartLegend: {
    flex: 1,
    gap: AppSpacing.xs,
  },
  legendRow: {
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: AppSpacing.xs,
    paddingTop: AppSpacing.xs,
  },
  seeAllText: {
    color: AppColors.primary,
    fontSize: AppFontSize.sm - 1,
    fontWeight: '600',
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
  featuredGoal: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    borderRadius: AppRadius.md,
    paddingVertical: AppSpacing.sm,
    gap: AppSpacing.xs,
  },
  goalHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  goalHeadingCopy: { flex: 1 },
  featuredLabel: {
    fontSize: AppFontSize.sm - 2,
    color: '#D5F0E4',
  },
  featuredTitle: {
    fontSize: AppFontSize.sm,
    color: AppColors.white,
    fontWeight: '700',
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalAmountLabel: {
    fontSize: AppFontSize.sm,
    color: '#D5F0E4',
  },
  goalPct: {
    fontSize: AppFontSize.sm,
    fontWeight: '700',
    color: AppColors.white,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: AppRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: AppColors.white,
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
