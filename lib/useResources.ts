import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from './query-client';
import { fetch } from 'expo/fetch';

interface Resources {
  water: number;
  dates: number;
  gold: number;
  stone: number;
  waterRate: number;
  datesRate: number;
  goldRate: number;
  stoneRate: number;
  storageCapacity: number;
  lastResourceUpdate: string;
}

interface InterpolatedResources {
  water: number;
  dates: number;
  gold: number;
  stone: number;
  waterRate: number;
  datesRate: number;
  goldRate: number;
  stoneRate: number;
  storageCapacity: number;
  isLoading: boolean;
  refetch: () => void;
}

export function useResources(profileId: string | undefined): InterpolatedResources {
  const queryClient = useQueryClient();
  const [interpolated, setInterpolated] = useState({
    water: 0, dates: 0, gold: 0, stone: 0,
  });
  const serverDataRef = useRef<Resources | null>(null);
  const lastSyncRef = useRef<number>(Date.now());

  const { data: serverResources, isLoading, refetch } = useQuery<Resources>({
    queryKey: ['resources', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('No profile ID');
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/profile/${profileId}/resources`);
      if (!res.ok) throw new Error('Failed to fetch resources');
      return res.json();
    },
    enabled: !!profileId,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  useEffect(() => {
    if (serverResources) {
      serverDataRef.current = serverResources;
      lastSyncRef.current = Date.now();
      setInterpolated({
        water: serverResources.water,
        dates: serverResources.dates,
        gold: serverResources.gold,
        stone: serverResources.stone,
      });
    }
  }, [serverResources]);

  useEffect(() => {
    if (!serverDataRef.current) return;

    const interval = setInterval(() => {
      const data = serverDataRef.current;
      if (!data) return;

      const elapsedSeconds = (Date.now() - lastSyncRef.current) / 1000;
      const elapsedHours = elapsedSeconds / 3600;

      setInterpolated({
        water: Math.min(data.water + data.waterRate * elapsedHours, data.storageCapacity),
        dates: Math.min(data.dates + data.datesRate * elapsedHours, data.storageCapacity),
        gold: Math.min(data.gold + data.goldRate * elapsedHours, data.storageCapacity),
        stone: Math.min(data.stone + data.stoneRate * elapsedHours, data.storageCapacity),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [serverResources]);

  return {
    water: Math.floor(interpolated.water),
    dates: Math.floor(interpolated.dates),
    gold: Math.floor(interpolated.gold),
    stone: Math.floor(interpolated.stone),
    waterRate: serverResources?.waterRate || 0,
    datesRate: serverResources?.datesRate || 0,
    goldRate: serverResources?.goldRate || 0,
    stoneRate: serverResources?.stoneRate || 0,
    storageCapacity: serverResources?.storageCapacity || 2000,
    isLoading,
    refetch,
  };
}
