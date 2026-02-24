import { View, Text, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { BUILDING_CONFIG, BUILDING_TYPES, getBuildingCost, getBuildingTime } from '@shared/schema';

interface NewBuildingModalProps {
  visible: boolean;
  onClose: () => void;
  slotIndex: number;
  isQueueBusy: boolean;
  resources: { water: number; dates: number; gold: number; stone: number };
  onBuild: (buildingType: string, slotIndex: number) => Promise<void>;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function NewBuildingModal({
  visible, onClose, slotIndex, isQueueBusy, resources, onBuild,
}: NewBuildingModalProps) {
  const [building, setBuilding] = useState(false);
  const [buildingType, setBuildingType] = useState<string | null>(null);

  const buildingTypes = Object.entries(BUILDING_CONFIG);

  const handleBuild = async (type: string) => {
    setBuildingType(type);
    setBuilding(true);
    try {
      await onBuild(type, slotIndex);
      onClose();
    } catch (e) {
    } finally {
      setBuilding(false);
      setBuildingType(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>اختر مبنى</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {isQueueBusy && (
            <View style={styles.queueBanner}>
              <Ionicons name="hourglass-outline" size={16} color={Colors.warning} />
              <Text style={styles.queueText}>طابور البناء ممتلئ - انتظر حتى ينتهي البناء الحالي</Text>
            </View>
          )}

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {buildingTypes.map(([type, config]) => {
              const cost = getBuildingCost(type, 0);
              const time = getBuildingTime(type, 0);
              const canAfford = resources.water >= cost.water &&
                resources.dates >= cost.dates &&
                resources.gold >= cost.gold &&
                resources.stone >= cost.stone;
              const disabled = !canAfford || isQueueBusy;

              return (
                <Pressable
                  key={type}
                  onPress={() => !disabled && handleBuild(type)}
                  disabled={disabled || building}
                  style={({ pressed }) => [
                    styles.buildingCard,
                    pressed && !disabled && styles.buildingCardPressed,
                    disabled && styles.buildingCardDisabled,
                  ]}
                >
                  <View style={styles.buildingCardLeft}>
                    <View style={[styles.buildingIcon, disabled && styles.buildingIconDisabled]}>
                      <Ionicons name={config.icon as any} size={22} color={disabled ? Colors.textMuted : Colors.primary} />
                    </View>
                    <View style={styles.buildingInfo}>
                      <Text style={[styles.buildingName, disabled && styles.textDisabled]}>{config.nameAr}</Text>
                      <View style={styles.costRow}>
                        {cost.water > 0 && <MiniCost icon="water-outline" value={cost.water} enough={resources.water >= cost.water} color={Colors.water} />}
                        {cost.dates > 0 && <MiniCost icon="leaf-outline" value={cost.dates} enough={resources.dates >= cost.dates} color={Colors.dates} />}
                        {cost.gold > 0 && <MiniCost icon="diamond-outline" value={cost.gold} enough={resources.gold >= cost.gold} color={Colors.gold} />}
                        {cost.stone > 0 && <MiniCost icon="cube-outline" value={cost.stone} enough={resources.stone >= cost.stone} color={Colors.stone} />}
                      </View>
                    </View>
                  </View>
                  <View style={styles.buildingCardRight}>
                    {building && buildingType === type ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <>
                        <View style={styles.timeTag}>
                          <Ionicons name="time-outline" size={10} color={Colors.textMuted} />
                          <Text style={styles.timeTagText}>{formatTime(time)}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MiniCost({ icon, value, enough, color }: { icon: string; value: number; enough: boolean; color: string }) {
  return (
    <View style={styles.miniCost}>
      <Ionicons name={icon as any} size={10} color={enough ? color : Colors.error} />
      <Text style={[styles.miniCostText, { color: enough ? color : Colors.error }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.backgroundModal,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(212, 165, 71, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 71, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.text,
  },
  queueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    padding: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  queueText: {
    fontSize: 12,
    fontFamily: 'Tajawal_400Regular',
    color: Colors.warning,
    flex: 1,
    textAlign: 'right',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    gap: 8,
    paddingBottom: 40,
  },
  buildingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.1)',
  },
  buildingCardPressed: {
    backgroundColor: 'rgba(212, 165, 71, 0.1)',
    transform: [{ scale: 0.98 }],
  },
  buildingCardDisabled: {
    opacity: 0.5,
  },
  buildingCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  buildingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 165, 71, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingIconDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  buildingInfo: {
    flex: 1,
    gap: 3,
  },
  buildingName: {
    fontSize: 14,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.text,
    textAlign: 'right',
  },
  textDisabled: {
    color: Colors.textMuted,
  },
  costRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  miniCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniCostText: {
    fontSize: 10,
    fontFamily: 'Tajawal_500Medium',
  },
  buildingCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeTagText: {
    fontSize: 10,
    fontFamily: 'Tajawal_400Regular',
    color: Colors.textMuted,
  },
});
