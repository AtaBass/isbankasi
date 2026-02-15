import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../lib/storage';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { dashboard as api } from '../../lib/api';
import { ProgressBar } from '../../components/ProgressBar';

function formatMoney(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

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
  const activeGoal = data?.active_goals?.[0];
  const goalProgress = activeGoal && activeGoal.target_amount
    ? (Number(activeGoal.current_amount) / Number(activeGoal.target_amount)) * 100
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }
    >
      {/* Header + Balance (template: gradient block with rounded-b-[3rem]) */}
      <View style={styles.headerBlock}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(data?.full_name || 'A').charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>Hey, {data?.full_name?.split(' ')[0] || 'Alex'}! 👋</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <View>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notifDot} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Total Balance Card (inside header in template) */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceDeco} />
          <View style={styles.balanceInner}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity onPress={() => setBalanceVisible((v) => !v)}>
                <Ionicons name={balanceVisible ? 'eye' : 'eye-off'} size={22} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? formatMoney(balance) : '••••••'}
              </Text>
              <Text style={styles.balanceCurrency}>TRY</Text>
            </View>
            <View style={styles.growthPillWrap}>
              <View style={styles.growthPill}>
                <Ionicons name="trending-up" size={12} color="#22c55e" />
                <Text style={styles.growthText}>+12% this month</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions (template: -mt-8 overlap, primary/10 icon bg) */}
      <View style={styles.quickActionsWrap}>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="paper-plane" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="card-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Request</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="qr-code-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* At a Glance (template: horizontal scroll, 3 cards) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>At a Glance</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.glanceScroll}>
          <View style={styles.glanceCard}>
            <View style={styles.glanceIconWrapOrange}>
              <Ionicons name="star" size={20} color={COLORS.orange} />
            </View>
            <Text style={styles.glanceCardLabel}>Goal: {activeGoal?.name || 'New PC'}</Text>
            <Text style={styles.glanceCardValue}>
              {activeGoal ? formatMoney(Number(activeGoal.current_amount)) : '₺0'} / {activeGoal?.target_amount ? formatMoney(Number(activeGoal.target_amount)) : '₺1.2k'}
            </Text>
            <ProgressBar progress={goalProgress} height={6} color={COLORS.orange} style={styles.glanceBar} />
          </View>
          <View style={styles.glanceCard}>
            <View style={styles.glanceIconWrapBlue}>
              <Ionicons name="sparkles" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.glanceCardLabel}>AI Buddy</Text>
            <Text style={styles.glanceStreak}>Saving streak! {data?.points?.streak_days ?? 0} days in a row.</Text>
          </View>
          <View style={styles.glanceCard}>
            <View style={styles.glanceIconWrapPurple}>
              <Ionicons name="people" size={20} color={COLORS.purple} />
            </View>
            <Text style={styles.glanceCardLabel}>Summer Trip Jar</Text>
            <View style={styles.jarAvatars}>
              <View style={[styles.jarAvatar, styles.jarAvatar1]}><Text style={styles.jarAvatarText}>A</Text></View>
              <View style={[styles.jarAvatar, styles.jarAvatar2]}><Text style={styles.jarAvatarText}>B</Text></View>
              <View style={styles.jarAvatarPlus}><Text style={styles.jarAvatarPlusText}>+3</Text></View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Your Activity (template: divide-y list) */}
      <View style={styles.section}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>
      {(data?.recent_transactions || []).length === 0 ? (
        <View style={styles.emptyActivity}>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <View style={styles.activityCard}>
          {data.recent_transactions.slice(0, 5).map((t, i) => (
            <View key={t.id}>
              <View style={styles.activityRow}>
                <View style={[styles.activityIcon, t.amount > 0 && styles.activityIconGreen]}>
                  <Ionicons
                    name={t.amount > 0 ? 'add-circle' : 'bag-handle-outline'}
                    size={22}
                    color={t.amount > 0 ? '#22c55e' : COLORS.textSecondary}
                  />
                </View>
                <View style={styles.activityBody}>
                  <Text style={styles.activityDesc}>{t.description || t.category || t.type}</Text>
                  <Text style={styles.activityDate}>
                    {new Date(t.created_at).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}, {new Date(t.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.activityAmount, t.amount > 0 ? styles.activityAmountGreen : styles.activityAmountRed]}>
                  {t.amount > 0 ? '+' : ''}{formatMoney(Number(t.amount))}
                </Text>
              </View>
              {i < Math.min(4, data.recent_transactions.length - 1) && <View style={styles.activityDivider} />}
            </View>
          ))}
        </View>
      )}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBlock: {
    backgroundColor: COLORS.primary,
    paddingTop: 40,
    paddingBottom: 64,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS['3xl'],
    borderBottomRightRadius: RADIUS['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  greeting: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', letterSpacing: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    padding: 28,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  balanceDeco: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  balanceInner: { position: 'relative', zIndex: 1 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '700' },
  balanceCurrency: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  growthPillWrap: { flexDirection: 'row', marginTop: 16 },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  growthText: { color: '#22c55e', fontSize: 10, fontWeight: '700' },
  quickActionsWrap: { marginTop: -32, paddingHorizontal: SPACING.lg, zIndex: 2 },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.06)',
  },
  quickAction: { flex: 1, alignItems: 'center', gap: 8 },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,51,153,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: { fontSize: 12, color: COLORS.text, fontWeight: '700' },
  section: { marginTop: 32, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#101318', marginBottom: 16 },
  glanceScroll: { flexDirection: 'row', gap: 16, paddingRight: SPACING.lg },
  glanceCard: {
    minWidth: 170,
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.06)',
  },
  glanceIconWrapOrange: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  glanceIconWrapBlue: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  glanceIconWrapPurple: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  glanceCardLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  glanceCardValue: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  glanceBar: { marginTop: 8 },
  glanceStreak: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  jarAvatars: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  jarAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  jarAvatar1: { backgroundColor: '#86efac', marginLeft: 0 },
  jarAvatar2: { backgroundColor: '#93c5fd', marginLeft: -8 },
  jarAvatarText: { fontSize: 10, fontWeight: '700', color: COLORS.text },
  jarAvatarPlus: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginLeft: -8 },
  jarAvatarPlusText: { fontSize: 8, fontWeight: '700', color: COLORS.textSecondary },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAll: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  emptyActivity: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary },
  activityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityDivider: { height: 1, backgroundColor: COLORS.border },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconGreen: { backgroundColor: '#dcfce7' },
  activityBody: { flex: 1 },
  activityDesc: { fontWeight: '700', color: '#101318', fontSize: 14 },
  activityDate: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, textTransform: 'uppercase' },
  activityAmount: { fontWeight: '700', color: '#101318', fontSize: 14 },
  activityAmountGreen: { color: '#22c55e' },
  activityAmountRed: { color: '#101318' },
  logoutBtn: { margin: SPACING.xl, alignItems: 'center' },
  logoutText: { color: COLORS.error, fontSize: 14 },
});
