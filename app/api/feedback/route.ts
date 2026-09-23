import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { essay } = await req.json();

  const result = streamText({
    model: google("gemini-3.5-flash"),
    prompt: `다음 자기소개서를 채용 담당자 관점에서 첨삭해줘.\n\n${essay}`,
    maxOutputTokens: 4096,
    providerOptions: {
      google: { thinkingConfig: { thinkingLevel: "low" } },
    },
    onFinish({ finishReason, usage }) {
      console.log("finish:", finishReason, usage);
    },
    onError({ error }) {
      console.error("stream error:", error);
    },
  });

  return result.toTextStreamResponse();
}
