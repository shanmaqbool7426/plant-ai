import Anthropic from "@anthropic-ai/sdk";
import { Router } from "express";

const router = Router();

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured. Add it to your environment secrets.");
  }
  return new Anthropic({ apiKey });
}

function extractJson(text: string): Record<string, unknown> {
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    return JSON.parse(codeMatch[1]);
  }
  const rawMatch = text.match(/\{[\s\S]*\}/);
  if (rawMatch) {
    return JSON.parse(rawMatch[0]);
  }
  throw new Error("No JSON found in response");
}

router.post("/identify", async (req, res) => {
  const { image, mediaType = "image/jpeg" } = req.body as { image: string; mediaType?: string };

  if (!image) {
    res.status(400).json({ error: "bad_request", message: "image is required" });
    return;
  }

  try {
    const anthropic = getAnthropicClient();

    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8192,
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
              text: `You are an expert botanist and plant identification system. Identify the plant in this image and return ONLY valid JSON (no markdown, no explanation) with exactly these fields:
{
  "commonName": "English common name",
  "scientificName": "Genus species",
  "family": "Plant family name",
  "confidence": 0.95,
  "toxicityToHumans": "Non-toxic to humans" OR "Toxic to humans",
  "toxicityToPets": "Non-toxic to pets" OR "Toxic to pets",
  "weedPotential": "Not considered a weed" OR "Can become invasive",
  "aliases": ["alias1", "alias2"],
  "careSummary": "2-3 sentence care overview",
  "wateringIntervalDays": 7,
  "fertilizingIntervalDays": 30,
  "sunlight": "Full sun / Part shade / Full shade",
  "humidity": "Low / Medium / High",
  "temperature": "60-85°F (15-29°C)",
  "soilType": "Well-draining potting mix"
}

Return only the JSON object. No other text.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const result = extractJson(text);
    res.json(result);
  } catch (err: unknown) {
    req.log.error({ err }, "Plant identification error");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "identification_failed", message });
  }
});

router.post("/diagnose", async (req, res) => {
  const { image, mediaType = "image/jpeg" } = req.body as { image: string; mediaType?: string };

  if (!image) {
    res.status(400).json({ error: "bad_request", message: "image is required" });
    return;
  }

  try {
    const anthropic = getAnthropicClient();

    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8192,
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
  "treatmentSteps": ["Step 1", "Step 2", "Step 3", ...]
}

If the plant appears healthy, set isHealthy to true, severity to "healthy", causes to [], and treatmentSteps to ["Continue current care routine", "Monitor for any changes"].

Return only the JSON object. No other text.`,
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
