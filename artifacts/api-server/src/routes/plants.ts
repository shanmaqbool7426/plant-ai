import Anthropic from "@anthropic-ai/sdk";
import { Router } from "express";
import FormData from "form-data";
import fetch from "node-fetch";
import { ScanRecord } from "../models/ScanRecord";
import { logger } from "../lib/logger";

const router = Router();
const PLANTNET_BASE = "https://my-api.plantnet.org/v2/identify/all";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  return new Anthropic({ apiKey });
}

function getPlantNetKey() {
  const key = process.env.PLANTNET_API_KEY;
  if (!key) throw new Error("PLANTNET_API_KEY is not configured.");
  return key;
}

function extractJson(text: string): Record<string, unknown> {
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeMatch) return JSON.parse(codeMatch[1]);
  const rawMatch = text.match(/\{[\s\S]*\}/);
  if (rawMatch) return JSON.parse(rawMatch[0]);
  throw new Error("No JSON found in response");
}

interface PlantNetResult {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    genus: { scientificNameWithoutAuthor: string };
    family: { scientificNameWithoutAuthor: string };
    commonNames: string[];
  };
}
interface PlantNetResponse {
  results: PlantNetResult[];
}

async function identifyWithPlantNet(imageBase64: string, mediaType: string): Promise<PlantNetResponse | null> {
  const key = getPlantNetKey();
  const imageBuffer = Buffer.from(imageBase64, "base64");
  const form = new FormData();
  form.append("organs", "auto");
  form.append("images", imageBuffer, { filename: "plant.jpg", contentType: mediaType });
  const url = `${PLANTNET_BASE}?api-key=${key}&nb-results=5&lang=en`;
  const response = await fetch(url, { method: "POST", body: form, headers: form.getHeaders() });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PlantNet API error ${response.status}: ${errText}`);
  }
  return (await response.json()) as PlantNetResponse;
}

async function enrichWithClaude(scientificName: string, commonName: string, family: string): Promise<Record<string, unknown>> {
  const anthropic = getAnthropicClient();
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `For the plant "${commonName}" (${scientificName}, family: ${family}), return ONLY valid JSON with exactly these fields:
{"toxicityToHumans":"Non-toxic to humans","toxicityToPets":"Non-toxic to pets","weedPotential":"Not considered a weed","careSummary":"2-3 sentence care overview.","wateringIntervalDays":7,"fertilizingIntervalDays":30,"sunlight":"Full sun","humidity":"Medium","temperature":"60-85°F (15-29°C)","soilType":"Well-draining potting mix"}
Return only the JSON object.`,
    }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  return extractJson(text);
}

router.post("/identify", async (req, res): Promise<void> => {
  const { image, mediaType = "image/jpeg" } = req.body as { image: string; mediaType?: string };
  if (!image) { res.status(400).json({ error: "bad_request", message: "image is required" }); return; }

  try {
    const plantNetData = await identifyWithPlantNet(image, mediaType);
    if (!plantNetData?.results?.length) {
      res.status(422).json({ error: "no_match", message: "No plant identified. Try a clearer photo." });
      return;
    }
    const top = plantNetData.results[0];
    const species = top.species;
    const confidence = top.score;
    const scientificName = species.scientificNameWithoutAuthor;
    const family = species.family?.scientificNameWithoutAuthor ?? "Unknown";
    const commonNames = species.commonNames ?? [];
    const commonName = commonNames.length > 0 ? commonNames[0] : scientificName.split(" ")[0];
    const aliases = commonNames.slice(1, 6);

    const care = await enrichWithClaude(scientificName, commonName, family);

    const result = {
      commonName,
      scientificName,
      family,
      confidence,
      aliases,
      toxicityToHumans: (care.toxicityToHumans as string) ?? "Unknown",
      toxicityToPets: (care.toxicityToPets as string) ?? "Unknown",
      weedPotential: (care.weedPotential as string) ?? "Unknown",
      careSummary: (care.careSummary as string) ?? "",
      wateringIntervalDays: (care.wateringIntervalDays as number) ?? 7,
      fertilizingIntervalDays: (care.fertilizingIntervalDays as number) ?? 30,
      sunlight: (care.sunlight as string) ?? undefined,
      humidity: (care.humidity as string) ?? undefined,
      temperature: (care.temperature as string) ?? undefined,
      soilType: (care.soilType as string) ?? undefined,
    };

    // Auto-save scan to MongoDB
    let savedId: string | undefined;
    try {
      const scan = await ScanRecord.create({ ...result, scannedAt: new Date() });
      savedId = (scan._id as any).toString();
    } catch (dbErr) {
      req.log.warn({ err: dbErr }, "Failed to save scan to MongoDB");
    }

    res.json({ id: savedId, ...result });
  } catch (err: unknown) {
    req.log.error({ err }, "Plant identification error");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "identification_failed", message });
  }
});

router.post("/diagnose", async (req, res): Promise<void> => {
  const { image, mediaType = "image/jpeg" } = req.body as { image: string; mediaType?: string };
  if (!image) { res.status(400).json({ error: "bad_request", message: "image is required" }); return; }

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType as any, data: image } },
          { type: "text", text: `Diagnose plant health issues visible in this image. Return ONLY valid JSON:
{"isHealthy":false,"severity":"mild","summary":"Brief summary.","causes":[{"name":"Issue name","likelihood":"high","description":"Brief explanation"}],"treatmentSteps":["Step 1","Step 2"]}
If healthy: isHealthy=true, severity="healthy", causes=[], treatmentSteps=["Continue current care routine"].
Return only the JSON object.` },
        ],
      }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    res.json(extractJson(text));
  } catch (err: unknown) {
    req.log.error({ err }, "Plant diagnosis error");
    res.status(500).json({ error: "diagnosis_failed", message: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
