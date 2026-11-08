import { describe, expect, it } from "vitest";
import { chatInput, companionInstructions, normalizeAudioMime, voiceInput } from "./chat";

const b64 = `data:audio/webm;base64,${"A".repeat(100)}`;

describe("chat safeguards", () => {
  it("rejects empty or oversized conversations", () => {
    expect(chatInput.safeParse({ messages: [], lang: "ar", companion: "kabsoul" }).success).toBe(false);
    expect(chatInput.safeParse({ messages: Array(41).fill({ role: "user", content: "x" }), lang: "ar", companion: "kabsoul" }).success).toBe(false);
    expect(chatInput.safeParse({ messages: [{ role: "user", content: "x".repeat(2001) }], lang: "ar", companion: "kabsoul" }).success).toBe(false);
  });

  it("accepts a normal bilingual conversation", () => {
    expect(chatInput.safeParse({ messages: [{ role: "user", content: "متى جرعتي؟" }, { role: "assistant", content: "راجع الرئيسية" }], lang: "ar", companion: "kabsoula" }).success).toBe(true);
  });

  it("voice input requires a bounded audio data URL", () => {
    expect(voiceInput.safeParse({ audio: b64, lang: "en" }).success).toBe(true);
    expect(voiceInput.safeParse({ audio: "data:image/png;base64,AAAA", lang: "en" }).success).toBe(false);
    expect(voiceInput.safeParse({ audio: "not-a-data-url", lang: "en" }).success).toBe(false);
  });

  it("iPhone recorder formats become an accepted upload format", () => {
    expect(normalizeAudioMime("audio/mp4;codecs=mp4a.40.2")).toBe("audio/mp4");
    expect(normalizeAudioMime("audio/x-m4a")).toBe("audio/mp4");
    expect(normalizeAudioMime("audio/webm;codecs=opus")).toBe("audio/webm");
    const url = `data:${normalizeAudioMime("audio/mp4;codecs=mp4a.40.2")};base64,${"A".repeat(100)}`;
    expect(voiceInput.safeParse({ audio: url, lang: "ar" }).success).toBe(true);
    expect(voiceInput.safeParse({ audio: `data:audio/mp4;codecs=mp4a.40.2;base64,${"A".repeat(100)}`, lang: "ar" }).success).toBe(false);
  });

  it("instructions forbid interaction verdicts, diagnosis, and dose changes", () => {
    for (const lang of ["ar", "en"] as const) {
      const s = companionInstructions(lang, "Kabsoul");
      expect(s).toContain("NEVER give a verdict");
      expect(s).toContain("NEVER say a combination is safe");
      expect(s).toContain("NEVER diagnose, prescribe");
      expect(s).toContain("997");
      expect(s).toContain("not available yet");
    }
  });

  it("instructions forbid pretending to know the user's medication list", () => {
    expect(companionInstructions("ar", "Kabsoula")).toContain("do not have access to it");
  });
});
