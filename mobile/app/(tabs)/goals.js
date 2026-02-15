import { useEffect, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { goals as api } from '../../lib/api';
import { ProgressBar } from '../../components/ProgressBar';

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moneySplitterOn, setMoneySplitterOn] = useState(true);
  const [roundUpMultiplier, setRoundUpMultiplier] = useState(2);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');

  const load = async () => {
    try {
      const [g, s] = await Promise.all([
        api.list(),
        api.splits().catch(() => []),
      ]);
      setGoals(g);
      setSplits(s);
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
        target_amount: newTarget ? parseFloat(newTarget) : null,
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

  const savingsPct = 20;
  const investmentPct = 10;
  const lastPurchase = 4.5;
  const roundedAmount = Math.ceil(lastPurchase / roundUpMultiplier) * roundUpMultiplier;
  const savedPerTx = (roundedAmount - lastPurchase).toFixed(2);

  const goalThemes = [
    { icon: 'shield-checkmark', bg: '#fef3c7', color: '#d97706' },
    { icon: 'airplane', bg: '#d1fae5', color: '#059669' },
    { icon: 'laptop', bg: '#f3e8ff', color: COLORS.purple },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }
    >
      {/* Header - sticky style */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Savings & Goals</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        {/* Money Splitter */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="git-branch-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Money Splitter</Text>
              <Text style={styles.cardDesc}>Auto-divide incoming funds</Text>
            </View>
            <Switch
              value={moneySplitterOn}
              onValueChange={setMoneySplitterOn}
              trackColor={{ false: '#e2e8f0', true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.splitBlock}>
            <View style={styles.splitLabelRow}>
              <View style={styles.splitDot} />
              <Text style={styles.splitLabel}>Savings</Text>
              <Text style={styles.splitPct}>{savingsPct}%</Text>
            </View>
            <ProgressBar progress={savingsPct} height={6} style={styles.splitBar} />
          </View>
          <View style={styles.splitBlock}>
            <View style={styles.splitLabelRow}>
              <View style={[styles.splitDot, styles.splitDotBlue]} />
              <Text style={styles.splitLabel}>Investment</Text>
              <Text style={styles.splitPct}>{investmentPct}%</Text>
            </View>
            <ProgressBar progress={investmentPct} height={6} color="#60a5fa" style={styles.splitBar} />
          </View>
        </View>

        {/* Smart Round-up */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="trending-up" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Smart Round-up</Text>
              <Text style={styles.cardDesc}>Multiply your spare change</Text>
            </View>
          </View>
          <View style={styles.sliderWrap}>
            <View style={styles.sliderLabels}>
              {[1, 2, 5].map((x) => (
                <TouchableOpacity
                  key={x}
                  style={styles.sliderLabelItem}
                  onPress={() => setRoundUpMultiplier(x)}
                >
                  <Text style={[styles.sliderLabelText, roundUpMultiplier === x && styles.sliderLabelActive]}>{x}x</Text>
                  <View style={[styles.sliderDot, roundUpMultiplier === x && styles.sliderDotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Live Preview</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Last purchase</Text>
              <Text style={styles.previewValue}>${lastPurchase.toFixed(2)}</Text>
            </View>
            <View style={[styles.previewRow, styles.previewRowBorder]}>
              <Text style={styles.previewLabel}>Rounded to</Text>
              <Text style={styles.previewValue}>${roundedAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.previewFooter}>
              <View style={styles.previewSavedRow}>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>{roundUpMultiplier}x</Text>
                </View>
                <Text style={styles.previewSaved}>${savedPerTx} saved</Text>
              </View>
              <View style={styles.previewTotalWrap}>
                <Text style={styles.previewTotalLabel}>Total Saved</Text>
                <Text style={styles.previewTotal}>$1.00</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Your Goals */}
        <View style={styles.goalsSection}>
          <View style={styles.goalsHeader}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <TouchableOpacity style={styles.newGoalBtn} onPress={() => setShowAddGoal(true)}>
              <Ionicons name="add-circle" size={18} color={COLORS.primary} />
              <Text style={styles.newGoalText}>New Goal</Text>
            </TouchableOpacity>
          </View>

          {showAddGoal && (
            <View style={styles.card}>
              <TextInput style={styles.input} placeholder="Goal name" value={newName} onChangeText={setNewName} />
              <TextInput style={styles.input} placeholder="Target amount (optional)" value={newTarget} onChangeText={setNewTarget} keyboardType="decimal-pad" />
              <View style={styles.row}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddGoal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={addGoal}>
                  <Text style={styles.submitBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {goals.map((g, idx) => {
            const target = Number(g.target_amount) || 1;
            const current = Number(g.current_amount) || 0;
            const pct = Math.min(100, Math.round((current / target) * 100));
            const isComplete = pct >= 100;
            const theme = goalThemes[idx % goalThemes.length];
            return (
              <View key={g.id} style={styles.goalCard}>
                <View style={styles.goalCardTop}>
                  <View style={styles.goalCardLeft}>
                    <View style={[styles.goalIconWrap, { backgroundColor: theme.bg }]}>
                      <Ionicons name={theme.icon} size={22} color={theme.color} />
                    </View>
                    <View>
                      <Text style={styles.goalCardTitle}>{g.name}</Text>
                      <Text style={styles.goalCardProgress}>{formatMoney(current)} / {formatMoney(target)}</Text>
                    </View>
                  </View>
                  <Text style={styles.goalPct}>{pct}%</Text>
                </View>
                <ProgressBar progress={pct} height={8} style={styles.goalCardBar} />
                <TouchableOpacity
                  style={[styles.topUpBtn, isComplete && styles.completeGoalBtn]}
                  onPress={() => !isComplete && Alert.alert('Top Up', 'Amount to add?')}
                >
                  <Text style={[styles.topUpBtnText, isComplete && styles.completeGoalBtnText]}>
                    {isComplete ? 'Complete Goal' : 'Top Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,51,153,0.1)',
  },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  main: { padding: 16, paddingTop: 24, gap: 24 },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.05)',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIconWrap: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(0,51,153,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#0f172a' },
  cardDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  splitBlock: { marginTop: 12 },
  splitLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  splitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 8 },
  splitDotBlue: { backgroundColor: '#60a5fa' },
  splitLabel: { flex: 1, fontSize: 14, color: '#0f172a' },
  splitPct: { fontWeight: '600', fontSize: 14, color: '#0f172a' },
  splitBar: { flex: 1 },
  sliderWrap: { marginTop: 24, marginBottom: 8 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  sliderLabelItem: { alignItems: 'center' },
  sliderLabelText: { fontSize: 12, fontWeight: '500', color: '#64748b' },
  sliderLabelActive: { color: COLORS.primary, fontWeight: '700' },
  sliderDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginTop: 4 },
  sliderDotActive: { backgroundColor: COLORS.primary },
  previewBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(0,51,153,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.1)',
  },
  previewTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(0,51,153,0.7)', letterSpacing: 1, textAlign: 'center', marginBottom: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewRowBorder: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,51,153,0.1)' },
  previewLabel: { fontSize: 14, color: '#64748b' },
  previewValue: { fontWeight: '500', fontSize: 14 },
  previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  previewSavedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  previewBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  previewSaved: { fontSize: 12, color: '#475569' },
  previewTotalWrap: { alignItems: 'flex-end' },
  previewTotalLabel: { fontSize: 12, color: '#94a3b8' },
  previewTotal: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  goalsSection: { gap: 16 },
  goalsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  newGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newGoalText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: COLORS.border, borderRadius: 8 },
  cancelBtnText: { color: '#0f172a' },
  submitBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 8 },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  goalCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.05)',
  },
  goalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  goalCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIconWrap: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  goalCardTitle: { fontWeight: '700', fontSize: 14, color: '#0f172a' },
  goalCardProgress: { fontSize: 12, color: '#64748b', marginTop: 2 },
  goalPct: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  goalCardBar: { marginBottom: 16 },
  topUpBtn: { paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,51,153,0.1)', alignItems: 'center' },
  topUpBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  completeGoalBtn: { backgroundColor: COLORS.primary },
  completeGoalBtnText: { color: '#fff' },
});
