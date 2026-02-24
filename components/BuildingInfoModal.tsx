import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { BUILDING_CONFIG, getBuildingCost, getBuildingTime, getBuildingProduction } from '@shared/schema';

interface BuildingInfoModalProps {
  visible: boolean;
  onClose: () => void;
  building: {
    id: string;
    buildingType: string;
    level: number;
    isUpgrading: boolean;
    upgradeEndTime: string | null;
  } | null;
  isQueueBusy: boolean;
  resources: { water: number; dates: number; gold: number; stone: number };
  onUpgrade: (buildingId: string) => Promise<void>;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function BuildingInfoModal({
  visible, onClose, building, isQueueBusy, resources, onUpgrade,
}: BuildingInfoModalProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!building?.isUpgrading || !building.upgradeEndTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const end = new Date(building.upgradeEndTime!).getTime();
      const now = Date.now();
      const diff = Math.max(0, (end - now) / 1000);
      setTimeLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [building?.isUpgrading, building?.upgradeEndTime]);

  if (!building) return null;

  const config = BUILDING_CONFIG[building.buildingType];
  if (!config) return null;

  const isMaxLevel = building.level >= config.maxLevel;
  const production = getBuildingProduction(building.buildingType, building.level);
  const nextProduction = building.level < config.maxLevel
    ? getBuildingProduction(building.buildingType, building.level + 1) : null;
  const upgradeCost = getBuildingCost(building.buildingType, building.level);
  const upgradeTime = getBuildingTime(building.buildingType, building.level);

  const canAfford = resources.water >= upgradeCost.water &&
    resources.dates >= upgradeCost.dates &&
    resources.gold >= upgradeCost.gold &&
    resources.stone >= upgradeCost.stone;

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await onUpgrade(building.id);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name={config.icon as any} size={24} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.buildingName}>{config.nameAr}</Text>
                <Text style={styles.levelText}>
                  {building.level === 0 ? 'قيد الإنشاء' : `المستوى ${building.level}`}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {building.isUpgrading && timeLeft > 0 && (
            <View style={styles.upgradingBanner}>
              <Ionicons name="time-outline" size={18} color={Colors.warning} />
              <Text style={styles.upgradingText}>جاري البناء</Text>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
          )}

          {building.level > 0 && (production.water > 0 || production.dates > 0 || production.gold > 0 || production.stone > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الإنتاج الحالي / ساعة</Text>
              <View style={styles.productionRow}>
                {production.water > 0 && <ProductionItem icon="water-outline" value={production.water} color={Colors.water} />}
                {production.dates > 0 && <ProductionItem icon="leaf-outline" value={production.dates} color={Colors.dates} />}
                {production.gold > 0 && <ProductionItem icon="diamond-outline" value={production.gold} color={Colors.gold} />}
                {production.stone > 0 && <ProductionItem icon="cube-outline" value={production.stone} color={Colors.stone} />}
              </View>
            </View>
          )}

          {config.storageBonus && building.level > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>سعة المخزن الإضافية</Text>
              <View style={styles.productionRow}>
                <View style={styles.productionItem}>
                  <Ionicons name="archive-outline" size={14} color={Colors.primaryLight} />
                  <Text style={[styles.productionValue, { color: Colors.primaryLight }]}>+{config.storageBonus * building.level}</Text>
                </View>
              </View>
            </View>
          )}

          {isMaxLevel ? (
            <View style={styles.maxLevelBanner}>
              <Ionicons name="trophy" size={20} color={Colors.gold} />
              <Text style={styles.maxLevelText}>المستوى الأقصى!</Text>
            </View>
          ) : !building.isUpgrading && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                تكلفة الترقية للمستوى {building.level + 1}
              </Text>
              <View style={styles.costGrid}>
                <CostItem icon="water-outline" cost={upgradeCost.water} current={resources.water} color={Colors.water} />
                <CostItem icon="leaf-outline" cost={upgradeCost.dates} current={resources.dates} color={Colors.dates} />
                <CostItem icon="diamond-outline" cost={upgradeCost.gold} current={resources.gold} color={Colors.gold} />
                <CostItem icon="cube-outline" cost={upgradeCost.stone} current={resources.stone} color={Colors.stone} />
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.timeText}>وقت البناء: {formatTime(upgradeTime)}</Text>
              </View>

              {isQueueBusy && !building.isUpgrading ? (
                <View style={styles.queueFullBanner}>
                  <Ionicons name="hourglass-outline" size={16} color={Colors.warning} />
                  <Text style={styles.queueFullText}>طابور البناء ممتلئ</Text>
                </View>
              ) : (
                <Pressable
                  onPress={handleUpgrade}
                  disabled={!canAfford || upgrading}
                  style={({ pressed }) => [
                    styles.upgradeButton,
                    !canAfford && styles.upgradeButtonDisabled,
                    pressed && canAfford && styles.upgradeButtonPressed,
                  ]}
                >
                  {upgrading ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[styles.upgradeButtonText, !canAfford && styles.upgradeButtonTextDisabled]}>
                      {canAfford ? 'ترقية' : 'موارد غير كافية'}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ProductionItem({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <View style={styles.productionItem}>
      <Ionicons name={icon as any} size={14} color={color} />
      <Text style={[styles.productionValue, { color }]}>{value}/h</Text>
    </View>
  );
}

function CostItem({ icon, cost, current, color }: { icon: string; cost: number; current: number; color: string }) {
  const enough = current >= cost;
  return (
    <View style={styles.costItem}>
      <Ionicons name={icon as any} size={13} color={enough ? color : Colors.error} />
      <Text style={[styles.costValue, { color: enough ? color : Colors.error }]}>
        {cost.toLocaleString('en')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.backgroundModal,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.2)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 71, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 165, 71, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingName: {
    fontSize: 16,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.text,
  },
  levelText: {
    fontSize: 12,
    fontFamily: 'Tajawal_400Regular',
    color: Colors.textSecondary,
  },
  upgradingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 152, 0, 0.15)',
  },
  upgradingText: {
    fontSize: 13,
    fontFamily: 'Tajawal_500Medium',
    color: Colors.warning,
  },
  timerText: {
    fontSize: 15,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.warning,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 71, 0.08)',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Tajawal_500Medium',
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'right',
  },
  productionRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  productionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productionValue: {
    fontSize: 13,
    fontFamily: 'Tajawal_700Bold',
  },
  costGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  costValue: {
    fontSize: 12,
    fontFamily: 'Tajawal_700Bold',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Tajawal_400Regular',
    color: Colors.textSecondary,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  upgradeButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  upgradeButtonDisabled: {
    backgroundColor: 'rgba(212, 165, 71, 0.2)',
  },
  upgradeButtonText: {
    fontSize: 15,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.background,
  },
  upgradeButtonTextDisabled: {
    color: Colors.textMuted,
  },
  maxLevelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  maxLevelText: {
    fontSize: 16,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.gold,
  },
  queueFullBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  queueFullText: {
    fontSize: 13,
    fontFamily: 'Tajawal_500Medium',
    color: Colors.warning,
  },
});
