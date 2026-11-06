import { z } from "zod";

export const MAX_VOICE_BYTES = 4 * 1024 * 1024;
export const MAX_CHAT_TURNS = 40;

const turn = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});
export type ChatTurn = z.infer<typeof turn>;

export const chatInput = z.object({
  messages: z.array(turn).min(1).max(MAX_CHAT_TURNS),
  lang: z.enum(["ar", "en"]),
  companion: z.enum(["kabsoul", "kabsoula"]),
});

export const voiceInput = z.object({
  audio: z
    .string()
    .max(Math.ceil(MAX_VOICE_BYTES * 4 / 3) + 120)
    .regex(/^data:audio\/(webm|mp4|mpeg|ogg|wav|m4a|x-m4a);base64,[A-Za-z0-9+/]+={0,2}$/),
  lang: z.enum(["ar", "en"]),
});

export type ChatError = "credits" | "permission" | "busy" | "failed";
export type ChatResponse = { ok: true; reply: string } | { ok: false; error: ChatError };
export type VoiceResponse = { ok: true; text: string } | { ok: false; error: ChatError | "empty" };

/** System instructions for the companion. Pure and testable. */
export function companionInstructions(lang: "ar" | "en", companionName: string): string {
  const common = `You are ${companionName}, a warm, calm, professional medication companion in a Saudi healthcare app for older adults. Reply ONLY in ${lang === "ar" ? "Arabic (clear, simple, respectful Gulf-friendly phrasing)" : "simple clear English"}. Keep answers short and easy to read.

Strict safety boundaries:
- Provide general educational information about medications, how to take them, food, and common health questions.
- NEVER diagnose, prescribe, suggest starting/stopping a medicine, or change doses.
- NEVER give a verdict on a drug-drug or drug-food interaction from your own knowledge, and NEVER say a combination is safe. If asked about interactions, explain that verified personalized interaction checking is not available yet in this app, and recommend asking a pharmacist or doctor.
- Do not claim to know the user's personal medication list; you do not have access to it.
- Make clear your answers are general education, not verified personal medical advice.
- For emergencies (chest pain, trouble breathing, severe allergic reaction, suspected overdose, loss of consciousness): tell the user to call emergency services immediately (in Saudi Arabia: 997 ambulance) or go to the nearest emergency department — do not rely on the chat.
- If unsure, say so and recommend a pharmacist or doctor.`;
  return common;
}
