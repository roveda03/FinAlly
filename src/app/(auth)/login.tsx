import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Button } from '@/components/common';
import { Input } from '@/components/forms';
import { AppColors, AppFontSize, AppSpacing } from '@/constants';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validateEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  }

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Informe um e-mail válido.';
    }
    if (!password.trim()) {
      newErrors.password = 'A senha é obrigatória.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    try {
      await login({ email: email.trim(), password });
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login.';
      Alert.alert('Erro de autenticação', message);
    }
  }

  function handleForgotPassword() {
    Alert.alert(
      'Recuperar senha',
      'Funcionalidade de recuperação de senha será implementada em uma próxima versão.'
    );
  }

  function handleCreateAccount() {
    Alert.alert(
      'Criar conta',
      'O cadastro de novos usuários será implementado em uma próxima versão.'
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Logo / Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="wallet" size={40} color={AppColors.white} />
          </View>
          <Text style={styles.appName}>FinAlly</Text>
          <Text style={styles.tagline}>Organize suas finanças, conquiste seus objetivos.</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Input
            label="E-mail"
            placeholder="Seu e-mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />
          <View style={styles.passwordContainer}>
            <Input
              label="Senha"
              placeholder="Sua senha"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={AppColors.textSecondary}
              />
            </Pressable>
          </View>

          <Button title="Entrar" loading={isLoading} onPress={handleLogin} />

          <Pressable onPress={handleForgotPassword} hitSlop={8}>
            <Text style={styles.linkText}>Esqueceu sua senha?</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta?</Text>
          <Pressable onPress={handleCreateAccount} hitSlop={8}>
            <Text style={styles.footerLink}>Criar conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.xl,
    gap: AppSpacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.sm,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: AppColors.primaryDark,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: AppFontSize.md,
    color: AppColors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  formContainer: {
    gap: AppSpacing.md,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: AppSpacing.md,
    top: 30,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontSize: AppFontSize.sm,
    color: AppColors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppSpacing.xs,
  },
  footerText: {
    fontSize: AppFontSize.sm,
    color: AppColors.textSecondary,
  },
  footerLink: {
    fontSize: AppFontSize.sm,
    color: AppColors.primary,
    fontWeight: '700',
  },
});
