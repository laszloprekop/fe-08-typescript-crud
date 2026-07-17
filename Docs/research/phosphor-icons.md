# Phosphor Icons: delivery, weight, and Tailwind interaction

Research for [#4](https://github.com/laszloprekop/fe-08-typescript-crud/issues/4). Measured 2026-07-17 against the real packages and CDNs.

Spike code: `spike/phosphor/` on branch `research/phosphor`. Every number below came out of that spike or out of `curl`/`npm view`; nothing here is from memory.

## Recommendation

**Inline the three SVGs from `@phosphor-icons/core@2.1.1`. Do not ship the webfont.**

Copy `trash.svg`, `pencil-simple.svg`, and `x.svg` out of the package (or off phosphoricons.com) and paste them into the render function as `<svg>` literals. Do not add a dependency at all — not a runtime one, not a dev one, not a `<link>`.

Three reasons, in order of weight:

1. **`size-4` does not size a webfont icon.** This is the practical difference for the reader, and it is measured, not reasoned — see the table below. A font icon is sized by `font-size` (`text-3xl`), an SVG by `width`/`height` (`size-8`). Teaching Tailwind and then handing the reader an element where the obvious Tailwind sizing utility silently does nothing is an anti-lesson.
2. **~380x the bytes for 3 of 1530 icons.** 159,737 bytes over the wire vs 421.
3. **The webfont's failure mode on an unlabelled button is garbage, not silence.** It announces a Private Use Area codepoint. See A11y.

**What this trades away, plainly:**

- **Adding a fourth icon later is a manual copy-paste**, not a class name. That is the real cost. For an app whose icon set is closed at three, it is the right trade; for an app that is still growing its icon vocabulary, it is not.
- **No `ph-*` class vocabulary.** The reader does not learn the icon-font pattern, which is a genuinely common one they will meet elsewhere (Font Awesome, Material Icons work this way). Worth one sentence in the doc, not a delivery mechanism.
- **The markup gets noisier.** A 400-byte `<path d="...">` sits in the middle of the render function. Mitigate by lifting each icon into a named `const TRASH_ICON = '<svg …>'` at the top of the module — which also gives the doc a place to say *why* it is inline.
- **No CDN cache sharing.** Irrelevant here — CDN cache partitioning has been per-site in Chrome and Safari for years, so the "someone else already downloaded it" benefit does not exist for a first-time visitor anyway.

## Verified

### 1. Delivery — the three routes

| | CDN `<link>` | npm (Vite bundles) | inline SVG |
|---|---|---|---|
| Over the wire (regular weight) | 159,737 B | ~161,040 B | **421 B** (all 3, gzipped) |
| Extra HTTP requests | 2 (third-party origin) | 2 (same origin) | **0** |
| Bytes in `dist/` | 0 | **4.0 MB** | ~1 KB |
| Entry in `package.json` | none | devDependency | **none** |
| Sized by Tailwind `size-4` | ✗ | ✗ | **✓** |

- **CDN**: 12,357 B (`regular/style.css`, gzipped as jsdelivr serves it) + 147,380 B (`Phosphor.woff2`).
- **npm**: ~13,660 B gzipped CSS (Tailwind + Phosphor combined; Phosphor's share ≈ 7.7 KB, by difference against the 5,950 B Tailwind-only build) + the same 147,380 B woff2. Phosphor's share is *smaller* than the CDN's 12,357 B because Vite minifies the CSS before it is gzipped — the CDN serves it unminified.
- **inline**: `trash.svg` (391 B) + `pencil-simple.svg` (348 B) + `x.svg` (284 B) = 1,023 B raw, 421 B gzipped together. These ride inside `index.html`/the JS bundle — no extra request.

### 2. The zero-runtime-dependencies worry is unfounded — verified

The issue flagged that an icon font "may not be able to stay dev-only". **It can.** `@phosphor-icons/web@2.1.2` installed as a `devDependency` builds identically — the package is CSS and font files, consumed by Vite at build time; nothing imports it at runtime. `dependencies` stayed empty and `vite build` emitted the same assets.

So the asymmetry the issue worried about **does not exist**. The npm route is rejected on bytes and on Tailwind ergonomics, **not** on dependency hygiene. Worth correcting in the doc rather than repeating.

### 3. Weight — 1530 icons for 3

`grep -c '^\.ph\.ph-' regular/style.css` → **1530** icons in the regular weight alone.

`@phosphor-icons/web@2.1.2` unpacks to **46,311,822 B** (`npm view … dist.unpackedSize`) — 44 MB on disk — because it ships all 6 weights x 4 font formats + SVG sources + `selection.json`.

**The surprise: Vite emits every font format, not just woff2.** The `@font-face` `src` list names woff2, woff, ttf, *and* svg; Vite copies each referenced asset into `dist/`. Verified for **both** npm forms — the README's `import "@phosphor-icons/web/regular"` subpath, and a plain `<link>` to the file in `node_modules/` — which emit byte-identical assets:

```
dist-npm/assets/Phosphor-…woff2    147.38 kB   ← the only one a modern browser fetches
dist-npm/assets/Phosphor-…ttf      488.63 kB
dist-npm/assets/Phosphor-…woff     488.71 kB
dist-npm/assets/Phosphor-…svg    2,996.37 kB
```

**4.0 MB of `dist/` to render three icons.** Over the wire it is still ~157 KB (a modern browser takes the first `src` it understands), but every deploy ships the 4 MB. The SVG route's entire `dist/` is **32 KB**, Tailwind included.

### 4. Subsetting — exists, but not for this doc

- **`@phosphor-icons/pack`** — linked from the package README, **404s on npm** (`npm error 404 '@phosphor-icons/pack@*' is not in this registry`). It is not a package: it is a hosted web tool at `https://pack.phosphoricons.com` (200 OK), backed by `github.com/phosphor-icons/pack` — 9 stars, last pushed **2024-04-19**. Using it means hand-generating a font binary in a browser and committing it, with no reproducible build step. **This is exactly the kind of README-says-so detail that does not survive checking.**
- **`@phosphor-icons/unplugin@0.1.1`** — a real bundler plugin, but its npm description opens: *"> [!WARNING] > This plugin is extremely experimental, and is subject to change. Use at your own risk!"*

Both are worse than pasting three `<path>` elements. **Subsetting is not worth the doc's complexity budget** — and note that the thing subsetting optimises (font bytes) is a problem the inline route does not have in the first place.

### 5. Style/weight choice — a separate asset *and* a class rename

Not a one-line switch. Each weight is its own directory, its own `style.css`, its own font files, **and its own class prefix**:

| weight | class prefix | style.css | woff2 |
|---|---|---|---|
| regular | `.ph` | 78,131 B | 147,380 B |
| bold | `.ph-bold` | 85,821 B | 150,052 B |
| fill | `.ph-fill` | 85,821 B | 131,744 B |
| thin | `.ph-thin` | 85,821 B | 153,660 B |
| light | `.ph-light` | 87,359 B | 155,232 B |
| duotone | `.ph-duotone` | 231,484 B | 164,420 B |

Switching regular → bold means a new `<link>` **and** rewriting `ph` → `ph-bold` on every icon. Two weights = two stylesheets = two font downloads. The README warns that loading all six via the script tag "will bring in around 3MB of fonts and CSS".

**Moot for the inline route** — the weight is just which directory you copy the SVG out of. `@phosphor-icons/core@2.1.1` ships all six as `assets/<weight>/<name>.svg`. **Recommend `regular`**: it is the default, it matches Phosphor's own marketing weight, and at 16px the thinner weights lose definition.

### 6. Tailwind interaction — measured, and it is the decisive finding

Rendered in headless Chromium, measuring the **painted ink** (bounding box of actually-drawn pixels), not the CSS box. The box is never the question — `size-4` always sets the box. The question is whether the *icon* follows.

| element | classes | declared box | font-size | **painted ink** | |
|---|---|---|---|---|---|
| `<i class="ph ph-trash">` | `size-4 text-red-600` | 16x16 | 16px | 12x13 | coincidence — see below |
| `<i class="ph ph-trash">` | `text-base text-red-600` | 16x16 | 16px | 12x13 | |
| `<i class="ph ph-trash">` | **`size-8`** `text-red-600` | 32x32 | 16px | **13x13** | ✗ **box grew, glyph did not** |
| `<i class="ph ph-trash">` | **`text-3xl`** `text-red-600` | 30x30 | 30px | **23x26** | ✓ font's own lever works |
| `<svg>` | `size-4 text-red-600` | 16x16 | 16px | 12x13 | |
| `<svg>` | **`size-8`** `text-red-600` | 32x32 | 16px | **24x26** | ✓ **scales correctly** |

**`size-*` does not size a webfont icon.** At `size-4` it *looks* like it works — but only because the default `font-size` happens to also be 16px. Change it to `size-8` and the box becomes 32x32 while the glyph stays 13x13, floating in the corner. That is a trap the reader would hit and struggle to diagnose, because the class is applied, the box *is* 32px, and DevTools shows nothing wrong.

**Colour works on both.** `text-red-600` resolved to `oklch(0.577 0.245 27.325)` on every variant. For the font it is the glyph's `color`; for the SVG it lands via `fill="currentColor"` — which is **already baked into the raw `@phosphor-icons/core` assets**, so a pasted SVG inherits `text-red-600` with no edits. Verified: `computed fill` on the SVG = `oklch(0.577 0.245 27.325)`, matching its `color`.

**So:** SVG icons take Tailwind's sizing *and* colour utilities natively. Font icons take colour but need `text-*` for size — a second, different mental model bolted onto the one being taught.

Also worth knowing: the CSS sets `font-display: block`, so the webfont's icons are **invisible until the font loads**, and the README warns against overriding `font-family`, `font-style`, `font-weight`, `font-variant`, `text-transform`, or the `:before`/`:after` pseudo-elements — a live hazard when the whole point of Tailwind is spraying utilities at elements.

### 7. A11y — the font's failure mode is worse than silence

Chromium's computed accessible names, straight from the AX tree via CDP:

| # | case | computed accessible name |
|---|---|---|
| 1 | webfont, icon-only, no aria | **`U+E4A6` (Private Use Area)** |
| 2 | webfont, icon-only, `aria-hidden` icon, no label | *(empty)* |
| 3 | webfont, icon-only, `aria-hidden` + `aria-label` | `Delete car` |
| 4 | webfont + visible text, `aria-hidden` icon | `Delete` |
| 5 | webfont + visible text, icon **not** hidden | **`U+E4A6 Delete`** |
| 6 | svg, icon-only, no aria | *(empty)* |
| 7 | svg, icon-only, `aria-hidden` + `aria-label` | `Delete car` |
| 8 | svg + visible text, `aria-hidden` icon | `Delete` |
| 9 | visible text "Delete" + `aria-label="Remove vehicle…"` | **`Remove vehicle from collection`** |

**Rows 1 and 5 are the font-specific hazard.** A webfont icon injects its glyph via `content:` on a `:before` pseudo-element, and pseudo-element content is *mandated* to participate in the accessible name — [accname-1.2 §4.3.2, step 2.F.ii](https://www.w3.org/TR/accname-1.2/): *"For `::before` pseudo elements, User agents MUST prepend CSS textual content, without a space, to the textual content of the current node."* So a font icon that is not explicitly hidden leaks an unpronounceable codepoint into the button's name. The SVG's failure mode (row 6) is an empty name — still a bug, but an honest one that an audit tool flags plainly.

**The idiomatic pattern:**

```html
<!-- icon-only: name comes from aria-label, icon hidden -->
<button aria-label="Delete car">
  <svg aria-hidden="true" class="size-4" …>…</svg>
</button>

<!-- visible text label: text IS the name. NO aria-label. -->
<button>
  <svg aria-hidden="true" class="size-4" …>…</svg>
  Delete
</button>
```

**Yes, it changes when the button keeps a visible label** — and this is the part that is usually got wrong. With visible text, the icon still gets `aria-hidden="true"`, but the button must **not** get an `aria-label`: the visible text already supplies the name (row 4/8), and an `aria-label` would *override* it (row 9). That is a [WCAG 2.5.3 Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) failure — **Level A** — because speech-input users say "click Delete" and hit a control whose name is "Remove vehicle from collection". `aria-hidden="true"` on the icon is non-negotiable in both cases; `aria-label` is for the icon-only case only.

## Not verified

- **Screen-reader behaviour in the wild.** All accessible names above are Chromium's computed AX tree, which is the right primary source for *name computation*. I did not run VoiceOver/NVDA to hear what they announce for `U+E4A6`. The name is garbage either way; exactly how each SR vocalises it is unverified.
- **`font-display: block` FOIT duration** on a real network. Read from the CSS, not timed.
- **The 421 B gzipped figure** is the three SVGs gzipped as a standalone stream. Inside a real bundle they compress against surrounding markup, so the true marginal cost differs — almost certainly *lower*, given repeated `<svg xmlns=… viewBox="0 0 256 256" fill="currentColor">` preamble. Directionally safe; treat 421 B as an upper bound.
- **CDN cache partitioning.** Stated above as an aside; it reflects documented browser behaviour but I did not test it here.
- **Whether the icon set stays at three.** The entire recommendation rests on this. If Phase 4's toasts/dialog pull in a fifth and sixth icon (`check-circle`, `warning`, `x-circle` are the obvious candidates), the copy-paste cost grows — still cheap at 6, reconsider at ~15.

## Reproducing

```sh
cd spike/phosphor
pnpm install
pnpm dev --port 5199 &
node measure.mjs   # Tailwind sizing/colour: painted-ink measurements
node a11y.mjs      # accessible names via CDP
```

`measure.mjs` screenshots each icon and computes the bounding box of painted pixels — that is what distinguishes "the box grew" from "the icon grew". `a11y.mjs` pulls names from Chromium's AX tree rather than trusting a reading of the spec.
