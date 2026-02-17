import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../lib/storage';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { dashboard as api, goals as goalsApi } from '../../lib/api';
import { ProgressBar } from '../../components/ProgressBar';

function formatMoney(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Günaydın,';
  if (h < 18) return 'İyi günler,';
  return 'İyi akşamlar,';
}

// Örnek işlemler (Recent Activity görseli gibi)
const SAMPLE_ACTIVITY = [
  { id: 's1', title: 'Burger King', date: 'Dün, 20:45', amount: -12.4, icon: 'fast-food' },
  { id: 's2', title: 'Annemden transfer', date: 'Dün, 13:20', amount: 50, icon: 'arrow-down-circle' },
  { id: 's3', title: 'Zara', date: '24 Eki, 16:15', amount: -45, icon: 'bag-handle-outline' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newGoalVisible, setNewGoalVisible] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [notifVisible, setNotifVisible] = useState(false);

  const load = async () => {
    try {
      const d = await api.get();
      setData(d);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const balance = Number(data?.balance ?? 0);
  const activeGoals = data?.active_goals ?? [];
  const transactions = data?.recent_transactions ?? [];
  const firstName = data?.full_name?.split(' ')[0] || 'Kullanıcı';

  // AI insight – Hoşgeldin kampanyası
  const aiInsight = 'Hoşgeldin kampanyası 20.000 TL %0 faiz';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {/* Header Section - sticky style */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} onPress={() => router.push('/profile')} activeOpacity={0.8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(data?.full_name || 'A').charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>Merhaba, {firstName}! 👋</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn} onPress={() => setNotifVisible(true)}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.textSecondary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Balance Hero */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceGlow} />
            <View style={styles.balanceInner}>
              <Text style={styles.balanceLabel}>Toplam Birikim</Text>
              <Text style={styles.balanceAmount}>{formatMoney(balance)}</Text>
              <View style={styles.balanceFooter}>
                <View>
                  <Text style={styles.weeklyLabel}>HAFTALIK İLERLEME</Text>
                  <Text style={styles.weeklyValue}>bu hafta +%12,5</Text>
                </View>
                <TouchableOpacity style={styles.detailsBtn} activeOpacity={0.9}>
                  <Text style={styles.detailsBtnText}>Detaylar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickSection}>
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/send')}>
              <View style={styles.quickIconWrap}>
                <Ionicons name="paper-plane" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.quickLabel}>Gönder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn}>
              <View style={styles.quickIconWrap}>
                <Ionicons name="card-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.quickLabel}>İste</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn}>
              <View style={styles.quickIconWrap}>
                <Ionicons name="qr-code-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.quickLabel}>Tara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn}>
              <View style={styles.quickIconWrap}>
                <Ionicons name="add" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.quickLabel}>Daha Fazla</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Aylık Özet */}
        <View style={styles.monthlySummaryWrap}>
          <View style={styles.monthlySummary}>
            <View style={styles.monthlySummaryHeader}>
              <View style={styles.monthlySummaryIconWrap}>
                <Ionicons name="stats-chart" size={18} color="#fff" />
              </View>
              <Text style={styles.monthlySummaryTitle}>Aylık Özet</Text>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardInner}>
                  <Text style={styles.summaryCardLabel}>Otomatik ayrılan</Text>
                  <Text style={styles.summaryCardValue}>2.400 TL</Text>
                </View>
              </View>
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardInner}>
                  <Text style={styles.summaryCardLabel}>Mikro birikim</Text>
                  <Text style={styles.summaryCardValue}>340 TL</Text>
                </View>
              </View>
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardInner}>
                  <Text style={styles.summaryCardLabel}>Cashback</Text>
                  <Text style={[styles.summaryCardValue, styles.summaryCardValueGreen]}>180 TL</Text>
                </View>
              </View>
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardInner}>
                  <Text style={styles.summaryCardLabel}>Borç/Alacak net</Text>
                  <Text style={[styles.summaryCardValue, styles.summaryCardValueRed]}>-250 TL</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Hoşgeldin Kampanyası */}
        <View style={styles.aiSection}>
          <View style={styles.aiCard}>
            <View style={styles.aiIconWrap}>
              <Ionicons name="cash-outline" size={28} color="#fff" />
            </View>
            <View style={styles.aiBody}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiTitle}>Hoşgeldin Kampanyası</Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>Canlı</Text>
                </View>
              </View>
              <Text style={styles.aiText}>{aiInsight}</Text>
            </View>
          </View>
        </View>

        {/* Savings Goals */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Birikim Hedefleri</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
              <Text style={styles.sectionLink}>Tümü</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalsScroll}
          >
            {(activeGoals[0] ? (
              <View key={activeGoals[0].id} style={styles.goalCard}>
                <View style={styles.goalIconWrap}>
                  <Ionicons name="flag" size={22} color="#ca8a04" />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>{activeGoals[0].name || 'Yeni Spor Ayakkabı'}</Text>
                  <Text style={styles.goalProgress}>
                    {formatMoney(Number(activeGoals[0].current_amount || 0))} / {formatMoney(Number(activeGoals[0].target_amount || 0))}
                  </Text>
                </View>
                <ProgressBar
                  progress={activeGoals[0].target_amount ? (Number(activeGoals[0].current_amount) / Number(activeGoals[0].target_amount)) * 100 : 0}
                  height={6}
                  color={COLORS.primary}
                  style={styles.goalBar}
                />
              </View>
            ) : (
              <View style={styles.goalCard}>
                <View style={[styles.goalIconWrap, { backgroundColor: '#fef9c3' }]}>
                  <Ionicons name="flag" size={22} color="#ca8a04" />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>Yeni Spor Ayakkabı</Text>
                  <Text style={styles.goalProgress}>₺120 / ₺160</Text>
                </View>
                <ProgressBar progress={75} height={6} color={COLORS.primary} style={styles.goalBar} />
              </View>
            ))}
            {(activeGoals[1] ? (
              <View key={activeGoals[1].id} style={styles.goalCard}>
                <View style={[styles.goalIconWrap, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="airplane" size={22} color="#2563eb" />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>{activeGoals[1].name || 'Yaz Tatili'}</Text>
                  <Text style={styles.goalProgress}>
                    {formatMoney(Number(activeGoals[1].current_amount || 0))} / {formatMoney(Number(activeGoals[1].target_amount || 0))}
                  </Text>
                </View>
                <ProgressBar
                  progress={activeGoals[1].target_amount ? (Number(activeGoals[1].current_amount) / Number(activeGoals[1].target_amount)) * 100 : 0}
                  height={6}
                  color={COLORS.primary}
                  style={styles.goalBar}
                />
              </View>
            ) : (
              <View style={styles.goalCard}>
                <View style={[styles.goalIconWrap, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="airplane" size={22} color="#2563eb" />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>Yaz Tatili</Text>
                  <Text style={styles.goalProgress}>₺450 / ₺1.200</Text>
                </View>
                <ProgressBar progress={35} height={6} color={COLORS.primary} style={styles.goalBar} />
              </View>
            ))}
            <TouchableOpacity style={styles.newGoalBtn} onPress={() => setNewGoalVisible(true)}>
              <Ionicons name="add-circle-outline" size={28} color={COLORS.textSecondary} />
              <Text style={styles.newGoalText}>Yeni Hedef</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son İşlemler</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>Geçmiş</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            {(transactions.length > 0 ? transactions.slice(0, 5) : SAMPLE_ACTIVITY).map((t) => {
              const isApi = transactions.length > 0 && t.created_at;
              const amount = isApi ? Number(t.amount) : t.amount;
              const title = isApi ? (t.description || t.category || 'İşlem') : t.title;
              const dateStr = isApi
                ? `${new Date(t.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}, ${new Date(t.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
                : t.date;
              const iconName = isApi ? (amount > 0 ? 'arrow-down-circle' : 'cart-outline') : t.icon;
              return (
                <View key={t.id} style={styles.activityRow}>
                  <View style={[styles.activityIcon, amount > 0 && styles.activityIconGreen]}>
                    <Ionicons
                      name={iconName}
                      size={22}
                      color={amount > 0 ? COLORS.primary : COLORS.textSecondary}
                    />
                  </View>
                  <View style={styles.activityBody}>
                    <Text style={styles.activityDesc}>{title}</Text>
                    <Text style={styles.activityDate}>{dateStr}</Text>
                  </View>
                  <Text style={[styles.activityAmount, amount > 0 && styles.activityAmountGreen]}>
                    {amount > 0 ? '+' : ''}{formatMoney(amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

<TouchableOpacity
        style={styles.logoutBtn}
        onPress={async () => {
          await storage.removeItem('token');
          router.replace('/');
        }}
      >
        <Text style={styles.logoutText}>Çıkış yap</Text>
      </TouchableOpacity>
      </ScrollView>

      {/* New Goal Modal */}
      <Modal visible={newGoalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNewGoalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCenter}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Yeni Hedef</Text>
                  <TouchableOpacity onPress={() => setNewGoalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Hedef</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Örn: Yeni bilgisayar"
                    placeholderTextColor={COLORS.textSecondary}
                    value={newGoalName}
                    onChangeText={setNewGoalName}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Hedef tutar (Birikim)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textSecondary}
                    value={newGoalTarget}
                    onChangeText={setNewGoalTarget}
                    keyboardType="decimal-pad"
                  />
                </View>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={async () => {
                    if (!newGoalName.trim()) return;
                    try {
                      await goalsApi.create({
                        name: newGoalName.trim(),
                        target_amount: newGoalTarget ? parseFloat(newGoalTarget.replace(',', '.')) : null,
                        type: 'savings',
                      });
                      setNewGoalVisible(false);
                      setNewGoalName('');
                      setNewGoalTarget('');
                      load();
                    } catch (e) {
                      console.warn(e);
                    }
                  }}
                >
                  <Text style={styles.modalSaveText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Bildirimler Modal */}
      <Modal visible={notifVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotifVisible(false)}
        >
          <TouchableOpacity style={styles.notifModalContent} activeOpacity={1} onPress={() => {}}>
            <View style={styles.notifModalHeader}>
              <Text style={styles.notifModalTitle}>Bildirimler</Text>
              <TouchableOpacity onPress={() => setNotifVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.notifItem} onPress={() => setNotifVisible(false)}>
              <View style={styles.notifItemIcon}>
                <Ionicons name="cash-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.notifItemBody}>
                <Text style={styles.notifItemTitle}>Hoşgeldin Kampanyası</Text>
                <Text style={styles.notifItemText}>20.000 TL %0 faiz fırsatından yararlan. Kampanya detaylarına uygulama içinden ulaşabilirsin.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifItem} onPress={() => setNotifVisible(false)}>
              <View style={styles.notifItemIcon}>
                <Ionicons name="star-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.notifItemBody}>
                <Text style={styles.notifItemTitle}>Nays Hakkında</Text>
                <Text style={styles.notifItemText}>Nays üyeliği ile Seviye 3'e geçebilir, 30 gün birikime dokunmama hedefine ulaşabilirsin. Profil sayfasından Nays'a katıl.</Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 120 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header (sticky style – light bg)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingTop: 48,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,51,153,0.1)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,51,153,0.2)',
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  greeting: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  // Balance Hero
  balanceSection: { padding: SPACING.md },
  balanceCard: {
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  balanceGlow: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,51,153,0.2)',
  },
  balanceInner: { position: 'relative', zIndex: 1 },
  balanceLabel: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 4, letterSpacing: -0.5 },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  weeklyLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', letterSpacing: 1 },
  weeklyValue: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  detailsBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Quick Actions
  quickSection: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickBtn: { flex: 1, alignItems: 'center', gap: 8 },
  quickIconWrap: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 80,
    alignSelf: 'center',
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  // Aylık Özet
  monthlySummaryWrap: { paddingHorizontal: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.sm },
  monthlySummary: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthlySummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  monthlySummaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthlySummaryTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  summaryCard: { width: '50%', padding: 6 },
  summaryCardInner: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: RADIUS.lg,
  },
  summaryCardLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  summaryCardValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  summaryCardValueGreen: { color: COLORS.success },
  summaryCardValueRed: { color: COLORS.error },

  // AI Buddy
  aiSection: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.lg },
  aiCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,51,153,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.2)',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  aiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBody: { flex: 1 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  aiTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  liveBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.2)',
  },
  liveBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  aiText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  // Savings Goals
  goalsSection: { paddingVertical: SPACING.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  sectionLink: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  goalsScroll: { flexDirection: 'row', gap: 16, paddingHorizontal: SPACING.md, paddingRight: SPACING.xl },
  goalCard: {
    minWidth: 160,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  goalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fef9c3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {},
  goalName: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  goalProgress: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  goalBar: { marginTop: 4 },
  newGoalBtn: {
    minWidth: 100,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  newGoalText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary },

  // Recent Activity
  activitySection: { padding: SPACING.md, paddingTop: SPACING.lg },
  activityList: { gap: 12 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconGreen: { backgroundColor: 'rgba(0,51,153,0.15)' },
  activityBody: { flex: 1 },
  activityDesc: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  activityDate: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  activityAmount: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  activityAmountGreen: { color: COLORS.primary },
  emptyActivity: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary },

  logoutBtn: { margin: SPACING.xl, alignItems: 'center' },
  logoutText: { color: COLORS.error, fontSize: 14 },

  // New Goal Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCenter: { justifyContent: 'center', alignItems: 'center' },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalField: { marginBottom: SPACING.lg },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Bildirimler modal
  notifModalContent: {
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  notifModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notifItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,51,153,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifItemBody: { flex: 1 },
  notifItemTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  notifItemText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 19 },
});
