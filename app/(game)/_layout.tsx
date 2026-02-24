import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

export default function GameLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1B2838',
          borderTopColor: 'rgba(212, 165, 71, 0.15)',
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 84 : 80,
          paddingBottom: Platform.OS === 'web' ? 34 : 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#D4A547',
        tabBarInactiveTintColor: 'rgba(196, 162, 101, 0.45)',
        tabBarLabelStyle: {
          fontFamily: 'Tajawal_700Bold',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'المدينة',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'الخريطة',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
