import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const BG_LIGHT = '#f5f6f8';
const TEXT_MAIN = '#101318';
const TEXT_MUTED = '#5e6d8d';

const CHAT_SAMPLE = [
  {
    soru: "AVM'deyim, İş Bankası'nın hangi kampanyalarından yararlanabilirim?",
    cevap: "Şu anda seçili yemek markalarında %10 cashback ve bazı giyim mağazalarında 500₺ üzeri harcamaya bonus fırsatı bulunuyor. Ayrıca sinema harcamalarında taksit avantajı var. İstersen sana en avantajlı kampanyayı filtreleyebilirim.",
  },
  {
    soru: 'Bu ay eğlence harcamalarım ne durumda?',
    cevap: "Bu ay eğlence kategorisinde geçen aya göre %18 daha fazla harcama yaptın. Belirlediğin bütçenin 750₺ üzerindesin. İstersen kalan günler için harcama limiti belirleyelim veya tasarruf planı oluşturalım.",
  },
];

export default function AIBuddyScreen() {
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="menu" size={24} color={TEXT_MAIN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İş-Gen AI Buddy</Text>
          <View style={styles.headerBtn} />
        </View>

        {/* AI Avatar & Welcome */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Ionicons name="sparkles" size={48} color={COLORS.primary} />
            </View>
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.heroTitle}>Merhaba, ben senin AI asistanınım</Text>
          <Text style={styles.heroSubtitle}>
            Finanslarını anlık analiz ediyorum. İşte bugünkü bulgular.
          </Text>
        </View>

        {/* Sohbet - Soru / Cevap */}
        <View style={styles.section}>
          <Text style={styles.chatSectionTitle}>Sohbet</Text>
          {CHAT_SAMPLE.map((item, idx) => (
            <View key={idx} style={styles.chatBlock}>
              <Text style={styles.chatSoruLabel}>Soru:</Text>
              <View style={styles.chatSoruBox}>
                <Text style={styles.chatSoruText}>{item.soru}</Text>
              </View>
              <Text style={styles.chatCevapLabel}>Cevap:</Text>
              <View style={styles.chatCevapBox}>
                <Text style={styles.chatCevapText}>{item.cevap}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Sticky: Öneri al / Uyarı yap baloncukları + chat input */}
      <View style={styles.inputSection}>
        <View style={styles.actionBubblesWrap}>
          <TouchableOpacity style={styles.actionBubble} activeOpacity={0.8}>
            <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionBubbleText}>Öneri al</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBubbleWarn} activeOpacity={0.8}>
            <Ionicons name="warning-outline" size={20} color="#b91c1c" />
            <Text style={styles.actionBubbleTextWarn}>Uyarı ver modu</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Finansların hakkında Buddy'ye sor..."
            placeholderTextColor={TEXT_MUTED}
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity style={styles.sendBtn}>
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: BG_LIGHT },
  container: { flex: 1 },
  content: { paddingBottom: 80 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: TEXT_MAIN },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,51,153,0.05)',
  },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,51,153,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.surface,
    overflow: 'hidden',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: TEXT_MAIN },
  heroSubtitle: { fontSize: 14, color: TEXT_MUTED, marginTop: 4, textAlign: 'center', paddingHorizontal: 16 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  chatSectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN, marginBottom: 16 },
  chatBlock: { marginBottom: 24 },
  chatSoruLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  chatSoruBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
  },
  chatSoruText: { fontSize: 14, color: TEXT_MAIN, lineHeight: 20 },
  chatCevapLabel: { fontSize: 12, fontWeight: '700', color: '#16a34a', marginBottom: 6 },
  chatCevapBox: {
    backgroundColor: 'rgba(0,51,153,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.12)',
    padding: 14,
    borderRadius: RADIUS.lg,
  },
  chatCevapText: { fontSize: 14, color: TEXT_MAIN, lineHeight: 22 },
  actionBubblesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  actionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,51,153,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.15)',
  },
  actionBubbleText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  actionBubbleWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(185,28,28,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(185,28,28,0.2)',
  },
  actionBubbleTextWarn: { fontSize: 14, fontWeight: '600', color: '#b91c1c' },
  inputSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG_LIGHT,
    borderRadius: RADIUS.full,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 12,
  },
  input: { flex: 1, paddingVertical: 4, fontSize: 14 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
