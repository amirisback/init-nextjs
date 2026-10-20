/// <reference types="@types/bun" />

// Test setup for mocking Next.js server-only, next/font, and next/headers in test runners
import { mock } from "bun:test";

mock.module("server-only", () => ({}));

mock.module("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

const mockCookieStore = {
  get: () => undefined,
  set: () => {},
  delete: () => {},
  has: () => false,
  getAll: () => [],
};

mock.module("next/headers", () => ({
  cookies: async () => mockCookieStore,
  headers: async () => new Headers(),
}));
