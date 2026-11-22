import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { AppTopBar, Button, Container, Header } from '@/components/common';
import { Input } from '@/components/forms';
import { AppColors, AppFontSize, AppRadius, AppSpacing } from '@/constants';
import { useFinance } from '@/hooks/use-finance';
import type { Category, IconName, Transaction, TransactionType } from '@/types';
import {
    calculateSummary,
    formatCurrency,
    formatDateHeading,
    isSameMonth,
    normalizeSearch,
    parseCurrencyInput,
    toIsoDate,
} from '@/utils';

type TypeFilter = 'all' | 'income' | 'expense';
type PeriodFilter = 'all' | 'month' | '30d' | '90d';

interface AdvancedFilters {
  period: PeriodFilter;
  categoryIds: string[];
}

const DEFAULT_FILTERS: AdvancedFilters = { period: 'all', categoryIds: [] };

const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: 'Tudo', value: 'all' },
  { label: 'Este mês', value: 'month' },
  { label: 'Últimos 30 dias', value: '30d' },
  { label: 'Últimos 3 meses', value: '90d' },
];

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toIsoDate(date);
}

function matchesPeriod(isoDate: string, period: PeriodFilter): boolean {
  switch (period) {
    case 'month':
      return isSameMonth(isoDate);
    case '30d':
      return isoDate >= daysAgoIso(30);
    case '90d':
      return isoDate >= daysAgoIso(90);
    default:
      return true;
  }
}

// ─── Abas por tipo ───────────────────────────────────────────────────
function TypeTabs({ active, onChange }: { active: TypeFilter; onChange: (f: TypeFilter) => void }) {
  const options: { label: string; value: TypeFilter; icon?: IconName; color?: string }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Despesas', value: 'expense', icon: 'arrow-down', color: AppColors.expense },
    { label: 'Receitas', value: 'income', icon: 'arrow-up', color: AppColors.income },
  ];
  return (
    <View style={styles.typeTabs} accessibilityRole="tablist">
      {options.map((o) => {
        const isActive = active === o.value;
        return (
          <Pressable
            key={o.value}
            style={[styles.typeTab, isActive && styles.typeTabActive]}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}>
            {o.icon ? (
              <Ionicons name={o.icon} size={17} color={isActive ? AppColors.white : o.color} />
            ) : null}
            <Text style={[styles.typeTabText, isActive && styles.typeTabTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Item da lista ───────────────────────────────────────────────────
function TransactionItem({
  item,
  category,
  onEdit,
  onDelete,
}: {
  item: Transaction;
  category: Category | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = item.type === 'income';
  const subtitle = isIncome
    ? `Receita${category ? ` · ${category.name}` : ''}`
    : (category?.name ?? '—');
  return (
    <Pressable
      style={({ pressed }) => [styles.transactionRow, pressed && styles.pressed]}
      onPress={onEdit}
      onLongPress={onDelete}
      accessibilityRole="button"
      accessibilityHint="Toque para editar. Pressione e segure para excluir.">
      <View style={styles.transactionIcon}>
        <Ionicons
          name={category?.icon ?? (isIncome ? 'arrow-up' : 'arrow-down')}
          size={20}
          color={AppColors.primaryDark}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDesc} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.transactionMeta} numberOfLines={1}>
          {subtitle}
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
      <Ionicons name="chevron-forward" size={18} color={AppColors.primaryDark} />
    </Pressable>
  );
}

// ─── Resumo do período ───────────────────────────────────────────────
function PeriodSummary({ transactions }: { transactions: Transaction[] }) {
  const summary = calculateSummary(transactions);
  return (
    <View style={styles.periodSummary}>
      <View style={styles.periodSummaryIcon}>
        <Ionicons name="bar-chart" size={20} color={AppColors.primaryDark} />
      </View>
      <View style={styles.periodSummaryCopy}>
        <Text style={styles.periodSummaryTitle}>Resumo do Período</Text>
        <Text style={styles.periodSummaryText} numberOfLines={2}>
          Receitas: {formatCurrency(summary.totalIncome)} | Despesas:{' '}
          {formatCurrency(summary.totalExpense)}
        </Text>
      </View>
      <View style={styles.periodSummaryDivider} />
      <View style={styles.periodBalance}>
        <Text style={styles.periodBalanceLabel}>Saldo</Text>
        <Text
          style={[
            styles.periodBalanceValue,
            { color: summary.balance >= 0 ? AppColors.income : AppColors.expense },
          ]}>
          {formatCurrency(summary.balance)}
        </Text>
      </View>
    </View>
  );
}

// ─── Modal de filtros (funil) ────────────────────────────────────────
function FiltersModal({
  initial,
  onApply,
  onClose,
}: {
  initial: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
  onClose: () => void;
}) {
  const { categories } = useFinance();
  const [draft, setDraft] = useState<AdvancedFilters>(initial);

  function toggleCategory(id: string) {
    setDraft((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Fechar filtros">
              <Ionicons name="close" size={24} color={AppColors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
            <View style={styles.categorySection}>
              <Text style={styles.categoryLabel}>Período</Text>
              <View style={styles.categoryGrid}>
                {PERIOD_OPTIONS.map((option) => {
                  const active = draft.period === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      onPress={() => setDraft((p) => ({ ...p, period: option.value }))}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}>
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.categorySection}>
              <Text style={styles.categoryLabel}>Categorias</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const active = draft.categoryIds.includes(cat.id);
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryChip, styles.categoryChipRow, active && styles.categoryChipActive]}
                      onPress={() => toggleCategory(cat.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}>
                      <Ionicons
                        name={cat.icon}
                        size={14}
                        color={active ? AppColors.white : AppColors.primaryDark}
                      />
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterActions}>
              <Button
                title="Limpar"
                variant="outline"
                fullWidth={false}
                style={styles.filterActionButton}
                onPress={() => setDraft(DEFAULT_FILTERS)}
              />
              <Button
                title="Aplicar"
                fullWidth={false}
                style={styles.filterActionButton}
                onPress={() => onApply(draft)}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    const numericAmount = parseCurrencyInput(form.amount);
    if (!form.amount.trim() || isNaN(numericAmount) || numericAmount <= 0)
      e.amount = 'Informe um valor válido.';
    if (!form.categoryId) e.categoryId = 'Selecione uma categoria.';
    if (!form.date.trim()) e.date = 'Informe a data.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const amount = parseCurrencyInput(form.amount);
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

function TransactionEntryScreen({ onClose }: { onClose: () => void }) {
  const { addTransaction, categories } = useFinance();
  const [form, setForm] = useState<FormData>({
    ...INITIAL_FORM,
    type: 'income',
    date: new Date().toLocaleDateString('pt-BR'),
  });
  const [errors, setErrors] = useState<Partial<Record<'amount' | 'categoryId' | 'date', string>>>({});
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const availableCategories = categories.filter((category) => category.type === form.type);
  const selectedCategory = availableCategories.find((category) => category.id === form.categoryId);

  function handleSave() {
    const amount = parseCurrencyInput(form.amount);
    const dateParts = form.date.split('/');
    const validDate = dateParts.length === 3 && dateParts[2].length === 4;
    const nextErrors: Partial<Record<'amount' | 'categoryId' | 'date', string>> = {};
    if (!form.amount.trim() || Number.isNaN(amount) || amount <= 0)
      nextErrors.amount = 'Informe um valor válido.';
    if (!form.categoryId) nextErrors.categoryId = 'Selecione uma categoria.';
    if (!validDate) nextErrors.date = 'Use o formato DD/MM/AAAA.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const [day, month, year] = dateParts;
    addTransaction({
      type: form.type,
      description: form.description.trim() || (form.type === 'income' ? 'Receita' : 'Despesa'),
      amount,
      categoryId: form.categoryId,
      date: `${year}-${month}-${day}`,
    });
    onClose();
  }

  function changeType(type: TransactionType) {
    setForm((current) => ({ ...current, type, categoryId: '' }));
    setErrors((current) => ({ ...current, categoryId: undefined }));
  }

  return (
    <Container scrollable contentStyle={styles.entryContent}>
      <View style={styles.entryHeader}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={25} color={AppColors.primaryDark} />
        </Pressable>
        <Text style={styles.entryHeaderTitle}>Nova Movimentação</Text>
        <View style={styles.entryBrand}>
          <Ionicons name="wallet" size={21} color={AppColors.primary} />
          <Text style={styles.entryBrandText}>FinAlly</Text>
        </View>
      </View>

      <View style={styles.entryTypeToggle}>
        <Pressable
          style={[styles.entryTypeButton, form.type === 'income' && styles.entryTypeActive]}
          onPress={() => changeType('income')}>
          <Ionicons
            name="arrow-up-circle"
            size={22}
            color={form.type === 'income' ? AppColors.white : AppColors.primaryDark}
          />
          <Text style={[styles.entryTypeText, form.type === 'income' && styles.entryTypeTextActive]}>
            Receita
          </Text>
        </Pressable>
        <Pressable
          style={[styles.entryTypeButton, form.type === 'expense' && styles.entryTypeExpenseActive]}
          onPress={() => changeType('expense')}>
          <Ionicons
            name="arrow-down-circle"
            size={22}
            color={form.type === 'expense' ? AppColors.white : AppColors.primaryDark}
          />
          <Text style={[styles.entryTypeText, form.type === 'expense' && styles.entryTypeTextActive]}>
            Despesa
          </Text>
        </Pressable>
      </View>

      <View style={styles.entryInfoPanel}>
        <Ionicons
          name={form.type === 'income' ? 'wallet' : 'wallet-outline'}
          size={48}
          color={AppColors.primary}
        />
        <View style={styles.entryInfoCopy}>
          <Text style={styles.entryInfoTitle}>
            {form.type === 'income' ? 'Registrar uma receita' : 'Registrar uma despesa'}
          </Text>
          <Text style={styles.entryInfoText}>
            {form.type === 'income'
              ? 'Adicione seus ganhos de forma rápida e organizada.'
              : 'Registre seus gastos para acompanhar suas finanças.'}
          </Text>
        </View>
      </View>

      <View style={styles.entryFieldBlock}>
        <View style={styles.entryLabelRow}>
          <Ionicons name="cash" size={19} color={AppColors.primaryDark} />
          <Text style={styles.entryLabel}>Valor</Text>
        </View>
        <Input
          placeholder="Ex: R$ 1.000,00"
          value={form.amount}
          onChangeText={(amount) => {
            setForm((current) => ({ ...current, amount }));
            if (errors.amount) setErrors((current) => ({ ...current, amount: undefined }));
          }}
          error={errors.amount}
          keyboardType="decimal-pad"
          style={styles.entryInput}
        />
      </View>

      <View style={styles.entryFieldBlock}>
        <View style={styles.entryLabelRow}>
          <Ionicons name="pricetag" size={19} color={AppColors.primaryDark} />
          <Text style={styles.entryLabel}>Categoria</Text>
        </View>
        <Pressable style={styles.categorySelect} onPress={() => setCategoryExpanded((open) => !open)}>
          <Ionicons name="briefcase" size={18} color={AppColors.primaryDark} />
          <Text style={styles.categorySelectText}>{selectedCategory?.name ?? 'Selecionar categoria'}</Text>
          <Ionicons name={categoryExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={AppColors.textPrimary} />
        </Pressable>
        {categoryExpanded ? (
          <View style={styles.categoryOptions}>
            {availableCategories.map((category) => (
              <Pressable
                key={category.id}
                style={styles.categoryOption}
                onPress={() => {
                  setForm((current) => ({ ...current, categoryId: category.id }));
                  setCategoryExpanded(false);
                  setErrors((current) => ({ ...current, categoryId: undefined }));
                }}>
                <Text style={styles.categoryOptionText}>{category.name}</Text>
                {category.id === form.categoryId ? (
                  <Ionicons name="checkmark" size={18} color={AppColors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}
        {errors.categoryId ? <Text style={styles.entryError}>{errors.categoryId}</Text> : null}
      </View>

      <View style={styles.entryFieldBlock}>
        <View style={styles.entryLabelRow}>
          <Ionicons name="calendar" size={19} color={AppColors.primaryDark} />
          <Text style={styles.entryLabel}>Data</Text>
        </View>
        <View style={styles.entryDateRow}>
          <View style={styles.entryDateInput}>
            <Input
              placeholder="DD/MM/AAAA"
              value={form.date}
              onChangeText={(date) => {
                setForm((current) => ({ ...current, date }));
                if (errors.date) setErrors((current) => ({ ...current, date: undefined }));
              }}
              error={errors.date}
              style={styles.entryInput}
            />
          </View>
          <Ionicons name="calendar-outline" size={20} color={AppColors.primaryDark} />
        </View>
      </View>

      <View style={styles.entryFieldBlock}>
        <View style={styles.entryLabelRow}>
          <Ionicons name="reader" size={19} color={AppColors.primaryDark} />
          <Text style={styles.entryLabel}>Descrição (opcional)</Text>
        </View>
        <Input
          placeholder="Ex: Pagamento do trabalho"
          value={form.description}
          onChangeText={(description) => setForm((current) => ({ ...current, description }))}
          style={styles.entryInput}
        />
      </View>

      <Pressable style={styles.saveEntryButton} onPress={handleSave}>
        <Ionicons name="save" size={19} color={AppColors.white} />
        <Text style={styles.saveEntryText}>Salvar Movimentação</Text>
      </Pressable>
    </Container>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────
export default function MovimentacoesScreen() {
  const { transactions, getCategoryById, removeTransaction } = useFinance();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [entryVisible, setEntryVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const hasAdvancedFilters = filters.period !== 'all' || filters.categoryIds.length > 0;

  const filtered = useMemo(() => {
    const query = normalizeSearch(search);
    return transactions
      .filter((t) => typeFilter === 'all' || t.type === typeFilter)
      .filter((t) => !query || normalizeSearch(t.description).includes(query))
      .filter((t) => matchesPeriod(t.date, filters.period))
      .filter((t) => filters.categoryIds.length === 0 || filters.categoryIds.includes(t.categoryId));
  }, [transactions, typeFilter, search, filters]);

  // Agrupa por data (mais recentes primeiro), mantendo a ordem de inserção no mesmo dia.
  const sections = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
    const groups: { title: string; date: string; data: Transaction[] }[] = [];
    for (const t of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.date === t.date) last.data.push(t);
      else groups.push({ title: formatDateHeading(t.date), date: t.date, data: [t] });
    }
    return groups;
  }, [filtered]);

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
    setEntryVisible(true);
  }, []);

  if (entryVisible) {
    return <TransactionEntryScreen onClose={() => setEntryVisible(false)} />;
  }

  return (
    <Container contentStyle={styles.screenContent}>
      <AppTopBar />
      <Header
        title="Histórico de Movimentações"
        subtitle="Acompanhe todas as suas receitas e despesas."
      />
      <TypeTabs active={typeFilter} onChange={setTypeFilter} />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={AppColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por descrição..."
            placeholderTextColor={AppColors.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            accessibilityLabel="Buscar por descrição"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Limpar busca">
              <Ionicons name="close-circle" size={18} color={AppColors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={[styles.funnelButton, hasAdvancedFilters && styles.funnelButtonActive]}
          onPress={() => setFiltersVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={hasAdvancedFilters ? 'Filtros (ativos)' : 'Filtros'}>
          <Ionicons
            name="funnel-outline"
            size={20}
            color={hasAdvancedFilters ? AppColors.white : AppColors.primaryDark}
          />
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={17} color={AppColors.primaryDark} />
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            category={getCategoryById(item.categoryId)}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma movimentação encontrada.</Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        style={styles.list}
      />

      <PeriodSummary transactions={filtered} />

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={handleOpenNew}
        accessibilityRole="button"
        accessibilityLabel="Nova movimentação">
        <Ionicons name="add" size={28} color={AppColors.white} />
      </Pressable>

      {modalVisible && (
        <TransactionFormModal
          visible={modalVisible}
          onClose={handleCloseModal}
          editingTransaction={editingTransaction}
        />
      )}

      {filtersVisible && (
        <FiltersModal
          initial={filters}
          onClose={() => setFiltersVisible(false)}
          onApply={(next) => {
            setFilters(next);
            setFiltersVisible(false);
          }}
        />
      )}
    </Container>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  entryContent: {
    gap: AppSpacing.md,
    paddingTop: AppSpacing.xs,
    paddingBottom: AppSpacing.lg,
  },
  entryHeader: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AppSpacing.xs,
  },
  entryHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: AppFontSize.md,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  entryBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  entryBrandText: {
    fontSize: AppFontSize.sm,
    fontWeight: '800',
    color: AppColors.primary,
  },
  entryTypeToggle: {
    minHeight: 44,
    flexDirection: 'row',
    backgroundColor: '#DDF3EA',
    borderRadius: AppRadius.full,
    padding: 3,
  },
  entryTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.xs,
    borderRadius: AppRadius.full,
  },
  entryTypeActive: {
    backgroundColor: AppColors.primaryDark,
  },
  entryTypeExpenseActive: {
    backgroundColor: '#B63845',
  },
  entryTypeText: {
    color: AppColors.primaryDark,
    fontSize: AppFontSize.md,
    fontWeight: '600',
  },
  entryTypeTextActive: {
    color: AppColors.white,
  },
  entryInfoPanel: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
    padding: AppSpacing.md,
    borderRadius: AppRadius.md,
    backgroundColor: '#D6F3E9',
  },
  entryInfoCopy: { flex: 1, gap: AppSpacing.xs },
  entryInfoTitle: {
    fontSize: AppFontSize.md,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  entryInfoText: {
    fontSize: AppFontSize.sm,
    lineHeight: 18,
    color: AppColors.textPrimary,
  },
  entryFieldBlock: { gap: AppSpacing.xs },
  entryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
  },
  entryLabel: {
    fontSize: AppFontSize.md,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  entryInput: {
    minHeight: 48,
    borderRadius: 13,
    borderColor: '#D6DEE1',
    backgroundColor: 'rgba(255,255,255,0.84)',
  },
  categorySelect: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    borderWidth: 1,
    borderColor: '#D6DEE1',
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.84)',
  },
  categorySelectText: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: AppFontSize.md,
  },
  categoryOptions: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AppRadius.md,
    overflow: 'hidden',
    backgroundColor: AppColors.white,
  },
  categoryOption: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  categoryOptionText: {
    color: AppColors.textPrimary,
    fontSize: AppFontSize.sm,
  },
  entryError: {
    color: AppColors.expense,
    fontSize: AppFontSize.sm,
  },
  entryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  entryDateInput: { flex: 1 },
  saveEntryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.sm,
    borderRadius: AppRadius.full,
    backgroundColor: AppColors.primary,
  },
  saveEntryText: {
    color: AppColors.white,
    fontSize: AppFontSize.md,
    fontWeight: '700',
  },
  /* Screen */
  screenContent: {
    gap: AppSpacing.sm,
    paddingBottom: AppSpacing.sm,
  },

  /* Type tabs */
  typeTabs: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
  },
  typeTab: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.xs,
    borderRadius: AppRadius.full,
    backgroundColor: '#E6F4EE',
    borderWidth: 1,
    borderColor: '#D3EBE0',
  },
  typeTabActive: {
    backgroundColor: AppColors.primaryDark,
    borderColor: AppColors.primaryDark,
  },
  typeTabText: {
    fontSize: AppFontSize.sm + 1,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  typeTabTextActive: {
    color: AppColors.white,
    fontWeight: '700',
  },

  /* Search */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  searchBox: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadius.full,
    backgroundColor: '#E6F1EC',
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    fontSize: AppFontSize.md,
    color: AppColors.textPrimary,
  },
  funnelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: '#BFDDD0',
  },
  funnelButtonActive: {
    backgroundColor: AppColors.primaryDark,
    borderColor: AppColors.primaryDark,
  },

  /* List */
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingVertical: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.xs,
    borderRadius: AppRadius.md,
    backgroundColor: '#E6F1EC',
  },
  sectionHeaderText: {
    fontSize: AppFontSize.sm + 1,
    color: AppColors.textPrimary,
  },

  /* Transaction */
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingVertical: AppSpacing.sm,
    paddingHorizontal: AppSpacing.sm,
    marginBottom: AppSpacing.xs,
    backgroundColor: AppColors.white,
    borderRadius: AppRadius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  pressed: {
    opacity: 0.75,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primaryLight,
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

  /* Period summary */
  periodSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    padding: AppSpacing.sm,
    borderRadius: AppRadius.md,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  periodSummaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primaryLight,
  },
  periodSummaryCopy: { flex: 1, gap: 2 },
  periodSummaryTitle: {
    fontSize: AppFontSize.sm,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  periodSummaryText: {
    fontSize: AppFontSize.sm - 2,
    color: AppColors.textSecondary,
  },
  periodSummaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: AppColors.border,
  },
  periodBalance: {
    alignItems: 'center',
  },
  periodBalanceLabel: {
    fontSize: AppFontSize.sm - 1,
    color: AppColors.textSecondary,
  },
  periodBalanceValue: {
    fontSize: AppFontSize.md,
    fontWeight: '800',
  },

  /* Filters modal */
  categoryChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
  },
  filterActions: {
    flexDirection: 'row',
    gap: AppSpacing.sm,
    marginTop: AppSpacing.xs,
  },
  filterActionButton: {
    flex: 1,
  },

  /* FAB */
  fab: {
    position: 'absolute',
    right: AppSpacing.md,
    bottom: 84,
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
