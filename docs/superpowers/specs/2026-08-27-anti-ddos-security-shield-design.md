# Design Spec: In-App Rate Limiting & Anti-DDoS Security Shield

**Date**: 2026-08-27  
**Status**: Approved  
**Author**: Antigravity  

---

## 1. Problem Statement & Goals

Modern web applications are frequent targets of Distributed Denial of Service (DDoS), Layer 7 HTTP floods, automated scraper bots, and malicious endpoint probes.

While volumetric Layer 3/4 network floods require DNS/CDN-level mitigation (such as Cloudflare Edge or Vercel DDoS Shield), the application layer (Layer 7) requires robust, in-app rate limiting, scanner detection, and security header hardening to protect compute resources, avoid server denial of service, and reject malicious traffic before expensive server rendering occurs.

### Objectives
- **In-App Rate Limiting**: Implement a fast, in-memory sliding window rate limiter in `src/lib/rate-limiter.ts` that runs in Next.js 16 `proxy.ts`.
- **Bad Bot & Probe Shielding**: Block known malicious User-Agents, scanners, and sensitive path scans (e.g. `.env`, `.git`, `wp-login.php`, traversal attacks).
- **Security Headers Hardening**: Configure production-grade HTTP security headers in `next.config.ts` (HSTS, X-Content-Type-Options, X-Frame-Options, Permissions-Policy, Referrer-Policy, remove X-Powered-By).
- **Edge CDN Documentation**: Provide a clear configuration guide for Cloudflare Free/Pro WAF, Bot Fight Mode, and Under Attack Mode to handle Layer 3/4 network floods.

---

## 2. Architecture & Data Flow

```
Incoming Request
      │
      ▼
Next.js 16 Proxy (`src/proxy.ts`)
      │
      ├─ 1. Probe & Path Scanner Check (e.g., .env, wp-login, traversal)
      │     └─► Malicious path? ──► Return 403 Forbidden
      │
      ├─ 2. Malicious Bot / Scanner Check (User-Agent analysis)
      │     └─► Bad Bot? ─────────► Return 403 Forbidden
      │
      ├─ 3. Multi-tier Sliding Window Rate Limiter (`src/lib/rate-limiter.ts`)
      │     ├─ Resolve Client IP (CF-Connecting-IP, X-Forwarded-For, X-Real-IP)
      │     ├─ Determine Route Tier (General Web, API/Server Action, Sensitive)
      │     └─ Rate limit exceeded? ──► Return 429 Too Many Requests + Retry-After
      │
      ▼
`NextResponse.next()` + Rate Limit Informational Headers (`X-RateLimit-Remaining`, etc.)
      │
      ▼
`next.config.ts` Headers (HSTS, CSP, X-Frame-Options, etc.)
      │
      ▼
App Router Server Components Execution
```

---

## 3. Detailed Component Specifications

### 3.1 `src/lib/rate-limiter.ts`
- **Algorithm**: Sliding Window Counter with automatic periodic cleanup to prevent memory leaks.
- **Client IP Resolver**:
  - `cf-connecting-ip` (Priority 1: Cloudflare)
  - `x-forwarded-for` (Priority 2: Standard reverse proxy / Vercel, takes the first client IP)
  - `x-real-ip` (Priority 3: Nginx / Traefik)
  - Fallback: `"127.0.0.1"`
- **Tiers & Thresholds**:
  - **General Web Pages**: 120 requests / 60 seconds.
  - **API & Actions**: 30 requests / 60 seconds.
  - **Sensitive / Auth Routes**: 10 requests / 60 seconds.
- **Return Object**:
  ```ts
  export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number; // Unix timestamp in seconds
    retryAfter?: number; // Seconds until next allowed request
  }
  ```

### 3.2 `src/proxy.ts` (Next.js 16 Proxy)
- **Path Pattern Matcher**: Intercepts client requests except static assets (`_next/static`, `_next/image`, `favicon.ico`, `manifest.json`, `sw.js`).
- **Bot Detection**:
  - RegEx checks for known scanners: `sqlmap`, `nikto`, `masscan`, `wpscan`, `acunetix`, `nmap`, `python-requests` (unidentified automation floods), `go-http-client` (unidentified).
- **Probe Filter**:
  - Blocks patterns containing `.env`, `.git`, `wp-admin`, `wp-login`, `phpmyadmin`, `cgi-bin`, `xmlrpc.php`, `../`, `%2e%2e`.
- **Response Handling**:
  - On 403: Clean JSON or lightweight text error.
  - On 429: Returns HTTP 429 status with `Retry-After: <seconds>` and custom header `X-RateLimit-*`.

### 3.3 `next.config.ts` (Security Headers)
- Configure `headers()` async function returning:
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options`: `nosniff`
  - `X-Frame-Options`: `SAMEORIGIN`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=(), browsing-topics=()`
  - `X-DNS-Prefetch-Control`: `on`
  - `poweredByHeader: false`

### 3.4 `docs/security/anti-ddos-cloudflare-guide.md`
- Documentation outlining:
  1. DNS Proxy setup (Orange Cloud ☁️).
  2. Cloudflare Bot Fight Mode & Security Level configuration.
  3. Under Attack Mode during active L3/L4 volumetric floods.
  4. Custom WAF Rate Limiting rules at Edge.

---

## 4. Verification & Testing Plan
- **Unit & Integration Testing**:
  - Test `src/lib/rate-limiter.ts` against rapid consecutive requests to verify 429 trigger and sliding window reset.
  - Test malicious User-Agent blocking in `src/proxy.ts`.
  - Test probe path detection in `src/proxy.ts`.
- **Build & Lint Verification**:
  - `bun run lint` (ESLint clean)
  - `bun run build` (Next.js build verification)
