import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Switch,
  PanResponder,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { goals as api } from '../../lib/api';
import { ProgressBar } from '../../components/ProgressBar';

function formatMoney(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moneySplitterOn, setMoneySplitterOn] = useState(true);
  const [splits, setSplits] = useState([
    { id: '1', name: 'Hesap', pct: 50 },
    { id: '2', name: 'Yatırım fonu', pct: 30 },
    { id: '3', name: 'Tatil hedefi', pct: 20 },
  ]);
  const [roundUpEnabled, setRoundUpEnabled] = useState(true);
  const [roundUpMultiplier, setRoundUpMultiplier] = useState(2);
  const roundUpSliderWidth = useRef(0);
  const ROUND_UP_MIN = 1;
  const ROUND_UP_MAX = 5;
  const ROUND_UP_STEP = 0.5;

  const roundUpStartValue = useRef(2);
  const roundUpPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const w = roundUpSliderWidth.current;
        if (w <= 0) return;
        const x = e.nativeEvent.locationX;
        const pct = Math.max(0, Math.min(1, x / w));
        const raw = ROUND_UP_MIN + pct * (ROUND_UP_MAX - ROUND_UP_MIN);
        const stepped = Math.round(raw / ROUND_UP_STEP) * ROUND_UP_STEP;
        const val = Math.max(ROUND_UP_MIN, Math.min(ROUND_UP_MAX, stepped));
        roundUpStartValue.current = val;
        setRoundUpMultiplier(val);
      },
      onPanResponderMove: (e, g) => {
        const w = roundUpSliderWidth.current;
        if (w <= 0) return;
        const deltaPct = g.dx / w;
        const deltaVal = deltaPct * (ROUND_UP_MAX - ROUND_UP_MIN);
        const raw = roundUpStartValue.current + deltaVal;
        const stepped = Math.round(raw / ROUND_UP_STEP) * ROUND_UP_STEP;
        setRoundUpMultiplier(Math.max(ROUND_UP_MIN, Math.min(ROUND_UP_MAX, stepped)));
      },
    })
  ).current;

  const onRoundUpSliderLayout = (e) => {
    roundUpSliderWidth.current = e.nativeEvent.layout.width;
  };

  const onRoundUpSliderPress = (e) => {
    const w = roundUpSliderWidth.current;
    if (w <= 0) return;
    const x = e.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / w));
    const raw = ROUND_UP_MIN + pct * (ROUND_UP_MAX - ROUND_UP_MIN);
    const stepped = Math.round(raw / ROUND_UP_STEP) * ROUND_UP_STEP;
    setRoundUpMultiplier(Math.max(ROUND_UP_MIN, Math.min(ROUND_UP_MAX, stepped)));
  };
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [notifVisible, setNotifVisible] = useState(false);

  const totalSplitPct = splits.reduce((s, x) => s + x.pct, 0);

  const updateSplitPct = (id, newPct) => {
    const n = Math.max(0, Math.min(100, Number(newPct) || 0));
    setSplits((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx < 0) return prev;
      const oldPct = prev[idx].pct;
      const othersSum = prev.reduce((s, x) => s + x.pct, 0) - oldPct;
      if (othersSum <= 0) return prev.map((x) => (x.id === id ? { ...x, pct: n } : x));
      const remaining = 100 - n;
      let next = prev.map((x, i) => {
        if (x.id === id) return { ...x, pct: n };
        const otherPct = prev[i].pct;
        return { ...x, pct: Math.round((remaining * otherPct) / othersSum) };
      });
      const total = next.reduce((s, x) => s + x.pct, 0);
      if (total !== 100) {
        const fixIdx = next.findIndex((x) => x.id !== id);
        if (fixIdx >= 0) next[fixIdx] = { ...next[fixIdx], pct: Math.max(0, next[fixIdx].pct + (100 - total)) };
      }
      return next;
    });
  };

  const updateSplitName = (id, name) => {
    setSplits((prev) => prev.map((x) => (x.id === id ? { ...x, name } : x)));
  };

  const addSplit = () => {
    setSplits((prev) => {
      const sum = prev.reduce((s, x) => s + x.pct, 0);
      if (sum <= 0) return prev;
      const take = 10;
      const scale = (sum - take) / sum;
      const next = [
        ...prev.map((x) => ({ ...x, pct: Math.round(x.pct * scale) })),
        { id: String(Date.now()), name: 'Yeni', pct: take },
      ];
      const total = next.reduce((s, x) => s + x.pct, 0);
      if (total !== 100 && next.length > 0) next[next.length - 1].pct = Math.max(0, next[next.length - 1].pct + (100 - total));
      return next;
    });
  };

  const removeSplit = (id) => {
    const item = splits.find((x) => x.id === id);
    if (!item || splits.length <= 1) return;
    setSplits((prev) => {
      const rest = prev.filter((x) => x.id !== id);
      const restSum = rest.reduce((s, x) => s + x.pct, 0);
      if (restSum <= 0) return rest;
      let next = rest.map((x) => ({ ...x, pct: Math.round((x.pct / restSum) * 100) }));
      const total = next.reduce((s, x) => s + x.pct, 0);
      if (total !== 100 && next.length > 0) next[0].pct = Math.max(0, next[0].pct + (100 - total));
      return next;
    });
  };

  const load = async () => {
    try {
      const g = await api.list().catch(() => []);
      setGoals(g);
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

  const addGoal = async () => {
    if (!newName.trim()) return;
    try {
      await api.create({
        name: newName.trim(),
        target_amount: newTarget ? parseFloat(newTarget.replace(',', '.')) : null,
        type: 'savings',
      });
      setNewName('');
      setNewTarget('');
      setShowAddGoal(false);
      load();
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  // Smart Round-up önizleme (HTML’deki gibi)
  const previewPurchase = 3.4;
  const mult = Number(roundUpMultiplier) || 2;
  const previewRounded = Math.ceil(previewPurchase / mult) * mult;
  const previewSaved = (previewRounded - previewPurchase).toFixed(2);
  const previewTotal = (Number(previewSaved) + previewPurchase).toFixed(2);

  const goalThemes = [
    { icon: 'flash', bg: '#ffedd5', color: '#ea580c' },
    { icon: 'sunny', bg: '#dbeafe', color: '#2563eb' },
    { icon: 'wallet', bg: '#f3e8ff', color: COLORS.purple },
  ];

  const displayGoals = goals.length > 0
    ? goals
    : [
        { id: 'd1', name: 'Acil Durum Fonu', target_amount: 10000, current_amount: 2500 },
        { id: 'd2', name: 'Yaz Tatili', target_amount: 1500, current_amount: 800 },
      ];

  return (
    <View style={styles.container}>
      {/* Header - HTML: savings icon + title, notification */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="wallet" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Birikim ve Hedefler</Text>
        </View>
        <TouchableOpacity style={styles.headerRightBtn} onPress={() => setNotifVisible(true)}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {/* Money Splitter */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>Money Splitter</Text>
                <Text style={styles.cardSubtitle}>Gelen parayı otomatik dağıt</Text>
              </View>
              <Switch
                value={moneySplitterOn}
                onValueChange={setMoneySplitterOn}
                trackColor={{ false: '#e5e7eb', true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
            {moneySplitterOn && (
              <>
                {splits.map((s) => (
                  <View key={s.id} style={styles.splitRow}>
                    <TextInput
                      style={styles.splitNameInput}
                      value={s.name}
                      onChangeText={(t) => updateSplitName(s.id, t)}
                      placeholder="Ad"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                    <View style={styles.splitPctWrap}>
                      <TextInput
                        style={styles.splitPctInput}
                        value={String(s.pct)}
                        onChangeText={(t) => updateSplitPct(s.id, t)}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                      <Text style={styles.splitPctSuffix}>%</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeSplit(s.id)}
                      style={styles.splitRemoveBtn}
                      disabled={splits.length <= 1}
                    >
                      <Ionicons name="remove-circle" size={24} color={splits.length <= 1 ? COLORS.border : COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addSplitBtn} onPress={addSplit}>
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.addSplitBtnText}>Dağılım ekle</Text>
                </TouchableOpacity>
                <View style={styles.splitTotalRow}>
                  <Text style={styles.splitTotalLabel}>Toplam</Text>
                  <Text style={[styles.splitTotalValue, totalSplitPct !== 100 && styles.splitTotalError]}>
                    %{splits.reduce((a, x) => a + x.pct, 0)}
                  </Text>
                </View>
                {splits.length > 0 && (
                  <View style={styles.splitBarWrap}>
                    {splits.map((s) => (
                      <View
                        key={s.id}
                        style={[styles.splitBarSegment, { width: `${s.pct}%`, backgroundColor: COLORS.primary }]}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Smart Round-up */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>Smart Round-up</Text>
                <Text style={styles.cardSubtitle}>Round up purchases to the nearest dollar</Text>
              </View>
              <Switch
                value={roundUpEnabled}
                onValueChange={setRoundUpEnabled}
                trackColor={{ false: '#e5e7eb', true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
            {roundUpEnabled && (
              <>
                <Text style={styles.roundUpValueLabel}>{(Number(roundUpMultiplier) || 2)}x</Text>
                <View
                  style={styles.roundUpTrackWrap}
                  onLayout={onRoundUpSliderLayout}
                  {...roundUpPan.panHandlers}
                >
                  <View style={styles.roundUpTrack} />
                  <View
                    style={[
                      styles.roundUpThumb,
                      {
                        left: `${Math.max(0, Math.min(100, ((Number(roundUpMultiplier) || 2) - ROUND_UP_MIN) / (ROUND_UP_MAX - ROUND_UP_MIN) * 100))}%`,
                        marginLeft: -12,
                      },
                    ]}
                  />
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1x</Text>
                  <Text style={[styles.sliderLabel, styles.sliderLabelCenter]}>3x</Text>
                  <Text style={styles.sliderLabel}>5x</Text>
                </View>
                {/* Live Preview */}
                <View style={styles.previewCard}>
              <View style={styles.previewCardHead}>
                <Text style={styles.previewCardLabel}>CANLI ÖNİZLEME</Text>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>AKTİF</Text>
                </View>
              </View>
              <View style={styles.previewCardRow}>
                <View style={styles.previewCardLeft}>
                  <View style={styles.previewIconWrap}>
                    <Ionicons name="cafe" size={22} color={COLORS.textSecondary} />
                  </View>
                  <View>
                    <Text style={styles.previewItemTitle}>Sabah Kahvesi</Text>
                    <Text style={styles.previewItemPrice}>₺{previewPurchase.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.previewCardRight}>
                  <Text style={styles.previewSavedText}>+₺{previewSaved} biriktirildi</Text>
                  <Text style={styles.previewTotalLabel}>Toplam: ₺{previewTotal}</Text>
                </View>
              </View>
              <View style={styles.previewCardDivider} />
              <View style={styles.previewCardRow}>
                <View style={styles.previewCardLeft}>
                  <View style={styles.previewIconWrap}>
                    <Ionicons name="restaurant" size={22} color={COLORS.textSecondary} />
                  </View>
                  <View>
                    <Text style={styles.previewItemTitle}>Öğle Yemeği</Text>
                    <Text style={styles.previewItemPrice}>₺12,50</Text>
                  </View>
                </View>
                <View style={styles.previewCardRight}>
                  <Text style={styles.previewSavedText}>+₺{((Math.ceil(12.5 / mult) * mult) - 12.5).toFixed(2)} biriktirildi</Text>
                  <Text style={styles.previewTotalLabel}>Toplam: ₺{(Math.ceil(12.5 / mult) * mult).toFixed(2)}</Text>
                </View>
              </View>
            </View>
              </>
            )}
          </View>
        </View>

        {/* Active Goals - HTML section */}
        <View style={styles.section}>
          <View style={styles.goalsHead}>
            <Text style={styles.sectionTitle}>Aktif Hedefler</Text>
            <TouchableOpacity style={styles.newGoalBtn} onPress={() => setShowAddGoal(true)}>
              <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              <Text style={styles.newGoalBtnText}>Yeni Hedef</Text>
            </TouchableOpacity>
          </View>

          {showAddGoal && (
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="Hedef adı"
                value={newName}
                onChangeText={setNewName}
                placeholderTextColor={COLORS.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder="Hedef tutar (isteğe bağlı)"
                value={newTarget}
                onChangeText={setNewTarget}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
              <View style={styles.formRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddGoal(false)}>
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={addGoal}>
                  <Text style={styles.submitBtnText}>Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {displayGoals.map((g, idx) => {
            const target = Number(g.target_amount) || 1;
            const current = Number(g.current_amount) || 0;
            const pct = Math.min(100, Math.round((current / target) * 100));
            const theme = goalThemes[idx % goalThemes.length];
            return (
              <View key={g.id} style={styles.goalCard}>
                <View style={styles.goalCardHead}>
                  <View style={styles.goalCardLeft}>
                    <View style={[styles.goalIconWrap, { backgroundColor: theme.bg }]}>
                      <Ionicons name={theme.icon} size={24} color={theme.color} />
                    </View>
                    <View>
                      <Text style={styles.goalName}>{g.name}</Text>
                      <Text style={styles.goalSubtitle}>{pct}% / {formatMoney(target)}</Text>
                    </View>
                  </View>
                  <View style={styles.goalAmountWrap}>
                    <Text style={styles.goalAmount}>{formatMoney(current)}</Text>
                  </View>
                </View>
                <ProgressBar progress={pct} height={10} color={COLORS.primary} style={styles.goalBar} />
              </View>
            );
          })}
        </View>
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Bildirimler Modal - ana sayfa ile aynı içerik */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 48,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,51,153,0.1)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,51,153,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  headerRightBtn: { padding: 8 },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: 24 },
  section: { marginBottom: SPACING.lg },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.06)',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  cardSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 16 },
  roundUpValueLabel: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  roundUpTrackWrap: { position: 'relative', height: 32, justifyContent: 'center', marginBottom: 8 },
  roundUpTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  roundUpThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    top: 4,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  splitNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  splitPctWrap: { flexDirection: 'row', alignItems: 'center', width: 56 },
  splitPctInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    minWidth: 40,
    textAlign: 'center',
  },
  splitPctSuffix: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginLeft: 2 },
  splitRemoveBtn: { padding: 4 },
  addSplitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 12 },
  addSplitBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  splitTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  splitTotalLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  splitTotalValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  splitTotalError: { color: COLORS.error },
  splitBarWrap: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: COLORS.border, marginTop: 8 },
  splitBarSegment: { height: '100%' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 4, marginBottom: 4 },
  sliderLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  sliderLabelCenter: { color: COLORS.primary },
  previewCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,51,153,0.2)',
    marginTop: 20,
  },
  previewCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  previewCardLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 1 },
  previewBadge: { backgroundColor: 'rgba(0,51,153,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  previewBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.text },
  previewCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewCardDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  previewCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewItemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  previewItemPrice: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  previewCardRight: { alignItems: 'flex-end' },
  previewSavedText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  previewTotalLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  // Bildirimler modal (ana sayfa ile aynı)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
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
  goalsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  newGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newGoalBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  formRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: COLORS.border, borderRadius: RADIUS.lg },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  submitBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.06)',
  },
  goalCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  goalCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  goalSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  goalAmountWrap: { alignItems: 'flex-end' },
  goalAmount: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  goalBar: { borderRadius: RADIUS.full },
  bottomPad: { height: 32 },
});
