import Anthropic from "@anthropic-ai/sdk";
import { Router } from "express";

const router = Router();

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  return new Anthropic({ apiKey });
}

router.post("/", async (req, res) => {
  const { messages, plantContext } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    plantContext?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "bad_request", message: "messages array is required" });
    return;
  }

  try {
    const anthropic = getAnthropicClient();

    const systemPrompt = `You are LeafLens Expert, a knowledgeable botanical and plant care specialist with expertise in plant identification, disease diagnosis, and horticultural advice. ${
      plantContext ? `The user is currently discussing: ${plantContext}.` : ""
    }

Provide helpful, accurate, and concise plant care advice. Be warm and encouraging. Keep responses under 200 words unless a detailed explanation is genuinely needed.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const content = message.content[0].type === "text" ? message.content[0].text : "";
    res.json({ content });
  } catch (err: unknown) {
    req.log.error({ err }, "Chat error");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "chat_failed", message });
  }
});

export default router;
