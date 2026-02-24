import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, ImageBackground,
  Dimensions, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useResources } from '@/lib/useResources';
import { getApiUrl, apiRequest } from '@/lib/query-client';
import { fetch } from 'expo/fetch';
import ResourceBar from '@/components/ResourceBar';
import BuildingSlot from '@/components/BuildingSlot';
import BuildingInfoModal from '@/components/BuildingInfoModal';
import NewBuildingModal from '@/components/NewBuildingModal';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CITY_WIDTH = SCREEN_WIDTH;
const CITY_HEIGHT = CITY_WIDTH * 1.4;

const SLOT_POSITIONS: { x: number; y: number }[] = [
  { x: 0.50, y: 0.08 },
  { x: 0.28, y: 0.16 },
  { x: 0.72, y: 0.15 },
  { x: 0.15, y: 0.28 },
  { x: 0.50, y: 0.26 },
  { x: 0.82, y: 0.30 },
  { x: 0.30, y: 0.42 },
  { x: 0.65, y: 0.44 },
  { x: 0.12, y: 0.55 },
  { x: 0.48, y: 0.58 },
  { x: 0.82, y: 0.56 },
  { x: 0.38, y: 0.73 },
];

function getSlotScale(yNormalized: number): number {
  return 0.7 + yNormalized * 0.55;
}

interface BuildingData {
  id: string;
  buildingType: string;
  level: number;
  slotIndex: number;
  isUpgrading: boolean;
  upgradeStartTime: string | null;
  upgradeEndTime: string | null;
}

export default function GameHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const [profileId, setProfileId] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [showBuildingInfo, setShowBuildingInfo] = useState(false);
  const [showNewBuilding, setShowNewBuilding] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(0);

  useEffect(() => {
    if (user) {
      initProfile();
    }
  }, [user]);

  const initProfile = async () => {
    if (!user) return;
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'player',
          email: user.email || '',
        }),
      });
      if (res.ok) {
        setProfileId(user.id);
      }
    } catch (e) {
      console.error('Failed to init profile:', e);
    }
  };

  const resources = useResources(profileId);

  const { data: buildingsData, refetch: refetchBuildings } = useQuery<BuildingData[]>({
    queryKey: ['buildings', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('No profile');
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/profile/${profileId}/buildings`);
      if (!res.ok) throw new Error('Failed to fetch buildings');
      return res.json();
    },
    enabled: !!profileId,
    refetchInterval: 5000,
  });

  const buildings = buildingsData || [];
  const isQueueBusy = buildings.some(b => b.isUpgrading);

  const getBuildingForSlot = (slotIndex: number) => {
    return buildings.find(b => b.slotIndex === slotIndex) || null;
  };

  const handleSlotPress = (slotIndex: number) => {
    const building = getBuildingForSlot(slotIndex);
    if (building) {
      setSelectedBuilding(building);
      setShowBuildingInfo(true);
    } else {
      setSelectedSlot(slotIndex);
      setShowNewBuilding(true);
    }
  };

  const handleUpgrade = async (buildingId: string) => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/buildings/${buildingId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const data = await res.json();
        Alert.alert('خطأ', data.error || 'فشل في الترقية');
        return;
      }
      await refetchBuildings();
      resources.refetch();
      setShowBuildingInfo(false);
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'حدث خطأ');
    }
  };

  const handleBuild = async (buildingType: string, slotIndex: number) => {
    try {
      if (!profileId) return;
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/profile/${profileId}/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingType, slotIndex }),
      });
      if (!res.ok) {
        const data = await res.json();
        Alert.alert('خطأ', data.error || 'فشل في البناء');
        return;
      }
      await refetchBuildings();
      resources.refetch();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'حدث خطأ');
    }
  };

  const sortedSlots = SLOT_POSITIONS
    .map((pos, index) => ({ pos, index }))
    .sort((a, b) => a.pos.y - b.pos.y);

  if (!profileId) {
    return (
      <View style={[styles.loadingContainer]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل مملكتك...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.profileBadge}>
            <Ionicons name="shield" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.playerName}>
            {user?.user_metadata?.username || 'محارب'}
          </Text>
        </View>
        <Pressable onPress={signOut} hitSlop={12}>
          <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ResourceBar
        water={resources.water}
        dates={resources.dates}
        gold={resources.gold}
        stone={resources.stone}
        waterRate={resources.waterRate}
        datesRate={resources.datesRate}
        goldRate={resources.goldRate}
        stoneRate={resources.stoneRate}
        storageCapacity={resources.storageCapacity}
      />

      {isQueueBusy && (
        <View style={styles.queueIndicator}>
          <Ionicons name="hammer-outline" size={12} color={Colors.warning} />
          <Text style={styles.queueIndicatorText}>جاري البناء...</Text>
        </View>
      )}

      <ScrollView
        style={styles.cityScroll}
        contentContainerStyle={styles.cityScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={require('@/assets/images/city-background-new.png')}
          style={[styles.cityMap, { width: CITY_WIDTH, height: CITY_HEIGHT }]}
          resizeMode="cover"
        >
          <View style={styles.cityOverlay} />
          {sortedSlots.map(({ pos, index }) => {
            const building = getBuildingForSlot(index);
            const scale = getSlotScale(pos.y);
            const slotW = Math.round(64 * scale);
            const slotH = Math.round(64 * scale);

            return (
              <View
                key={index}
                style={[
                  styles.slotWrapper,
                  {
                    left: pos.x * CITY_WIDTH - slotW / 2,
                    top: pos.y * CITY_HEIGHT - slotH / 2,
                    zIndex: Math.round(pos.y * 100),
                  },
                ]}
              >
                <BuildingSlot
                  building={building}
                  slotIndex={index}
                  onPress={() => handleSlotPress(index)}
                  scale={scale}
                />
              </View>
            );
          })}
        </ImageBackground>
      </ScrollView>

      <BuildingInfoModal
        visible={showBuildingInfo}
        onClose={() => setShowBuildingInfo(false)}
        building={selectedBuilding}
        isQueueBusy={isQueueBusy}
        resources={{
          water: resources.water,
          dates: resources.dates,
          gold: resources.gold,
          stone: resources.stone,
        }}
        onUpgrade={handleUpgrade}
      />

      <NewBuildingModal
        visible={showNewBuilding}
        onClose={() => setShowNewBuilding(false)}
        slotIndex={selectedSlot}
        isQueueBusy={isQueueBusy}
        resources={{
          water: resources.water,
          dates: resources.dates,
          gold: resources.gold,
          stone: resources.stone,
        }}
        onBuild={handleBuild}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Tajawal_500Medium',
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 165, 71, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 165, 71, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.2)',
  },
  playerName: {
    fontSize: 14,
    fontFamily: 'Tajawal_700Bold',
    color: Colors.text,
  },
  queueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 152, 0, 0.06)',
  },
  queueIndicatorText: {
    fontSize: 11,
    fontFamily: 'Tajawal_500Medium',
    color: Colors.warning,
  },
  cityScroll: {
    flex: 1,
  },
  cityScrollContent: {
    flexGrow: 1,
  },
  cityMap: {
    position: 'relative',
  },
  cityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 14, 5, 0.15)',
  },
  slotWrapper: {
    position: 'absolute',
  },
});
