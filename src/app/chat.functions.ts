import { createServerFn } from "@tanstack/react-start";
import { chatInput, companionInstructions, voiceInput, type ChatError, type ChatResponse, type VoiceResponse } from "./chat";

function mapGatewayError(error: { code?: string }): ChatError {
  return error.code === "payment_required" ? "credits" : error.code === "permission_denied" ? "permission" : error.code === "rate_limited" ? "busy" : "failed";
}

export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => chatInput.parse(input))
  .handler(async ({ data }): Promise<ChatResponse> => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const companionName = data.companion === "kabsoul" ? "Kabsoul (كبسول)" : "Kabsoula (كبسولة)";
    try {
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        reasoning: { effort: "low" },
        max_output_tokens: 1200,
        instructions: companionInstructions(data.lang, companionName),
        input: data.messages.map((m) => ({
          role: m.role,
          content: [{ type: m.role === "user" ? ("input_text" as const) : ("output_text" as const), text: m.content }],
        })),
      });
      if (response.status !== "completed") return { ok: false, error: "failed" };
      const content = response.output.flatMap((item) => (item.type === "message" ? item.content : []));
      if (content.some((item) => item.type === "refusal")) return { ok: false, error: "failed" };
      const text = content.flatMap((item) => (item.type === "output_text" ? [item.text] : [])).join("").trim();
      if (!text) return { ok: false, error: "failed" };
      return { ok: true, reply: text.slice(0, 2000) };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("Chat AI failure", { code: error.code, status: error.httpStatus, outcome: error.outcome, recovery: error.recovery, remote: error.remote, ids: error.ids });
        return { ok: false, error: mapGatewayError(error) };
      }
      console.error("Chat response validation failed");
      return { ok: false, error: "failed" };
    }
  });

export const transcribeVoice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => voiceInput.parse(input))
  .handler(async ({ data }): Promise<VoiceResponse> => {
    const { transcribeAudio, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const match = /^data:(audio\/[a-z0-9-]+);base64,(.+)$/i.exec(data.audio);
      if (!match) return { ok: false, error: "failed" };
      const [, mime, b64] = match;
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const ext = mime.includes("mp4") || mime.includes("m4a") ? "m4a" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : mime.includes("mpeg") ? "mp3" : "webm";
      const file = new File([bytes], `voice.${ext}`, { type: mime });
      const result = await transcribeAudio({
        model: "openai/gpt-transcribe",
        file,
        language: data.lang === "ar" ? "ar" : "en",
        response_format: "json",
      });
      const text = (result.text ?? "").trim();
      if (!text) return { ok: false, error: "empty" };
      return { ok: true, text: text.slice(0, 2000) };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("Voice transcription failure", { code: error.code, status: error.httpStatus, outcome: error.outcome, recovery: error.recovery, remote: error.remote, ids: error.ids });
        return { ok: false, error: mapGatewayError(error) };
      }
      console.error("Voice transcription failed");
      return { ok: false, error: "failed" };
    }
  });
