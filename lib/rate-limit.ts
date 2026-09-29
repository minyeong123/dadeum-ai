import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiters: { perMinute: Ratelimit; perDay: Ratelimit } | null = null;

// 빌드 시점에는 환경변수가 없을 수 있으므로(CI 등) 첫 요청에서 생성한다
function getLimiters() {
  if (limiters) return limiters;

  const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });

  limiters = {
    // 짧은 시간 연타 방지
    perMinute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 m"),
      prefix: "dadeum:rl:min",
    }),
    // Gemini 무료 티어 일일 한도 보호
    perDay: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(20, "1 d"),
      prefix: "dadeum:rl:day",
    }),
  };
  return limiters;
}

export type RateLimitResult =
  | { success: true }
  | { success: false; retryAfterSeconds: number };

export async function checkRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const { perMinute, perDay } = getLimiters();

  const minute = await perMinute.limit(identifier);
  if (!minute.success) {
    return { success: false, retryAfterSeconds: toSeconds(minute.reset) };
  }

  const day = await perDay.limit(identifier);
  if (!day.success) {
    return { success: false, retryAfterSeconds: toSeconds(day.reset) };
  }

  return { success: true };
}

function toSeconds(resetAt: number) {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
}
