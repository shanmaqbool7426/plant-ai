import { Router } from "express";
import { ScanRecord } from "../models/ScanRecord";
import { GardenPlant } from "../models/GardenPlant";

const router = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [totalScans, gardenSize, familyAgg, recentDocs] = await Promise.all([
    ScanRecord.countDocuments(),
    GardenPlant.countDocuments(),
    ScanRecord.aggregate([
      { $group: { _id: "$family", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    ScanRecord.find().sort({ scannedAt: -1 }).limit(5).lean(),
  ]);

  const topFamilies = familyAgg.map((f: any) => ({ family: f._id, count: f.count }));

  const recentScans = recentDocs.map((doc: any) => ({
    id: doc._id.toString(),
    commonName: doc.commonName,
    scientificName: doc.scientificName,
    family: doc.family,
    confidence: doc.confidence,
    aliases: doc.aliases ?? [],
    careSummary: doc.careSummary ?? "",
    wateringIntervalDays: doc.wateringIntervalDays ?? 7,
    fertilizingIntervalDays: doc.fertilizingIntervalDays ?? 30,
    sunlight: doc.sunlight ?? null,
    humidity: doc.humidity ?? null,
    temperature: doc.temperature ?? null,
    soilType: doc.soilType ?? null,
    toxicityToHumans: doc.toxicityToHumans ?? "Unknown",
    toxicityToPets: doc.toxicityToPets ?? "Unknown",
    weedPotential: doc.weedPotential ?? "Unknown",
    scannedAt: doc.scannedAt instanceof Date ? doc.scannedAt.toISOString() : new Date(doc.scannedAt).toISOString(),
  }));

  res.json({ totalScans, gardenSize, topFamilies, recentScans });
});

export default router;
