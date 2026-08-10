# Recipes

Six patterns, distilled from a 126-project study corpus and rewritten to Hallmark's dialect. Each states its **native-first alternative** — check that column before reaching for the recipe.

All examples assume the token bridge from [`../SKILL.md`](../SKILL.md) (`import { gsap, DUR } from "@/lib/gsap"`) and the client-component wiring from [`nextjs-setup.md`](nextjs-setup.md).

## The shared reduced-motion preamble

Every recipe uses the same structure, so it is stated once here rather than repeated six times.

```css
/* Start state lives in CSS, gated on js-ready, and is *undone* for reduced motion. */
.js-ready .reveal { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .js-ready .reveal { opacity: 1; }
}
```

```ts
const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  // Everything below. For `reduce` users this never runs, and the CSS
  // above has already left the content visible and in place.
});
```

This is the whole reduced-motion strategy: **the animation is the enhancement, the static page is the baseline.** No parallel "reduced" animation to maintain.

---

## 1. Clip-path wipe reveal

The corpus's single most common technique (40 of 126 projects). An image uncovers itself as it enters the viewport.

> **Native first:** for a plain fade/slide reveal, `IntersectionObserver` + a CSS class is enough — Hallmark `motion.md`. This recipe is for a *directional wipe*, where the image is revealed rather than faded.

The corpus writes the wipe as a four-point `polygon()`. `inset()` says the same thing in a quarter of the characters and interpolates more reliably.

```tsx
useGSAP(
  () => {
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        ".wipe img",
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          duration: DUR.long,
          scrollTrigger: { trigger: ".wipe", start: "top 80%", once: true },
        },
      );
    });
  },
  { scope: root },
);
```

- `once: true` — a reveal that re-plays on scroll-back is noise, not craft.
- Both states must use the same `clip-path` function. `inset` → `polygon` will not interpolate.
- The corpus pairs this with `duration: 2` and `power1.out`. Both are gate failures.

## 2. Scrubbed sequence with pin

An element is held in place while the page scrolls past it, and its progress is tied to scroll position.

> **Native first:** `animation-timeline: view()` does scrubbing in pure CSS, but Firefox ships it in preview only (see the SKILL gate). Pinning has no native equivalent at all. This is where GSAP genuinely earns its bundle.

```tsx
mm.add("(prefers-reduced-motion: no-preference)", () => {
  gsap.to(".panel", {
    yPercent: -100,
    ease: "none", // scrubbed tweens must not double-ease
    scrollTrigger: {
      trigger: root.current,
      pin: true,
      scrub: 1, // 1s catch-up; `true` is jittery on trackpads
      end: "+=100%",
      invalidateOnRefresh: true,
    },
  });
});
```

- `scrub: 1` rather than `scrub: true`. The number is a smoothing window and it is the difference between "expensive" and "twitchy".
- `invalidateOnRefresh: true` recalculates distances on resize. Without it, rotating a phone breaks the sequence.
- Never pin for reduced-motion users — pinning alters document flow, which is precisely the disorientation they opted out of. The `mm.add` wrapper handles this.

## 3. Split-text line reveal

Headline lines rise into place from behind a mask.

> **Native first:** none. Splitting text into per-line elements requires measuring wrapped line boxes at runtime.

Two problems sink most implementations: lines are measured before the webfont loads (so they re-wrap wrong), and the split markup destroys the accessible text. `SplitText` solves both — `autoSplit` re-splits on font load and resize, `aria` restores the original text for screen readers, and `mask` builds the overflow wrapper so you do not hand-write one.

```tsx
useGSAP(
  () => {
    const split = SplitText.create(".headline", {
      type: "lines",
      mask: "lines",
      autoSplit: true, // re-split on font load + resize
      aria: "auto", // preserve the readable text
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 100,
          duration: DUR.long,
          stagger: 0.06,
          scrollTrigger: { trigger: ".headline", start: "top 85%", once: true },
        }),
    });

    return () => split.revert(); // context.revert() does not know about SplitText
  },
  { scope: root },
);
```

- Build the animation **inside `onSplit`**. `autoSplit` discards and rebuilds the line elements when the font loads; an animation created outside would be pointing at dead nodes.
- Cap `stagger` so the full headline lands within ~500 ms. The corpus uses `stagger: 0.1` with `duration: 2` across six paragraphs — the last line arrives seconds after the first.
- Split headings only. Splitting body copy is a slop gate.

## 4. Horizontal pinned section

A row of panels moves sideways while the page is pinned.

> **Native first:** a plain `overflow-x: auto` scroller. It is keyboard-accessible, works on touch, needs no JS, and is the right answer more often than this recipe is.

The corpus implements this by hijacking the wheel event with a `lerp` loop. That version has no keyboard support, no scrollbar, no touch handling, and an animation frame loop that never cancels. Pin + scrub gives the same visual with native scroll semantics intact.

```tsx
mm.add("(prefers-reduced-motion: no-preference)", () => {
  const track = root.current!.querySelector<HTMLElement>(".track")!;
  const distance = () => track.scrollWidth - window.innerWidth;

  gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: root.current,
      pin: true,
      scrub: 1,
      end: () => `+=${distance()}`,
      invalidateOnRefresh: true,
    },
  });
});
```

`x` and `end` are **functions**, not values. They are re-evaluated on refresh, which is what makes resize work.

## 5. Layout transition: grid → detail

An item appears to grow from its position in a grid into a detail view.

> **Native first — and it usually wins.** `document.startViewTransition()` is supported in Chrome 111+, Safari 18+, and Firefox 144+. It needs no library and handles the common case in a few lines:
>
> ```ts
> document.startViewTransition(() => setSelected(id));
> ```
>
> with `view-transition-name` on the shared element.

Reach for `Flip` only when View Transitions breaks down: the transition must be **interruptible** (the user can click another card mid-flight), **scroll-linked**, or must survive a state change that View Transitions' snapshot model cannot express.

```tsx
const { contextSafe } = useGSAP({ scope: root });

const expand = contextSafe((card: HTMLElement) => {
  const state = Flip.getState(".card");
  card.classList.add("is-expanded");

  Flip.from(state, {
    duration: DUR.long,
    ease: "hm-out",
    absolute: true, // prevents siblings reflowing mid-flight
    nested: true,
  });
});
```

`contextSafe` is mandatory here — the animation is created in an event handler, so without it, it escapes the `useGSAP` context and survives unmount.

## 6. Smooth scroll — and why usually not

Six corpus projects add Lenis, ScrollSmoother, or Locomotive. Default to **not** doing this.

Smooth-scroll libraries replace native scrolling with a JS-interpolated position. What that costs:

- `Ctrl+F` / find-in-page jumps to the wrong place or fights the interpolation.
- Anchor links and browser scroll-restoration break.
- Screen-reader and keyboard navigation land off-target.
- Scroll position lags input on every device that already has good native inertia — which is all of them.

It is a slop gate (#10) precisely because it is applied reflexively.

If a specific effect genuinely requires it — a scrubbed sequence whose smoothing must match a pinned element exactly — use `ScrollSmoother` (it ships with GSAP and integrates with ScrollTrigger, rather than fighting it), and gate it:

```tsx
mm.add("(prefers-reduced-motion: no-preference)", () => {
  ScrollSmoother.create({ smooth: 1, normalizeScroll: false });
});
```

`normalizeScroll: false` — leave the browser's own scroll handling alone. And state in the PR *which* effect required it. "It feels nicer" is not that.
