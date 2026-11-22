import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card } from '@/components/cards';
import { AppTopBar, Button, Header } from '@/components/common';
import { Input } from '@/components/forms';
import { GoalsAndLimitsTabs, SegmentedTabs } from '@/components/navigation';
import { AppColors, AppFontSize, AppRadius, AppSpacing } from '@/constants';
import { useFinance } from '@/hooks/use-finance';
import type { Goal } from '@/types';
import { calculateGoalProgress, formatCurrency, formatDate, formatPercentage } from '@/utils';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Resumo ──────────────────────────────────────────────────────────
// ─── Cartão de meta ──────────────────────────────────────────────────
function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = calculateGoalProgress(goal);
  const iconName = goal.title.toLowerCase().includes('viagem')
    ? 'airplane'
    : goal.title.toLowerCase().includes('reserva')
      ? 'wallet-outline'
      : 'flag-outline';

  return (
    <Card style={styles.goalCard}>
      <View style={styles.goalHero}>
        <View style={styles.goalIconBubble}>
          <Ionicons name={iconName} size={26} color={AppColors.primaryDark} />
        </View>
        <View style={styles.goalTitleArea}>
          <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
          {goal.description ? <Text style={styles.goalDescription} numberOfLines={1}>{goal.description}</Text> : null}
        </View>
        <Pressable
          onPress={() => Alert.alert(goal.title, undefined, [
            { text: 'Editar', onPress: onEdit },
            { text: 'Excluir', style: 'destructive', onPress: onDelete },
            { text: 'Cancelar', style: 'cancel' },
          ])}
          hitSlop={10}
          accessibilityLabel={`Ações para ${goal.title}`}>
          <Ionicons name="ellipsis-vertical" size={20} color={AppColors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.goalMetrics}>
        <View style={styles.goalMetric}>
          <Text style={styles.goalAmountText}>{formatCurrency(goal.targetAmount)}</Text>
          <Text style={styles.goalMetricLabel}>Valor desejado</Text>
        </View>
        <View style={styles.goalMetricDivider} />
        <View style={styles.goalMetric}>
          <Text style={styles.goalAmountText}>{formatCurrency(goal.currentAmount)}</Text>
          <Text style={styles.goalMetricLabel}>Acumulado</Text>
        </View>
      </View>
      <View style={styles.goalProgressRow}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: progress >= 100 ? '#38D9A9' : AppColors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.goalPct}>{formatPercentage(progress)}</Text>
      </View>
      {goal.deadline ? (
        <Text style={styles.goalDeadline}>
          <Ionicons name="calendar-outline" size={15} color={AppColors.primaryDark} />{' '}
          Prazo: {formatDate(goal.deadline)}
        </Text>
      ) : null}
    </Card>
  );
}

// ─── Modal / Formulário ──────────────────────────────────────────────
interface GoalFormData {
  title: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
}

const INITIAL_GOAL_FORM: GoalFormData = {
  title: '',
  description: '',
  targetAmount: '',
  currentAmount: '0',
  deadline: '',
};

function GoalFormModal({
  visible,
  onClose,
  editingGoal,
}: {
  visible: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}) {
  const { addGoal, updateGoal } = useFinance();
  const [form, setForm] = useState<GoalFormData>(() => {
    if (editingGoal) {
      return {
        title: editingGoal.title,
        description: editingGoal.description ?? '',
        targetAmount: editingGoal.targetAmount.toString().replace('.', ','),
        currentAmount: editingGoal.currentAmount.toString().replace('.', ','),
        deadline: editingGoal.deadline ?? '',
      };
    }
    return { ...INITIAL_GOAL_FORM };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof GoalFormData, string>>>({});

  function validate(): boolean {
    const e: Partial<Record<keyof GoalFormData, string>> = {};
    if (!form.title.trim()) e.title = 'Nome da meta é obrigatório.';
    const target = parseFloat(form.targetAmount.replace(',', '.'));
    if (!form.targetAmount.trim() || isNaN(target) || target <= 0)
      e.targetAmount = 'Informe um valor desejado válido.';
    const current = parseFloat(form.currentAmount.replace(',', '.'));
    if (isNaN(current) || current < 0) e.currentAmount = 'Valor acumulado inválido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      targetAmount: parseFloat(form.targetAmount.replace(',', '.')),
      currentAmount: parseFloat(form.currentAmount.replace(',', '.')),
      deadline: form.deadline.trim() || undefined,
    };
    if (editingGoal) {
      updateGoal(editingGoal.id, data);
    } else {
      addGoal(data);
    }
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboard}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGoal ? 'Editar meta' : 'Nova meta'}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Fechar edição da meta">
                <Ionicons name="close" size={24} color={AppColors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalForm}>
              <Input
                label="Nome da meta"
                placeholder="Ex: Viagem, Notebook..."
                value={form.title}
                onChangeText={(t) => {
                  setForm((p) => ({ ...p, title: t }));
                  if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                }}
                error={errors.title}
              />
              <Input
                label="Descrição (opcional)"
                placeholder="Detalhes sobre a meta"
                value={form.description}
                onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
                multiline
              />
              <Input
                label="Valor desejado (R$)"
                placeholder="0,00"
                value={form.targetAmount}
                onChangeText={(t) => {
                  setForm((p) => ({ ...p, targetAmount: t }));
                  if (errors.targetAmount) setErrors((p) => ({ ...p, targetAmount: undefined }));
                }}
                error={errors.targetAmount}
                keyboardType="decimal-pad"
              />
              <Input
                label="Valor acumulado (R$)"
                placeholder="0,00"
                value={form.currentAmount}
                onChangeText={(t) => {
                  setForm((p) => ({ ...p, currentAmount: t }));
                  if (errors.currentAmount)
                    setErrors((p) => ({ ...p, currentAmount: undefined }));
                }}
                error={errors.currentAmount}
                keyboardType="decimal-pad"
              />
              <Input
                label="Prazo (opcional, AAAA-MM-DD)"
                placeholder="2027-06-30"
                value={form.deadline}
                onChangeText={(t) => setForm((p) => ({ ...p, deadline: t }))}
              />
              <Button title="Salvar" onPress={handleSave} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────
export default function MetasScreen() {
  const { goals, removeGoal } = useFinance();
  const { goalId, novaMeta } = useLocalSearchParams<{ goalId?: string; novaMeta?: string }>();
  const routeGoal = goals.find((goal) => goal.id === goalId);
  const routeNewGoal = novaMeta === '1';
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleEdit = useCallback((g: Goal) => {
    setEditingGoal(g);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback(
    (g: Goal) => {
      Alert.alert('Excluir meta', `Deseja excluir "${g.title}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => removeGoal(g.id),
        },
      ]);
    },
    [removeGoal]
  );

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingGoal(null);
    router.setParams({ goalId: undefined, novaMeta: undefined });
  }, []);

  const handleOpenNew = useCallback(() => {
    setEditingGoal(null);
    setModalVisible(true);
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.headerPadding}>
        <AppTopBar />
        <Header title="Minhas Metas" subtitle="Defina objetivos e acompanhe seu progresso!" />
        <SegmentedTabs tabs={GoalsAndLimitsTabs} active="Metas" />
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GoalCard goal={item} onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item)} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma meta cadastrada.</Text>}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <View style={styles.footer}>
        <Pressable style={styles.newGoalButton} onPress={handleOpenNew}>
          <Ionicons name="add" size={21} color={AppColors.white} />
          <Text style={styles.newGoalText}>Nova Meta</Text>
        </Pressable>
        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={27} color={AppColors.primaryDark} />
          <View style={styles.tipCopy}>
            <Text style={styles.tipTitle}>Dica do FinAlly</Text>
            <Text style={styles.tipText}>Pequenas economias hoje, grandes conquistas amanhã!</Text>
          </View>
        </View>
      </View>

      {(modalVisible || routeGoal || routeNewGoal) && (
        <GoalFormModal
          visible={modalVisible || Boolean(routeGoal) || routeNewGoal}
          onClose={handleCloseModal}
          editingGoal={routeGoal ?? editingGoal}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  headerPadding: {
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.sm,
  },
  summaryPadding: {
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.sm,
  },

  /* Summary */
  summaryRow: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
  },
  summaryItem: {
    flex: 1,
    padding: AppSpacing.sm,
    borderRadius: AppRadius.md,
    gap: 2,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  summaryItemLabel: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textSecondary,
  },
  summaryItemValue: {
    fontSize: AppFontSize.md,
    fontWeight: '700',
  },

  /* List */
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.sm,
    gap: AppSpacing.sm,
  },

  /* Goal card */
  goalCard: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
    borderRadius: AppRadius.md,
  },
  goalHero: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: AppSpacing.sm,
    backgroundColor: AppColors.primaryDark,
  },
  goalIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#BDEBDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitleArea: {
    flex: 1,
    gap: 2,
  },
  goalTitle: {
    fontSize: AppFontSize.lg,
    fontWeight: '700',
    color: AppColors.white,
  },
  goalDescription: {
    fontSize: AppFontSize.sm,
    color: '#D5F0E4',
    lineHeight: 16,
  },
  goalActions: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
    alignItems: 'flex-start',
  },
  goalMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
  goalMetric: {
    flex: 1,
    gap: 2,
  },
  goalMetricDivider: {
    width: 1,
    height: 36,
    backgroundColor: AppColors.border,
    marginHorizontal: AppSpacing.sm,
  },
  goalMetricLabel: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textSecondary,
  },
  goalAmountText: {
    fontSize: AppFontSize.md,
    color: AppColors.textPrimary,
    fontWeight: '700',
  },
  goalPct: {
    fontSize: AppFontSize.sm,
    fontWeight: '700',
    color: AppColors.primary,
  },
  progressBar: {
    flex: 1,
    height: 9,
    backgroundColor: AppColors.primaryLight,
    borderRadius: AppRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 9,
    borderRadius: AppRadius.full,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
  goalDeadline: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textPrimary,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.xs,
    paddingBottom: AppSpacing.sm,
  },

  footer: {
    gap: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.sm,
  },
  newGoalButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.xs,
    backgroundColor: AppColors.primaryDark,
    borderRadius: AppRadius.full,
  },
  newGoalText: {
    fontSize: AppFontSize.md,
    color: AppColors.white,
    fontWeight: '700',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    backgroundColor: '#E1F2EC',
    minHeight: 58,
    paddingVertical: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadius.md,
  },
  tipCopy: { flex: 1 },
  tipTitle: {
    fontSize: AppFontSize.sm,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  tipText: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textPrimary,
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

  /* Empty */
  emptyText: {
    fontSize: AppFontSize.md,
    color: AppColors.textSecondary,
    textAlign: 'center',
    paddingVertical: AppSpacing.xl,
  },
});
