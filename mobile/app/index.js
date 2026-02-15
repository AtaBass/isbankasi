import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { storage } from '../lib/storage';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../constants/theme';
import { auth } from '../lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [register, setRegister] = useState(false);
  const [fullName, setFullName] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Email ve şifre gerekli');
      return;
    }
    if (register && !fullName.trim()) {
      Alert.alert('Hata', 'Ad soyad gerekli');
      return;
    }
    setLoading(true);
    try {
      const data = register
        ? await auth.register({ email: email.trim(), password, full_name: fullName.trim() })
        : await auth.login(email.trim(), password);
      await storage.setItem('token', data.token);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Hata', e.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>İş Bankası</Text>
        <Text style={styles.subtitle}>Genç Mobil Bankacılık</Text>

        {register && (
          <TextInput
            style={styles.input}
            placeholder="Ad Soyad"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{register ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switch}
          onPress={() => setRegister((r) => !r)}
        >
          <Text style={styles.switchText}>
            {register ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesap oluştur'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: SPACING.md,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switch: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.primary,
    fontSize: 14,
  },
});
