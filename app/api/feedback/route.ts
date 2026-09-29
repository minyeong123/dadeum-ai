import { google } from "@ai-sdk/google";
import { ipAddress } from "@vercel/functions";
import { streamText } from "ai";
import { feedbackInputSchema } from "@/lib/feedback-input";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = feedbackInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  // 로컬 개발 환경에서는 IP가 없으므로 하나의 키로 묶는다
  const ip = ipAddress(req) ?? "local";
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.success) {
    return Response.json(
      {
        error: `요청이 너무 많습니다. ${formatWait(rateLimit.retryAfterSeconds)} 뒤에 다시 시도해주세요.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const { essay } = parsed.data;

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

function formatWait(seconds: number) {
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}분`;
  return `${Math.ceil(seconds / 3600)}시간`;
}
