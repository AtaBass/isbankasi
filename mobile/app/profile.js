import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { dashboard as api } from '../lib/api';
import { PASAPORT_LEVELS, getCurrentPasaportLevel } from '../lib/pasaportLevel';

export default function ProfileScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get().then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const fullName = data?.full_name || 'Kullanıcı';
  const initial = fullName.charAt(0).toUpperCase();
  const email = data?.email || 'kullanici@isb.com';
  const pasaportLevel = getCurrentPasaportLevel();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İş Bankası Genç</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profil kartı */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{initial}</Text>
          </View>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <Text style={styles.profileLevel}>{pasaportLevel.title} · Seviye {pasaportLevel.level}</Text>
        </View>

        {/* Finansal Pasaport */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trophy" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Finansal Pasaport</Text>
          </View>
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
          <View style={styles.rewardsBox}>
            <View style={styles.rewardsTitleRow}>
              <Ionicons name="gift" size={18} color={COLORS.primary} />
              <Text style={styles.rewardsTitle}>Seviye Ödülleri</Text>
            </View>
            <Text style={styles.rewardsDesc}>
              Seviye arttıkça cashback oranın artar, daha iyi kampanyalar açılır!
            </Text>
          </View>
        </View>

        {/* Nays Üyeliği */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="star" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Nays Üyeliği</Text>
          </View>
          <View style={styles.naysCard}>
            <Text style={styles.naysStatusLabel}>Durum: <Text style={styles.naysStatusRed}>Henüz Yok</Text></Text>
            <Text style={styles.naysReq}>Seviye 3 için Nays üyeliği gereklidir.</Text>
            <TouchableOpacity style={styles.naysBtn}>
              <Text style={styles.naysBtnText}>Nays'a Katıl</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Kartlarım */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="card" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Kartlarım</Text>
          </View>
          <View style={styles.cardWidget}>
            <Text style={styles.cardWidgetTitle}>İş Bankası Genç Kredi Kartı</Text>
            <Text style={styles.cardWidgetNumber}>•••• •••• •••• 4892</Text>
            <View style={styles.cardWidgetFooter}>
              <Text style={styles.cardWidgetLimit}>Limit 20.000 TL</Text>
              <Text style={styles.cardWidgetAvail}>Kullanılabilir 14.200 TL</Text>
            </View>
          </View>
        </View>

        {/* Ayarlar / Güvenlik / Yardım */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuRow}>
            <Ionicons name="settings-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.menuRowText}>Ayarlar</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow}>
            <Ionicons name="lock-closed-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.menuRowText}>Güvenlik</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow}>
            <Ionicons name="document-text-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.menuRowText}>Yardım & Destek</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 48,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  headerRight: { width: 40 },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xl,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  profileEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  profileLevel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6 },
  section: { marginBottom: SPACING.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  pasaportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pasaportLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pasaportLevelNum: { fontSize: 16, fontWeight: '700', color: COLORS.primary, minWidth: 24, textAlign: 'center' },
  pasaportLevelTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  pasaportLevelDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  pasaportCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border },
  rewardsBox: {
    backgroundColor: 'rgba(0,51,153,0.06)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,51,153,0.1)',
  },
  rewardsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rewardsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  rewardsDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  naysCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  naysStatusLabel: { fontSize: 14, color: COLORS.text },
  naysStatusRed: { color: COLORS.error, fontWeight: '700' },
  naysReq: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6 },
  naysBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    marginTop: 12,
  },
  naysBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardWidget: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardWidgetTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  cardWidgetNumber: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  cardWidgetFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cardWidgetLimit: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  cardWidgetAvail: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuRowText: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.text },
  bottomPad: { height: 40 },
});
