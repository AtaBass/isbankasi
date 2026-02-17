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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { social as api } from '../../lib/api';
import { ProgressBar } from '../../components/ProgressBar';

function formatMoney(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n);
}

// Kimin kime ne kadar borcu olduğunu hesapla (katkılar eşit bölünür)
function computeDebts(contributions) {
  const total = contributions.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const n = contributions.length;
  if (n === 0) return [];
  const avg = total / n;
  const balances = contributions.map((c) => ({ name: c.name, balance: (Number(c.amount) || 0) - avg }));
  const debtors = balances.filter((b) => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter((b) => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debts = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amount = Math.min(-d.balance, c.balance);
    if (amount >= 0.01) {
      debts.push({ from: d.name, to: c.name, amount: Math.round(amount * 100) / 100 });
      debtors[i].balance += amount;
      creditors[j].balance -= amount;
    }
    if (debtors[i].balance >= -0.01) i++;
    if (creditors[j].balance <= 0.01) j++;
  }
  return debts;
}

// Borç listesini 3. görseldeki gibi kartlara çevir (X sana borçlu / Sen Y'ye borçlusun)
function debtsToCards(debts, currentUser) {
  const cards = [];
  debts.forEach((d) => {
    if (d.to === currentUser) cards.push({ type: 'owes_me', who: d.from, amount: d.amount, reason: 'Split' });
    if (d.from === currentUser) cards.push({ type: 'i_owe', who: d.to, amount: d.amount, reason: 'Split' });
  });
  return cards;
}

// Challenge kümesi (şablonlar) – hepsinin puanı var
const CHALLENGE_TEMPLATES = [
  { id: 'c1', title: 'Haftalık Mini Birikim', desc: '5 arkadaşınla bu hafta 10 TL biriktir.', icon: 'wallet', puan: 10 },
  { id: 'c2', title: 'Kahvesiz Hafta', desc: '7 gün sabah kahveni atla.', icon: 'cafe', puan: 15 },
  { id: 'c3', title: 'Günlük 5K Adım', desc: '7 gün boyunca günde en az 5000 adım at.', icon: 'walk', puan: 20 },
  { id: 'c4', title: 'Dışarıda Yemek Yok', desc: 'Bu hafta dışarıda yemek yeme.', icon: 'restaurant', puan: 25 },
];

// Kumbara simgeleri (hedeflerdeki gibi rastgele atanır)
const JAR_ICONS = [
  { icon: 'airplane', bg: '#dbeafe', color: '#2563eb' },
  { icon: 'restaurant', bg: '#dcfce7', color: '#16a34a' },
  { icon: 'wallet', bg: '#f3e8ff', color: '#7c3aed' },
  { icon: 'gift', bg: '#ffedd5', color: '#ea580c' },
  { icon: 'cafe', bg: '#fef3c7', color: '#d97706' },
  { icon: 'film', bg: '#e0e7ff', color: '#4f46e5' },
];
function getRandomJarIcon() {
  return JAR_ICONS[Math.floor(Math.random() * JAR_ICONS.length)];
}

// Örnek kumbaralar: contributions = kim ne kadar para ekledi
const SAMPLE_JARS = [
  {
    id: '1',
    name: 'Yaz Tatili 2024',
    tag: 'TATİL',
    tagStyle: 'travel',
    icon: 'airplane',
    savings: 1200,
    memberCount: 4,
    members: ['Ayşe', 'Bora', 'Can', 'Deniz'],
    targetAmount: 5000,
    contributions: [
      { name: 'Ayşe', amount: 400 },
      { name: 'Bora', amount: 350 },
      { name: 'Can', amount: 250 },
      { name: 'Deniz', amount: 200 },
    ],
  },
  {
    id: '2',
    name: 'Yemek Kumbarası',
    tag: 'SOSYAL',
    tagStyle: 'social',
    icon: 'restaurant',
    savings: 450,
    memberCount: 6,
    members: ['Elif', 'Fatma', 'Gül', 'Hakan', 'İrem', 'Kemal'],
    targetAmount: 1500,
    contributions: [
      { name: 'Elif', amount: 100 },
      { name: 'Fatma', amount: 80 },
      { name: 'Gül', amount: 90 },
      { name: 'Hakan', amount: 60 },
      { name: 'İrem', amount: 70 },
      { name: 'Kemal', amount: 50 },
    ],
  },
];

export default function SocialScreen() {
  const [groups, setGroups] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [debts, setDebts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupTarget, setGroupTarget] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [search, setSearch] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedJar, setSelectedJar] = useState(null);
  const [splitSource, setSplitSource] = useState(null);
  const [selectedJarForSplit, setSelectedJarForSplit] = useState(null);
  const [splitEntries, setSplitEntries] = useState([]);
  const [newSplitPerson, setNewSplitPerson] = useState('');
  const [newSplitAmount, setNewSplitAmount] = useState('');
  const [newSplitDebts, setNewSplitDebts] = useState(null);
  const [quickSplitExpanded, setQuickSplitExpanded] = useState(false);
  const [showChallengeCreate, setShowChallengeCreate] = useState(false);
  const [challengeStep, setChallengeStep] = useState(1);
  const [selectedChallengeTemplate, setSelectedChallengeTemplate] = useState(null);
  const [selectedChallengePerson, setSelectedChallengePerson] = useState(null);
  const [userChallenges, setUserChallenges] = useState([]);
  const [activeChallengeIds, setActiveChallengeIds] = useState(['c1']);

  const load = async () => {
    try {
      const [g, c] = await Promise.all([
        api.groups().catch(() => []),
        api.challenges().catch(() => []),
      ]);
      setGroups((g || []).map((gr) => ({ ...gr, icon: gr.icon || getRandomJarIcon().icon }))); 
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
      await api.createGroup({
        name: groupName.trim(),
        type: 'piggy_bank',
        target: groupTarget.trim() || undefined,
        invite_code: inviteCode.trim() || undefined,
        icon: getRandomJarIcon().icon,
      });
      setGroupName('');
      setGroupTarget('');
      setInviteCode('');
      setShowNewGroup(false);
      load();
    } catch (e) {
      Alert.alert('Hata', e.message || 'Bir hata oluştu');
    }
  };

  const addSplitEntry = () => {
    if (!newSplitPerson.trim() || !newSplitAmount.trim()) return;
    setSplitEntries((prev) => [...prev, { id: String(Date.now()), name: newSplitPerson.trim(), amount: newSplitAmount.trim() }]);
    setNewSplitPerson('');
    setNewSplitAmount('');
    setNewSplitDebts(null);
  };
  const removeSplitEntry = (id) => {
    setSplitEntries((prev) => prev.filter((e) => e.id !== id));
    setNewSplitDebts(null);
  };
  const createNewSplit = () => {
    const contributions = splitEntries.map((e) => ({ name: e.name, amount: e.amount }));
    setNewSplitDebts(computeDebts(contributions));
  };

  const splitDebts = selectedJarForSplit ? computeDebts(selectedJarForSplit.contributions || []) : [];

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
        <TouchableOpacity style={styles.qrBtn} onPress={() => setQrModalVisible(true)}>
          <Ionicons name="qr-code-outline" size={24} color="#101318" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={22} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Birlikte biriktirecek arkadaş bul..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Shared Jars */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Ortak Kumbaralar</Text>
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => setShowNewGroup(true)}>
            <Ionicons name="add" size={18} color={COLORS.primary} />
            <Text style={styles.seeAllText}>Ekle</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jarScroll}>
          {SAMPLE_JARS.map((jar) => (
            <TouchableOpacity key={jar.id} style={styles.jarCard} onPress={() => setSelectedJar(jar)} activeOpacity={0.9}>
              <View style={[styles.jarImageWrap, jar.tagStyle === 'social' && styles.jarImageWrapGreen]}>
                <View style={styles.jarImageGradient} />
                <View style={[styles.jarIconWrap, { backgroundColor: (JAR_ICONS.find((j) => j.icon === jar.icon) || JAR_ICONS[0]).bg }]}>
                  <Ionicons name={(JAR_ICONS.find((j) => j.icon === jar.icon) || JAR_ICONS[0]).icon} size={36} color={(JAR_ICONS.find((j) => j.icon === jar.icon) || JAR_ICONS[0]).color} />
                </View>
                <View style={styles.jarTagWrap}>
                  <Text style={jar.tagStyle === 'social' ? styles.jarTagSocial : styles.jarTagTravel}>{jar.tag}</Text>
                </View>
              </View>
              <Text style={styles.jarTitle}>{jar.name}</Text>
              <View style={styles.jarMetaRow}>
                <Text style={styles.jarMeta}>{formatMoney(jar.savings)} birikim • {jar.memberCount} üye</Text>
                <View style={styles.jarAvatars}>
                  {jar.members.slice(0, 2).map((m, i) => (
                    <View key={m} style={[styles.jarAvatar, i === 0 ? styles.jarA1 : styles.jarA2]}>
                      <Text style={styles.jarAvatarText}>{m.charAt(0)}</Text>
                    </View>
                  ))}
                  {jar.memberCount > 2 && (
                    <View style={styles.jarAvatarPlus}><Text style={styles.jarAvatarPlusText}>+{jar.memberCount - 2}</Text></View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {showNewGroup && (
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Kumbara adı" value={groupName} onChangeText={setGroupName} placeholderTextColor="#6b7280" />
          <TextInput style={styles.input} placeholder="Kumbara hedefi" value={groupTarget} onChangeText={setGroupTarget} keyboardType="decimal-pad" placeholderTextColor="#6b7280" />
          <View style={styles.inviteCodeRow}>
            <TextInput
              style={styles.inviteCodeInput}
              placeholder="Davet kodu"
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholderTextColor="#6b7280"
            />
            <TouchableOpacity style={styles.cameraBtn}>
              <Ionicons name="camera" size={22} color="#101318" />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewGroup(false)}>
              <Text style={styles.cancelBtnText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={createGroup}>
              <Text style={styles.submitBtnText}>Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* QR / Davet kodu modal */}
      <Modal visible={qrModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setQrModalVisible(false)}>
          <View style={styles.qrModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.qrModalTitle}>Senin davet kodun</Text>
            <View style={styles.qrCodeBox}>
              <View style={styles.qrCodePlaceholder}>
                <Ionicons name="qr-code" size={120} color="#101318" />
              </View>
            </View>
            <TouchableOpacity style={styles.qrModalClose} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.qrModalCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Kumbara detay modal */}
      <Modal visible={!!selectedJar} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedJar(null)}>
          {selectedJar && (
            <View style={styles.jarDetailContent} onStartShouldSetResponder={() => true}>
              <View style={styles.jarDetailHeader}>
                <Text style={styles.jarDetailTitle}>{selectedJar.name}</Text>
                <TouchableOpacity onPress={() => setSelectedJar(null)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.jarDetailRow}>
                <Text style={styles.jarDetailLabel}>Hedef tutar</Text>
                <Text style={styles.jarDetailValue}>{formatMoney(selectedJar.targetAmount)}</Text>
              </View>
              <View style={styles.jarDetailRow}>
                <Text style={styles.jarDetailLabel}>Birikim</Text>
                <Text style={styles.jarDetailValue}>{formatMoney(selectedJar.savings)}</Text>
              </View>
              <View style={styles.jarDetailRow}>
                <Text style={styles.jarDetailLabel}>Kim ne kadar ekledi</Text>
              </View>
              <View style={styles.jarDetailMembers}>
                {(selectedJar.contributions || selectedJar.members.map((m) => ({ name: m, amount: 0 }))).map((c) => (
                  <View key={c.name} style={styles.jarDetailMemberRow}>
                    <View style={styles.debtAvatar}><Text style={styles.debtAvatarText}>{c.name.charAt(0)}</Text></View>
                    <Text style={styles.jarDetailMemberName}>{c.name}</Text>
                    <Text style={styles.jarDetailContribution}>{formatMoney(c.amount)} ekledi</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.qrModalClose} onPress={() => setSelectedJar(null)}>
                <Text style={styles.qrModalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      {/* QuickSplit - buton gibi tıklanınca açılır/kapanır */}
      <View style={styles.debtSection}>
        <TouchableOpacity style={styles.quickSplitHeader} onPress={() => setQuickSplitExpanded(!quickSplitExpanded)} activeOpacity={0.7}>
          <Text style={styles.sectionTitle}>QuickSplit</Text>
          <Ionicons name={quickSplitExpanded ? 'chevron-up' : 'chevron-down'} size={22} color="#101318" />
        </TouchableOpacity>
        {quickSplitExpanded && (
          <>
        <Text style={styles.splitSubtitle}>Split grupları</Text>
        <View style={styles.splitOptionsRow}>
          <TouchableOpacity
            style={[styles.splitOptionBtn, splitSource === 'kumbara' && styles.splitOptionBtnActive]}
            onPress={() => setSplitSource('kumbara')}
          >
            <Ionicons name="wallet" size={18} color={splitSource === 'kumbara' ? '#fff' : COLORS.primary} />
            <Text style={[styles.splitOptionText, splitSource === 'kumbara' && styles.splitOptionTextActive]}>Varolan kumbaradan al</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.splitOptionBtn, splitSource === 'yeni' && styles.splitOptionBtnActive]}
            onPress={() => setSplitSource('yeni')}
          >
            <Ionicons name="add-circle" size={18} color={splitSource === 'yeni' ? '#fff' : COLORS.primary} />
            <Text style={[styles.splitOptionText, splitSource === 'yeni' && styles.splitOptionTextActive]}>Yeni split oluştur</Text>
          </TouchableOpacity>
        </View>

        {splitSource === 'kumbara' && (
          <View style={styles.splitCard}>
            <Text style={styles.splitCardTitle}>Kumbara seç</Text>
            {SAMPLE_JARS.map((jar) => (
              <TouchableOpacity
                key={jar.id}
                style={[styles.splitKumbaraRow, selectedJarForSplit?.id === jar.id && styles.splitKumbaraRowSelected]}
                onPress={() => setSelectedJarForSplit(selectedJarForSplit?.id === jar.id ? null : jar)}
              >
                <Text style={styles.splitKumbaraName}>{jar.name}</Text>
                <Text style={styles.jarMeta}>{formatMoney(jar.savings)} birikim</Text>
              </TouchableOpacity>
            ))}
            {selectedJarForSplit && (
              <View style={styles.splitDebtBlock}>
                <Text style={styles.splitCardTitle}>Kim kime ne kadar borçlu</Text>
                {splitDebts.length === 0 ? (
                  <Text style={styles.splitDebtEmpty}>Herkes eşit ödedi, borç yok.</Text>
                ) : (
                  splitDebts.map((d, idx) => (
                    <View key={idx} style={styles.debtCard}>
                      <View style={styles.debtLeft}>
                        <View style={styles.debtAvatarWrap}>
                          <View style={styles.debtAvatar}><Text style={styles.debtAvatarText}>{d.from.charAt(0)}</Text></View>
                          <View style={styles.debtBadgeGreen}>
                            <Ionicons name="arrow-forward" size={10} color="#fff" />
                          </View>
                        </View>
                        <View>
                          <Text style={styles.debtTitle}>{d.from}, {d.to}'ye borçlu</Text>
                          <Text style={styles.debtSub}>Split</Text>
                        </View>
                      </View>
                      <View style={styles.debtRight}>
                        <Text style={styles.debtAmountGreen}>{formatMoney(d.amount)}</Text>
                        <TouchableOpacity style={styles.settleBtn}><Text style={styles.settleBtnText}>Ödeş</Text></TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {splitSource === 'yeni' && (
          <View style={styles.splitCard}>
            <Text style={styles.splitCardTitle}>Kişiler ve ödenen tutarlar</Text>
            <View style={styles.splitInputRow}>
              <View style={styles.splitPersonInputWrap}>
                <TextInput
                  style={styles.splitPersonInput}
                  placeholder="Kişi adı"
                  value={newSplitPerson}
                  onChangeText={setNewSplitPerson}
                  placeholderTextColor="#6b7280"
                />
                <TouchableOpacity style={styles.kendimBtn} onPress={() => { setNewSplitPerson('Kendim'); setNewSplitDebts(null); }}>
                  <Text style={styles.kendimBtnText}>Kendim</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.splitAmountInput}
                placeholder="Tutar"
                value={newSplitAmount}
                onChangeText={setNewSplitAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#6b7280"
              />
              <TouchableOpacity style={styles.splitAddBtn} onPress={addSplitEntry}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {splitEntries.map((e) => (
              <View key={e.id} style={styles.splitEntryRow}>
                <View>
                  <Text style={styles.debtTitle}>{e.name}</Text>
                  <Text style={styles.debtSub}>{formatMoney(parseFloat(e.amount) || 0)} ödedi</Text>
                </View>
                <TouchableOpacity onPress={() => removeSplitEntry(e.id)}>
                  <Ionicons name="trash-outline" size={20} color={socialDanger} />
                </TouchableOpacity>
              </View>
            ))}
            {splitEntries.length >= 2 && (
              <TouchableOpacity style={styles.splitCreateBtn} onPress={createNewSplit}>
                <Text style={styles.splitCreateBtnText}>Oluştur</Text>
              </TouchableOpacity>
            )}
            {newSplitDebts !== null && (
              <View style={styles.splitDebtBlock}>
                <Text style={styles.splitCardTitle}>Kim kime ne kadar borçlu</Text>
                {newSplitDebts.length === 0 ? (
                  <Text style={styles.splitDebtEmpty}>Herkes eşit ödedi, borç yok.</Text>
                ) : (
                  newSplitDebts.map((d, idx) => (
                    <View key={idx} style={styles.debtCard}>
                      <View style={styles.debtLeft}>
                        <View style={styles.debtAvatarWrap}>
                          <View style={styles.debtAvatar}><Text style={styles.debtAvatarText}>{d.from.charAt(0)}</Text></View>
                          <View style={styles.debtBadgeGreen}><Ionicons name="arrow-forward" size={10} color="#fff" /></View>
                        </View>
                        <View>
                          <Text style={styles.debtTitle}>{d.from}, {d.to}'ye borçlu</Text>
                          <Text style={styles.debtSub}>Split</Text>
                        </View>
                      </View>
                      <View style={styles.debtRight}>
                        <Text style={styles.debtAmountGreen}>{formatMoney(d.amount)}</Text>
                        <TouchableOpacity style={styles.settleBtn}><Text style={styles.settleBtnText}>Ödeş</Text></TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

          </>
        )}
      </View>

      {/* Financial Challenges */}
      <View style={[styles.section, styles.sectionSpaced]}>
        <Text style={styles.sectionTitle}>Finansal Meydan Okumalar</Text>
        <View style={styles.challengeListWrap}>
        {[...CHALLENGE_TEMPLATES.slice(0, 2).map((ch, i) => ({ ...ch, active: activeChallengeIds.includes(ch.id) })), ...userChallenges].map((ch, idx) => {
          const isActive = activeChallengeIds.includes(ch.id);
          return (
          <View key={ch.id || idx} style={[isActive ? styles.challengeCardActive : styles.challengeCard, idx > 0 && styles.challengeCardSpaced]}>
            <View style={isActive ? styles.challengeIconWrap : styles.challengeIconWrapGray}>
              <Ionicons name={ch.icon || 'wallet'} size={28} color={isActive ? COLORS.primary : '#6b7280'} />
            </View>
            <View style={styles.challengeBody}>
              <View style={styles.challengeTitleRow}>
                <Text style={styles.challengeTitle}>{ch.title}</Text>
                <View style={styles.challengePuanWrap}>
                  <Text style={styles.challengePuan}>{ch.puan || 0} puan</Text>
                </View>
                {isActive ? <View style={styles.badgeActive}><Text style={styles.badgeActiveText}>Aktif</Text></View> : <View style={styles.badgeJoin}><Text style={styles.badgeJoinText}>Katıl</Text></View>}
              </View>
              <Text style={styles.challengeDesc}>{ch.desc}</Text>
              {isActive && (
                <>
                  <ProgressBar progress={70} height={6} style={styles.challengeBar} />
                  <View style={styles.challengeFooter}>
                    <View style={styles.challengeAvatars}>
                      <View style={styles.challengeAvatar}><Text style={styles.challengeAvatarText}>1</Text></View>
                      <View style={styles.challengeAvatar}><Text style={styles.challengeAvatarText}>2</Text></View>
                      <View style={styles.challengeAvatar}><Text style={styles.challengeAvatarText}>3</Text></View>
                    </View>
                    <Text style={styles.challengeMeta}>2 gün kaldı</Text>
                  </View>
                </>
              )}
              {!isActive && (
                <TouchableOpacity style={styles.acceptBtn} onPress={() => setActiveChallengeIds((prev) => (prev.includes(ch.id) ? prev : [...prev, ch.id]))}>
                  <Text style={styles.acceptBtnText}>Meydan Okumayı Kabul Et</Text>
                </TouchableOpacity>
              )}
              {ch.person && <Text style={styles.challengePerson}>Challenge: {ch.person}</Text>}
            </View>
          </View>
        ); })}
        <TouchableOpacity
          style={styles.challengeAddFab}
          onPress={() => { setShowChallengeCreate(true); setChallengeStep(1); setSelectedChallengeTemplate(null); setSelectedChallengePerson(null); }}
          activeOpacity={0.85}
        >
          <View style={styles.challengeAddFabRing}>
            <View style={styles.challengeAddFabInner}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        </View>

      {/* Challenge oluştur modal */}
      <Modal visible={showChallengeCreate} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowChallengeCreate(false)}>
          <View style={styles.jarDetailContent} onStartShouldSetResponder={() => true}>
            <View style={styles.jarDetailHeader}>
              <Text style={styles.jarDetailTitle}>{challengeStep === 1 ? 'Challenge seç' : 'Kişi seç'}</Text>
              <TouchableOpacity onPress={() => setShowChallengeCreate(false)}><Ionicons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            {challengeStep === 1 && CHALLENGE_TEMPLATES.map((t) => (
              <TouchableOpacity key={t.id} style={[styles.splitKumbaraRow, selectedChallengeTemplate?.id === t.id && styles.splitKumbaraRowSelected]} onPress={() => setSelectedChallengeTemplate(t)}>
                <View>
                  <Text style={styles.splitKumbaraName}>{t.title}</Text>
                  <Text style={styles.jarMeta}>{t.puan} puan</Text>
                </View>
              </TouchableOpacity>
            ))}
            {challengeStep === 2 && (() => {
              const people = [...new Set(SAMPLE_JARS.flatMap((j) => j.members))];
              return people.map((p) => (
                <TouchableOpacity key={p} style={[styles.splitKumbaraRow, selectedChallengePerson === p && styles.splitKumbaraRowSelected]} onPress={() => setSelectedChallengePerson(p)}>
                  <Text style={styles.splitKumbaraName}>{p}</Text>
                </TouchableOpacity>
              ));
            })()}
            <View style={styles.row}>
              {challengeStep === 2 && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setChallengeStep(1)}>
                  <Text style={styles.cancelBtnText}>Geri</Text>
                </TouchableOpacity>
              )}
              {challengeStep === 1 && selectedChallengeTemplate && (
                <TouchableOpacity style={styles.submitBtn} onPress={() => setChallengeStep(2)}>
                  <Text style={styles.submitBtnText}>İleri</Text>
                </TouchableOpacity>
              )}
              {challengeStep === 2 && selectedChallengePerson && (
                <TouchableOpacity style={styles.submitBtn} onPress={() => {
                  setUserChallenges((prev) => [...prev, { ...selectedChallengeTemplate, person: selectedChallengePerson, id: 'uc-' + Date.now(), active: false }]);
                  setShowChallengeCreate(false);
                }}>
                  <Text style={styles.submitBtnText}>Oluştur</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  sectionSpaced: { marginTop: 28 },
  challengeListWrap: { position: 'relative', paddingBottom: 24 },
  challengeAddFab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  challengeAddFabRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,51,153,0.2)',
    borderWidth: 3,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  challengeAddFabInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#101318', marginBottom: 12 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  jarScroll: { flexDirection: 'row', gap: 16, paddingRight: 16 },
  jarCard: { width: 256, flexShrink: 0 },
  jarImageWrap: { height: 176, borderRadius: RADIUS['2xl'], overflow: 'hidden', marginBottom: 12, backgroundColor: COLORS.primary, position: 'relative' },
  jarImageWrapGreen: { backgroundColor: '#059669' },
  jarImageGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  jarIconWrap: { position: 'absolute', top: 12, right: 12, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
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
  inviteCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inviteCodeInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 10 },
  cameraBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: COLORS.border, borderRadius: 8 },
  cancelBtnText: { color: '#101318' },
  submitBtn: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 8 },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  debtSection: { marginTop: 32, paddingHorizontal: 16 },
  quickSplitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
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
  challengeCardSpaced: { marginTop: 14 },
  challengeIconWrap: { width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(0,51,153,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  challengeIconWrapGray: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  challengeBody: { flex: 1 },
  challengeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 4 },
  challengeTitle: { fontWeight: '700', fontSize: 14, color: '#101318' },
  challengePuanWrap: { backgroundColor: 'rgba(0,51,153,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  challengePuan: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  challengePerson: { fontSize: 12, color: '#6b7280', marginTop: 4 },
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
  // QR modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  qrModalContent: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 24, alignItems: 'center' },
  qrModalTitle: { fontSize: 18, fontWeight: '700', color: '#101318', marginBottom: 20 },
  qrCodeBox: { padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 20 },
  qrCodePlaceholder: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8 },
  qrModalClose: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.primary, borderRadius: 12 },
  qrModalCloseText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  // Kumbara detay modal
  jarDetailContent: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 24, width: '100%', maxWidth: 360 },
  jarDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  jarDetailTitle: { fontSize: 20, fontWeight: '700', color: '#101318', flex: 1 },
  jarDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  jarDetailLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  jarDetailValue: { fontSize: 16, fontWeight: '700', color: '#101318' },
  jarDetailMembers: { marginBottom: 20 },
  jarDetailMemberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  jarDetailMemberName: { fontSize: 15, color: '#101318', fontWeight: '500', flex: 1 },
  jarDetailContribution: { fontSize: 14, color: '#059669', fontWeight: '600' },
  // QuickSplit
  splitSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  splitOptionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  splitOptionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.surface },
  splitOptionBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  splitOptionText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  splitOptionTextActive: { color: '#fff' },
  splitCard: { backgroundColor: '#f9fafb', borderRadius: RADIUS.xl, padding: 16, marginBottom: 16 },
  splitCardTitle: { fontSize: 14, fontWeight: '700', color: '#101318', marginBottom: 12 },
  splitKumbaraRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  splitKumbaraRowSelected: { backgroundColor: 'rgba(0,51,153,0.08)', borderRadius: 8 },
  splitKumbaraName: { fontWeight: '600', fontSize: 14, color: '#101318' },
  splitDebtBlock: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  splitDebtEmpty: { fontSize: 14, color: '#6b7280', fontStyle: 'italic', marginTop: 8 },
  splitDebtRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  splitDebtArrow: { marginRight: 0 },
  splitDebtText: { flex: 1, fontSize: 14, color: '#101318' },
  splitDebtFrom: { fontWeight: '700' },
  splitDebtTo: { fontWeight: '600', color: COLORS.primary },
  splitDebtAmount: { fontWeight: '700', color: '#059669' },
  splitInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  splitPersonInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  splitPersonInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10 },
  kendimBtn: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(0,51,153,0.12)', borderRadius: 10 },
  kendimBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  splitAmountInput: { width: 90, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10 },
  splitAddBtn: { width: 48, height: 48, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  splitCreateBtn: { marginTop: 16, paddingVertical: 14, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center' },
  splitCreateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  splitEntryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
});
