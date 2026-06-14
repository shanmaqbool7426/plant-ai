import Anthropic from "@anthropic-ai/sdk";
import { Router } from "express";
import FormData from "form-data";
import fetch from "node-fetch";

const router = Router();

const PLANTNET_BASE = "https://my-api.plantnet.org/v2/identify/all";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
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
    scientificNameAuthorship: string;
    genus: { scientificNameWithoutAuthor: string };
    family: { scientificNameWithoutAuthor: string };
    commonNames: string[];
  };
}

interface PlantNetResponse {
  results: PlantNetResult[];
  remainingIdentificationRequests?: number;
}

async function identifyWithPlantNet(
  imageBase64: string,
  mediaType: string
): Promise<PlantNetResponse | null> {
  const key = getPlantNetKey();
  const imageBuffer = Buffer.from(imageBase64, "base64");

  const form = new FormData();
  form.append("organs", "auto");
  form.append("images", imageBuffer, {
    filename: "plant.jpg",
    contentType: mediaType,
  });

  const url = `${PLANTNET_BASE}?api-key=${key}&nb-results=5&lang=en`;
  const response = await fetch(url, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PlantNet API error ${response.status}: ${errText}`);
  }

  return (await response.json()) as PlantNetResponse;
}

async function enrichWithClaude(
  scientificName: string,
  commonName: string,
  family: string,
  confidence: number,
  aliases: string[]
): Promise<Record<string, unknown>> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a plant expert. For the plant "${commonName}" (${scientificName}, family: ${family}), return ONLY a valid JSON object (no markdown, no explanation) with exactly these fields:
{
  "toxicityToHumans": "Non-toxic to humans" OR "Toxic to humans: <brief reason>",
  "toxicityToPets": "Non-toxic to pets" OR "Toxic to pets: <brief reason>",
  "weedPotential": "Not considered a weed" OR "Can become invasive",
  "careSummary": "2-3 sentence care overview",
  "wateringIntervalDays": <integer>,
  "fertilizingIntervalDays": <integer>,
  "sunlight": "Full sun / Part shade / Full shade",
  "humidity": "Low / Medium / High",
  "temperature": "preferred temp range e.g. 60-85°F (15-29°C)",
  "soilType": "e.g. Well-draining potting mix"
}

Return only the JSON object.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "{}";
  return extractJson(text);
}

router.post("/identify", async (req, res) => {
  const {
    image,
    mediaType = "image/jpeg",
  } = req.body as { image: string; mediaType?: string };

  if (!image) {
    res.status(400).json({ error: "bad_request", message: "image is required" });
    return;
  }

  try {
    const plantNetData = await identifyWithPlantNet(image, mediaType);

    if (!plantNetData || !plantNetData.results || plantNetData.results.length === 0) {
      res.status(422).json({
        error: "no_match",
        message: "No plant identified. Try a clearer photo with better lighting.",
      });
      return;
    }

    const top = plantNetData.results[0];
    const species = top.species;
    const confidence = top.score;
    const scientificName = species.scientificNameWithoutAuthor;
    const family = species.family?.scientificNameWithoutAuthor ?? "Unknown";
    const commonNames = species.commonNames ?? [];
    const commonName =
      commonNames.length > 0 ? commonNames[0] : scientificName.split(" ")[0];
    const aliases = commonNames.slice(1, 6);

    const care = await enrichWithClaude(scientificName, commonName, family, confidence, aliases);

    res.json({
      commonName,
      scientificName,
      family,
      confidence,
      aliases,
      toxicityToHumans: care.toxicityToHumans ?? "Unknown",
      toxicityToPets: care.toxicityToPets ?? "Unknown",
      weedPotential: care.weedPotential ?? "Unknown",
      careSummary: care.careSummary ?? "",
      wateringIntervalDays: care.wateringIntervalDays ?? 7,
      fertilizingIntervalDays: care.fertilizingIntervalDays ?? 30,
      sunlight: care.sunlight ?? "Unknown",
      humidity: care.humidity ?? "Unknown",
      temperature: care.temperature ?? "Unknown",
      soilType: care.soilType ?? "Unknown",
    });
  } catch (err: unknown) {
    req.log.error({ err }, "Plant identification error");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "identification_failed", message });
  }
});

router.post("/diagnose", async (req, res) => {
  const {
    image,
    mediaType = "image/jpeg",
  } = req.body as { image: string; mediaType?: string };

  if (!image) {
    res.status(400).json({ error: "bad_request", message: "image is required" });
    return;
  }

  try {
    const anthropic = getAnthropicClient();

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: image,
              },
            },
            {
              type: "text",
              text: `You are an expert plant pathologist. Diagnose any plant diseases or health issues visible in this image. Return ONLY valid JSON (no markdown) with exactly these fields:
{
  "isHealthy": false,
  "severity": "healthy" | "mild" | "moderate" | "severe",
  "summary": "Brief diagnosis summary",
  "causes": [
    {"name": "Disease/issue name", "likelihood": "high" | "medium" | "low", "description": "Brief explanation"},
    ...up to 4 causes ranked by likelihood
  ],
  "treatmentSteps": ["Step 1", "Step 2", "Step 3"]
}

If the plant appears healthy, set isHealthy to true, severity to "healthy", causes to [], and treatmentSteps to ["Continue current care routine", "Monitor for any changes"].

Return only the JSON object.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const result = extractJson(text);
    res.json(result);
  } catch (err: unknown) {
    req.log.error({ err }, "Plant diagnosis error");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "diagnosis_failed", message });
  }
});

export default router;
