import { Router } from "express";
import { ScanRecord } from "../models/ScanRecord";

const router = Router();

function toDTO(doc: any) {
  return {
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
  };
}

router.get("/scans", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? "20", 10), 100);
  const scans = await ScanRecord.find().sort({ scannedAt: -1 }).limit(limit).lean();
  res.json(scans.map(toDTO));
});

router.get("/scans/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const scan = await ScanRecord.findById(raw).lean();
  if (!scan) { res.status(404).json({ error: "not_found", message: "Scan not found" }); return; }
  res.json(toDTO(scan));
});

router.delete("/scans/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await ScanRecord.findByIdAndDelete(raw);
  if (!result) { res.status(404).json({ error: "not_found", message: "Scan not found" }); return; }
  res.sendStatus(204);
});

export default router;
