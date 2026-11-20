import { Ionicons } from '@expo/vector-icons';
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
import { Button, Header } from '@/components/common';
import { Input } from '@/components/forms';
import { AppColors, AppFontSize, AppRadius, AppSpacing, BottomNavigationHeight } from '@/constants';
import { useFinance } from '@/hooks/use-finance';
import type { Goal } from '@/types';
import { calculateGoalProgress, formatCurrency, formatDate, formatPercentage } from '@/utils';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Resumo ──────────────────────────────────────────────────────────
function GoalsSummary() {
  const { goals } = useFinance();
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryItem, { backgroundColor: AppColors.primaryLight }]}>
        <Text style={styles.summaryItemLabel}>Metas</Text>
        <Text style={[styles.summaryItemValue, { color: AppColors.primary }]}>{goals.length}</Text>
      </View>
      <View style={[styles.summaryItem, { backgroundColor: AppColors.white }]}>
        <Text style={styles.summaryItemLabel}>Desejado</Text>
        <Text style={[styles.summaryItemValue, { color: AppColors.textPrimary }]}>
          {formatCurrency(totalTarget)}
        </Text>
      </View>
      <View style={[styles.summaryItem, { backgroundColor: AppColors.white }]}>
        <Text style={styles.summaryItemLabel}>Acumulado</Text>
        <Text style={[styles.summaryItemValue, { color: AppColors.income }]}>
          {formatCurrency(totalCurrent)}
        </Text>
      </View>
    </View>
  );
}

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
  return (
    <Card style={styles.goalCard}>
      <View style={styles.goalHeaderRow}>
        <View style={styles.goalTitleArea}>
          <Text style={styles.goalTitle} numberOfLines={1}>
            {goal.title}
          </Text>
          {goal.description ? (
            <Text style={styles.goalDescription} numberOfLines={2}>
              {goal.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.goalActions}>
          <Pressable onPress={onEdit} hitSlop={8}>
            <Ionicons name="create-outline" size={20} color={AppColors.textSecondary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={AppColors.expense} />
          </Pressable>
        </View>
      </View>
      <View style={styles.goalAmounts}>
        <Text style={styles.goalAmountText}>
          {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
        </Text>
        <Text style={styles.goalPct}>{formatPercentage(progress)}</Text>
      </View>
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
      {goal.deadline ? (
        <Text style={styles.goalDeadline}>
          <Ionicons name="calendar-outline" size={12} color={AppColors.textSecondary} /> Prazo:{' '}
          {formatDate(goal.deadline)}
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
              <Pressable onPress={onClose} hitSlop={12}>
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
  }, []);

  const handleOpenNew = useCallback(() => {
    setEditingGoal(null);
    setModalVisible(true);
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.headerPadding}>
        <Header title="Minhas Metas" subtitle="Transforme seus planos em conquistas." />
      </View>
      <View style={styles.summaryPadding}>
        <GoalsSummary />
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

      {/* Botão Nova Meta */}
      <Pressable style={styles.fab} onPress={handleOpenNew}>
        <Ionicons name="add" size={22} color={AppColors.white} />
        <Text style={styles.fabText}>Nova Meta</Text>
      </Pressable>

      {modalVisible && (
        <GoalFormModal
          visible={modalVisible}
          onClose={handleCloseModal}
          editingGoal={editingGoal}
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
    paddingBottom: BottomNavigationHeight + 80,
    gap: AppSpacing.sm,
  },

  /* Goal card */
  goalCard: {
    gap: AppSpacing.sm,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: AppSpacing.sm,
  },
  goalTitleArea: {
    flex: 1,
    gap: 2,
  },
  goalTitle: {
    fontSize: AppFontSize.lg,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  goalDescription: {
    fontSize: AppFontSize.sm,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  goalActions: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
    alignItems: 'flex-start',
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalAmountText: {
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
    borderRadius: AppRadius.full,
  },
  goalDeadline: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textSecondary,
  },

  /* FAB */
  fab: {
    position: 'absolute',
    right: AppSpacing.md,
    bottom: AppSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
    backgroundColor: AppColors.primary,
    paddingVertical: AppSpacing.sm + 4,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadius.full,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  fabText: {
    fontSize: AppFontSize.md,
    fontWeight: '700',
    color: AppColors.white,
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
