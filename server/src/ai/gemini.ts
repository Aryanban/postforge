import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  buildSystemPrompt,
  buildUserPrompt,
  type AIDraft,
  type PlatformType,
  type ProjectProfile,
} from '@postforge/core';
import { config } from '../config.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/** Low-level model call: returns a validated draft, or throws. */
export async function generateDraft(
  project: ProjectProfile,
  frameworkId: string,
  platform: PlatformType,
  feedback?: string
): Promise<AIDraft> {
  if (!config.geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Set it in server/.env to enable AI generation.'
    );
  }
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemPrompt(platform),
    generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
  });
  const result = await model.generateContent(
    buildUserPrompt(project, frameworkId, platform, feedback)
  );
  const text = result.response.text().trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('model returned non-JSON output');
  }
  return validateDraft(parsed);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function validateDraft(raw: unknown): AIDraft {
  if (typeof raw !== 'object' || raw === null) throw new Error('model returned no object');
  const obj = raw as Record<string, unknown>;
  const draft: AIDraft = {
    hook: str(obj.hook),
    mainContent: str(obj.mainContent),
    replyContent: str(obj.replyContent) || undefined,
    threadParts: Array.isArray(obj.threadParts)
      ? (obj.threadParts as unknown[]).filter(v => typeof v === 'string')
      : undefined,
    whyAlgorithmLikes: str(obj.whyAlgorithmLikes),
  };
  if (!draft.mainContent) throw new Error('model returned empty mainContent');
  return draft;
}
