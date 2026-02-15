import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { social as api } from '../../lib/api';
import { ProgressBar } from '../../components/ProgressBar';

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export default function SocialScreen() {
  const [groups, setGroups] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [debts, setDebts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [g, c] = await Promise.all([
        api.groups().catch(() => []),
        api.challenges().catch(() => []),
      ]);
      setGroups(g);
      setChallenges(c);
      if (g.length > 0) {
        const d = await api.debts(g[0].id).catch(() => ({ debts: [] }));
        setDebts(d.debts || []);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      await api.createGroup({ name: groupName.trim(), type: 'piggy_bank' });
      setGroupName('');
      setShowNewGroup(false);
      load();
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  const socialSuccess = '#4ade80';
  const socialDanger = '#fb7185';
  const primaryLight = '#e6f0ff';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="wallet" size={22} color="#fff" />
          </View>
          <Text style={styles.logoTitle}>İş-Gen Social</Text>
        </View>
        <TouchableOpacity style={styles.qrBtn}>
          <Ionicons name="qr-code-outline" size={24} color="#101318" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={22} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Find friends to save with..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Shared Jars */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Shared Jars</Text>
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => setShowNewGroup(true)}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jarScroll}>
          <View style={styles.jarCard}>
            <View style={styles.jarImageWrap}>
              <View style={styles.jarImageGradient} />
              <View style={styles.jarTagWrap}>
                <Text style={styles.jarTagTravel}>TRAVEL</Text>
              </View>
            </View>
            <Text style={styles.jarTitle}>Summer Trip 2024</Text>
            <View style={styles.jarMetaRow}>
              <Text style={styles.jarMeta}>$1,200 saved • 4 members</Text>
              <View style={styles.jarAvatars}>
                <View style={[styles.jarAvatar, styles.jarA1]}><Text style={styles.jarAvatarText}>A</Text></View>
                <View style={[styles.jarAvatar, styles.jarA2]}><Text style={styles.jarAvatarText}>B</Text></View>
                <View style={styles.jarAvatarPlus}><Text style={styles.jarAvatarPlusText}>+2</Text></View>
              </View>
            </View>
          </View>
          <View style={styles.jarCard}>
            <View style={[styles.jarImageWrap, styles.jarImageWrapGreen]}>
              <View style={styles.jarImageGradient} />
              <View style={styles.jarTagWrap}>
                <Text style={styles.jarTagSocial}>SOCIAL</Text>
              </View>
            </View>
            <Text style={styles.jarTitle}>Dinner Fund</Text>
            <View style={styles.jarMetaRow}>
              <Text style={styles.jarMeta}>$450 saved • 6 members</Text>
              <View style={styles.jarAvatars}>
                <View style={[styles.jarAvatar, styles.jarA1]}><Text style={styles.jarAvatarText}>C</Text></View>
                <View style={[styles.jarAvatar, styles.jarA2]}><Text style={styles.jarAvatarText}>D</Text></View>
                <View style={styles.jarAvatarPlus}><Text style={styles.jarAvatarPlusText}>+4</Text></View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {showNewGroup && (
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Jar name" value={groupName} onChangeText={setGroupName} />
          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewGroup(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={createGroup}>
              <Text style={styles.submitBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Debt Tracker */}
      <View style={styles.debtSection}>
        <Text style={styles.sectionTitle}>Debt Tracker</Text>
        <View style={styles.debtCardWrap}>
          <View style={styles.debtCard}>
            <View style={styles.debtLeft}>
              <View style={styles.debtAvatarWrap}>
                <View style={styles.debtAvatar}><Text style={styles.debtAvatarText}>A</Text></View>
                <View style={styles.debtBadgeGreen}>
                  <Ionicons name="arrow-down" size={10} color="#fff" />
                </View>
              </View>
              <View>
                <Text style={styles.debtTitle}>Alice owes you</Text>
                <Text style={styles.debtSub}>Coffee & Snacks</Text>
              </View>
            </View>
            <View style={styles.debtRight}>
              <Text style={styles.debtAmountGreen}>$50.00</Text>
              <TouchableOpacity style={styles.settleBtn}>
                <Text style={styles.settleBtnText}>Settle</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.debtCard}>
            <View style={styles.debtLeft}>
              <View style={styles.debtAvatarWrap}>
                <View style={styles.debtAvatar}><Text style={styles.debtAvatarText}>B</Text></View>
                <View style={styles.debtBadgeRed}>
                  <Ionicons name="arrow-up" size={10} color="#fff" />
                </View>
              </View>
              <View>
                <Text style={styles.debtTitle}>You owe Bob</Text>
                <Text style={styles.debtSub}>Gas money</Text>
              </View>
            </View>
            <View style={styles.debtRight}>
              <Text style={styles.debtAmountRed}>$20.00</Text>
              <TouchableOpacity style={styles.payBtn}>
                <Text style={styles.payBtnText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Financial Challenges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Challenges</Text>
        <View style={styles.challengeCardActive}>
          <View style={styles.challengeIconWrap}>
            <Ionicons name="wallet" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.challengeBody}>
            <View style={styles.challengeTitleRow}>
              <Text style={styles.challengeTitle}>Weekly Mini-Save</Text>
              <View style={styles.badgeActive}><Text style={styles.badgeActiveText}>Active</Text></View>
            </View>
            <Text style={styles.challengeDesc}>Save $10 this week with 5 friends.</Text>
            <ProgressBar progress={70} height={6} style={styles.challengeBar} />
            <View style={styles.challengeFooter}>
              <View style={styles.challengeAvatars}>
                <View style={styles.challengeAvatar}><Text style={styles.challengeAvatarText}>1</Text></View>
                <View style={styles.challengeAvatar}><Text style={styles.challengeAvatarText}>2</Text></View>
                <View style={styles.challengeAvatar}><Text style={styles.challengeAvatarText}>3</Text></View>
              </View>
              <Text style={styles.challengeMeta}>2 days left</Text>
            </View>
          </View>
        </View>
        <View style={styles.challengeCard}>
          <View style={styles.challengeIconWrapGray}>
            <Ionicons name="cafe" size={28} color="#6b7280" />
          </View>
          <View style={styles.challengeBody}>
            <View style={styles.challengeTitleRow}>
              <Text style={styles.challengeTitle}>No Coffee Week</Text>
              <View style={styles.badgeJoin}><Text style={styles.badgeJoinText}>Join</Text></View>
            </View>
            <Text style={styles.challengeDesc}>Skip your morning latte for 7 days.</Text>
            <TouchableOpacity style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>Accept Challenge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logoTitle: { fontSize: 20, fontWeight: '700', color: '#101318' },
  qrBtn: { padding: 8 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 4, fontSize: 14 },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#101318', marginBottom: 12 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  jarScroll: { flexDirection: 'row', gap: 16, paddingRight: 16 },
  jarCard: { width: 256, flexShrink: 0 },
  jarImageWrap: { height: 176, borderRadius: RADIUS['2xl'], overflow: 'hidden', marginBottom: 12, backgroundColor: COLORS.primary },
  jarImageWrapGreen: { backgroundColor: '#059669' },
  jarImageGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  jarTagWrap: { position: 'absolute', bottom: 12, left: 12 },
  jarTagTravel: { backgroundColor: 'rgba(0,51,153,0.9)', color: '#fff', fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, overflow: 'hidden' },
  jarTagSocial: { backgroundColor: 'rgba(74,222,128,0.9)', color: '#fff', fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, overflow: 'hidden' },
  jarTitle: { fontWeight: '600', fontSize: 14, color: '#101318' },
  jarMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  jarMeta: { fontSize: 12, color: '#6b7280' },
  jarAvatars: { flexDirection: 'row' },
  jarAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  jarA1: { backgroundColor: '#86efac' },
  jarA2: { backgroundColor: '#93c5fd', marginLeft: -8 },
  jarAvatarText: { fontSize: 10, fontWeight: '700', color: '#101318' },
  jarAvatarPlus: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e5e7eb', marginLeft: -8, justifyContent: 'center', alignItems: 'center' },
  jarAvatarPlusText: { fontSize: 8, fontWeight: '700', color: '#4b5563' },
  card: { marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 10, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: COLORS.border, borderRadius: 8 },
  cancelBtnText: { color: '#101318' },
  submitBtn: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 8 },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  debtSection: { marginTop: 32, paddingHorizontal: 16 },
  debtCardWrap: { backgroundColor: '#f9fafb', borderRadius: RADIUS['2xl'], padding: 16, gap: 12 },
  debtCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  debtLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  debtAvatarWrap: { position: 'relative' },
  debtAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  debtAvatarText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  debtBadgeGreen: { position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#4ade80', borderWidth: 2, borderColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  debtBadgeRed: { position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fb7185', borderWidth: 2, borderColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  debtTitle: { fontWeight: '700', fontSize: 14, color: '#101318' },
  debtSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  debtRight: { alignItems: 'flex-end' },
  debtAmountGreen: { fontWeight: '800', fontSize: 16, color: '#4ade80' },
  debtAmountRed: { fontWeight: '800', fontSize: 16, color: '#fb7185' },
  settleBtn: { marginTop: 4, paddingVertical: 4, paddingHorizontal: 12, backgroundColor: '#e6f0ff', borderRadius: RADIUS.full },
  settleBtnText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },
  payBtn: { marginTop: 4, paddingVertical: 6, paddingHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  payBtnText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  challengeCardActive: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: RADIUS['2xl'],
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.1)',
    overflow: 'hidden',
  },
  challengeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  challengeIconWrap: { width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(0,51,153,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  challengeIconWrapGray: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  challengeBody: { flex: 1 },
  challengeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  challengeTitle: { fontWeight: '700', fontSize: 14, color: '#101318' },
  badgeActive: { backgroundColor: 'rgba(0,51,153,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeActiveText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  badgeJoin: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeJoinText: { fontSize: 10, fontWeight: '700', color: '#9ca3af' },
  challengeDesc: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
  challengeBar: { marginBottom: 8 },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  challengeAvatars: { flexDirection: 'row' },
  challengeAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#e5e7eb', marginLeft: -6, justifyContent: 'center', alignItems: 'center' },
  challengeAvatarText: { fontSize: 8, fontWeight: '700' },
  challengeMeta: { fontSize: 10, fontWeight: '500', color: '#6b7280' },
  acceptBtn: { paddingVertical: 10, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center' },
  acceptBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
