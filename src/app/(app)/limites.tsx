import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/cards';
import { ProgressRing } from '@/components/charts';
import { AppTopBar, Button, Header } from '@/components/common';
import { Input } from '@/components/forms';
import { GoalsAndLimitsTabs, SegmentedTabs } from '@/components/navigation';
import { AppColors, AppFontSize, AppRadius, AppSpacing } from '@/constants';
import { useFinance } from '@/hooks/use-finance';
import type { LimitStatus, LimitUsage, SpendingLimit } from '@/types';
import { formatCurrency, formatPercentage, parseCurrencyInput } from '@/utils';

const STATUS_COLORS: Record<LimitStatus, string> = {
  ok: AppColors.primaryDark,
  warning: '#E08A00',
  exceeded: AppColors.expense,
};

// ─── Card em destaque ────────────────────────────────────────────────
function FeaturedLimit({ usage, onEdit }: { usage: LimitUsage; onEdit: () => void }) {
  const name = usage.category?.name ?? 'Categoria';
  return (
    <Card style={styles.featuredCard}>
      <View style={styles.featuredHero}>
        <View style={styles.featuredIconBubble}>
          <Ionicons
            name={usage.category?.icon ?? 'pricetag'}
            size={26}
            color={AppColors.primaryDark}
          />
        </View>
        <View style={styles.featuredTitleArea}>
          <Text style={styles.featuredTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.featuredSubtitle}>Limite mensal</Text>
        </View>
        <Pressable
          onPress={onEdit}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Editar limite de ${name}`}>
          <Ionicons name="pencil" size={21} color={AppColors.white} />
        </Pressable>
      </View>
      <View style={styles.featuredBody}>
        <ProgressRing percentage={usage.percentage} color={STATUS_COLORS[usage.status]} />
        <View style={styles.featuredDivider} />
        <View style={styles.featuredMetrics}>
          <View>
            <Text style={styles.metricValue}>{formatCurrency(usage.limit.amount)}</Text>
            <Text style={styles.metricLabel}>Limite definido</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>{formatCurrency(usage.spent)}</Text>
            <Text style={styles.metricLabel}>Já utilizado</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

// ─── Aviso de proximidade ────────────────────────────────────────────
function LimitWarning({ usage }: { usage: LimitUsage }) {
  if (usage.status === 'ok') return null;
  const exceeded = usage.status === 'exceeded';
  return (
    <View
      style={[styles.warningBox, exceeded && styles.warningBoxExceeded]}
      accessibilityRole="alert">
      <Ionicons
        name="warning"
        size={40}
        color={exceeded ? AppColors.expense : AppColors.primaryDark}
      />
      <View style={styles.warningCopy}>
        <Text style={[styles.warningTitle, exceeded && { color: AppColors.expense }]}>
          {exceeded ? 'Limite ultrapassado!' : 'Você está próximo do limite!'}
        </Text>
        <Text style={styles.warningText}>
          {exceeded
            ? `Você ultrapassou o limite em ${formatCurrency(Math.abs(usage.remaining))} neste mês.`
            : `Restam apenas ${formatCurrency(usage.remaining)} para atingir seu limite de gastos.`}
        </Text>
      </View>
    </View>
  );
}

// ─── Linha da lista ──────────────────────────────────────────────────
function LimitRow({
  usage,
  selected,
  onPress,
}: {
  usage: LimitUsage;
  selected: boolean;
  onPress: () => void;
}) {
  const name = usage.category?.name ?? 'Categoria';
  const color = STATUS_COLORS[usage.status];
  return (
    <Pressable
      style={[styles.limitRow, selected && styles.limitRowSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}: ${formatPercentage(usage.percentage)} do limite utilizado`}>
      <View style={styles.limitIcon}>
        <Ionicons name={usage.category?.icon ?? 'pricetag'} size={21} color={AppColors.primaryDark} />
      </View>
      <View style={styles.limitInfo}>
        <View style={styles.limitInfoTop}>
          <Text style={styles.limitName} numberOfLines={1}>{name}</Text>
          <Text style={styles.limitValues}>
            {formatCurrency(usage.spent)} / {formatCurrency(usage.limit.amount)}
          </Text>
        </View>
        <View style={styles.limitInfoBottom}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(usage.percentage, 100)}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={[styles.limitPct, { color }]}>{formatPercentage(usage.percentage)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={AppColors.primaryDark} />
    </Pressable>
  );
}

// ─── Modal / Formulário ──────────────────────────────────────────────
function LimitFormModal({
  editingLimit,
  onClose,
}: {
  editingLimit: SpendingLimit | null;
  onClose: () => void;
}) {
  const { categories, limits, addLimit, updateLimit, removeLimit, getCategoryById } = useFinance();
  const [categoryId, setCategoryId] = useState(editingLimit?.categoryId ?? '');
  const [amount, setAmount] = useState(
    editingLimit ? editingLimit.amount.toFixed(2).replace('.', ',') : ''
  );
  const [errors, setErrors] = useState<{ categoryId?: string; amount?: string }>({});

  // Categorias de despesa que ainda não possuem limite (ou a do limite em edição).
  const availableCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.type === 'expense' &&
          (c.id === editingLimit?.categoryId || !limits.some((l) => l.categoryId === c.id))
      ),
    [categories, limits, editingLimit]
  );

  function handleSave() {
    const value = parseCurrencyInput(amount);
    const nextErrors: typeof errors = {};
    if (!categoryId) nextErrors.categoryId = 'Selecione uma categoria.';
    if (Number.isNaN(value) || value <= 0) nextErrors.amount = 'Informe um valor válido.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (editingLimit) {
      updateLimit(editingLimit.id, { categoryId, amount: value });
    } else {
      addLimit({ categoryId, amount: value });
    }
    onClose();
  }

  function handleDelete() {
    if (!editingLimit) return;
    const name = getCategoryById(editingLimit.categoryId)?.name ?? 'esta categoria';
    Alert.alert('Excluir limite', `Deseja excluir o limite de ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          removeLimit(editingLimit.id);
          onClose();
        },
      },
    ]);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboard}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLimit ? 'Editar limite' : 'Definir novo limite'}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Fechar">
                <Ionicons name="close" size={24} color={AppColors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalForm}>
              <View style={styles.categorySection}>
                <Text style={styles.fieldLabel}>Categoria</Text>
                {availableCategories.length === 0 ? (
                  <Text style={styles.helperText}>
                    Todas as categorias de despesa já possuem limite.
                  </Text>
                ) : (
                  <View style={styles.categoryGrid}>
                    {availableCategories.map((cat) => {
                      const active = categoryId === cat.id;
                      return (
                        <Pressable
                          key={cat.id}
                          style={[styles.categoryChip, active && styles.categoryChipActive]}
                          onPress={() => {
                            setCategoryId(cat.id);
                            setErrors((p) => ({ ...p, categoryId: undefined }));
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active }}>
                          <Ionicons
                            name={cat.icon}
                            size={15}
                            color={active ? AppColors.white : AppColors.primaryDark}
                          />
                          <Text
                            style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                {errors.categoryId ? <Text style={styles.errorText}>{errors.categoryId}</Text> : null}
              </View>

              <Input
                label="Limite mensal (R$)"
                placeholder="Ex: 700,00"
                value={amount}
                onChangeText={(t) => {
                  setAmount(t);
                  if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
                }}
                error={errors.amount}
                keyboardType="decimal-pad"
              />

              <Button title="Salvar limite" onPress={handleSave} />
              {editingLimit ? (
                <Button title="Excluir limite" variant="danger" onPress={handleDelete} />
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────
export default function LimitesScreen() {
  const { limitUsages } = useFinance();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLimit, setEditingLimit] = useState<SpendingLimit | null>(null);

  const featured =
    limitUsages.find((u) => u.limit.id === selectedId) ?? limitUsages[0] ?? null;

  const openNew = useCallback(() => {
    setEditingLimit(null);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((limit: SpendingLimit) => {
    setEditingLimit(limit);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingLimit(null);
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <AppTopBar />
        <Header
          title="Limites de Gastos"
          subtitle="Controle seus gastos e evite surpresas no fim do mês!"
        />
        <SegmentedTabs tabs={GoalsAndLimitsTabs} active="Limites" />

        {featured ? (
          <>
            <FeaturedLimit usage={featured} onEdit={() => openEdit(featured.limit)} />
            <LimitWarning usage={featured} />

            <Text style={styles.sectionTitle}>Seus limites por categoria</Text>
            <View style={styles.limitList}>
              {limitUsages.map((usage) => (
                <LimitRow
                  key={usage.limit.id}
                  usage={usage}
                  selected={usage.limit.id === featured.limit.id}
                  onPress={() => setSelectedId(usage.limit.id)}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="speedometer-outline" size={56} color={AppColors.primary} />
            <Text style={styles.emptyTitle}>Nenhum limite definido</Text>
            <Text style={styles.emptyText}>
              Defina limites mensais por categoria e receba avisos antes de ultrapassar seu
              orçamento.
            </Text>
          </View>
        )}

        <Pressable
          style={styles.newLimitButton}
          onPress={openNew}
          accessibilityRole="button">
          <Ionicons name="add" size={21} color={AppColors.white} />
          <Text style={styles.newLimitText}>Definir Novo Limite</Text>
        </Pressable>
      </ScrollView>

      {modalVisible ? <LimitFormModal editingLimit={editingLimit} onClose={closeModal} /> : null}
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.lg,
    gap: AppSpacing.md,
  },

  /* Featured */
  featuredCard: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
    borderRadius: AppRadius.md,
  },
  featuredHero: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    padding: AppSpacing.sm,
    paddingRight: AppSpacing.md,
    backgroundColor: AppColors.primaryDark,
  },
  featuredIconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitleArea: { flex: 1, gap: 2 },
  featuredTitle: {
    fontSize: AppFontSize.lg,
    fontWeight: '700',
    color: AppColors.white,
  },
  featuredSubtitle: {
    fontSize: AppFontSize.sm,
    color: '#D5F0E4',
  },
  featuredBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppSpacing.md,
    gap: AppSpacing.md,
  },
  featuredDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: AppColors.border,
  },
  featuredMetrics: {
    flex: 1,
    gap: AppSpacing.md,
  },
  metricValue: {
    fontSize: AppFontSize.xl,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  metricLabel: {
    fontSize: AppFontSize.sm,
    color: AppColors.textSecondary,
  },

  /* Warning */
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
    padding: AppSpacing.md,
    borderRadius: AppRadius.md,
    backgroundColor: '#DDF0E7',
  },
  warningBoxExceeded: {
    backgroundColor: '#FCE9E9',
  },
  warningCopy: { flex: 1, gap: 2 },
  warningTitle: {
    fontSize: AppFontSize.md,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  warningText: {
    fontSize: AppFontSize.sm,
    lineHeight: 18,
    color: AppColors.textPrimary,
  },

  /* List */
  sectionTitle: {
    fontSize: AppFontSize.lg,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  limitList: {
    gap: AppSpacing.sm,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    padding: AppSpacing.sm,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  limitRowSelected: {
    borderColor: AppColors.primary,
  },
  limitIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitInfo: { flex: 1, gap: AppSpacing.xs },
  limitInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  limitName: {
    flexShrink: 1,
    fontSize: AppFontSize.md,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  limitValues: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textSecondary,
  },
  limitInfoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: AppColors.primaryLight,
    borderRadius: AppRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: AppRadius.full,
  },
  limitPct: {
    minWidth: 38,
    textAlign: 'right',
    fontSize: AppFontSize.sm,
    fontWeight: '700',
  },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingVertical: AppSpacing.xl,
    paddingHorizontal: AppSpacing.lg,
  },
  emptyTitle: {
    fontSize: AppFontSize.lg,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  emptyText: {
    fontSize: AppFontSize.md,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },

  /* New limit */
  newLimitButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.xs,
    backgroundColor: AppColors.primaryDark,
    borderRadius: AppRadius.full,
  },
  newLimitText: {
    fontSize: AppFontSize.md,
    color: AppColors.white,
    fontWeight: '700',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: AppRadius.lg,
    borderTopRightRadius: AppRadius.lg,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : AppSpacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: AppSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  modalTitle: {
    fontSize: AppFontSize.lg,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  modalForm: {
    padding: AppSpacing.md,
    gap: AppSpacing.md,
  },
  categorySection: { gap: AppSpacing.xs },
  fieldLabel: {
    fontSize: AppFontSize.sm,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  helperText: {
    fontSize: AppFontSize.sm,
    color: AppColors.textSecondary,
  },
  errorText: {
    fontSize: AppFontSize.sm,
    color: AppColors.expense,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
    paddingVertical: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadius.full,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  categoryChipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  categoryChipText: {
    fontSize: AppFontSize.sm,
    color: AppColors.textPrimary,
  },
  categoryChipTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },
});
