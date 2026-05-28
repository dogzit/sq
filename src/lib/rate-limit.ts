const rateMap = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateMap) {
    if (now > value.resetAt) rateMap.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(
  key: string,
  { maxRequests = 5, windowMs = 60 * 1000 } = {}
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: maxRequests - entry.count };
}

export function rateLimitByIp(request: Request, endpoint: string, opts?: { maxRequests?: number; windowMs?: number }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  return rateLimit(`${endpoint}:${ip}`, opts);
}
