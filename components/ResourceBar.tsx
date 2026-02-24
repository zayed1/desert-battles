import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface ResourceBarProps {
  water: number;
  dates: number;
  gold: number;
  stone: number;
  waterRate: number;
  datesRate: number;
  goldRate: number;
  stoneRate: number;
  storageCapacity: number;
}

function ResourceItem({ icon, value, rate, color, capacity }: {
  icon: string; value: number; rate: number; color: string; capacity: number;
}) {
  const fillPercent = Math.min((value / capacity) * 100, 100);

  return (
    <View style={styles.resourceItem}>
      <View style={styles.resourceTop}>
        <Ionicons name={icon as any} size={14} color={color} />
        <Text style={[styles.resourceValue, { color }]}>
          {value.toLocaleString('en')}
        </Text>
      </View>
      <View style={styles.capacityBarBg}>
        <View style={[styles.capacityBarFill, { width: `${fillPercent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function ResourceBar({
  water, dates, gold, stone,
  waterRate, datesRate, goldRate, stoneRate,
  storageCapacity,
}: ResourceBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.resourcesRow}>
        <ResourceItem icon="water-outline" value={water} rate={waterRate} color={Colors.water} capacity={storageCapacity} />
        <ResourceItem icon="leaf-outline" value={dates} rate={datesRate} color={Colors.dates} capacity={storageCapacity} />
        <ResourceItem icon="diamond-outline" value={gold} rate={goldRate} color={Colors.gold} capacity={storageCapacity} />
        <ResourceItem icon="cube-outline" value={stone} rate={stoneRate} color={Colors.stone} capacity={storageCapacity} />
      </View>
      <View style={styles.capacityRow}>
        <Ionicons name="archive-outline" size={10} color={Colors.textMuted} />
        <Text style={styles.capacityText}>
          {storageCapacity.toLocaleString('en')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 14, 5, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 71, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resourcesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  resourceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  resourceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceValue: {
    fontSize: 12,
    fontFamily: 'Tajawal_700Bold',
  },
  capacityBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.7,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 4,
  },
  capacityText: {
    fontSize: 9,
    fontFamily: 'Tajawal_400Regular',
    color: Colors.textMuted,
  },
});
