# In-App Rate Limiting & Anti-DDoS Security Shield Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement robust Layer 7 In-App Rate Limiting, Malicious Bot/Probe Shielding, HTTP Security Headers hardening, and Edge CDN DDoS mitigation documentation for Next.js 16.

**Architecture:** Next.js 16 `src/proxy.ts` acts as the entry interceptor that runs scanner checks, bot detection, and an in-memory sliding window rate limiter from `src/lib/rate-limiter.ts`. `next.config.ts` enforces production-grade security headers.

**Tech Stack:** Next.js 16.3.0, TypeScript strict, Vitest, Serwist PWA.

## Global Constraints
- Next.js 16 App Router conventions: use `src/proxy.ts` (Next.js 16 convention), no legacy `pages/`.
- TypeScript strict mode: explicit return types, no implicit any.
- No heavy unneeded third-party runtime dependencies (YAGNI / Ponytail principle).
- ESLint and build must pass cleanly (`bun run lint`, `bun run build`).

---

### Task 1: Core Sliding Window Rate Limiter (`src/lib/rate-limiter.ts`)

**Files:**
- Create: `src/lib/rate-limiter.ts`
- Test: `src/lib/__tests__/rate-limiter.test.ts`

**Interfaces:**
- Produces:
  - `getClientIp(headers: Headers): string`
  - `checkRateLimit(identifier: string, limit: number, windowMs: number): RateLimitResult`
  - `getRouteTier(pathname: string): { limit: number; windowMs: number }`
  - `interface RateLimitResult { success: boolean; limit: number; remaining: number; reset: number; retryAfter?: number }`

- [ ] **Step 1: Write failing unit test for rate limiter**

```typescript
// src/lib/__tests__/rate-limiter.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIp, getRouteTier, resetRateLimitStore } from "../rate-limiter";

describe("Rate Limiter", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("should extract client IP in correct priority order", () => {
    const cfHeaders = new Headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" });
    expect(getClientIp(cfHeaders)).toBe("1.1.1.1");

    const xffHeaders = new Headers({ "x-forwarded-for": "203.0.113.195, 70.41.3.18" });
    expect(getClientIp(xffHeaders)).toBe("203.0.113.195");

    const emptyHeaders = new Headers();
    expect(getClientIp(emptyHeaders)).toBe("127.0.0.1");
  });

  it("should enforce rate limits on consecutive requests", () => {
    const ip = "192.168.1.50";
    const limit = 3;
    const windowMs = 1000;

    const res1 = checkRateLimit(ip, limit, windowMs);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(ip, limit, windowMs);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(ip, limit, windowMs);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4th request exceeds limit
    const res4 = checkRateLimit(ip, limit, windowMs);
    expect(res4.success).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.retryAfter).toBeGreaterThan(0);
  });

  it("should return correct route tiers", () => {
    expect(getRouteTier("/api/users").limit).toBeLessThan(getRouteTier("/about").limit);
    expect(getRouteTier("/auth/login").limit).toBeLessThanOrEqual(getRouteTier("/api/users").limit);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/lib/__tests__/rate-limiter.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/lib/rate-limiter.ts`**

```typescript
// src/lib/rate-limiter.ts

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until next allowed request
}

export interface RouteTierConfig {
  limit: number;
  windowMs: number;
}

// In-memory sliding window counter store
// Key: identifier (e.g. IP or IP+tier), Value: array of timestamps (ms)
const requestLogs = new Map<string, number[]>();

// Periodic garbage collection every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupOldEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of requestLogs.entries()) {
    // Remove timestamps older than 5 minutes
    const valid = timestamps.filter((t) => now - t < 5 * 60 * 1000);
    if (valid.length === 0) {
      requestLogs.delete(key);
    } else {
      requestLogs.set(key, valid);
    }
  }
}

/**
 * Resets the in-memory store (primarily for unit tests).
 */
export function resetRateLimitStore(): void {
  requestLogs.clear();
}

/**
 * Extracts client IP from request headers.
 */
export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Categorizes routes into rate limit tiers.
 */
export function getRouteTier(pathname: string): RouteTierConfig {
  // Sensitive auth or security routes
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth")
  ) {
    return { limit: 10, windowMs: 60 * 1000 }; // 10 req / min
  }

  // General API routes & server actions
  if (pathname.startsWith("/api")) {
    return { limit: 30, windowMs: 60 * 1000 }; // 30 req / min
  }

  // Default web UI pages
  return { limit: 120, windowMs: 60 * 1000 }; // 120 req / min
}

/**
 * Checks and records rate limit for a given identifier using sliding window.
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanupOldEntries();

  const now = Date.now();
  const windowStart = now - windowMs;

  const existingTimestamps = requestLogs.get(identifier) || [];
  // Filter out timestamps outside the current sliding window
  const activeTimestamps = existingTimestamps.filter((t) => t > windowStart);

  const resetTimestampSec = Math.ceil((now + windowMs) / 1000);

  if (activeTimestamps.length >= limit) {
    const oldestInWindow = activeTimestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));

    requestLogs.set(identifier, activeTimestamps);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTimestampSec,
      retryAfter: retryAfterSec,
    };
  }

  // Allow request and add current timestamp
  activeTimestamps.push(now);
  requestLogs.set(identifier, activeTimestamps);

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - activeTimestamps.length),
    reset: resetTimestampSec,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/lib/__tests__/rate-limiter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/rate-limiter.ts src/lib/__tests__/rate-limiter.test.ts
git commit -m "feat(security): add sliding window rate limiter utility"
```

---

### Task 2: Next.js 16 Proxy Integration (`src/proxy.ts`)

**Files:**
- Modify: `src/proxy.ts`
- Test: `src/lib/__tests__/proxy-security.test.ts`

**Interfaces:**
- Consumes: `getClientIp`, `getRouteTier`, `checkRateLimit` from `src/lib/rate-limiter.ts`
- Produces: `proxy(request: NextRequest): NextResponse`

- [ ] **Step 1: Write test for proxy security checks (bot & probe detection)**

```typescript
// src/lib/__tests__/proxy-security.test.ts
import { describe, it, expect } from "vitest";
import { isSuspiciousPath, isMaliciousBot } from "../security-guards";

describe("Security Guards", () => {
  it("should detect suspicious probe paths", () => {
    expect(isSuspiciousPath("/.env")).toBe(true);
    expect(isSuspiciousPath("/wp-login.php")).toBe(true);
    expect(isSuspiciousPath("/phpmyadmin/index.php")).toBe(true);
    expect(isSuspiciousPath("/../../etc/passwd")).toBe(true);
    expect(isSuspiciousPath("/about")).toBe(false);
    expect(isSuspiciousPath("/api/users")).toBe(false);
  });

  it("should detect malicious user agents and automated scanners", () => {
    expect(isMaliciousBot("sqlmap/1.5.2")).toBe(true);
    expect(isMaliciousBot("Nikto/2.1.6")).toBe(true);
    expect(isMaliciousBot("masscan/1.0")).toBe(true);
    expect(isMaliciousBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
    expect(isMaliciousBot(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Create `src/lib/security-guards.ts` and run tests**

```typescript
// src/lib/security-guards.ts

const SUSPICIOUS_PATH_PATTERNS = [
  /\/\.env/i,
  /\/\.git/i,
  /\/\.svn/i,
  /\/\.aws/i,
  /wp-admin/i,
  /wp-login/i,
  /wp-content/i,
  /phpmyadmin/i,
  /xmlrpc\.php/i,
  /cgi-bin/i,
  /\.\./, // Path traversal
  /%2e%2e/i, // Encoded traversal
  /\.php$/i,
  /\.bak$/i,
  /\.config$/i,
];

const MALICIOUS_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /wpscan/i,
  /acunetix/i,
  /nmap/i,
  /havij/i,
  /zgrab/i,
  /morfeus/i,
  /dirbuster/i,
];

export function isSuspiciousPath(pathname: string): boolean {
  return SUSPICIOUS_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function isMaliciousBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return MALICIOUS_USER_AGENTS.some((pattern) => pattern.test(userAgent));
}
```

Run: `bunx vitest run src/lib/__tests__/proxy-security.test.ts`
Expected: PASS

- [ ] **Step 3: Update `src/proxy.ts` to implement full security workflow**

```typescript
// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp, getRouteTier, checkRateLimit } from "@/lib/rate-limiter";
import { isSuspiciousPath, isMaliciousBot } from "@/lib/security-guards";

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent");

  // 1. Probe & Path Scanner Filter
  if (isSuspiciousPath(pathname)) {
    return new NextResponse(
      JSON.stringify({ error: "Forbidden: Suspicious request path detected." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Malicious Bot & Scanner Filter
  if (isMaliciousBot(userAgent)) {
    return new NextResponse(
      JSON.stringify({ error: "Forbidden: Automated scanner blocked." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 3. Rate Limiting Check
  const ip = getClientIp(request.headers);
  const tier = getRouteTier(pathname);
  const rateLimitResult = checkRateLimit(`${ip}:${pathname.startsWith("/api") ? "api" : "web"}`, tier.limit, tier.windowMs);

  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Too Many Requests",
        message: "You have exceeded the request rate limit. Please try again later.",
        retryAfter: rateLimitResult.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.retryAfter ?? 60),
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.reset),
        },
      }
    );
  }

  // 4. Pass-through with rate limit information headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
  response.headers.set("X-RateLimit-Reset", String(rateLimitResult.reset));

  return response;
}

export const config = {
  matcher: [
    // Skip internal paths (_next), static files, sw.js, and favicon
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/security-guards.ts src/lib/__tests__/proxy-security.test.ts src/proxy.ts
git commit -m "feat(security): integrate scanner guard and rate limiting in proxy.ts"
```

---

### Task 3: Security Headers Hardening (`next.config.ts`)

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update `next.config.ts` with hardened security headers**

```typescript
// next.config.ts
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSerwist(nextConfig);
```

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "feat(security): harden HTTP security headers in next.config.ts"
```

---

### Task 4: Edge CDN & Cloudflare Anti-DDoS Documentation

**Files:**
- Create: `docs/security/anti-ddos-cloudflare-guide.md`

- [ ] **Step 1: Write `docs/security/anti-ddos-cloudflare-guide.md`**

Provide comprehensive production setup instructions covering:
- Cloudflare DNS proxying (`Proxied ☁️`)
- Bot Fight Mode activation
- WAF Custom Rate Limiting rules
- "Under Attack Mode" triggering during active volumetric L3/L4 attacks
- IP Whitelisting & Origin Server Protection (Cloudflare Authenticated Origin Pulls / Strict SSL)

- [ ] **Step 2: Commit**

```bash
git add docs/security/anti-ddos-cloudflare-guide.md
git commit -m "docs(security): add cloudflare edge anti-ddos configuration guide"
```

---

### Task 5: End-to-End Verification & Build Test

- [ ] **Step 1: Run full unit test suite**
Run: `bunx vitest run`
Expected: All tests pass (0 failures).

- [ ] **Step 2: Run ESLint**
Run: `bun run lint`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Run Next.js build**
Run: `bun run build`
Expected: Build successfully completes.
