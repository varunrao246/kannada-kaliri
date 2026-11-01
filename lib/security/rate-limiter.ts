/**
 * Sliding Window In-Memory Rate Limiter
 * Kannada Kaliri — Milestone 11 Security Hardening
 *
 * Provides granular rate-limiting across API routes to defend against:
 * - Denial of Wallet (unbounded AI / Speech API credit consumption)
 * - Denial of Service / Resource exhaustion
 * - Brute force attempts
 *
 * Standard RFC Headers provided:
 * - X-RateLimit-Limit
 * - X-RateLimit-Remaining
 * - X-RateLimit-Reset
 * - Retry-After
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfterSeconds: number;
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// Preset limits for different platform tiers
export const RATE_LIMITS = {
  // Voice services (high cost / resource intensive)
  STT: { limit: 15, windowMs: 60_000 }, // 15 audio transcriptions per minute
  TTS: { limit: 30, windowMs: 60_000 }, // 30 audio syntheses per minute

  // AI Conversational agents
  GURU: { limit: 20, windowMs: 60_000 }, // 20 Guru turns per minute
  SCENARIO: { limit: 20, windowMs: 60_000 }, // 20 Scenario turns per minute

  // Exercises, Gamification, and Admin
  EXERCISE: { limit: 60, windowMs: 60_000 }, // 60 exercise actions per minute
  ADMIN: { limit: 60, windowMs: 60_000 }, // 60 admin requests per minute
  DEFAULT: { limit: 60, windowMs: 60_000 },
} as const;

// Storage entry for each key: array of request timestamps (epoch ms)
interface WindowEntry {
  timestamps: number[];
}

// In-memory key store
const storage = new Map<string, WindowEntry>();

// Clean up stale keys periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const threshold = now - windowMs;
  for (const [key, entry] of storage.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > threshold);
    if (entry.timestamps.length === 0) {
      storage.delete(key);
    }
  }
}

/**
 * Checks whether a request under `key` is allowed within `limit` and `windowMs`.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  purgeStaleEntries(config.windowMs);

  let entry = storage.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    storage.set(key, entry);
  }

  // Filter out timestamps outside the active sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const resetTimeMs = (entry.timestamps[0] || now) + config.windowMs;
  const resetTimeSec = Math.ceil(resetTimeMs / 1000);
  const retryAfterSec = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

  if (entry.timestamps.length >= config.limit) {
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetTime: resetTimeSec,
      retryAfterSeconds: retryAfterSec,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    allowed: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.timestamps.length),
    resetTime: resetTimeSec,
    retryAfterSeconds: 0,
  };
}

/**
 * Extracts a client identifier from Request (prefers authenticated user_id, falls back to IP).
 */
export function getClientIdentifier(request: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Extract from IP headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim();
    if (ip) return `ip:${ip}`;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp.trim()}`;
  }

  return 'ip:127.0.0.1';
}

/**
 * Converts RateLimitResult to standard HTTP response headers.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };

  if (!result.allowed) {
    headers['Retry-After'] = result.retryAfterSeconds.toString();
  }

  return headers;
}

/**
 * Resets the in-memory storage (useful for isolated automated tests).
 */
export function resetRateLimitStore(): void {
  storage.clear();
}

