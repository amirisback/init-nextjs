import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { resetRateLimitStore } from "@/lib/rate-limiter";
import {
  encryptAction,
  decryptAction,
  obfuscateAction,
  deobfuscateAction,
} from "@/app/demo-encryption/actions";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { generateMetadata } from "@/app/layout";

describe("E2E Application Workflow Test Suite", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe("E2E Security & Proxy Middleware Gateways", () => {
    it("should intercept and block path traversal / sensitive probe requests with HTTP 403", () => {
      const maliciousPaths = [
        "http://localhost:3000/.env",
        "http://localhost:3000/.git/config",
        "http://localhost:3000/wp-admin",
        "http://localhost:3000/phpmyadmin",
        "http://localhost:3000/cgi-bin/test",
        "http://localhost:3000/exploit.php",
      ];

      for (const path of maliciousPaths) {
        const req = new NextRequest(path, {
          headers: { "x-forwarded-for": "192.168.1.100" },
        });
        const res = proxy(req);
        expect(res.status).toBe(403);
      }
    });

    it("should block automated vulnerability scanners with HTTP 403", () => {
      const scannerAgents = [
        "sqlmap/1.5#stable",
        "Nikto/2.1.6",
        "masscan/1.0",
        "WPScan v3.8.20",
        "Acunetix-Product",
      ];

      for (const userAgent of scannerAgents) {
        const req = new NextRequest("http://localhost:3000/about", {
          headers: {
            "x-forwarded-for": "192.168.1.101",
            "user-agent": userAgent,
          },
        });
        const res = proxy(req);
        expect(res.status).toBe(403);
      }
    });

    it("should allow legitimate traffic with rate limit tracking headers attached", () => {
      const req = new NextRequest("http://localhost:3000/", {
        headers: {
          "x-forwarded-for": "192.168.1.102",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });
      const res = proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("X-RateLimit-Limit")).toBe("120");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("119");
      expect(res.headers.get("X-RateLimit-Reset")).toBeDefined();
    });

    it("should throttle requests exceeding strict tier limit with HTTP 429", () => {
      const ip = "192.168.1.103";
      let lastRes;
      for (let i = 0; i < 11; i++) {
        const req = new NextRequest("http://localhost:3000/api/auth/login", {
          headers: {
            "x-forwarded-for": ip,
            "user-agent": "Mozilla/5.0",
          },
        });
        lastRes = proxy(req);
      }
      expect(lastRes?.status).toBe(429);
      expect(lastRes?.headers.get("Retry-After")).toBeDefined();
    });
  });

  describe("E2E Cryptographic Security & Server Actions", () => {
    it("should execute encryption and decryption roundtrip cleanly", async () => {
      const plaintext = "user-profile-data-with-pii-998877";
      const encRes = await encryptAction(plaintext);

      expect(encRes.success).toBe(true);
      expect(encRes.result).toBeDefined();
      expect(encRes.result).not.toBe(plaintext);

      const decRes = await decryptAction(encRes.result!);
      expect(decRes.success).toBe(true);
      expect(decRes.result).toBe(plaintext);
    });

    it("should safely reject tampered ciphertext with friendly error", async () => {
      const encRes = await encryptAction("important-financial-record");
      expect(encRes.success).toBe(true);

      const tampered = encRes.result!.slice(0, -4) + "abcd";
      const decRes = await decryptAction(tampered);

      expect(decRes.success).toBe(false);
      expect(decRes.error).toContain("Decryption failed");
    });

    it("should validate empty inputs in server actions", async () => {
      const encRes = await encryptAction("");
      expect(encRes.success).toBe(false);

      const decRes = await decryptAction("");
      expect(decRes.success).toBe(false);
    });
  });

  describe("E2E ID Obfuscation (Sqids) Server Actions", () => {
    it("should execute obfuscate and deobfuscate roundtrip cleanly", async () => {
      const rawId = 10492;
      const obfRes = await obfuscateAction(rawId);

      expect(obfRes.success).toBe(true);
      expect(obfRes.result).toBeDefined();
      expect(obfRes.result!.length).toBeGreaterThanOrEqual(6);

      const deobfRes = await deobfuscateAction(obfRes.result!);
      expect(deobfRes.success).toBe(true);
      expect(deobfRes.result).toBe(rawId);
    });

    it("should reject negative or invalid numbers", async () => {
      const negRes = await obfuscateAction(-5);
      expect(negRes.success).toBe(false);

      const floatRes = await obfuscateAction(12.34);
      expect(floatRes.success).toBe(false);
    });

    it("should reject corrupt or invalid hashes", async () => {
      const corruptRes = await deobfuscateAction("invalid-sqids-***");
      expect(corruptRes.success).toBe(false);
    });
  });

  describe("E2E Next.js Core Routes & Metadata", () => {
    it("should generate compliant PWA Web Manifest", () => {
      const manifestData = manifest();
      expect(manifestData.name).toBe("Amir App");
      expect(manifestData.display).toBe("standalone");
      expect(manifestData.start_url).toBe("/");
      expect(manifestData.icons?.length).toBeGreaterThanOrEqual(2);
    });

    it("should generate compliant robots.txt route structure", () => {
      const robotsData = robots();
      expect(robotsData.rules).toBeDefined();
      expect(robotsData.sitemap).toContain("/sitemap.xml");
      expect(robotsData.host).toBeDefined();
    });

    it("should generate compliant sitemap.xml entries", () => {
      const sitemapData = sitemap();
      expect(Array.isArray(sitemapData)).toBe(true);
      expect(sitemapData.length).toBeGreaterThan(0);
      expect(sitemapData[0]?.url).toBeDefined();
      expect(sitemapData[0]?.lastModified).toBeInstanceOf(Date);
    });

    it("should generate comprehensive root layout metadata", async () => {
      const meta = await generateMetadata();
      expect(meta.title).toBeDefined();
      expect(meta.description).toBeDefined();
      expect(meta.openGraph).toBeDefined();
      expect(meta.twitter).toBeDefined();
    });
  });
});
