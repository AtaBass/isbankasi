import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { tasks as tasksApi, rewards as rewardsApi } from '../../lib/api';

const BG_LIGHT = '#f5f6f8';
const BORDER_CARD = '#dadee7';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 16;

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [points, setPoints] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [redeemingId, setRedeemingId] = useState(null);

  const load = async () => {
    try {
      const [t, r, p] = await Promise.all([
        tasksApi.list().catch(() => []),
        rewardsApi.list().catch(() => []),
        rewardsApi.myPoints().catch(() => null),
      ]);
      setTasks(t);
      setRewards(r);
      setPoints(p);
    } catch (e) {
      console.warn(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const completeTask = async (id) => {
    setCompletingId(id);
    try {
      await tasksApi.complete(id);
      load();
      Alert.alert('Done!', 'Mission completed. Points added to your balance.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setCompletingId(null);
    }
  };

  const redeemReward = async (reward) => {
    if ((points?.available_points ?? 0) < reward.points_cost) {
      Alert.alert('Not enough points', 'You need more points to redeem this reward.');
      return;
    }
    setRedeemingId(reward.id);
    try {
      await rewardsApi.redeem(reward.id);
      load();
      Alert.alert('Redeemed!', `${reward.name} has been added to your rewards.`);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setRedeemingId(null);
    }
  };

  const totalPts = points?.available_points ?? 12450;
  const streakDays = points?.current_streak_days ?? 7;
  const activeTasks = Array.isArray(tasks) ? tasks.filter((t) => !t.completed) : [];
  const defaultTasks = [
    { id: 'goal', title: 'Set a new goal', description: 'Plan your savings for the month', points_reward: 200, completed: false, icon: 'flag' },
    { id: 'refer', title: 'Refer a friend', description: 'Invite someone to join İş-Gen', points_reward: 500, completed: false, icon: 'person-add' },
  ];
  const missionList = activeTasks.length > 0 ? activeTasks : defaultTasks;

  const defaultRewards = [
    { id: '1', name: '50 TL Cashback', category: 'Cashback', points_cost: 5000, gradient: 'blue', icon: 'card' },
    { id: '2', name: 'Any Movie Ticket', category: 'Entertainment', points_cost: 3500, gradient: 'rose', icon: 'film' },
    { id: '3', name: 'Exclusive Concert Tickets', category: 'Premium Event', points_cost: 15000, gradient: 'purple', icon: 'musical-notes', fullWidth: true },
  ];
  const rewardList = rewards.length > 0 ? rewards : defaultRewards;
  const gridRewards = rewardList.slice(0, 2);
  const wideReward = rewardList.length > 2 ? rewardList[2] : rewardList.find((r) => r.fullWidth) || null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tasks & Rewards</Text>
          </View>
          <View style={styles.pointsPill}>
            <Ionicons name="server" size={16} color={COLORS.primary} />
            <Text style={styles.pointsPillText}>{totalPts.toLocaleString()} pts</Text>
          </View>
        </View>

        {/* Daily Streak */}
        <View style={styles.section}>
          <View style={styles.streakCard}>
            <View style={styles.streakBgIcon}>
              <Ionicons name="flame" size={120} color="rgba(249,115,22,0.05)" />
            </View>
            <View style={styles.streakRow}>
              <View style={styles.streakLeft}>
                <Text style={styles.streakLabel}>Daily Streak</Text>
                <Text style={styles.streakValue}>{streakDays} Days Streak</Text>
                <Text style={styles.streakDesc}>You're on fire! Keep it up to earn bonus multipliers.</Text>
              </View>
              <View style={styles.streakRingWrap}>
                <View style={styles.streakRingOuter} />
                <View style={styles.streakRingInner}>
                  <Ionicons name="flame" size={32} color={COLORS.orange} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Streak Protection */}
        <View style={styles.section}>
          <View style={styles.protectionCard}>
            <View style={styles.protectionRow}>
              <View style={styles.protectionIconWrap}>
                <Ionicons name="shield-checkmark" size={28} color="#ea580c" />
              </View>
              <View style={styles.protectionText}>
                <Text style={styles.protectionTitle}>Streak Protection Active!</Text>
                <Text style={styles.protectionDesc}>Don't let your {streakDays}-day progress reset. Tap below!</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.quickCheckInBtn}>
              <Text style={styles.quickCheckInBtnText}>✨ Quick Check-In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Missions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Missions</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          {missionList.slice(0, 4).map((task) => (
            <View key={task.id} style={styles.missionCard}>
              <View style={styles.missionLeft}>
                <View style={styles.missionIconWrap}>
                  <Ionicons name={task.icon || 'flag'} size={22} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.missionTitle}>{task.title}</Text>
                  <Text style={styles.missionDesc}>{task.description}</Text>
                </View>
              </View>
              <View style={styles.missionRight}>
                <Text style={styles.missionPts}>+{task.points_reward} pts</Text>
                <TouchableOpacity
                  style={styles.completeMissionBtn}
                  onPress={() => completeTask(task.id)}
                  disabled={completingId === task.id}
                >
                  {completingId === task.id ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.completeMissionBtnText}>Complete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Rewards Store */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rewards Store</Text>
            <TouchableOpacity><Ionicons name="cart" size={22} color="#9ca3af" /></TouchableOpacity>
          </View>
          <View style={styles.rewardsGrid}>
            {gridRewards.map((r) => (
              <View key={r.id} style={styles.rewardCard}>
                <View style={[styles.rewardCardTop, (r.gradient === 'rose' || gridRewards.indexOf(r) === 1) ? styles.rewardTopRose : styles.rewardTopBlue]}>
                  <Ionicons name={r.icon === 'film' ? 'film' : 'card'} size={32} color="#fff" />
                </View>
                <View style={styles.rewardCardBody}>
                  <Text style={styles.rewardCategory}>{r.category}</Text>
                  <Text style={styles.rewardName}>{r.name}</Text>
                  <View style={styles.rewardFooter}>
                    <Text style={styles.rewardPts}>{r.points_cost?.toLocaleString()} pts</Text>
                    <TouchableOpacity
                      style={styles.redeemBtnOutline}
                      onPress={() => redeemReward(r)}
                      disabled={redeemingId === r.id}
                    >
                      <Text style={styles.redeemBtnOutlineText}>Redeem</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
          {wideReward && (
            <View key={wideReward.id} style={styles.rewardCardWide}>
              <View style={styles.rewardCardWideLeft}>
                <Ionicons name="musical-notes" size={48} color="#fff" />
              </View>
              <View style={styles.rewardCardWideRight}>
                <Text style={styles.rewardCategory}>{(wideReward.category || 'Premium Event').toUpperCase()}</Text>
                <Text style={styles.rewardNameWide}>{wideReward.name}</Text>
                <Text style={styles.rewardDesc}>Access to top musical performances</Text>
                <View style={styles.rewardFooterWide}>
                  <Text style={styles.rewardPts}>{(wideReward.points_cost ?? 15000).toLocaleString()} pts</Text>
                  <TouchableOpacity
                    style={styles.redeemBtnSolid}
                    onPress={() => redeemReward(wideReward)}
                    disabled={redeemingId === wideReward.id}
                  >
                    <Text style={styles.redeemBtnSolidText}>Redeem</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: BG_LIGHT },
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_CARD,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101318' },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,51,153,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  pointsPillText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  section: { paddingHorizontal: CARD_PADDING, marginBottom: 24 },
  streakCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER_CARD,
    overflow: 'hidden',
    position: 'relative',
  },
  streakBgIcon: { position: 'absolute', right: -16, bottom: -16, opacity: 0.2 },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streakLeft: { flex: 1 },
  streakLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  streakValue: { fontSize: 28, fontWeight: '700', color: '#101318', marginTop: 4 },
  streakDesc: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  streakRingWrap: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  streakRingOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fed7aa',
  },
  streakRingInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.orange,
  },
  protectionCard: {
    borderRadius: RADIUS['2xl'],
    borderWidth: 2,
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
    padding: 20,
  },
  protectionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  protectionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  protectionTitle: { fontSize: 14, fontWeight: '700', color: '#9a3412' },
  protectionDesc: { fontSize: 12, color: '#9a3412', opacity: 0.9, marginTop: 2 },
  quickCheckInBtn: {
    backgroundColor: COLORS.orange,
    paddingVertical: 14,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  },
  quickCheckInBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#101318' },
  viewAll: { fontSize: 12, fontWeight: '500', color: COLORS.primary },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: BORDER_CARD,
    marginBottom: 12,
  },
  missionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  missionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionTitle: { fontSize: 14, fontWeight: '700', color: '#101318' },
  missionDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  missionRight: { alignItems: 'flex-end' },
  missionPts: { fontSize: 14, fontWeight: '700', color: '#16a34a', marginBottom: 4 },
  completeMissionBtn: {
    backgroundColor: 'rgba(0,51,153,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  completeMissionBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  rewardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  rewardCard: {
    width: (SCREEN_WIDTH - CARD_PADDING * 2 - 16) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: BORDER_CARD,
    overflow: 'hidden',
  },
  rewardCardTop: { height: 112, justifyContent: 'center', alignItems: 'center' },
  rewardTopBlue: { backgroundColor: '#60a5fa' },
  rewardTopRose: { backgroundColor: '#fb7185' },
  rewardCardBody: { padding: 12 },
  rewardCategory: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  rewardName: { fontSize: 14, fontWeight: '700', color: '#101318', marginTop: 2 },
  rewardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  rewardPts: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  redeemBtnOutline: {
    backgroundColor: 'rgba(0,51,153,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  redeemBtnOutlineText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  rewardCardWide: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: BORDER_CARD,
    overflow: 'hidden',
    marginTop: 16,
  },
  rewardCardWideLeft: {
    width: '33%',
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  rewardCardWideRight: { flex: 1, padding: 16, justifyContent: 'center' },
  rewardNameWide: { fontSize: 16, fontWeight: '700', color: '#101318', marginTop: 2 },
  rewardDesc: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  rewardFooterWide: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  redeemBtnSolid: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  redeemBtnSolidText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
