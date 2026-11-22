import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors, AppFontSize, AppSpacing } from '@/constants';
import { useFinance } from '@/hooks/use-finance';
import { formatCurrency, formatPercentage } from '@/utils';

/** Barra superior com a marca FinAlly e o sino de notificações (alertas de limite). */
export function AppTopBar() {
  const { limitAlerts } = useFinance();
  const hasAlerts = limitAlerts.length > 0;

  function handleNotifications() {
    if (!hasAlerts) {
      Alert.alert('Notificações', 'Você está em dia!');
      return;
    }
    const message = limitAlerts
      .map((u) => {
        const name = u.category?.name ?? 'Categoria';
        return u.status === 'exceeded'
          ? `• ${name}: limite ultrapassado em ${formatCurrency(Math.abs(u.remaining))}.`
          : `• ${name}: ${formatPercentage(u.percentage)} do limite utilizado. Restam ${formatCurrency(u.remaining)}.`;
      })
      .join('\n');
    Alert.alert('Alertas de limite', message);
  }

  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <Ionicons name="wallet" size={26} color={AppColors.primaryDark} />
        <Text style={styles.brandName}>FinAlly</Text>
      </View>
      <Pressable
        onPress={handleNotifications}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          hasAlerts ? `Notificações: ${limitAlerts.length} alerta(s) não lido(s)` : 'Notificações'
        }>
        <Ionicons name="notifications-outline" size={23} color={AppColors.primaryDark} />
        {hasAlerts ? <View style={styles.badge} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: AppSpacing.xs,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
  },
  brandName: {
    fontSize: AppFontSize.lg,
    fontWeight: '800',
    color: AppColors.primaryDark,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: AppColors.expense,
    borderWidth: 1.5,
    borderColor: AppColors.background,
  },
});
