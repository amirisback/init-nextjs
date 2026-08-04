---
name: nextjs-typescript-webdev
description: Use when building, modifying, or refactoring features, pages, components, or API routes in Next.js and TypeScript
---

# Next.js & TypeScript Web Development Skill

## Overview
Standards and best practices for developing scalable, type-safe, and high-performance web applications using **Next.js (App Router)**, **TypeScript**, and **Clean Architecture**.

---

## 1. Next.js App Router Architecture

### Server vs. Client Components
- **React Server Components (RSC)**: Default for all components. Use RSC for data fetching, rendering static/server content, and accessing backend resources directly.
- **Client Components (`'use client'`)**: Use ONLY when component requires:
  - React hooks (`useState`, `useEffect`, `useReducer`, `useRef`, etc.)
  - Event listeners (`onClick`, `onChange`, `onSubmit`, etc.)
  - Browser-only APIs (`window`, `localStorage`, etc.)
  - Client state stores (Zustand)

### Routing & URL Conventions
- Use `[id]` folder structure for primary dynamic routes (e.g., `/order/[id]`, `/products/[id]`). Avoid using `[slug]`.
- Use specific nested parameter names (e.g., `[productId]`) ONLY when nested under another dynamic route (e.g., `/community/[id]/products/[productId]`).
- Use `createSlug(id)` from `@/utils/createSlug` when navigating (`router.push`).
- Use `parseSlug(id) ?? id` in `page.tsx` to extract/decrypt raw IDs before passing to Use Cases.

---

## 2. TypeScript Best Practices

- **Strict Type Safety**: Never use `any`. Use `unknown` with type guards or generics when type is uncertain.
- **Interfaces vs. Types**:
  - Prefer `interface` for object schemas and data contracts.
  - Use `type` for unions, primitives, tuples, or mapped types.
- **Discriminated Unions**: Represent state cleanly:
  ```typescript
  type UIState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };
  ```
- **Zod Data Validation**: Validate external data (API responses, forms, URL search params) using Zod schemas at runtime boundaries.

---

## 3. Clean Architecture Integration

### Layer Boundaries
1. **Presentation Layer (`src/presentation/`)**:
   - React components, pages, custom UI hooks.
   - **NO direct GraphQL queries/mutations** (`useQuery`, `useMutation`, `.gql` imports prohibited in Presentation).
   - Instantiate Use Cases via DI Module (`useMemo(() => createXxxModule(client), [])`).
   - Use Clean Auth Store (`useCleanAuthStore` from `src/presentation/auth/store/auth-store.ts`).
2. **Core Layer (`src/core/` / `domain/`)**:
   - Entities, Use Case interfaces, Domain logic.
   - Independent of framework and data layers.
3. **Data Layer (`src/data/`)**:
   - Repositories implementations, Data Sources, Mappers, GraphQL/API operations.
   - Error mapping (`mapGraphQLError`) handles backend/API exceptions before reaching Core/Presentation.

---

## 4. UI/UX Design System & Aesthetics

- **Rich Aesthetics**: High contrast, curated color palettes, dark mode support, glassmorphism, subtle micro-animations.
- **Typography & Layout**: Standardize typography tokens, responsive CSS Grid / Flexbox layouts.
- **Semantic HTML & Accessibility**: Unique `id` attributes for interactive elements, proper heading hierarchy (`h1` -> `h2`), `aria-*` tags.

---

## 5. Verification Checklist

Before finalizing any changes:
1. Run TypeScript check: `npx tsc --noEmit`
2. Ensure no direct API/Apollo hooks in Presentation layer.
3. Confirm proper dynamic route slug encoding/decoding.
4. Verify error handling wraps UI cleanly without swallowing errors silently.
