/**
 * BloomGuide AI: Core AI coach service.
 * Uses OpenAI first, falls back to Gemini on quota/error.
 * Logs full trace to Opik.
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
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

const USER_MESSAGE = "What workout should I do today? Give one workout type and a brief reason.";

async function tryOpenAI(
  systemPrompt: string,
  input: BloomGuideInput
): Promise<{ text: string; model: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: USER_MESSAGE },
  ];

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 150,
    });
    const text =
      completion.choices[0]?.message?.content?.trim() ?? "No suggestion available.";
    return { text, model: "gpt-3.5-turbo" };
  } catch {
    return null;
  }
}

async function tryGemini(
  systemPrompt: string
): Promise<{ text: string; model: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
      contents: USER_MESSAGE,
    });
    const text = (response.text ?? "").trim() || "No suggestion available.";
    return { text, model: "gemini-1.5-flash" };
  } catch {
    return null;
  }
}

async function logToOpik(
  input: BloomGuideInput,
  systemPrompt: string,
  result: { text: string; model: string } | null,
  error?: string
) {
  if (!process.env.OPIK_API_KEY) return;
  try {
    const { opikClient } = await import("@/lib/opik");
    const trace = opikClient.trace({
      name: error ? "bloom_guide_ai_error" : "bloom_guide_ai",
      input: {
        systemPrompt,
        userMessage: USER_MESSAGE,
        metadata: {
          currentPhase: input.currentPhase,
          energy: input.latestLog?.energy,
          stress: input.latestLog?.stress,
          testGroup: input.testGroup,
        },
        ...(error && { error }),
      },
      output: error ? { error: true } : { suggestion: result?.text, model: result?.model },
    });
    trace.end();
    await opikClient.flush();
  } catch {
    // Non-fatal
  }
}

/**
 * Call OpenAI first; on failure (e.g. quota), fall back to Gemini.
 * Requires OPENAI_API_KEY or GEMINI_API_KEY.
 */
export async function runBloomGuideAI(
  input: BloomGuideInput
): Promise<BloomGuideOutput> {
  const systemPrompt = getSystemPrompt(input);

  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("Configure OPENAI_API_KEY or GEMINI_API_KEY in .env.local");
  }

  let result = await tryOpenAI(systemPrompt, input);

  if (!result && process.env.GEMINI_API_KEY) {
    result = await tryGemini(systemPrompt);
  }

  if (!result) {
    const err =
      "Unable to get AI suggestion. Check your OpenAI and Gemini API keys and quotas.";
    await logToOpik(input, systemPrompt, null, err);
    throw new Error(err);
  }

  await logToOpik(input, systemPrompt, result);

  return { suggestion: result.text };
}
