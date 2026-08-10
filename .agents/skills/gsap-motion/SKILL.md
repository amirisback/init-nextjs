---
name: gsap-motion
description: "Escalation path for motion CSS cannot do — scroll-scrubbed sequences, pinned sections, split-text reveals, interruptible layout transitions, drag physics. Enforces a motion budget and forces GSAP to speak Hallmark's easing/duration dialect instead of GSAP's defaults. Use when a page needs scroll animation, when GSAP is requested by name, or when auditing existing motion for slop."
risk: safe
source: "Distilled from a private 126-project CODEGRID/GSAP study corpus — no third-party code reproduced"
date_added: "2026-08-10"
---

# GSAP Motion

`hallmark` owns the page: structure, theme, type, colour — **and the default motion language**, which is CSS, quiet, and deliberately restrained. This skill is not a replacement for that. It is the **escalation path**, and it is designed to fire rarely.

Read [`hallmark/references/motion.md`](../hallmark/references/motion.md) first. If what you need fits there, build it there and stop. Do not load GSAP.

## Why this skill exists

GSAP's out-of-the-box defaults are `ease: "power1.out"`, `duration: 0.5`. Those are the on-distribution values every tutorial uses and every model was trained into — the exact thing Hallmark exists to refuse. A page can pass all 57 of Hallmark's slop gates and still announce itself as generated the moment it moves.

So this skill has one non-negotiable rule: **GSAP never runs on its own defaults.** It runs on Hallmark's tokens.

## The gate

Answer these three before writing a single line of GSAP. Stop at the first "yes".

| Question | If yes |
| --- | --- |
| Can CSS `transition` / `@keyframes` do it? | Do that. Hallmark `motion.md`. Stop. |
| Is it a reveal-once-on-scroll? | `IntersectionObserver` + a CSS class. Hallmark `motion.md`. Stop. |
| Is it a simple layout transition (grid → detail, list reorder)? | `document.startViewTransition()`. Native, no dependency. Stop. |

GSAP earns its place **only** for:

- **Scrubbed** motion — progress tied to scroll position, not a one-shot trigger.
- **Pinning** — an element held while the page scrolls past it.
- **Text splitting** — per-line or per-word reveals (no CSS equivalent).
- **Interruptible or scroll-linked** layout transitions, where View Transitions' fire-and-forget model breaks down.
- **Drag / physics** — `Draggable`, inertia, throw.

Anything else is ~27 KB gzipped of runtime (44 KB once ScrollTrigger is in) for something the platform already does.

> **A note on CSS scroll-driven animations.** `animation-timeline: view()` covers scrubbed reveals natively, but as of 2026-08 it is **not Baseline** — Chrome 115+, Safari 26+, **Firefox has it in preview only**. Use it as progressive enhancement behind `@supports (animation-timeline: view())`, never as the sole implementation. That gap is the honest reason ScrollTrigger still earns its keep.

## The motion budget

The failure mode of every GSAP reference project is the same: *everything moves*. Enforce a hard cap per page.

- **One** hero moment. The single orchestrated sequence a visitor remembers.
- **Two** scrubbed sections, maximum. A third makes the page feel like it is fighting the scrollbar.
- **Zero** decorative motion on elements that are not the subject of their section.
- If a section's motion cannot be explained in one sentence of what it *communicates*, delete it.

Exceeding the budget is a defect, not a style choice. Say so in review.

## Setup: the token bridge

This is the centrepiece. It maps Hallmark's easing and duration tokens onto GSAP so a GSAP-animated page moves in exactly the same dialect as its CSS.

```ts
// src/lib/gsap.ts
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

// Hallmark's easing tokens, expressed for GSAP.
// CustomEase pads a 4-number string with (0,0) and (1,1), making these
// byte-for-byte equivalent to the CSS cubic-bezier() of the same values.
CustomEase.create("hm-out", "0.16, 1, 0.3, 1"); //    --ease-out
CustomEase.create("hm-in", "0.7, 0, 0.84, 0"); //     --ease-in
CustomEase.create("hm-in-out", "0.65, 0, 0.35, 1"); //--ease-in-out

// Hallmark's duration tokens, in seconds.
export const DUR = { micro: 0.12, short: 0.22, long: 0.42 } as const;

gsap.defaults({ ease: "hm-out", duration: DUR.long });

export { gsap };
```

Import `gsap` from this module everywhere. Never from `"gsap"` directly — that is how `power1.out` leaks back in.

**Scrubbed tweens are the one exception to the duration tokens.** When `scrub` is set, duration only controls catch-up smoothing, not the visible timing; the scroll distance does. Use `ease: "none"` for scrubbed tweens — any other easing double-applies against the scroll position and reads as lag.

## Reduced motion is a gate, not a fallback

Do not animate and then bolt on a `prefers-reduced-motion` override. Branch at the source with `gsap.matchMedia()`, so the reduced branch never constructs the spatial tween at all.

```ts
const mm = gsap.matchMedia();

mm.add(
  {
    motion: "(prefers-reduced-motion: no-preference)",
    reduced: "(prefers-reduced-motion: reduce)",
  },
  (ctx) => {
    const { motion } = ctx.conditions as { motion: boolean };

    if (!motion) {
      gsap.set(".reveal", { opacity: 1, clearProps: "transform" });
      return; // no ScrollTrigger, no scrub, no pin
    }

    // full motion branch here
  },
);
```

`mm.revert()` tears down every branch at once. In React, `useGSAP` does that for you — see [`references/nextjs-setup.md`](references/nextjs-setup.md).

Reduced motion means **no spatial movement and no scroll-hijacking**. Opacity crossfade is acceptable. Pinning is not: it changes document flow and disorients exactly the users who asked for less motion.

## Workflow

1. Run **the gate**. Most briefs stop here. Say which row stopped it.
2. Confirm the **motion budget** with the user: name the one hero moment.
3. Install the token bridge (`src/lib/gsap.ts`) before any animation code.
4. Build the reduced-motion branch **first**, then the full branch. This ordering makes the accessible path the default rather than the afterthought.
5. Pick a recipe from [`references/recipes.md`](references/recipes.md).
6. Wire it per [`references/nextjs-setup.md`](references/nextjs-setup.md) — client boundary, `useGSAP`, cleanup.
7. Run the **slop gates** below before handing back.

## Motion slop gates

These extend Hallmark's 57. Each one is a straight fail — fix it, do not justify it.

**Dialect**

1. `power1.out`, `power2.out`, `back.out`, `elastic`, or any stock GSAP ease anywhere. Use `hm-*`.
2. A non-scrubbed `duration` above `0.6`. The corpus is full of `duration: 2`; it reads as syrup.
3. `ease` set on a scrubbed tween to anything but `"none"`.
4. `gsap` imported directly instead of through the token bridge.

**Scroll**

5. `window.addEventListener("scroll", …)` or `"wheel"`. ScrollTrigger, or nothing.
6. A `requestAnimationFrame` loop that never cancels.
7. Wheel-hijacked horizontal scroll. It kills keyboard nav, the scrollbar, and mobile. Pin + scrub instead.
8. Parallax on the hero. The single most reliable tell of a template.
9. `scrub: true` on more than two sections.
10. Smooth-scroll libraries (Lenis, ScrollSmoother, Locomotive) added without an explicit reason. They break `Ctrl+F`, anchor links, and native scroll feel by default.

**Content**

11. Count-up number stats. Never once helped a reader.
12. Custom or magnetic cursors.
13. A marquee with no pause on hover or focus.
14. Text that starts at `opacity: 0` in the DOM with no CSS fallback — if JS fails or is slow, the content is invisible. Set the hidden state in CSS scoped under a `js-ready` class on `<html>`.

**React**

15. Animation set up outside `useGSAP` (or without a manual `gsap.context()` + cleanup).
16. `ScrollTrigger` created without `ScrollTrigger.refresh()` after async content changes layout height.

## Auditing existing motion

Given a file or page, walk the 16 gates and return a ranked punch list — location, gate number, one-line fix. **Do not edit** unless asked. Report the motion budget as a count first: hero moments, scrubbed sections, decorative animations.

## References

- [`references/nextjs-setup.md`](references/nextjs-setup.md) — GSAP 3.15 + `@gsap/react` 2.1.2 in Next.js App Router / React 19: client boundaries, `useGSAP`, SSR flash, route-change refresh.
- [`references/recipes.md`](references/recipes.md) — six recipes, each with its native-first alternative and reduced-motion branch.
