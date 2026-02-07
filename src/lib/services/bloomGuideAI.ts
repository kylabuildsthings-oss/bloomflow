/**
 * BloomGuide AI: Core AI coach service.
 * Uses OpenAI Chat Completions and logs full trace to Opik.
 */

import OpenAI from "openai";
import type { CyclePhase } from "./cycleEngine";

export type LatestLog = {
  sleep?: number;
  energy?: number;
  stress?: number;
} | null;

export type BloomGuideInput = {
  currentPhase: CyclePhase;
  latestLog: LatestLog;
  fitnessGoal?: string | null;
  testGroup?: string | null; // "A" or "B"
};

export type BloomGuideOutput = {
  suggestion: string;
  workoutType?: string;
  reason?: string;
};

const TEST_GROUP_TONES: Record<string, string> = {
  motivation_A: "encouraging and energetic",
  motivation_B: "nurturing and accepting",
  A: "encouraging and energetic",
  B: "nurturing and accepting",
};

function getSystemPrompt(input: BloomGuideInput): string {
  const { currentPhase, latestLog, fitnessGoal, testGroup } = input;
  const energy = latestLog?.energy ?? 3;
  const stress = latestLog?.stress ?? 3;
  const tone =
    TEST_GROUP_TONES[testGroup ?? ""] ??
    TEST_GROUP_TONES.motivation_A;
  const goalNote = fitnessGoal
    ? ` The user's fitness goal: ${fitnessGoal}.`
    : "";

  return `You are BloomGuide, a supportive, evidence-aware fitness coach for a women's wellness app. The user is in the ${currentPhase} phase. Based on their energy (${energy}/5) and stress (${stress}/5), suggest ONE appropriate workout type and a brief, motivating reason. NEVER give medical advice. Use a ${tone} tone.${goalNote}`;
}

/**
 * Call OpenAI and return BloomGuide suggestion.
 * Logs full prompt, response, and metadata to Opik.
 */
export async function runBloomGuideAI(
  input: BloomGuideInput
): Promise<BloomGuideOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const systemPrompt = getSystemPrompt(input);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content:
        "What workout should I do today? Give one workout type and a brief reason.",
    },
  ];

  let responseText = "";

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 150,
    });

    responseText =
      completion.choices[0]?.message?.content?.trim() ?? "No suggestion available.";
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    if (process.env.OPIK_API_KEY) {
      try {
        const { opikClient } = await import("@/lib/opik");
        const trace = opikClient.trace({
          name: "bloom_guide_ai_error",
          input: { systemPrompt, userMessage: messages[1], error: errorMessage },
          output: { error: true },
        });
        trace.end();
        await opikClient.flush();
      } catch {
        // Non-fatal
      }
    }
    throw err;
  }

  // Log full trace to Opik
  if (process.env.OPIK_API_KEY) {
    try {
      const { opikClient } = await import("@/lib/opik");
      const trace = opikClient.trace({
        name: "bloom_guide_ai",
        input: {
          systemPrompt,
          userMessage: messages[1],
          metadata: {
            currentPhase: input.currentPhase,
            energy: input.latestLog?.energy,
            stress: input.latestLog?.stress,
            testGroup: input.testGroup,
          },
        },
        output: {
          suggestion: responseText,
          model: "gpt-3.5-turbo",
        },
      });
      trace.end();
      await opikClient.flush();
    } catch {
      // Non-fatal
    }
  }

  return { suggestion: responseText };
}
