import { useState } from 'react';
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

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Button } from '@/components/common';
import { Input } from '@/components/forms';
import { AppColors, AppFontSize, AppSpacing } from '@/constants';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const { login, register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerVisible, setRegisterVisible] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);

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
    setAuthError(null);
    if (!validate()) return;
    try {
      await login({ email: email.trim(), password });
      router.replace('/dashboard');
    } catch (err: unknown) {
      // Exibido na própria tela: Alert.alert não funciona no navegador (react-native-web).
      setAuthError(err instanceof Error ? err.message : 'Erro ao fazer login.');
    }
  }

  function handleForgotPassword() {
    Alert.alert(
      'Recuperar senha',
      'Funcionalidade de recuperação de senha será implementada em uma próxima versão.'
    );
  }

  function handleCreateAccount() {
    setRegisterError(null);
    setRegisterVisible(true);
  }

  async function handleRegister() {
    if (!registerName.trim() || !validateEmail(registerEmail) || registerPassword.length < 8) {
      setRegisterError('Informe nome, e-mail válido e senha com pelo menos 8 caracteres.');
      return;
    }
    setRegisterError(null);
    try {
      await register({
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
      });
      setRegisterVisible(false);
      router.replace('/dashboard');
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Não foi possível criar a conta.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View pointerEvents="none" style={styles.topSweep} />
      <View pointerEvents="none" style={styles.topSweepLight} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandContainer}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Ionicons name="wallet" size={42} color={AppColors.white} />
            </View>
            <Text style={styles.appName}>FinAlly</Text>
          </View>
          <Text style={styles.tagline}>Organize suas finanças, conquiste seus objetivos.</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>Bem-vindo(a)!</Text>
            <Text style={styles.welcomeSubtitle}>
              Acesse sua conta para continuar cuidando das suas finanças.
            </Text>
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color={AppColors.textSecondary} />
          <Input
            placeholder="E-mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setAuthError(null);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            style={styles.inputField}
          />
          </View>
          <View style={styles.passwordContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={AppColors.textSecondary}
              style={styles.passwordIcon}
            />
            <Input
              placeholder="Senha"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setAuthError(null);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              style={styles.passwordInput}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={AppColors.textSecondary}
              />
            </Pressable>
          </View>

          {authError ? (
            <View style={styles.authError} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={20} color={AppColors.expense} />
              <Text style={styles.authErrorText}>{authError}</Text>
            </View>
          ) : null}

          <Button title="Entrar" loading={isLoading} onPress={handleLogin} style={styles.loginButton} />
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>ou</Text>
            <View style={styles.orLine} />
          </View>
          <Pressable style={styles.createButton} onPress={handleCreateAccount}>
            <Ionicons name="person-add-outline" size={21} color={AppColors.primaryDark} />
            <Text style={styles.createButtonText}>Criar uma conta</Text>
          </Pressable>
          <Pressable onPress={handleForgotPassword} hitSlop={8}>
            <Text style={styles.linkText}>Esqueceu sua senha?</Text>
          </Pressable>
        </View>

        <View style={styles.growthArt} accessibilityElementsHidden>
          <View style={styles.growthBase} />
          <View style={[styles.growthBar, styles.barOne]} />
          <View style={[styles.growthBar, styles.barTwo]} />
          <View style={[styles.growthBar, styles.barThree]} />
          <View style={[styles.growthBar, styles.barFour]} />
          <Ionicons name="trending-up" size={94} color="#52A987" style={styles.trendIcon} />
          <View style={styles.coinStack}>
            <Ionicons name="cash" size={48} color="#F2C65C" />
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={registerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRegisterVisible(false)}>
        <KeyboardAvoidingView
          style={styles.registerOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.registerContent}>
            <Text style={styles.registerTitle}>Criar conta</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Input
                label="Nome"
                placeholder="Seu nome"
                value={registerName}
                onChangeText={setRegisterName}
                autoCapitalize="words"
              />
              <Input
                label="E-mail"
                placeholder="voce@exemplo.com"
                value={registerEmail}
                onChangeText={setRegisterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Input
                label="Senha"
                placeholder="Mínimo de 8 caracteres"
                value={registerPassword}
                onChangeText={setRegisterPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
              {registerError ? (
                <Text style={styles.registerError} accessibilityRole="alert">{registerError}</Text>
              ) : null}
              <Button
                title="Criar conta"
                loading={isLoading}
                onPress={handleRegister}
                style={styles.registerButton}
              />
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setRegisterVisible(false)}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  topSweep: {
    position: 'absolute',
    top: -90,
    left: -42,
    width: 280,
    height: 190,
    backgroundColor: '#2E795E',
    borderBottomRightRadius: 150,
    transform: [{ rotate: '-9deg' }],
  },
  topSweepLight: {
    position: 'absolute',
    top: -112,
    left: 80,
    width: 160,
    height: 170,
    backgroundColor: '#B9DED0',
    borderBottomRightRadius: 110,
    transform: [{ rotate: '18deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
    paddingTop: 96,
    paddingBottom: AppSpacing.md,
    gap: AppSpacing.lg,
  },
  brandContainer: {
    alignItems: 'center',
    gap: AppSpacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  logoMark: {
    width: 66,
    height: 58,
    borderRadius: 18,
    backgroundColor: AppColors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 38,
    fontWeight: '800',
    color: AppColors.primaryDark,
  },
  tagline: {
    fontSize: AppFontSize.sm,
    color: AppColors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 19,
  },
  formContainer: {
    gap: AppSpacing.sm,
  },
  welcome: {
    alignItems: 'center',
    gap: AppSpacing.xs,
    marginBottom: AppSpacing.sm,
  },
  welcomeTitle: {
    fontSize: AppFontSize.xl,
    color: '#102E32',
    fontWeight: '700',
  },
  welcomeSubtitle: {
    fontSize: AppFontSize.md,
    lineHeight: 20,
    color: AppColors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  inputRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingLeft: AppSpacing.md,
    borderWidth: 1,
    borderColor: '#D5DDDF',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  inputField: {
    flex: 1,
    minHeight: 48,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingLeft: 0,
  },
  passwordContainer: {
    position: 'relative',
    minHeight: 52,
    justifyContent: 'center',
  },
  passwordIcon: {
    position: 'absolute',
    zIndex: 1,
    left: AppSpacing.md,
  },
  eyeButton: {
    position: 'absolute',
    right: AppSpacing.md,
    top: 0,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  passwordInput: {
    minHeight: 52,
    paddingLeft: 48,
    paddingRight: 48,
    borderColor: '#D5DDDF',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  authError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    paddingVertical: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    borderRadius: 12,
    backgroundColor: '#FCE9E9',
  },
  authErrorText: {
    flex: 1,
    fontSize: AppFontSize.sm,
    color: AppColors.expense,
    fontWeight: '600',
  },
  registerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  registerContent: {
    maxHeight: '90%',
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: AppSpacing.lg,
  },
  registerTitle: {
    color: AppColors.textPrimary,
    fontSize: AppFontSize.lg,
    fontWeight: '700',
    marginBottom: AppSpacing.md,
  },
  registerError: {
    color: AppColors.expense,
    marginBottom: AppSpacing.sm,
  },
  registerButton: {
    marginBottom: AppSpacing.sm,
  },
  loginButton: {
    backgroundColor: AppColors.primaryDark,
    borderRadius: 14,
    marginTop: AppSpacing.xs,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
  },
  orLine: {
    height: 1,
    flex: 1,
    backgroundColor: '#D8E0E2',
  },
  orText: {
    color: AppColors.textSecondary,
    fontSize: AppFontSize.sm,
  },
  createButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: AppColors.primaryDark,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppSpacing.sm,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  createButtonText: {
    fontSize: AppFontSize.md,
    color: AppColors.primaryDark,
    fontWeight: '600',
  },
  linkText: {
    fontSize: AppFontSize.sm,
    color: AppColors.primary,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: AppSpacing.xs,
  },
  growthArt: {
    height: 116,
    flexDirection: 'row',
    marginHorizontal: AppSpacing.xs,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    overflow: 'hidden',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
  },
  growthBase: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#DDF3EA',
  },
  growthBar: {
    width: 24,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: '#61B091',
    marginLeft: AppSpacing.sm,
  },
  barOne: { height: 24 },
  barTwo: { height: 38 },
  barThree: { height: 54 },
  barFour: { height: 70 },
  trendIcon: {
    position: 'absolute',
    right: 50,
    bottom: 30,
  },
  coinStack: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 31,
    backgroundColor: '#FFE7A6',
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
