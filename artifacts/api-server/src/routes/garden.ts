import { Router } from "express";
import { GardenPlant } from "../models/GardenPlant";

const router = Router();

function toDTO(doc: any) {
  return {
    id: doc._id.toString(),
    commonName: doc.commonName,
    scientificName: doc.scientificName,
    family: doc.family,
    aliases: doc.aliases ?? [],
    careSummary: doc.careSummary ?? null,
    wateringIntervalDays: doc.wateringIntervalDays ?? null,
    fertilizingIntervalDays: doc.fertilizingIntervalDays ?? null,
    sunlight: doc.sunlight ?? null,
    humidity: doc.humidity ?? null,
    temperature: doc.temperature ?? null,
    soilType: doc.soilType ?? null,
    toxicityToHumans: doc.toxicityToHumans ?? null,
    toxicityToPets: doc.toxicityToPets ?? null,
    notes: doc.notes ?? null,
    savedAt: doc.savedAt instanceof Date ? doc.savedAt.toISOString() : new Date(doc.savedAt).toISOString(),
  };
}

router.get("/garden", async (_req, res): Promise<void> => {
  const plants = await GardenPlant.find().sort({ savedAt: -1 }).lean();
  res.json(plants.map(toDTO));
});

router.post("/garden", async (req, res): Promise<void> => {
  const body = req.body as any;
  if (!body?.commonName || !body?.scientificName) {
    res.status(400).json({ error: "bad_request", message: "commonName and scientificName are required" });
    return;
  }
  const plant = await GardenPlant.create({ ...body, savedAt: new Date() });
  res.status(201).json(toDTO(plant.toObject()));
});

router.delete("/garden/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await GardenPlant.findByIdAndDelete(raw);
  if (!result) { res.status(404).json({ error: "not_found", message: "Plant not found" }); return; }
  res.sendStatus(204);
});

export default router;
