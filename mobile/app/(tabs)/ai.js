import { useEffect, useState } from 'react';
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
import { ai as api } from '../../lib/api';

const BG_LIGHT = '#f5f6f8';
const TEXT_MAIN = '#101318';
const TEXT_MUTED = '#5e6d8d';

const BAR_HEIGHTS = [0.5, 0.75, 1, 0.67, 0.5, 0.33, 0.75]; // Today = index 2 (full)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AIBuddyScreen() {
  const [insights, setInsights] = useState([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.insights();
      setInsights(Array.isArray(data) ? data : []);
    } catch (e) {
      setInsights([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="menu" size={24} color={TEXT_MAIN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İş-Gen AI Buddy</Text>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="notifications" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* AI Avatar & Welcome */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Ionicons name="sparkles" size={48} color={COLORS.primary} />
            </View>
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.heroTitle}>Hi, I'm your AI Buddy</Text>
          <Text style={styles.heroSubtitle}>
            Analyzing your finances in real-time. Here's what I found today.
          </Text>
        </View>

        {/* Spending Patterns */}
        <View style={styles.section}>
          <View style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <Text style={styles.patternLabel}>SPENDING PATTERNS</Text>
              <View style={styles.weeklyPill}>
                <Text style={styles.weeklyPillText}>Weekly View</Text>
              </View>
            </View>
            <View style={styles.chart}>
              {BAR_HEIGHTS.map((h, i) => (
                <View key={i} style={styles.barCol}>
                  {i === 2 && <Text style={styles.todayLabel}>Today</Text>}
                  <View
                    style={[
                      styles.bar,
                      { height: `${h * 100}%` },
                      i === 2 && styles.barToday,
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.dayLabels}>
              {DAYS.map((d) => (
                <Text key={d} style={styles.dayLabel}>{d}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Daily Insights */}
        <View style={styles.section}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightSectionTitle}>Daily Insights</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllBtn}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insightScroll}>
            <View style={styles.insightCard}>
              <View style={styles.insightIconAmber}>
                <Ionicons name="cafe" size={24} color="#d97706" />
              </View>
              <Text style={styles.insightCardTitle}>Coffee Spending</Text>
              <Text style={styles.insightCardText}>
                You spent <Text style={styles.textRed}>20% more</Text> on Coffee this week compared to last.
              </Text>
            </View>
            <View style={styles.insightCard}>
              <View style={styles.insightIconBlue}>
                <Ionicons name="wallet" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.insightCardTitle}>Smart Tip</Text>
              <Text style={styles.insightCardText}>
                You could save <Text style={styles.textPrimary}>$30/mo</Text> by switching your current phone plan.
              </Text>
            </View>
            <View style={styles.insightCard}>
              <View style={styles.insightIconGreen}>
                <Ionicons name="flash" size={24} color="#16a34a" />
              </View>
              <Text style={styles.insightCardTitle}>Streak Unlocked</Text>
              <Text style={styles.insightCardText}>
                Great job! You've hit a <Text style={styles.textGreen}>7-day saving streak</Text>. Keep it up!
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Quick Actions Chat Style */}
        <View style={styles.section}>
          <View style={styles.bubbleWrap}>
            <View style={styles.chatBubble}>
              <Text style={styles.chatBubbleText}>
                How can I help you manage your budget today? Try asking about your subscriptions.
              </Text>
            </View>
            <View style={styles.quickWrap}>
              <TouchableOpacity style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>Analyze my rent 🏠</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>Top expenses 💸</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>Spending goals 🎯</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Input + Nav area - input only here, nav is in _layout */}
      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask Buddy about your finances..."
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
  content: { paddingBottom: 100 },
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
  patternCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 16,
    borderRadius: RADIUS.xl,
  },
  patternHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  patternLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 1 },
  weeklyPill: { backgroundColor: 'rgba(0,51,153,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  weeklyPillText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 128,
    gap: 8,
    paddingHorizontal: 8,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  todayLabel: { position: 'absolute', top: -24, fontSize: 10, fontWeight: '700', color: COLORS.primary },
  bar: {
    width: '100%',
    minHeight: 4,
    backgroundColor: '#e5e7eb',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barToday: { backgroundColor: COLORS.primary },
  dayLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  dayLabel: { flex: 1, fontSize: 10, fontWeight: '500', color: '#9ca3af', textAlign: 'center' },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  insightSectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN },
  viewAllBtn: { fontSize: 12, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },
  insightScroll: { flexDirection: 'row', gap: 16, paddingBottom: 16 },
  insightCard: {
    width: 256,
    flexShrink: 0,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 16,
    borderRadius: RADIUS.xl,
  },
  insightIconAmber: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  insightIconBlue: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  insightIconGreen: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  insightCardTitle: { fontWeight: '700', fontSize: 16, color: TEXT_MAIN },
  insightCardText: { fontSize: 14, color: TEXT_MUTED, marginTop: 4, lineHeight: 20 },
  textRed: { color: '#ef4444', fontWeight: '600' },
  textPrimary: { color: COLORS.primary, fontWeight: '600' },
  textGreen: { color: '#16a34a', fontWeight: '600' },
  bubbleWrap: { marginTop: 8 },
  chatBubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    backgroundColor: 'rgba(0,51,153,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.1)',
    padding: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: RADIUS.xl,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  chatBubbleText: { fontSize: 14, color: TEXT_MAIN },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quickBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
  },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  inputSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
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
