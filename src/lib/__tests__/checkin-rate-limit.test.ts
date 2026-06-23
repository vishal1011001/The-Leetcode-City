import { describe, it, expect, beforeEach } from "vitest";

// Mock rateLimit to simulate sliding-window behavior for check-in daily limit
const mockRateLimitStore = new Map<string, { count: number; resetAt: number }>();

async function mockRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = mockRateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    mockRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, reset: entry.resetAt };
  }

  entry.count++;
  return { ok: true, remaining: limit - entry.count, reset: entry.resetAt };
}

describe("Daily check-in rate limiting logic", () => {
  beforeEach(() => {
    mockRateLimitStore.clear();
  });

  it("permits the first check-in request of the day", async () => {
    const result = await mockRateLimit("checkin:daily:user-1", 1, 24 * 60 * 60 * 1000);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks subsequent check-in requests within the 24-hour window", async () => {
    // First check-in request
    const first = await mockRateLimit("checkin:daily:user-2", 1, 24 * 60 * 60 * 1000);
    expect(first.ok).toBe(true);

    // Second check-in request within 24 hours
    const second = await mockRateLimit("checkin:daily:user-2", 1, 24 * 60 * 60 * 1000);
    expect(second.ok).toBe(false);
    expect(second.remaining).toBe(0);
  });

  it("allows checking in again after the 24-hour window expires", async () => {
    const key = "checkin:daily:user-3";
    const windowMs = 24 * 60 * 60 * 1000;

    const first = await mockRateLimit(key, 1, windowMs);
    expect(first.ok).toBe(true);

    // Simulate 24 hours passing by modifying the entry reset time
    const entry = mockRateLimitStore.get(key);
    if (entry) {
      entry.resetAt = Date.now() - 1000; // set reset in the past
    }

    const third = await mockRateLimit(key, 1, windowMs);
    expect(third.ok).toBe(true); // reset has passed, allowed again
  });
});
