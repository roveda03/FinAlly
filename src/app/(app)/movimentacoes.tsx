import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
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

import { Button, Container, Header } from '@/components/common';
import { Input } from '@/components/forms';
import { AppColors, AppFontSize, AppRadius, AppSpacing, BottomNavigationHeight } from '@/constants';
import { useFinance } from '@/hooks/use-finance';
import type { Transaction, TransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/utils';

type FilterType = 'all' | 'income' | 'expense';

// ─── Resumo ──────────────────────────────────────────────────────────
function Summary() {
  const { summary } = useFinance();
  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryItem, { backgroundColor: AppColors.primaryLight }]}>
        <Text style={styles.summaryItemLabel}>Receitas</Text>
        <Text style={[styles.summaryItemValue, { color: AppColors.income }]}>
          {formatCurrency(summary.totalIncome)}
        </Text>
      </View>
      <View style={[styles.summaryItem, { backgroundColor: '#FDECED' }]}>
        <Text style={styles.summaryItemLabel}>Despesas</Text>
        <Text style={[styles.summaryItemValue, { color: AppColors.expense }]}>
          {formatCurrency(summary.totalExpense)}
        </Text>
      </View>
      <View style={[styles.summaryItem, { backgroundColor: AppColors.white }]}>
        <Text style={styles.summaryItemLabel}>Saldo</Text>
        <Text
          style={[
            styles.summaryItemValue,
            { color: summary.balance >= 0 ? AppColors.income : AppColors.expense },
          ]}>
          {formatCurrency(summary.balance)}
        </Text>
      </View>
    </View>
  );
}

// ─── Filtros ─────────────────────────────────────────────────────────
function Filters({
  active,
  onChange,
}: {
  active: FilterType;
  onChange: (f: FilterType) => void;
}) {
  const options: { label: string; value: FilterType }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Receitas', value: 'income' },
    { label: 'Despesas', value: 'expense' },
  ];
  return (
    <View style={styles.filtersRow}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          style={[styles.filterChip, active === o.value && styles.filterChipActive]}
          onPress={() => onChange(o.value)}>
          <Text style={[styles.filterText, active === o.value && styles.filterTextActive]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Item da lista ───────────────────────────────────────────────────
function TransactionItem({
  item,
  categoryName,
  onEdit,
  onDelete,
}: {
  item: Transaction;
  categoryName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = item.type === 'income';
  return (
    <Pressable style={styles.transactionRow} onPress={onEdit} onLongPress={onDelete}>
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
          {item.description}
        </Text>
        <Text style={styles.transactionMeta}>
          {categoryName} · {formatDate(item.date)}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: isIncome ? AppColors.income : AppColors.expense },
        ]}>
        {isIncome ? '+ ' : '- '}
        {formatCurrency(item.amount)}
      </Text>
    </Pressable>
  );
}

// ─── Modal / Formulário ──────────────────────────────────────────────
interface FormData {
  type: TransactionType;
  description: string;
  amount: string;
  categoryId: string;
  date: string;
}

const INITIAL_FORM: FormData = {
  type: 'expense',
  description: '',
  amount: '',
  categoryId: '',
  date: new Date().toISOString().slice(0, 10),
};

function TransactionFormModal({
  visible,
  onClose,
  editingTransaction,
}: {
  visible: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}) {
  const { addTransaction, updateTransaction, categories } = useFinance();
  const [form, setForm] = useState<FormData>(() => {
    if (editingTransaction) {
      return {
        type: editingTransaction.type,
        description: editingTransaction.description,
        amount: editingTransaction.amount.toString().replace('.', ','),
        categoryId: editingTransaction.categoryId,
        date: editingTransaction.date,
      };
    }
    return { ...INITIAL_FORM };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === form.type),
    [categories, form.type]
  );

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.description.trim()) e.description = 'Descrição é obrigatória.';
    const numericAmount = parseFloat(form.amount.replace(',', '.'));
    if (!form.amount.trim() || isNaN(numericAmount) || numericAmount <= 0)
      e.amount = 'Informe um valor válido.';
    if (!form.categoryId) e.categoryId = 'Selecione uma categoria.';
    if (!form.date.trim()) e.date = 'Informe a data.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const amount = parseFloat(form.amount.replace(',', '.'));
    const data = {
      type: form.type,
      description: form.description.trim(),
      amount,
      categoryId: form.categoryId,
      date: form.date,
    };
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, data);
    } else {
      addTransaction(data);
    }
    onClose();
  }

  function handleTypeToggle(type: TransactionType) {
    setForm((prev) => ({ ...prev, type, categoryId: '' }));
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
                {editingTransaction ? 'Editar movimentação' : 'Nova movimentação'}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={AppColors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalForm}>
              {/* Type toggle */}
              <View style={styles.typeToggle}>
                <Pressable
                  style={[styles.typeBtn, form.type === 'income' && styles.typeBtnIncomeActive]}
                  onPress={() => handleTypeToggle('income')}>
                  <Text
                    style={[
                      styles.typeBtnText,
                      form.type === 'income' && styles.typeBtnTextActive,
                    ]}>
                    Receita
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.typeBtn, form.type === 'expense' && styles.typeBtnExpenseActive]}
                  onPress={() => handleTypeToggle('expense')}>
                  <Text
                    style={[
                      styles.typeBtnText,
                      form.type === 'expense' && styles.typeBtnTextActive,
                    ]}>
                    Despesa
                  </Text>
                </Pressable>
              </View>

              <Input
                label="Descrição"
                placeholder="Ex: Almoço, Salário..."
                value={form.description}
                onChangeText={(t) => {
                  setForm((p) => ({ ...p, description: t }));
                  if (errors.description) setErrors((p) => ({ ...p, description: undefined }));
                }}
                error={errors.description}
              />
              <Input
                label="Valor (R$)"
                placeholder="0,00"
                value={form.amount}
                onChangeText={(t) => {
                  setForm((p) => ({ ...p, amount: t }));
                  if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
                }}
                error={errors.amount}
                keyboardType="decimal-pad"
              />
              <Input
                label="Data (AAAA-MM-DD)"
                placeholder="2026-11-20"
                value={form.date}
                onChangeText={(t) => {
                  setForm((p) => ({ ...p, date: t }));
                  if (errors.date) setErrors((p) => ({ ...p, date: undefined }));
                }}
                error={errors.date}
              />

              {/* Category selector */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryLabel}>Categoria</Text>
                {errors.categoryId ? (
                  <Text style={styles.categoryError}>{errors.categoryId}</Text>
                ) : null}
                <View style={styles.categoryGrid}>
                  {filteredCategories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        form.categoryId === cat.id && styles.categoryChipActive,
                      ]}
                      onPress={() => {
                        setForm((p) => ({ ...p, categoryId: cat.id }));
                        if (errors.categoryId)
                          setErrors((p) => ({ ...p, categoryId: undefined }));
                      }}>
                      <Text
                        style={[
                          styles.categoryChipText,
                          form.categoryId === cat.id && styles.categoryChipTextActive,
                        ]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Button title="Salvar" onPress={handleSave} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────
export default function MovimentacoesScreen() {
  const { transactions, getCategoryById, removeTransaction } = useFinance();
  const [filter, setFilter] = useState<FilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const handleEdit = useCallback((t: Transaction) => {
    setEditingTransaction(t);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback(
    (t: Transaction) => {
      Alert.alert('Excluir movimentação', `Deseja excluir "${t.description}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => removeTransaction(t.id),
        },
      ]);
    },
    [removeTransaction]
  );

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingTransaction(null);
  }, []);

  const handleOpenNew = useCallback(() => {
    setEditingTransaction(null);
    setModalVisible(true);
  }, []);

  return (
    <Container>
      <Header title="Movimentações" subtitle="Acompanhe suas entradas e saídas." />
      <Summary />
      <Filters active={filter} onChange={setFilter} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            categoryName={getCategoryById(item.categoryId)?.name ?? '—'}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma movimentação encontrada.</Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={handleOpenNew}>
        <Ionicons name="add" size={28} color={AppColors.white} />
      </Pressable>

      {modalVisible && (
        <TransactionFormModal
          visible={modalVisible}
          onClose={handleCloseModal}
          editingTransaction={editingTransaction}
        />
      )}
    </Container>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
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
  },
  summaryItemLabel: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textSecondary,
  },
  summaryItemValue: {
    fontSize: AppFontSize.md,
    fontWeight: '700',
  },

  /* Filters */
  filtersRow: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
  },
  filterChip: {
    paddingVertical: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadius.full,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  filterText: {
    fontSize: AppFontSize.sm,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },

  /* List */
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: BottomNavigationHeight + 80,
    gap: AppSpacing.xs,
  },

  /* Transaction */
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingVertical: AppSpacing.sm,
    paddingHorizontal: AppSpacing.sm,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
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

  /* FAB */
  fab: {
    position: 'absolute',
    right: AppSpacing.md,
    bottom: AppSpacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
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

  /* Type toggle */
  typeToggle: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: AppSpacing.sm,
    borderRadius: AppRadius.md,
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  typeBtnIncomeActive: {
    backgroundColor: AppColors.primaryLight,
    borderColor: AppColors.income,
  },
  typeBtnExpenseActive: {
    backgroundColor: '#FDECED',
    borderColor: AppColors.expense,
  },
  typeBtnText: {
    fontSize: AppFontSize.md,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  typeBtnTextActive: {
    color: AppColors.textPrimary,
    fontWeight: '700',
  },

  /* Category */
  categorySection: {
    gap: AppSpacing.xs,
  },
  categoryLabel: {
    fontSize: AppFontSize.sm,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  categoryError: {
    fontSize: AppFontSize.sm,
    color: AppColors.expense,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.sm,
  },
  categoryChip: {
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
    color: AppColors.textSecondary,
  },
  categoryChipTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },

  /* Empty */
  emptyText: {
    fontSize: AppFontSize.md,
    color: AppColors.textSecondary,
    textAlign: 'center',
    paddingVertical: AppSpacing.xl,
  },
});
