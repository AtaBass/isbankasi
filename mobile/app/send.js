import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function SendScreen() {
  const router = useRouter();
  const [iban, setIban] = useState('');
  const [fullName, setFullName] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = () => {
    // TODO: API ile havale işlemi
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Para Gönder</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>IBAN</Text>
          <TextInput
            style={styles.input}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            placeholderTextColor={COLORS.textSecondary}
            value={iban}
            onChangeText={setIban}
            keyboardType="default"
            autoCapitalize="characters"
            maxLength={32}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>İsim - Soyisim</Text>
          <TextInput
            style={styles.input}
            placeholder="Alıcı adı soyadı"
            placeholderTextColor={COLORS.textSecondary}
            value={fullName}
            onChangeText={setFullName}
            keyboardType="default"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tutar</Text>
          <TextInput
            style={styles.input}
            placeholder="0,00"
            placeholderTextColor={COLORS.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, (!iban || !fullName || !amount) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!iban || !fullName || !amount}
        >
          <Text style={styles.sendBtnText}>Gönder</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  headerRight: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: 40 },
  field: { marginBottom: SPACING.xl },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  sendBtn: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.textSecondary, opacity: 0.7 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
