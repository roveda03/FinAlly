import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTopBar } from '@/components/common';
import { AppColors, AppFontSize, AppRadius, AppSpacing } from '@/constants';
import { useChat } from '@/hooks/use-chat';
import type { ChatMessage, IconName } from '@/types';
import { formatTime } from '@/utils';

const BULLET = '• ';

// ─── Avatares ────────────────────────────────────────────────────────
function BotAvatar({ size = 38 }: { size?: number }) {
  return (
    <View style={[styles.botAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="hardware-chip" size={size * 0.55} color={AppColors.primaryDark} />
    </View>
  );
}

function UserAvatar() {
  return (
    <View style={styles.userAvatar}>
      <Ionicons name="person" size={20} color={AppColors.white} />
    </View>
  );
}

// ─── Conteúdo da mensagem (texto + itens com check) ─────────────────
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n');
  return (
    <View style={styles.messageLines}>
      {lines.map((line, index) =>
        line.startsWith(BULLET) ? (
          <View key={index} style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={17} color={AppColors.primaryDark} />
            <Text style={[styles.messageText, styles.bulletText]}>
              {line.slice(BULLET.length)}
            </Text>
          </View>
        ) : (
          <Text key={index} style={[styles.messageText, isUser && styles.messageTextUser]}>
            {line}
          </Text>
        )
      )}
    </View>
  );
}

// ─── Balão ───────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === 'user';
  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser ? <BotAvatar /> : null}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <MessageContent content={message.content} isUser={isUser} />
        <Text style={[styles.time, isUser && styles.timeUser]}>{formatTime(message.createdAt)}</Text>
      </View>
      {isUser ? <UserAvatar /> : null}
    </View>
  );
}

function TypingBubble() {
  return (
    <View style={styles.messageRow} accessibilityLiveRegion="polite">
      <BotAvatar />
      <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
        <ActivityIndicator size="small" color={AppColors.primary} />
        <Text style={styles.typingText}>Digitando…</Text>
      </View>
    </View>
  );
}

// ─── Atalhos ─────────────────────────────────────────────────────────
const QUICK_ACTIONS: { label: string; icon: IconName; message?: string }[] = [
  { label: 'Dicas de economia', icon: 'bulb-outline', message: 'Me dê dicas de economia' },
  { label: 'Análise dos meus gastos', icon: 'bar-chart-outline', message: 'Faça uma análise dos meus gastos' },
  { label: 'Criar uma meta', icon: 'flag-outline' },
];

// ─── Tela ────────────────────────────────────────────────────────────
export default function ChatbotScreen() {
  const { messages, isTyping, sendMessage, clearHistory } = useChat();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const canSend = text.trim().length > 0 && !isTyping;

  useEffect(() => {
    const timeout = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timeout);
  }, [messages.length, isTyping]);

  function handleSend() {
    if (!canSend) return;
    const message = text;
    setText('');
    void sendMessage(message);
  }

  function handleQuickAction(action: (typeof QUICK_ACTIONS)[number]) {
    if (action.message) {
      if (!isTyping) void sendMessage(action.message);
      return;
    }
    router.navigate({ pathname: '/metas', params: { novaMeta: '1' } });
  }

  function handleClear() {
    Alert.alert('Limpar conversa', 'Deseja apagar o histórico desta conversa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: clearHistory },
    ]);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <AppTopBar />
          <View style={styles.assistantHeader}>
            <BotAvatar size={64} />
            <View style={styles.assistantCopy}>
              <Text style={styles.assistantTitle} accessibilityRole="header">
                Assistente Financeiro
              </Text>
              <Text style={styles.assistantSubtitle}>
                Tire suas dúvidas e receba dicas personalizadas sobre suas finanças!
              </Text>
            </View>
            <Pressable
              onPress={handleClear}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Limpar conversa">
              <Ionicons name="trash-outline" size={20} color={AppColors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          ListFooterComponent={isTyping ? <TypingBubble /> : undefined}
          contentContainerStyle={styles.messages}
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.footer}>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
                onPress={() => handleQuickAction(action)}
                disabled={Boolean(action.message) && isTyping}
                accessibilityRole="button">
                <Ionicons name={action.icon} size={16} color={AppColors.primaryDark} />
                <Text style={styles.quickActionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={AppColors.textSecondary}
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
              maxLength={500}
              accessibilityLabel="Mensagem para o assistente"
            />
            <Pressable
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensagem">
              <Ionicons name="send" size={19} color={AppColors.white} />
            </Pressable>
          </View>

          <Text style={styles.disclaimer}>
            As respostas têm finalidade educativa e podem conter erros. Não substituem a orientação
            de um profissional nem recomendam investimentos.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: AppSpacing.md,
    gap: AppSpacing.sm,
    paddingBottom: AppSpacing.sm,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
  },
  assistantCopy: { flex: 1, gap: 2 },
  assistantTitle: {
    fontSize: AppFontSize.xl,
    fontWeight: '800',
    color: AppColors.primaryDark,
  },
  assistantSubtitle: {
    fontSize: AppFontSize.sm,
    lineHeight: 18,
    color: AppColors.textSecondary,
  },

  /* Avatars */
  botAvatar: {
    backgroundColor: AppColors.primaryLight,
    borderWidth: 2,
    borderColor: '#B7E4D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Messages */
  messages: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    gap: AppSpacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AppSpacing.sm,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    gap: AppSpacing.xs,
  },
  bubbleBot: {
    backgroundColor: '#E1F2EC',
    borderRadius: AppRadius.lg,
    borderTopLeftRadius: AppRadius.sm / 2,
  },
  bubbleUser: {
    backgroundColor: AppColors.primaryDark,
    borderRadius: AppRadius.lg,
    borderTopRightRadius: AppRadius.sm / 2,
  },
  messageLines: { gap: AppSpacing.xs },
  messageText: {
    fontSize: AppFontSize.md,
    lineHeight: 21,
    color: AppColors.textPrimary,
  },
  messageTextUser: {
    color: AppColors.white,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AppSpacing.xs,
  },
  bulletText: {
    flex: 1,
  },
  time: {
    alignSelf: 'flex-end',
    fontSize: AppFontSize.sm - 2,
    color: AppColors.textSecondary,
  },
  timeUser: {
    color: '#BFE3D4',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  typingText: {
    fontSize: AppFontSize.sm,
    color: AppColors.textSecondary,
  },

  /* Footer */
  footer: {
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.sm,
    gap: AppSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: AppSpacing.sm,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
    paddingVertical: AppSpacing.xs + 2,
    paddingHorizontal: AppSpacing.md - 2,
    borderRadius: AppRadius.full,
    borderWidth: 1,
    borderColor: AppColors.primaryDark,
    backgroundColor: AppColors.white,
  },
  pressed: {
    opacity: 0.7,
  },
  quickActionText: {
    fontSize: AppFontSize.sm,
    fontWeight: '600',
    color: AppColors.primaryDark,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: AppSpacing.sm,
    paddingLeft: AppSpacing.md,
    paddingRight: AppSpacing.xs,
    paddingVertical: AppSpacing.xs,
    borderRadius: AppRadius.full,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.white,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    paddingVertical: AppSpacing.sm,
    fontSize: AppFontSize.md,
    color: AppColors.textPrimary,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppColors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  disclaimer: {
    fontSize: AppFontSize.sm - 2,
    lineHeight: 15,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
});
