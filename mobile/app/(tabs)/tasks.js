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
  ImageBackground,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { tasks as tasksApi, rewards as rewardsApi } from '../../lib/api';
import { getCurrentPasaportLevel, PASAPORT_LEVELS } from '../../lib/pasaportLevel';

const BG_LIGHT = '#f5f6f8';
const BORDER_CARD = '#e5e7eb';
const TEXT_MAIN = '#101318';
const TEXT_MUTED = '#6b7280';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 16;
const CASHBACK_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyHUZnLubQZweMmKm8U73tBEPUNALcmjiGhiTpUnP5dawabnqVa2MN291r8ztRP7JlYli2fKznikmyjLx-QbUrgHOxyBKf0UXKQ9_4dP2Zb3CjJDmrI7KDg7aEu7c4yFPdWVTRifGmFOneCTiqBRmlxu9efbTg-QJP_mq6toth0MSI9WxY1i1hmue3tFqC4eZF7Ip-5n8UgjbZnWladoSUxFfXzGhQDeVu0eBm-Air8a_HMvC6fSmZcET03RDiIryQLVx3r6ljS0qE';
const MOVIE_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRPKC5UlLHAEHde9HA7eCUTgnNEf9HR9ZnANoxv-eGT2mFUyRJ8TBEm4UdIijeXjpdZxnlxrtsFLC9HagzbJJrCWOsqChYVBmu788A8ux_PwUCKmjYD-nt_hT7oUnNY8WqL2-Z2l08mKSHQBok_ZscZ-dnvKO3B6HTMaUbJN-VYTAQ-1pkL5qYyjree8DYdMC6QS12SE_UXrrAjcW-tX1UnL9dQEz1P1tHprcpS0Nq2ppyAD39J2-PC9IGex9TwA4zfYVp3-XfK4sn';
const CONCERT_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXkufq_LLa4QyJGxAKFkmao9tQpBqUoE9JJsmR7xde83UpImzLt0KDaad_XP0javGTA1SInRsDWAzRv_AjHPinXcLBDEvHwieYbKFOzeLy2-6UPkZ_LceVI1zobSLRWREHsEqr7NleRwnPqxsDkRKUJmQIwzFAsoA9zJULjrTry-xQWm3D-VzBxwN2orBIl8ACkHSgFRFBb9tguWaccaSiZsFvXL2iP4FrmXOj1y-NuAUoqzR8rk3tPslYYQS-s5057ZB3jdovfRKs';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CURRENT_DAY_INDEX = 3; // Thursday = 4th (0-based 3)

const ALL_CHALLENGES = [
  { id: 'goal', title: 'Hedef belirle', description: 'İlk hedefini planla', points_reward: 50, icon: 'flag', actionLabel: 'Başla' },
  { id: 'refer', title: 'Arkadaşını davet et', description: 'Çevreni davet et', points_reward: 100, icon: 'person-add', actionLabel: 'Davet et' },
  { id: 'budget', title: 'Bütçe oluştur', description: 'Bu ay harcama limitlerini belirle', points_reward: 75, icon: 'wallet', actionLabel: 'Başla' },
  { id: 'savings', title: 'İlk birikim', description: 'Hedef cebine transfer yap', points_reward: 150, icon: 'trending-up', actionLabel: 'Başla' },
  { id: 'reels', title: 'Reel izle', description: 'Bir eğitim reelini tamamla', points_reward: 25, icon: 'play-circle', actionLabel: 'İzle' },
  { id: 'card', title: 'Kartını bağla', description: 'Ödeme yöntemi ekle', points_reward: 200, icon: 'card', actionLabel: 'Bağla' },
  { id: 'challenge', title: 'Challenge\'a katıl', description: 'Sosyal bir challenge\'da yer al', points_reward: 80, icon: 'trophy', actionLabel: 'Katıl' },
  { id: 'ai', title: 'AI Buddy\'ye sor', description: 'Yapay zeka asistanından öneri al', points_reward: 30, icon: 'sparkles', actionLabel: 'Sor' },
];

function isDemoTaskId(id) {
  const s = String(id);
  return s.length > 0 && !/^\d+$/.test(s);
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [points, setPoints] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [redeemingId, setRedeemingId] = useState(null);
  const [protectedOn, setProtectedOn] = useState(true);
  const [showAllChallenges, setShowAllChallenges] = useState(false);
  const [showPasaportModal, setShowPasaportModal] = useState(false);
  const [redeemedRewardIds, setRedeemedRewardIds] = useState([]);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);

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

  const completeTask = async (task) => {
    const taskId = task?.id ?? task;
    const pointsReward = typeof task === 'object' && task != null ? (task.points_reward ?? 0) : 0;
    setCompletingId(taskId);
    try {
      if (isDemoTaskId(taskId)) {
        setCompletedTaskIds((prev) => (prev.includes(taskId) ? prev : [...prev, taskId]));
        Alert.alert('Tamamlandı!', `Görev tamamlandı. +${pointsReward} puan bakiyene eklendi.`);
      } else {
        await tasksApi.complete(taskId);
        load();
        Alert.alert('Tamamlandı!', `Görev tamamlandı. +${pointsReward} puan bakiyene eklendi.`);
      }
    } catch (e) {
      Alert.alert('Hata', e?.message || 'Bir hata oluştu.');
    } finally {
      setCompletingId(null);
    }
  };

  const rewardItems = [
    { id: '1', name: '10₺ Cashback', desc: 'Cüzdanına anında bakiye kredisi', points_cost: 800, image: CASHBACK_IMG, popular: true },
    { id: '2', name: 'Sinema Bileti', desc: 'Cinema Pass ile istediğin film, istediğin zaman', points_cost: 500, image: MOVIE_IMG, popular: false },
  ];
  const wideReward = { id: '3', name: 'Konser Bileti', desc: 'Canlı müzik giriş bileti', points_cost: 1200, image: CONCERT_IMG };
  const allRewardsList = [...rewardItems, wideReward];

  const spentOnRedeemed = allRewardsList
    .filter((r) => redeemedRewardIds.includes(r.id))
    .reduce((sum, r) => sum + (Number(r.points_cost) || 0), 0);
  const pointsFromCompletedTasks = ALL_CHALLENGES.filter((t) => completedTaskIds.includes(t.id))
    .reduce((sum, t) => sum + (Number(t.points_reward) || 0), 0);
  const totalPts = 1500 + pointsFromCompletedTasks - spentOnRedeemed;

  const redeemReward = async (reward) => {
    const cost = Number(reward.points_cost) || 0;
    if (totalPts < cost) {
      Alert.alert('Yetersiz puan', 'Bu ödülü kullanmak için daha fazla puan gerekli.');
      return;
    }
    setRedeemingId(reward.id);
    try {
      await rewardsApi.redeem(reward.id);
      setRedeemedRewardIds((prev) => (prev.includes(reward.id) ? prev : [...prev, reward.id]));
      load();
      Alert.alert('Kullanıldı!', `${reward.name} ödüllerine eklendi.`);
    } catch (e) {
      const isInsufficientPoints = (e?.message || '').toLowerCase().includes('yetersiz') || (e?.message || '').toLowerCase().includes('puan');
      if (isInsufficientPoints && totalPts >= cost) {
        setRedeemedRewardIds((prev) => (prev.includes(reward.id) ? prev : [...prev, reward.id]));
        load();
        Alert.alert('Kullanıldı!', `${reward.name} ödüllerine eklendi.`);
      } else {
        Alert.alert('Hata', e?.message || 'Bir hata oluştu.');
      }
    } finally {
      setRedeemingId(null);
    }
  };

  const levelInfo = getCurrentPasaportLevel();
  const activeTasks = Array.isArray(tasks) ? tasks.filter((t) => !t.completed) : [];
  const baseMissions = activeTasks.length > 0 ? activeTasks : ALL_CHALLENGES.slice(0, 2);
  const missionList = baseMissions.filter((t) => !completedTaskIds.includes(t.id));
  const allChallengesList = activeTasks.length > 0 ? [...activeTasks, ...ALL_CHALLENGES.filter((c) => !activeTasks.some((t) => t.id === c.id))] : ALL_CHALLENGES;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {/* Header: başlık + seviye (tıklanabilir) + puan */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Görevler ve Ödüller</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.levelBadge}
              onPress={() => setShowPasaportModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.levelBadgeText}>{levelInfo.title}</Text>
              <Text style={styles.levelBadgeSub}>Seviye {levelInfo.level}</Text>
            </TouchableOpacity>
            <View style={styles.pointsPill}>
              <Ionicons name="card" size={20} color={COLORS.primary} />
              <Text style={styles.pointsPillText}>{totalPts.toLocaleString('tr-TR')} puan</Text>
            </View>
          </View>
        </View>

        {/* 7-Day Streak */}
        <View style={styles.section}>
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View style={styles.streakTitleRow}>
                <Ionicons name="flame" size={24} color={COLORS.primary} />
                <Text style={styles.streakTitle}>7 Günlük Seri</Text>
              </View>
              <View style={styles.protectedBadge}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
                <Text style={styles.protectedText}>Korumalı</Text>
                <TouchableOpacity
                  style={[styles.toggleTrack, protectedOn && styles.toggleTrackOn]}
                  onPress={() => setProtectedOn(!protectedOn)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toggleThumb, protectedOn && styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.daysRow}>
              {DAY_LABELS.flatMap((label, i) => {
                const isDone = i < CURRENT_DAY_INDEX;
                const isCurrent = i === CURRENT_DAY_INDEX;
                const isFuture = i > CURRENT_DAY_INDEX;
                const connectorToRightDone = isDone && i + 1 <= CURRENT_DAY_INDEX;
                const dayEl = (
                  <View key={`day-${i}`} style={styles.dayBlock}>
                    <View style={[
                      styles.dayCircle,
                      isDone && styles.dayCircleDone,
                      isCurrent && styles.dayCircleCurrent,
                      isFuture && styles.dayCircleFuture,
                    ]}>
                      {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
                      {isCurrent && <Text style={styles.dayCircleCurrentText}>4</Text>}
                      {isFuture && <Text style={styles.dayCircleFutureText}>{i + 1}</Text>}
                    </View>
                    <Text style={[styles.dayLabel, isCurrent && styles.dayLabelCurrent]}>{label}</Text>
                  </View>
                );
                const connEl = i < DAY_LABELS.length - 1 ? (
                  <View key={`conn-${i}`} style={[styles.connector, connectorToRightDone ? styles.connectorDone : styles.connectorFuture]} />
                ) : null;
                return connEl ? [dayEl, connEl] : [dayEl];
              })}
            </View>
          </View>
        </View>

        {/* Aktif Görevler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aktif Görevler</Text>
            <TouchableOpacity onPress={() => setShowAllChallenges(true)}>
              <Text style={styles.viewAll}>Tümünü gör</Text>
            </TouchableOpacity>
          </View>
          {missionList.slice(0, 4).map((task) => (
            <View key={task.id} style={styles.missionCard}>
              <View style={styles.missionIconWrap}>
                <Ionicons name={task.icon || 'flag'} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.missionBody}>
                <Text style={styles.missionTitle}>{task.title}</Text>
                <Text style={styles.missionDesc}>{task.description}</Text>
              </View>
              <View style={styles.missionRight}>
                <Text style={styles.missionPts}>+{task.points_reward} puan</Text>
                <TouchableOpacity
                  style={styles.missionBtn}
                  onPress={() => completeTask(task)}
                  disabled={completingId === task.id}
                >
                  {completingId === task.id ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.missionBtnText}>{task.actionLabel || 'Başla'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Ödül Mağazası */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödül Mağazası</Text>
          <View style={styles.rewardsGrid}>
            {rewardItems.map((r) => (
              <View key={r.id} style={styles.rewardCard}>
                <View style={styles.rewardCardTop}>
                  <ImageBackground source={{ uri: r.image }} style={styles.rewardImage} resizeMode="cover">
                    <View style={styles.rewardImageOverlay} />
                    {r.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>POPÜLER</Text>
                      </View>
                    )}
                  </ImageBackground>
                </View>
                <View style={styles.rewardCardBody}>
                  <Text style={styles.rewardName} numberOfLines={1}>{r.name}</Text>
                  <Text style={styles.rewardDesc} numberOfLines={2}>{r.desc}</Text>
                  <View style={styles.rewardFooter}>
                    <Text style={styles.rewardPts}>{r.points_cost} puan</Text>
                    {redeemedRewardIds.includes(r.id) ? (
                      <View style={styles.redeemedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                        <Text style={styles.redeemedBadgeText}>Ödül Alındı</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.cartBtn}
                        onPress={() => redeemReward(r)}
                        disabled={redeemingId === r.id}
                      >
                        <Ionicons name="cart" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.rewardCardWide}>
            <ImageBackground source={{ uri: wideReward.image }} style={styles.rewardWideLeft} resizeMode="cover">
              <View style={styles.rewardWideLeftOverlay} />
            </ImageBackground>
            <View style={styles.rewardWideRight}>
              <Text style={styles.rewardNameWide}>{wideReward.name}</Text>
              <Text style={styles.rewardDescWide}>{wideReward.desc}</Text>
              <View style={styles.rewardFooterWide}>
                <Text style={styles.rewardPts}>{wideReward.points_cost} puan</Text>
                {redeemedRewardIds.includes(wideReward.id) ? (
                  <View style={styles.redeemedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.redeemedBadgeText}>Ödül Alındı</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.redeemBtn}
                    onPress={() => redeemReward(wideReward)}
                    disabled={redeemingId === wideReward.id}
                  >
                    <Ionicons name="gift" size={14} color={TEXT_MAIN} />
                    <Text style={styles.redeemBtnText}>Kullan</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Tüm challenge'lar modal */}
      <Modal
        visible={showAllChallenges}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAllChallenges(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAllChallenges(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tüm Görevler</Text>
              <TouchableOpacity onPress={() => setShowAllChallenges(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={28} color={TEXT_MAIN} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {allChallengesList.map((task) => {
                const isCompleted = completedTaskIds.includes(task.id) || (task.completed === true);
                return (
                  <View key={task.id} style={styles.missionCard}>
                    <View style={styles.missionIconWrap}>
                      <Ionicons name={task.icon || 'flag'} size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.missionBody}>
                      <Text style={styles.missionTitle}>{task.title}</Text>
                      <Text style={styles.missionDesc}>{task.description}</Text>
                    </View>
                    <View style={styles.missionRight}>
                      <Text style={styles.missionPts}>+{task.points_reward} puan</Text>
                      {isCompleted ? (
                        <View style={styles.redeemedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                          <Text style={styles.redeemedBadgeText}>Tamamlandı</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.missionBtn}
                          onPress={() => { setShowAllChallenges(false); completeTask(task); }}
                          disabled={completingId === task.id}
                        >
                          {completingId === task.id ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <Text style={styles.missionBtnText}>{task.actionLabel || 'Başla'}</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Finansal Pasaport modal - seviye kutusuna tıklanınca */}
      <Modal
        visible={showPasaportModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasaportModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPasaportModal(false)}>
          <Pressable style={styles.pasaportModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pasaportModalHeader}>
              <View style={styles.pasaportTitleRow}>
                <Ionicons name="trophy" size={22} color={COLORS.primary} />
                <Text style={styles.pasaportModalTitle}>Finansal Pasaport</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPasaportModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={28} color={TEXT_MAIN} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pasaportModalScroll} contentContainerStyle={styles.pasaportModalScrollContent} showsVerticalScrollIndicator={false}>
              {PASAPORT_LEVELS.map((item) => (
                <View key={item.level} style={styles.pasaportRow}>
                  <View style={styles.pasaportLeft}>
                    <Text style={styles.pasaportLevelNum}>{item.level}</Text>
                    <View>
                      <Text style={styles.pasaportLevelTitle}>{item.title}</Text>
                      <Text style={styles.pasaportLevelDesc}>{item.desc}</Text>
                    </View>
                  </View>
                  {item.done ? (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  ) : (
                    <View style={styles.pasaportCircle} />
                  )}
                </View>
              ))}
              <View style={styles.pasaportRewardsBox}>
                <View style={styles.pasaportRewardsTitleRow}>
                  <Ionicons name="gift" size={18} color={COLORS.primary} />
                  <Text style={styles.pasaportRewardsTitle}>Seviye Ödülleri</Text>
                </View>
                <Text style={styles.pasaportRewardsDesc}>
                  Seviye arttıkça cashback oranın artar, daha iyi kampanyalar açılır!
                </Text>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingVertical: 18,
    paddingTop: 20,
    gap: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,51,153,0.1)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelBadge: {
    backgroundColor: 'rgba(0,51,153,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.15)',
    alignItems: 'center',
    minWidth: 72,
  },
  levelBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  levelBadgeSub: { fontSize: 9, color: TEXT_MUTED },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,51,153,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.2)',
  },
  pointsPillText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_CARD,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN },
  modalCloseBtn: { padding: 4 },
  modalScroll: { maxHeight: 400 },
  modalScrollContent: { padding: CARD_PADDING, paddingBottom: 32 },
  pasaportModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '85%',
  },
  pasaportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_CARD,
  },
  pasaportTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pasaportModalTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN },
  pasaportModalScroll: { maxHeight: 420 },
  pasaportModalScrollContent: { padding: CARD_PADDING, paddingBottom: 32 },
  pasaportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER_CARD,
  },
  pasaportLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pasaportLevelNum: { fontSize: 16, fontWeight: '700', color: COLORS.primary, minWidth: 24, textAlign: 'center' },
  pasaportLevelTitle: { fontSize: 15, fontWeight: '600', color: TEXT_MAIN },
  pasaportLevelDesc: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  pasaportCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: BORDER_CARD },
  pasaportRewardsBox: {
    backgroundColor: 'rgba(0,51,153,0.06)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.1)',
  },
  pasaportRewardsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pasaportRewardsTitle: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  pasaportRewardsDesc: { fontSize: 13, color: TEXT_MUTED, lineHeight: 20 },
  section: { paddingHorizontal: CARD_PADDING, marginTop: 8, marginBottom: 24 },
  streakCard: {
    backgroundColor: 'rgba(0,51,153,0.05)',
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.1)',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  streakTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakTitle: { fontSize: 20, fontWeight: '700', fontStyle: 'italic', color: TEXT_MAIN },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  protectedText: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
  toggleTrack: {
    width: 32,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    marginLeft: 8,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: { backgroundColor: 'rgba(0,51,153,0.2)' },
  toggleThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9ca3af',
  },
  toggleThumbOn: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayBlock: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleDone: {
    backgroundColor: COLORS.primary,
    borderStyle: 'solid',
    borderColor: COLORS.primary,
  },
  dayCircleCurrent: {
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: COLORS.surface,
    borderStyle: 'solid',
  },
  dayCircleCurrentText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  dayCircleFuture: {},
  dayCircleFutureText: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
  dayLabel: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED, marginTop: 8 },
  dayLabelCurrent: { color: COLORS.primary },
  connector: {
    height: 2,
    borderRadius: 1,
    flex: 1,
    minWidth: 4,
    marginHorizontal: 2,
  },
  connectorDone: { backgroundColor: COLORS.primary },
  connectorFuture: { backgroundColor: COLORS.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN, marginBottom: 12 },
  viewAll: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: BORDER_CARD,
    marginBottom: 12,
  },
  missionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(0,51,153,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionBody: { flex: 1, marginLeft: 16 },
  missionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  missionDesc: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  missionRight: { alignItems: 'flex-end' },
  missionPts: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  missionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    minWidth: 64,
    alignItems: 'center',
  },
  missionBtnText: { fontSize: 10, fontWeight: '700', color: TEXT_MAIN, letterSpacing: 0.5 },
  rewardsGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  rewardCard: {
    flex: 1,
    maxWidth: (SCREEN_WIDTH - CARD_PADDING * 2 - 16) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: BORDER_CARD,
    overflow: 'hidden',
  },
  rewardCardTop: { height: 112, backgroundColor: 'rgba(0,51,153,0.2)' },
  rewardImage: { flex: 1 },
  rewardImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,51,153,0.2)' },
  popularBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '700', color: TEXT_MAIN },
  rewardCardBody: { padding: 12 },
  rewardName: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  rewardDesc: { fontSize: 10, color: TEXT_MUTED, marginTop: 4 },
  rewardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  rewardPts: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  cartBtn: {
    backgroundColor: TEXT_MAIN,
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redeemedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  redeemedBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.success },
  rewardCardWide: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: BORDER_CARD,
    overflow: 'hidden',
  },
  rewardWideLeft: { width: '33%', minHeight: 96 },
  rewardWideLeftOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,51,153,0.3)' },
  rewardWideRight: { flex: 1, padding: 12, justifyContent: 'center' },
  rewardNameWide: { fontSize: 14, fontWeight: '700', color: TEXT_MAIN },
  rewardDescWide: { fontSize: 10, color: TEXT_MUTED, marginTop: 2 },
  rewardFooterWide: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
  },
  redeemBtnText: { fontSize: 12, fontWeight: '700', color: TEXT_MAIN },
});
