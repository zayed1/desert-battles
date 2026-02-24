import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import {
  BUILDING_TYPES, BUILDING_CONFIG,
  getBuildingCost, getBuildingTime, getBuildingProduction,
} from "@shared/schema";

function calculateResources(profile: any) {
  const now = new Date();
  const lastUpdate = new Date(profile.lastResourceUpdate);
  const elapsedHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

  const water = Math.min(profile.water + profile.waterRate * elapsedHours, profile.storageCapacity);
  const dates = Math.min(profile.dates + profile.datesRate * elapsedHours, profile.storageCapacity);
  const gold = Math.min(profile.gold + profile.goldRate * elapsedHours, profile.storageCapacity);
  const stone = Math.min(profile.stone + profile.stoneRate * elapsedHours, profile.storageCapacity);

  return { water, dates, gold, stone, lastResourceUpdate: now };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/profile", async (req: Request, res: Response) => {
    try {
      const { id, username, email } = req.body;
      if (!id || !username || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let profile = await storage.getProfile(id);
      if (profile) {
        const resources = calculateResources(profile);
        profile = await storage.updateProfile(id, resources) || profile;
        return res.json(profile);
      }

      const randomX = Math.floor(Math.random() * 100);
      const randomY = Math.floor(Math.random() * 100);

      profile = await storage.createProfile({
        id,
        username,
        email,
      });

      await storage.updateProfile(id, {
        mapX: randomX,
        mapY: randomY,
      });

      const defaultBuildings = [
        { profileId: id, buildingType: BUILDING_TYPES.WELL, level: 1, slotIndex: 0 },
        { profileId: id, buildingType: BUILDING_TYPES.DATE_FARM, level: 1, slotIndex: 1 },
      ];

      for (const b of defaultBuildings) {
        await storage.createBuilding(b);
      }

      profile = await storage.getProfile(id);
      return res.json(profile);
    } catch (error: any) {
      console.error("Error creating/getting profile:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profile/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let profile = await storage.getProfile(id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const resources = calculateResources(profile);
      profile = await storage.updateProfile(id, resources) || profile;
      return res.json(profile);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profile/:id/resources", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let profile = await storage.getProfile(id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const resources = calculateResources(profile);
      profile = await storage.updateProfile(id, resources) || profile;

      return res.json({
        water: profile!.water,
        dates: profile!.dates,
        gold: profile!.gold,
        stone: profile!.stone,
        waterRate: profile!.waterRate,
        datesRate: profile!.datesRate,
        goldRate: profile!.goldRate,
        stoneRate: profile!.stoneRate,
        storageCapacity: profile!.storageCapacity,
        lastResourceUpdate: profile!.lastResourceUpdate,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profile/:id/buildings", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const buildingsList = await storage.getBuildings(id);

      const now = new Date();
      const updatedBuildings = [];

      for (const b of buildingsList) {
        if (b.isUpgrading && b.upgradeEndTime && new Date(b.upgradeEndTime) <= now) {
          const updated = await storage.updateBuilding(b.id, {
            level: b.level + 1,
            isUpgrading: false,
            upgradeStartTime: null,
            upgradeEndTime: null,
          });
          if (updated) {
            const config = BUILDING_CONFIG[updated.buildingType];
            if (config) {
              const production = getBuildingProduction(updated.buildingType, updated.level);
              const profile = await storage.getProfile(id);
              if (profile) {
                let newWaterRate = profile.waterRate;
                let newDatesRate = profile.datesRate;
                let newGoldRate = profile.goldRate;
                let newStoneRate = profile.stoneRate;
                let newStorageCapacity = profile.storageCapacity;

                const oldProduction = getBuildingProduction(updated.buildingType, updated.level - 1);
                newWaterRate += (production.water - oldProduction.water);
                newDatesRate += (production.dates - oldProduction.dates);
                newGoldRate += (production.gold - oldProduction.gold);
                newStoneRate += (production.stone - oldProduction.stone);

                if (config.storageBonus) {
                  newStorageCapacity += config.storageBonus;
                }

                await storage.updateProfile(id, {
                  waterRate: newWaterRate,
                  datesRate: newDatesRate,
                  goldRate: newGoldRate,
                  stoneRate: newStoneRate,
                  storageCapacity: newStorageCapacity,
                });
              }
            }
            updatedBuildings.push(updated);
          } else {
            updatedBuildings.push(b);
          }
        } else {
          updatedBuildings.push(b);
        }
      }

      return res.json(updatedBuildings);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profile/:id/buildings", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { buildingType, slotIndex } = req.body;

      if (!buildingType || slotIndex === undefined) {
        return res.status(400).json({ error: "Missing buildingType or slotIndex" });
      }

      const config = BUILDING_CONFIG[buildingType];
      if (!config) {
        return res.status(400).json({ error: "Invalid building type" });
      }

      let profile = await storage.getProfile(id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const resources = calculateResources(profile);
      profile = await storage.updateProfile(id, resources) || profile;

      const existingBuildings = await storage.getBuildings(id);
      const isAnyUpgrading = existingBuildings.some(b => b.isUpgrading);
      if (isAnyUpgrading) {
        return res.status(400).json({ error: "طابور البناء ممتلئ" });
      }

      const slotOccupied = existingBuildings.find(b => b.slotIndex === slotIndex);
      if (slotOccupied) {
        return res.status(400).json({ error: "هذا الموقع مشغول بالفعل" });
      }

      const cost = getBuildingCost(buildingType, 0);
      if (profile!.water < cost.water || profile!.dates < cost.dates ||
          profile!.gold < cost.gold || profile!.stone < cost.stone) {
        return res.status(400).json({ error: "موارد غير كافية" });
      }

      const buildTime = getBuildingTime(buildingType, 0);
      const now = new Date();
      const endTime = new Date(now.getTime() + buildTime * 1000);

      await storage.updateProfile(id, {
        water: profile!.water - cost.water,
        dates: profile!.dates - cost.dates,
        gold: profile!.gold - cost.gold,
        stone: profile!.stone - cost.stone,
        lastResourceUpdate: now,
      });

      const building = await storage.createBuilding({
        profileId: id,
        buildingType,
        level: 0,
        slotIndex,
      });

      await storage.updateBuilding(building.id, {
        isUpgrading: true,
        upgradeStartTime: now,
        upgradeEndTime: endTime,
      });

      const updatedBuilding = await storage.getBuilding(building.id);
      return res.json(updatedBuilding);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/buildings/:buildingId/upgrade", async (req: Request, res: Response) => {
    try {
      const { buildingId } = req.params;
      const building = await storage.getBuilding(buildingId);

      if (!building) {
        return res.status(404).json({ error: "Building not found" });
      }

      const config = BUILDING_CONFIG[building.buildingType];
      if (!config) {
        return res.status(400).json({ error: "Invalid building type" });
      }

      if (building.level >= config.maxLevel) {
        return res.status(400).json({ error: "المستوى الأقصى!" });
      }

      if (building.isUpgrading) {
        return res.status(400).json({ error: "المبنى قيد الترقية بالفعل" });
      }

      const allBuildings = await storage.getBuildings(building.profileId);
      const isAnyUpgrading = allBuildings.some(b => b.isUpgrading);
      if (isAnyUpgrading) {
        return res.status(400).json({ error: "طابور البناء ممتلئ" });
      }

      let profile = await storage.getProfile(building.profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const resources = calculateResources(profile);
      profile = await storage.updateProfile(profile.id, resources) || profile;

      const cost = getBuildingCost(building.buildingType, building.level);
      if (profile!.water < cost.water || profile!.dates < cost.dates ||
          profile!.gold < cost.gold || profile!.stone < cost.stone) {
        return res.status(400).json({ error: "موارد غير كافية" });
      }

      const buildTime = getBuildingTime(building.buildingType, building.level);
      const now = new Date();
      const endTime = new Date(now.getTime() + buildTime * 1000);

      await storage.updateProfile(profile!.id, {
        water: profile!.water - cost.water,
        dates: profile!.dates - cost.dates,
        gold: profile!.gold - cost.gold,
        stone: profile!.stone - cost.stone,
        lastResourceUpdate: now,
      });

      const updatedBuilding = await storage.updateBuilding(buildingId, {
        isUpgrading: true,
        upgradeStartTime: now,
        upgradeEndTime: endTime,
      });

      return res.json(updatedBuilding);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/world-map", async (req: Request, res: Response) => {
    try {
      const minX = parseInt(req.query.minX as string) || 0;
      const maxX = parseInt(req.query.maxX as string) || 19;
      const minY = parseInt(req.query.minY as string) || 0;
      const maxY = parseInt(req.query.maxY as string) || 19;

      const cells = await storage.getWorldMapCells(minX, maxX, minY, maxY);
      return res.json(cells);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/building-config", async (_req: Request, res: Response) => {
    return res.json(BUILDING_CONFIG);
  });

  const httpServer = createServer(app);
  return httpServer;
}
