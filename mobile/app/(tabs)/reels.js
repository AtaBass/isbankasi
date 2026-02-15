import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import { reels as reelsApi, rewards as rewardsApi } from '../../lib/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const REEL_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBo50TFSESMtFGu3Tz5Px1KLW9ZyViiSL7T13jMlzzxOxqKkpYiHjvNB1id5IWCOTrJVSGt98kQU33sUn3wj2N0QTlgxNahJqrifRRYKiSpc82GBiP9p3OSA0oT3z6fdofijzb9wcikMcX1FDX6bfs4PAgidb6sX8EiyLAbmrP1wsyMbLuY7N3ZUqE4nF2JzpOScbZevNGd1gPhInqM0DSQQCr7W3LO5B_MmuDqGtpBRvaXydja58Z0eT2tQfXd_CYKGdbJ18XWO-Zn';

export default function ReelsScreen() {
  const [reels, setReels] = useState([]);
  const [points, setPoints] = useState(null);

  useEffect(() => {
    Promise.all([
      reelsApi.list().catch(() => []),
      rewardsApi.myPoints().catch(() => null),
    ]).then(([r, p]) => {
      setReels(r);
      setPoints(p);
    });
  }, []);

  const currentReel = reels[0] || {
    title: 'What is Compound Interest?',
    description: 'Compound interest is interest calculated on the principal amount and also on the accumulated interest of previous periods. It is often called the "eighth wonder of the world".',
    points_reward: 50,
    duration_seconds: 143,
  };
  const totalPts = points?.available_points ?? 1250;
  const progressPct = 37;
  const currentTime = '0:37';
  const totalTime = '2:23';

  return (
    <View style={styles.container}>
      {/* Full screen video background */}
      <View style={styles.videoWrap}>
        <ImageBackground
          source={{ uri: REEL_IMAGE }}
          style={styles.videoBg}
          resizeMode="cover"
        >
          <View style={styles.playOverlay}>
            <View style={styles.playBtnCircle}>
              <Ionicons name="play" size={48} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
        </ImageBackground>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      {/* Top header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.pointsPill}>
          <Ionicons name="cash" size={18} color="#facc15" />
          <Text style={styles.pointsPillText}>{totalPts.toLocaleString()} pts</Text>
        </View>
        <TouchableOpacity style={styles.topBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Right sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.creatorWrap}>
          <View style={styles.creatorAvatar} />
          <View style={styles.followBadge}>
            <Ionicons name="add" size={12} color="#fff" />
          </View>
        </View>
        <View style={styles.sideItem}>
          <Ionicons name="heart" size={32} color="#fff" />
          <Text style={styles.sideCount}>1.2k</Text>
        </View>
        <View style={styles.sideItem}>
          <Ionicons name="chatbubble" size={32} color="#fff" />
          <Text style={styles.sideCount}>85</Text>
        </View>
        <View style={styles.sideItem}>
          <Ionicons name="share" size={32} color="#fff" />
          <Text style={styles.sideCount}>430</Text>
        </View>
        <View style={styles.earnBadge}>
          <Ionicons name="star" size={24} color="#fff" />
          <Text style={styles.earnBadgeText}>+50 PTS</Text>
        </View>
      </View>

      {/* Bottom content overlay */}
      <View style={styles.bottomOverlay}>
        <View style={styles.bottomContent}>
          <Text style={styles.reelTitle} numberOfLines={1}>{currentReel.title}</Text>
          <Text style={styles.reelDesc} numberOfLines={2}>{currentReel.description}</Text>
          <TouchableOpacity style={styles.seeMoreRow}>
            <Text style={styles.seeMoreText}>See more</Text>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.audioRow}>
          <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.audioText} numberOfLines={1}>
            Original Audio - İş-Gen Academy • Financial Basics Series
          </Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.timeText}>{currentTime}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]}>
              <View style={styles.playhead} />
            </View>
          </View>
          <Text style={styles.timeText}>{totalTime}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  videoWrap: { ...StyleSheet.absoluteFillObject },
  videoBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  playOverlay: { position: 'absolute' },
  playBtnCircle: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 24, borderRadius: 9999 },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pointsPillText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sidebar: {
    position: 'absolute',
    right: 16,
    bottom: 140,
    zIndex: 20,
    alignItems: 'center',
    gap: 24,
  },
  creatorWrap: { position: 'relative', marginBottom: 8 },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#94a3b8',
    borderWidth: 2,
    borderColor: '#fff',
  },
  followBadge: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideItem: { alignItems: 'center' },
  sideCount: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 2 },
  earnBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(0,51,153,0.9)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  earnBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
  },
  bottomContent: { maxWidth: '80%' },
  reelTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  reelDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
  seeMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  seeMoreText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  audioText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, flex: 1 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  timeText: { color: '#fff', fontSize: 10, fontWeight: '500' },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    position: 'relative',
  },
  playhead: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
