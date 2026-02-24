import { supabaseAdmin } from "./supabase-admin";

export interface Profile {
  id: string;
  username: string;
  email: string;
  water: number;
  dates: number;
  gold: number;
  stone: number;
  waterRate: number;
  datesRate: number;
  goldRate: number;
  stoneRate: number;
  storageCapacity: number;
  mapX: number;
  mapY: number;
  lastResourceUpdate: Date;
  createdAt: Date;
}

export interface InsertProfile {
  id: string;
  username: string;
  email: string;
}

export interface Building {
  id: string;
  profileId: string;
  buildingType: string;
  level: number;
  slotIndex: number;
  isUpgrading: boolean;
  upgradeStartTime: Date | null;
  upgradeEndTime: Date | null;
  createdAt: Date;
}

export interface InsertBuilding {
  profileId: string;
  buildingType: string;
  level: number;
  slotIndex: number;
}

export interface WorldMapCell {
  id: string;
  x: number;
  y: number;
  profileId: string | null;
  terrainType: string;
  isOccupied: boolean;
}

function dbToProfile(row: any): Profile {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    water: row.water,
    dates: row.dates,
    gold: row.gold,
    stone: row.stone,
    waterRate: row.water_rate,
    datesRate: row.dates_rate,
    goldRate: row.gold_rate,
    stoneRate: row.stone_rate,
    storageCapacity: row.storage_capacity,
    mapX: row.map_x,
    mapY: row.map_y,
    lastResourceUpdate: new Date(row.last_resource_update),
    createdAt: new Date(row.created_at),
  };
}

function profileToDb(data: Partial<Profile>): Record<string, any> {
  const map: Record<string, any> = {};
  if (data.username !== undefined) map.username = data.username;
  if (data.email !== undefined) map.email = data.email;
  if (data.water !== undefined) map.water = data.water;
  if (data.dates !== undefined) map.dates = data.dates;
  if (data.gold !== undefined) map.gold = data.gold;
  if (data.stone !== undefined) map.stone = data.stone;
  if (data.waterRate !== undefined) map.water_rate = data.waterRate;
  if (data.datesRate !== undefined) map.dates_rate = data.datesRate;
  if (data.goldRate !== undefined) map.gold_rate = data.goldRate;
  if (data.stoneRate !== undefined) map.stone_rate = data.stoneRate;
  if (data.storageCapacity !== undefined) map.storage_capacity = data.storageCapacity;
  if (data.mapX !== undefined) map.map_x = data.mapX;
  if (data.mapY !== undefined) map.map_y = data.mapY;
  if (data.lastResourceUpdate !== undefined) map.last_resource_update = data.lastResourceUpdate instanceof Date ? data.lastResourceUpdate.toISOString() : data.lastResourceUpdate;
  return map;
}

function dbToBuilding(row: any): Building {
  return {
    id: row.id,
    profileId: row.profile_id,
    buildingType: row.building_type,
    level: row.level,
    slotIndex: row.slot_index,
    isUpgrading: row.is_upgrading,
    upgradeStartTime: row.upgrade_start_time ? new Date(row.upgrade_start_time) : null,
    upgradeEndTime: row.upgrade_end_time ? new Date(row.upgrade_end_time) : null,
    createdAt: new Date(row.created_at),
  };
}

function buildingToDb(data: Partial<Building>): Record<string, any> {
  const map: Record<string, any> = {};
  if (data.profileId !== undefined) map.profile_id = data.profileId;
  if (data.buildingType !== undefined) map.building_type = data.buildingType;
  if (data.level !== undefined) map.level = data.level;
  if (data.slotIndex !== undefined) map.slot_index = data.slotIndex;
  if (data.isUpgrading !== undefined) map.is_upgrading = data.isUpgrading;
  if (data.upgradeStartTime !== undefined) map.upgrade_start_time = data.upgradeStartTime instanceof Date ? data.upgradeStartTime.toISOString() : data.upgradeStartTime;
  if (data.upgradeEndTime !== undefined) map.upgrade_end_time = data.upgradeEndTime instanceof Date ? data.upgradeEndTime.toISOString() : data.upgradeEndTime;
  return map;
}

function dbToWorldMapCell(row: any): WorldMapCell {
  return {
    id: row.id,
    x: row.x,
    y: row.y,
    profileId: row.profile_id,
    terrainType: row.terrain_type,
    isOccupied: row.is_occupied,
  };
}

export interface IStorage {
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, data: Partial<Profile>): Promise<Profile | undefined>;
  getBuildings(profileId: string): Promise<Building[]>;
  getBuilding(id: string): Promise<Building | undefined>;
  createBuilding(building: InsertBuilding): Promise<Building>;
  updateBuilding(id: string, data: Partial<Building>): Promise<Building | undefined>;
  getWorldMapCells(minX: number, maxX: number, minY: number, maxY: number): Promise<WorldMapCell[]>;
  getWorldMapCell(x: number, y: number): Promise<WorldMapCell | undefined>;
  createWorldMapCell(cell: Partial<WorldMapCell>): Promise<WorldMapCell>;
}

export class SupabaseStorage implements IStorage {
  async getProfile(id: string): Promise<Profile | undefined> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return undefined;
    return dbToProfile(data);
  }

  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    if (error || !data) return undefined;
    return dbToProfile(data);
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: insertProfile.id,
        username: insertProfile.username,
        email: insertProfile.email,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create profile: ${error.message}`);
    return dbToProfile(data);
  }

  async updateProfile(id: string, updateData: Partial<Profile>): Promise<Profile | undefined> {
    const dbData = profileToDb(updateData);
    if (Object.keys(dbData).length === 0) return this.getProfile(id);
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return dbToProfile(data);
  }

  async getBuildings(profileId: string): Promise<Building[]> {
    const { data, error } = await supabaseAdmin
      .from('buildings')
      .select('*')
      .eq('profile_id', profileId);
    if (error || !data) return [];
    return data.map(dbToBuilding);
  }

  async getBuilding(id: string): Promise<Building | undefined> {
    const { data, error } = await supabaseAdmin
      .from('buildings')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return undefined;
    return dbToBuilding(data);
  }

  async createBuilding(insertBuilding: InsertBuilding): Promise<Building> {
    const { data, error } = await supabaseAdmin
      .from('buildings')
      .insert({
        profile_id: insertBuilding.profileId,
        building_type: insertBuilding.buildingType,
        level: insertBuilding.level,
        slot_index: insertBuilding.slotIndex,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create building: ${error.message}`);
    return dbToBuilding(data);
  }

  async updateBuilding(id: string, updateData: Partial<Building>): Promise<Building | undefined> {
    const dbData = buildingToDb(updateData);
    if (Object.keys(dbData).length === 0) return this.getBuilding(id);
    const { data, error } = await supabaseAdmin
      .from('buildings')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return dbToBuilding(data);
  }

  async getWorldMapCells(minX: number, maxX: number, minY: number, maxY: number): Promise<WorldMapCell[]> {
    const { data, error } = await supabaseAdmin
      .from('world_map')
      .select('*')
      .gte('x', minX)
      .lte('x', maxX)
      .gte('y', minY)
      .lte('y', maxY);
    if (error || !data) return [];
    return data.map(dbToWorldMapCell);
  }

  async getWorldMapCell(x: number, y: number): Promise<WorldMapCell | undefined> {
    const { data, error } = await supabaseAdmin
      .from('world_map')
      .select('*')
      .eq('x', x)
      .eq('y', y)
      .single();
    if (error || !data) return undefined;
    return dbToWorldMapCell(data);
  }

  async createWorldMapCell(cell: Partial<WorldMapCell>): Promise<WorldMapCell> {
    const { data, error } = await supabaseAdmin
      .from('world_map')
      .insert({
        x: cell.x,
        y: cell.y,
        profile_id: cell.profileId,
        terrain_type: cell.terrainType || 'desert',
        is_occupied: cell.isOccupied || false,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create world map cell: ${error.message}`);
    return dbToWorldMapCell(data);
  }
}

export const storage = new SupabaseStorage();
