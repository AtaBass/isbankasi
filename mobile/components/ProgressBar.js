import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export function ProgressBar({ progress = 0, height = 8, color = COLORS.primary, backgroundColor = COLORS.border, style }) {
  const pct = Math.min(100, Math.max(0, Number(progress)));
  return (
    <View style={[styles.track, { height, backgroundColor }, style]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: RADIUS.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADIUS.full },
});
