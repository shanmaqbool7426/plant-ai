import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedPlant {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  imageUri: string;
  toxicityToHumans: string;
  toxicityToPets: string;
  weedPotential: string;
  aliases: string[];
  careSummary: string;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  sunlight?: string;
  humidity?: string;
  temperature?: string;
  soilType?: string;
  dateAdded: string;
  notes: string;
  lastWatered?: string;
  lastFertilized?: string;
  wateringEnabled: boolean;
  fertilizingEnabled: boolean;
}

export interface PendingIdentification {
  commonName: string;
  scientificName: string;
  family: string;
  confidence: number;
  toxicityToHumans: string;
  toxicityToPets: string;
  weedPotential: string;
  aliases: string[];
  careSummary: string;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  sunlight?: string;
  humidity?: string;
  temperature?: string;
  soilType?: string;
  imageUri: string;
}

interface GardenContextValue {
  plants: SavedPlant[];
  pendingIdentification: PendingIdentification | null;
  setPendingIdentification: (data: PendingIdentification | null) => void;
  addPlant: (pending: PendingIdentification) => Promise<SavedPlant>;
  removePlant: (id: string) => Promise<void>;
  updatePlantNotes: (id: string, notes: string) => Promise<void>;
  updatePlantSchedule: (
    id: string,
    updates: Partial<Pick<SavedPlant, "lastWatered" | "lastFertilized" | "wateringEnabled" | "fertilizingEnabled">>
  ) => Promise<void>;
  getPlant: (id: string) => SavedPlant | undefined;
  isSaved: (commonName: string) => boolean;
}

const GardenContext = createContext<GardenContextValue | null>(null);

export function GardenProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<SavedPlant[]>([]);
  const [pendingIdentification, setPendingIdentification] =
    useState<PendingIdentification | null>(null);

  useEffect(() => {
    loadPlants();
  }, []);

  async function loadPlants() {
    try {
      const stored = await AsyncStorage.getItem("leaflens_garden");
      if (stored) setPlants(JSON.parse(stored));
    } catch {}
  }

  async function savePlants(updated: SavedPlant[]) {
    setPlants(updated);
    await AsyncStorage.setItem("leaflens_garden", JSON.stringify(updated));
  }

  async function addPlant(pending: PendingIdentification): Promise<SavedPlant> {
    const plant: SavedPlant = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      commonName: pending.commonName,
      scientificName: pending.scientificName,
      family: pending.family,
      imageUri: pending.imageUri,
      toxicityToHumans: pending.toxicityToHumans,
      toxicityToPets: pending.toxicityToPets,
      weedPotential: pending.weedPotential,
      aliases: pending.aliases,
      careSummary: pending.careSummary,
      wateringIntervalDays: pending.wateringIntervalDays,
      fertilizingIntervalDays: pending.fertilizingIntervalDays,
      sunlight: pending.sunlight,
      humidity: pending.humidity,
      temperature: pending.temperature,
      soilType: pending.soilType,
      dateAdded: new Date().toISOString(),
      notes: "",
      wateringEnabled: true,
      fertilizingEnabled: true,
    };
    const updated = [plant, ...plants];
    await savePlants(updated);
    return plant;
  }

  async function removePlant(id: string) {
    const updated = plants.filter((p) => p.id !== id);
    await savePlants(updated);
  }

  async function updatePlantNotes(id: string, notes: string) {
    const updated = plants.map((p) => (p.id === id ? { ...p, notes } : p));
    await savePlants(updated);
  }

  async function updatePlantSchedule(
    id: string,
    updates: Partial<Pick<SavedPlant, "lastWatered" | "lastFertilized" | "wateringEnabled" | "fertilizingEnabled">>
  ) {
    const updated = plants.map((p) => (p.id === id ? { ...p, ...updates } : p));
    await savePlants(updated);
  }

  function getPlant(id: string) {
    return plants.find((p) => p.id === id);
  }

  function isSaved(commonName: string) {
    return plants.some(
      (p) => p.commonName.toLowerCase() === commonName.toLowerCase()
    );
  }

  return (
    <GardenContext.Provider
      value={{
        plants,
        pendingIdentification,
        setPendingIdentification,
        addPlant,
        removePlant,
        updatePlantNotes,
        updatePlantSchedule,
        getPlant,
        isSaved,
      }}
    >
      {children}
    </GardenContext.Provider>
  );
}

export function useGarden() {
  const ctx = useContext(GardenContext);
  if (!ctx) throw new Error("useGarden must be used within GardenProvider");
  return ctx;
}
