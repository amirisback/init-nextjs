# GSAP in Next.js App Router

Verified against `gsap@3.15.0` and `@gsap/react@2.1.2`, Next.js 16 / React 19.

## Install

```bash
bun add gsap @gsap/react
```

GSAP's npm package ships `ScrollTrigger`, `SplitText`, `CustomEase`, `Flip`, `Draggable` and `ScrollSmoother` in the box. There is no separate plugin install and no Club membership to buy — import them from `gsap/<PluginName>`.

## The client boundary

GSAP touches `window`, `document`, and layout. It cannot run in a Server Component.

Keep the boundary **tight**. Do not stamp `'use client'` on a page to animate one section — that opts the whole subtree out of server rendering. Extract the animated part into its own client component and leave the page a Server Component:

```tsx
// src/app/page.tsx  — stays a Server Component
import { RevealSection } from "./_components/RevealSection";

export default function Page() {
  return (
    <main>
      <h1>Static, server-rendered, indexable</h1>
      <RevealSection />
    </main>
  );
}
```

Content must live in the **server-rendered HTML**, not be injected by the animation. Animate elements that are already in the markup.

## `useGSAP`

`useGSAP` is the only correct way to create animations in React. It runs `useLayoutEffect` on the client and `useEffect` on the server, and calls `context.revert()` on unmount — which kills every tween, ScrollTrigger, and inline style the callback created.

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, DUR } from "@/lib/gsap";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function RevealSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Selectors are scoped to `root` — no document-wide queries.
      gsap.from(".reveal", {
        opacity: 0,
        y: 12,
        duration: DUR.long,
        stagger: 0.06,
        scrollTrigger: { trigger: root.current, start: "top 80%" },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root}>
      <p className="reveal">…</p>
    </section>
  );
}
```

Rules that follow from how the hook works:

- **`scope` is not optional.** Without it, `".reveal"` matches every such element on the page, including ones owned by other components.
- **`registerPlugin` goes at module scope** in a client module, once. Calling it inside the callback re-registers on every run.
- **Never create tweens at module scope or in the component body.** Only inside the `useGSAP` callback.
- **Animations created in event handlers must be wrapped**, or they escape the context and leak:

  ```tsx
  const { contextSafe } = useGSAP({ scope: root });
  const onClick = contextSafe(() => gsap.to(".card", { scale: 1.02 }));
  ```

- **Dependencies:** `useGSAP(cb, { scope: root, dependencies: [id], revertOnUpdate: true })`. Without `revertOnUpdate`, a dependency change adds a *new* animation on top of the old one instead of replacing it.

## The SSR flash

The classic bug: an element's hidden start state is set by JS, so between first paint and hydration the user sees the finished content, then it jumps to hidden and animates in.

Set the start state in **CSS**, gated on a class that JS adds to `<html>`:

```css
.js-ready .reveal {
  opacity: 0;
}
```

```tsx
// in the root layout, before hydration
<script
  dangerouslySetInnerHTML={{
    __html: `document.documentElement.classList.add('js-ready')`,
  }}
/>
```

If JS never loads, the class is never added and the content stays visible. That is the correct failure mode. Hiding content in plain CSS and revealing it with JS is not — it makes the page blank for anyone whose bundle fails.

## Route changes

App Router navigations swap the DOM without a full reload. Two consequences:

1. **Unmount cleanup is handled** — `useGSAP`'s `context.revert()` kills the old page's ScrollTriggers.
2. **Layout height changes are not.** After images load, fonts swap, or async content mounts, ScrollTrigger's cached start/end positions are stale and triggers fire at the wrong scroll offsets.

```tsx
useGSAP(
  () => {
    // …create triggers…
    ScrollTrigger.refresh();
  },
  { scope: root },
);
```

For images specifically, prefer giving `next/image` explicit `width`/`height` (or `fill` with a sized parent) so the layout never shifts and no refresh is needed. Reserving the space is cheaper than recalculating after the fact.

## Tailwind and theme switching

GSAP writes **inline styles**, which beat Tailwind utilities and CSS variables. Two consequences in this project:

- An animated `opacity`/`transform` will not respond to a Tailwind class afterwards. Use `clearProps: "opacity,transform"` at the end of a tween if the element must return to class-driven styling.
- Do not animate `color` or `backgroundColor` on elements themed by `next-themes`. The inline style survives the theme swap and the element keeps the old theme's colour. Animate a wrapper's `opacity` instead, or tween a CSS variable.

## Bundle cost

`gsap` core is 27 KB gzipped (71 KB minified); ScrollTrigger adds 17 KB gzipped (43 KB minified). That lands in the client bundle of every route importing it. Import plugins individually (`gsap/ScrollTrigger`), never `gsap/all`, and keep the client boundary tight so unaffected routes stay clean.
