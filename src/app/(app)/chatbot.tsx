import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Container, Header } from '@/components/common';
import { AppColors, AppFontSize, AppSpacing } from '@/constants';

export default function ChatbotScreen() {
  return (
    <Container contentStyle={styles.content}>
      <Header title="Chatbot" subtitle="Seu assistente financeiro inteligente" />
      <View style={styles.placeholder}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color={AppColors.primaryLight} />
        <Text style={styles.title}>Em breve!</Text>
        <Text style={styles.description}>
          Estamos preparando um assistente inteligente para ajudar você a gerenciar suas finanças.
          Fique ligado nas próximas atualizações!
        </Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.md,
    paddingHorizontal: AppSpacing.xl,
  },
  title: {
    fontSize: AppFontSize.xl,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  description: {
    fontSize: AppFontSize.md,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
