# Tailwind v4 on this stack — verified by running it

**Spike branch:** `research/tailwind-v4` · **Date:** 2026-07-17 · **Answers:** issue #3

Everything below was executed in `web/` on this branch. Toolchain as run:
Node v20.19.2, pnpm 10.28.1, `vite 8.1.5` (resolved from `^8.1.1`),
`typescript 6.0.3` (resolved from `~6.0.2`), `tailwindcss@4.3.3`,
`@tailwindcss/vite@4.3.3`, Chrome via Playwright 1.61.1.

Anything I could not verify by execution is in [Not verified](#not-verified).

---

## Headline

Tailwind v4 works on this stack with **two devDependencies, one five-line
config file, and one line of CSS**. No `tailwind.config.js`, no PostCSS, no
`content: []`, no `init` command.

The interesting findings are not about installing Tailwind. They are about
**Pico + Tailwind coexistence**, and they overturn the premise in issue #3.

---

## 1. Install command and package.json diff

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

Resolved: `@tailwindcss/vite 4.3.3`, `tailwindcss 4.3.3`. Diff:

```diff
   "devDependencies": {
+    "@tailwindcss/vite": "^4.3.3",
+    "tailwindcss": "^4.3.3",
     "typescript": "~6.0.2",
     "vite": "^8.1.1"
   },
```

**Both land in `devDependencies`. `web/` still has no `dependencies` field at
all** — the zero-runtime-dependency property survives. Verified:

```
$ node -e "console.log(require('./package.json').dependencies)"
undefined
```

Tailwind is a build-time tool: it compiles to a `.css` asset, so nothing
ships to the browser as a module. Nothing else is needed — no `postcss.config.js`,
no `tailwind.config.js`, and **no `npx tailwindcss init`** (that command is v3;
it does not exist here).

## 2. The whole `web/vite.config.ts`

The file did not exist. In full, five lines:

```ts
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [tailwindcss()],
})
```

`tailwindcss` is a **default** export from `@tailwindcss/vite` and is **called**
(`tailwindcss()`) — it is a plugin factory, not a plugin object.

### ⚠️ `tsc` does not typecheck this file

`web/tsconfig.json` has `"include": ["src"]`, and `vite.config.ts` is at the
package root. So the one file the reader is about to hand-write is the one file
`pnpm build`'s `tsc` step ignores. Verified by appending a blatant error:

```ts
const oops: number = "definitely not a number"
```

```
$ npx tsc ; echo $?
0                                   # passes
$ npx tsc --listFiles | grep -c vite.config.ts
0                                   # not even in the file list
```

This is why `create vite`'s React templates ship a `tsconfig.node.json` plus
project references. This repo's vanilla-ts scaffold has none, so the gap is
real and silent. It does not break anything — Vite itself strips the types when
it loads the config — but "tsc passes" says nothing about `vite.config.ts`.

## 3. `index.html` and `style.css`

`src/style.css` is already in the module graph via `import "./style.css"` at
`src/main.ts:1`, and is **not** linked from `index.html`. So Tailwind needs no
`index.html` change at all to be wired in — adding the import to the CSS is
enough.

Minimum head of `web/src/style.css`:

```css
@import "tailwindcss";
```

### Does `@import` sit above or below the custom rules?

**Put it at the top.** But the honest finding is that Tailwind *tolerated* it
below a rule — because **Tailwind's plugin resolves `@import` itself at build
time** rather than leaving it to the browser. This built fine and emitted
working preflight:

```css
.zz { color: red; }
@import "tailwindcss";   /* still worked */
```

Do not rely on that. Real CSS requires `@import` before any other rule, and the
placement has a **consequence that does bite** (§4): everything Tailwind emits
lands inside `@layer`, while anything you write outside an `@import` is
*unlayered* and therefore **beats all of it**.

### Content detection needs no configuration

There is no `content: []`. v4 auto-detects sources. Verified: all six probe
utilities used only in `index.html` (`bg-red-500 p-4 text-3xl font-bold
bg-green-500 p-2`) were generated, without any config naming `index.html`.

## 4. Preflight — the load-bearing question

### Can it be disabled? **Yes.**

`@import "tailwindcss"` is a convenience. Splitting it and omitting the
preflight line disables the reset:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

Verified: preflight's signature (`border: 0 solid` on `*`) went from present to
**absent**, and the dev CSS dropped **7250 → 2558 bytes**. These are real
package entrypoints, not a trick — `tailwindcss/package.json` `exports`
explicitly publishes `./preflight.css`, `./theme.css`, `./utilities.css`.

> Note for a v3 mental model: in v4.3.3 `index.css` **inlines** theme/base/utilities
> into `@layer` blocks rather than `@import`-ing three files. The three files
> still exist and are exported; `index.css` just isn't a re-export of them.

### But you almost certainly should not disable it

**Issue #3's premise is wrong.** It says preflight "actively fights Pico". It
does not. Measured with Pico's `<link>` and plain `@import "tailwindcss"`
(preflight **on**):

| element | computed | whose? |
|---|---|---|
| `h1` | `font-size: 40px; font-weight: 700` | Pico's |
| `main` | `padding: 80px` | Pico's |
| `#submit-btn` | `background: rgb(1,114,173)` | Pico's |

Preflight is inside `@layer base`. Pico arrives via a plain `<link>` and is
therefore **unlayered**. In the CSS cascade, **unlayered normal declarations beat
layered ones**, at any specificity. So Pico wins over preflight automatically,
everywhere, for free. Preflight is already harmless next to Pico.

### The real problem is the exact opposite

That same rule means **Pico beats Tailwind's utilities too**, because utilities
are in `@layer utilities`. Measured on `<p class="bg-red-500 p-4 text-3xl font-bold">`:

| utility | expected | actual | why |
|---|---|---|---|
| `bg-red-500` | red | ✅ red | Pico sets no `background-color` on `p` — no contest |
| `text-3xl` | 37.5px | ❌ **20px** | loses to Pico's unlayered `p { font-size: var(--font-size) }` |
| `font-bold` | 700 | ❌ **400** | same rule sets `font-weight` |
| `p-4` | 20px | ❌ **80px** | see the variable collision below |

Pico's culprit rule, from its minified source:

```css
address,blockquote,dl,figure,form,ol,p,pre,table,ul{margin-top:0;margin-bottom:var(--typography-spacing-vertical);color:var(--color);font-style:normal;font-weight:var(--font-weight);font-size:var(--font-size)}
```

So a naive "add Tailwind alongside Pico" gives a reader utilities that work for
some properties and **silently do nothing for others**. That is a far worse
teaching outcome than a clean break.

### ⚠️ The `--spacing` collision — the nastiest find

**Pico v1 and Tailwind v4 both define `--spacing` on `:root`, with different
meanings.**

- Pico: `--spacing: 1rem` (its block-rhythm unit)
- Tailwind: `--spacing: 0.25rem` (its spacing *scale step*)

Every Tailwind spacing utility compiles to a `calc()` over that variable:

```css
.p-4{padding:calc(var(--spacing) * 4)}
```

Pico is unlayered, so **Pico's value wins**, and every Tailwind spacing utility
(`p-*`, `m-*`, `gap-*`, `w-*`, `h-*`) silently comes out **4× too large**.
Verified: `--spacing` resolves to `1rem`, and `p-4` computes to **80px**
instead of 20px. Nothing errors. Nothing warns.

It is **zero-sum** — measured both ways:

| config | Pico `main` padding | Tailwind `p-4` |
|---|---|---|
| Pico's `--spacing: 1rem` wins | 80px ✅ | 80px ❌ (want 20px) |
| Override to `0.25rem` | 20px ❌ (want 80px) | 20px ✅ |

Because Pico derives `--block-spacing-vertical: calc(var(--spacing) * 4)` from
the same variable. Only one framework can be correct — unless you reclaim the
variable *and* hand Pico back the values it derived (§ Verdict).

Pico's **form** sizing is unaffected: `--form-element-spacing-vertical` is a
literal, not derived. Inputs/buttons stayed at 15px padding / 62px height under
every configuration.

### ☠️ The trap that looks like it works: `@layer` + remote `@import`

The textbook fix is to put Pico in a cascade layer below `utilities`:

```css
@layer theme, base, pico, components, utilities;
@import url("https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css") layer(pico);
@import "tailwindcss";
```

**In `pnpm dev` this works.** Pico alive (`h1` 40px/700, button `rgb(1,114,173)`),
Tailwind's `text-3xl`/`font-bold` winning. A reader would ship it.

**In `pnpm build` the same source silently inverts.** Same file, `vite preview`:

| | dev | prod |
|---|---|---|
| `#submit-btn` background | `rgb(1,114,173)` ✅ | `rgba(0,0,0,0)` — **dead** |
| `h1` | 40px / 700 ✅ | 20px / 400 — preflight won |

`pnpm build` exits **0**. The page renders. The styling is just wrong.

**Mechanism** — layer order is fixed by **first registration**, and the build
**hoists every `@import` to the top of the file**, above the `@layer` statement
that was supposed to order them. Built output:

```css
@import "https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css" layer(pico);
@layer properties, theme, base, pico, components, utilities;   /* too late */
```

`layer(pico)` is now registered *first*, so `pico` is the **lowest** layer and
preflight beats it. (The default minifier also drops the `@layer` statement
outright — but that is a red herring: `--minify false` keeps the statement and
Pico is **still** dead, because the hoist already decided the order.)

And the obvious repair — ordering the `@import`s themselves so no statement rule
is needed — **fails differently**:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import url("...pico.min.css") layer(pico);      /* silently DELETED */
@import "tailwindcss/utilities.css" layer(utilities);
```

Pico vanishes entirely (`grep -ci pico` on the served CSS → **0**). Tailwind's
plugin expands its own `@import`s **in place**, so Pico's `@import` is no longer
at the top of the file, becomes invalid, and is dropped without a warning.

**Catch-22:** Pico's `@import` must be first to survive Tailwind's expansion —
but being first is exactly what makes its layer lowest, where preflight kills it.
**`@import url(pico) layer(pico)` cannot be made to work in both dev and prod.**

## Verdict on coexistence: possible, but it costs a hack

A Pico-and-Tailwind period **is** achievable. The configuration that is verified
correct in **both dev and prod** keeps Pico as an ordinary `<link>` and uses
Tailwind's `important` flag:

```css
@import "tailwindcss" important;

/* Pico v1 and Tailwind v4 both define --spacing on :root with different scales
   (Pico 1rem, Tailwind 0.25rem). Pico's <link> is unlayered so it beats
   Tailwind's @theme, and every Tailwind spacing utility comes out 4x too big.
   Reclaim it, then hand Pico back the rhythm it derived from it. */
:root {
  --spacing: 0.25rem;
}

body > main,
section,
article {
  --block-spacing-vertical: 4rem;
  --block-spacing-horizontal: 2rem;
}
```

`@import "tailwindcss" important;` marks every utility `!important`, which is how
a layered utility beats unlayered Pico:

```css
.p-4{padding:calc(var(--spacing) * 4)!important}
```

Measured identical in dev **and** prod: Pico's form/rhythm intact (`main` 80px,
input 15px/62px, button `rgb(1,114,173)`), Tailwind correct (`p-4` 20px, `p-2`
10px, `text-3xl` 37.5px, `font-bold` 700), and confirmed visually in Chrome:
Pico's form, buttons and headings render normally while the red/green probe
elements carry Tailwind's utilities.

**But weigh the cost before choosing gradual migration.** It buys a working app
at every step, and it charges:

- Every utility becomes `!important` — the escape hatch is gone for the whole
  coexistence period, and it must be un-done at the end.
- A hand-maintained `--spacing` reconciliation, with Pico's responsive
  block-spacing flattened to two literals (Pico varies them by breakpoint;
  the override does not).
- Two resets and two type scales in the page at once.

That is three concepts (cascade layers, `!important` utilities, variable
collision) that exist **only** to be deleted later — expensive for a doc whose
`--spacing` note alone needs a paragraph. The counterweight is the doc's rule
that every step ends with a working app.

**My read:** the "big-bang vs gradual" decision is now a real choice rather than
a blocked one, and the tie-breaker is pedagogical, not technical. A big-bang
swap in a single step teaches one thing (Tailwind). Coexistence teaches three
things the reader will throw away. Recommend big-bang, with this section kept as
the evidence for *why* the tempting middle path was rejected.

## 5. `pnpm build`, and Vitest reuse

**`pnpm build` (`tsc && vite build`) passes** — exit `0`, on the final config:

```
dist/index.html                 1.80 kB │ gzip: 0.80 kB
dist/assets/index-gTQQVQEt.css  5.89 kB │ gzip: 1.98 kB
dist/assets/index-CRBUoO0d.js   2.79 kB │ gzip: 1.15 kB
✓ built in 50ms
```

Pico stays a **CDN request** in the built output — Vite leaves remote `@import`
URLs alone and does not inline them, so `<link>`-ed Pico never enters the
bundle. (Only styling *we* author enters the build graph.)

**Vitest reuses this exact `vite.config.ts` — verified, not assumed.** I
installed `vitest` (resolved **4.1.10**, works with vite 8.1.5), put a
`console.log` inside `vite.config.ts`, and ran `npx vitest --run`:

```
### vite.config.ts WAS LOADED by: .../node_modules/vitest/vitest.mjs
 Test Files  1 passed (1)
```

The config was loaded **by the Vitest process**. Mechanism: Vitest is built on
Vite and reads the project's `vite.config.ts` by default; test settings go in a
`test: {}` key on the same object. So Phase 4 inherits the `tailwindcss()`
plugin with no extra wiring. Vitest and the throwaway test were **removed after
verifying** — the `package.json` diff in §1 is the real one.

## 6. Gotchas a v3 mental model walks into

1. **`npx tailwindcss init` does not exist.** No `tailwind.config.js` to generate.
2. **No PostCSS.** No `postcss.config.js`, no `autoprefixer`. `@tailwindcss/vite`
   is the whole chain. (A `@tailwindcss/postcss` package exists for non-Vite
   builds; not needed here — **not tested**.)
3. **No `content: []`.** Auto-detection; configuring it is the reflex to unlearn.
4. **`@theme`, not `theme.extend`.** Tokens are CSS custom properties.
5. **Everything Tailwind emits is layered.** This is the big one. In v3, utilities
   were effectively unlayered and beat a plain CSS framework. In v4 they lose to
   any unlayered rule — so **advice written for v3 + Pico is actively wrong here**.
6. **Utilities are `calc()` over CSS variables.** `.p-4` is
   `calc(var(--spacing) * 4)`, not a literal. That is what makes a variable-name
   collision with another framework silent and invisible.
7. **`tsc` never sees `vite.config.ts`** with this tsconfig (§2).
8. **Dev and prod disagree** on layer order for remote `@import`s (§4). `pnpm dev`
   is not proof; `pnpm build && pnpm preview` is.
9. **Vite picks a different port when one is taken.** Hit live: `--port 5199`
   logged `Port 5199 is in use, trying another one...` and served **5200**.
   Use `--strictPort` when a port matters. (Same family as the `port 5014` lesson.)

---

## Not verified

Flagged rather than implied, per the map's standing constraint.

- **`@tailwindcss/postcss`** — exists per the v4 ecosystem; never installed or run here.
- **Tailwind's `@theme` token system** beyond `--spacing`, `--color-red-500`,
  `--text-3xl`, `--font-weight-bold` resolving correctly. No custom `@theme` block
  was authored.
- **Browsers other than Chrome.** All computed-style measurements are Chrome via
  Playwright. Cascade layers are widely supported, but Safari/Firefox were not
  driven.
- **Pico v2.** Everything here is Pico **v1** (`@picocss/pico@1`), which is what
  the app pins. v2's variable names may differ — the `--spacing` collision was
  not re-checked against v2.
- **Whether the `!important` coexistence config survives a real Phase 3 migration.**
  It was verified against the current markup plus two probe elements, not against
  a half-migrated page.
- **Responsive fidelity of the `--block-spacing-*` override.** Pico varies those
  per breakpoint; the override pins two literals. Only the ≥1200px case
  (`--spacing * 4` = 80px) was matched. Narrower viewports were not measured.
- **`@import "tailwindcss" important;`** is verified *by observation* — it emits
  `!important` and behaves — but I did not locate it in first-party v4
  documentation to confirm it is a supported, stable API rather than an
  implementation detail.

## Reproducing

The spike branch carries the working coexistence config. Probe elements live in
`web/index.html` (`#tw-probe`, `#tw-btn-probe`) — **delete them**; they exist
only to make the cascade measurable.

```bash
cd web
pnpm install
pnpm dev                       # utilities visibly apply
pnpm build && pnpm preview     # and agree with dev
```
