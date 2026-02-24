import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { BUILDING_CONFIG } from '@shared/schema';

const BUILDING_IMAGES: Record<string, ImageSourcePropType> = {
  well: require('@/assets/images/buildings/well.png'),
  date_farm: require('@/assets/images/buildings/date_farm.png'),
  gold_mine: require('@/assets/images/buildings/gold_mine.png'),
  quarry: require('@/assets/images/buildings/quarry.png'),
  barracks: require('@/assets/images/buildings/barracks.png'),
  wall: require('@/assets/images/buildings/wall.png'),
  storage: require('@/assets/images/buildings/storage.png'),
  market: require('@/assets/images/buildings/market.png'),
};

interface BuildingSlotProps {
  building: {
    id: string;
    buildingType: string;
    level: number;
    isUpgrading: boolean;
    upgradeEndTime: string | null;
  } | null;
  slotIndex: number;
  onPress: () => void;
  scale: number;
}

function formatTimeShort(seconds: number): string {
  if (seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function UpgradingIndicator({ iconSize }: { iconSize: number }) {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View style={[styles.upgradingGlow, animatedStyle]}>
      <Ionicons name="hammer" size={iconSize} color={Colors.warning} />
    </Animated.View>
  );
}

export default function BuildingSlot({ building, slotIndex, onPress, scale }: BuildingSlotProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  const containerSize = Math.round(72 * scale);
  const imageSize = Math.round(64 * scale);

  useEffect(() => {
    if (!building?.isUpgrading || !building.upgradeEndTime) {
      setTimeLeft(0);
      return;
    }
    const updateTimer = () => {
      const end = new Date(building.upgradeEndTime!).getTime();
      setTimeLeft(Math.max(0, (end - Date.now()) / 1000));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [building?.isUpgrading, building?.upgradeEndTime]);

  if (!building) {
    const emptySize = Math.round(40 * scale);
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.emptySlot,
          { width: containerSize, height: containerSize },
        ]}
      >
        {({ pressed }) => (
          <View style={[
            styles.emptyFrame,
            {
              width: emptySize,
              height: emptySize,
              borderRadius: Math.round(8 * scale),
              opacity: pressed ? 0.6 : 0.3,
            },
          ]}>
            <Ionicons
              name="add"
              size={Math.round(14 * scale)}
              color="rgba(210, 180, 140, 0.5)"
            />
          </View>
        )}
      </Pressable>
    );
  }

  const config = BUILDING_CONFIG[building.buildingType];
  if (!config) return null;

  const buildingImage = BUILDING_IMAGES[building.buildingType];
  const shadowW = Math.round(50 * scale);
  const shadowH = Math.round(shadowW * 0.25);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.buildingContainer,
        { width: containerSize, height: containerSize },
        pressed && styles.buildingPressed,
      ]}
    >
      <View style={[styles.groundShadow, {
        width: shadowW,
        height: shadowH,
        borderRadius: shadowW,
        bottom: Math.round(2 * scale),
      }]} />

      {buildingImage ? (
        <Image
          source={buildingImage}
          style={{
            width: imageSize,
            height: imageSize,
          }}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.fallbackCircle, {
          width: Math.round(46 * scale),
          height: Math.round(46 * scale),
          borderRadius: Math.round(23 * scale),
        }]}>
          <Ionicons name={config.icon as any} size={Math.round(24 * scale)} color="#F5E6D0" />
        </View>
      )}

      {building.level > 0 && (
        <View style={[styles.levelBadge, {
          minWidth: Math.round(20 * scale),
          height: Math.round(20 * scale),
          borderRadius: Math.round(10 * scale),
          top: Math.round(0 * scale),
          right: Math.round(2 * scale),
        }]}>
          <Text style={[styles.levelText, { fontSize: Math.round(11 * scale) }]}>{building.level}</Text>
        </View>
      )}

      {building.isUpgrading && timeLeft > 0 && (
        <>
          <UpgradingIndicator iconSize={Math.round(14 * scale)} />
          <View style={[styles.timerBadge, { borderRadius: Math.round(6 * scale), bottom: Math.round(-2 * scale) }]}>
            <Text style={[styles.timerText, { fontSize: Math.round(9 * scale) }]}>{formatTimeShort(timeLeft)}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFrame: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(210, 180, 140, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buildingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingPressed: {
    transform: [{ scale: 0.92 }],
  },
  groundShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  fallbackCircle: {
    backgroundColor: 'rgba(180, 140, 80, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(210, 180, 140, 0.4)',
  },
  levelBadge: {
    position: 'absolute',
    backgroundColor: '#D4A547',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.4)',
      },
      default: {
        elevation: 3,
      },
    }),
  },
  levelText: {
    fontFamily: 'Tajawal_700Bold',
    color: Colors.white,
  },
  upgradingGlow: {
    position: 'absolute',
    top: -2,
    left: 0,
  },
  timerBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 140, 0, 0.9)',
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  timerText: {
    fontFamily: 'Tajawal_700Bold',
    color: Colors.white,
  },
});
