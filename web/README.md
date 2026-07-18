# Roger's Retro Cars — Frontend (TypeScript)

![Roger's Retro Cars in use — adding a car and being stopped by year validation, correcting it, generating a random car, editing a card in place, deleting one behind an inline confirmation, and switching to dark theme](../Docs/demo-600.gif)

A full-CRUD single-page app for managing a collection of classic cars, built in
**TypeScript** with **Vite**. This is the frontend half of the exercise; it talks
to the [C# Minimal API backend](../api) over `fetch`.

## About

This is the TypeScript solution to **Lexicon Övning 8 — _Cars med Typescript_**
(LTU 2026), presented as the **MVP + Beyond** lecture. The same Cars CRUD app is
built once in TypeScript against an unchanged C# Minimal API, growing through the
handout's three tasks:

| Level | Task        | Verb     | What it teaches                                    |
| ----- | ----------- | -------- | -------------------------------------------------- |
| 1     | Create a car| `POST`   | Typed `fetch`, reading a form via DOM casting      |
| 2     | Delete a car| `DELETE` | Event wiring without inline `onclick`, module scope|
| 3     | Edit a car  | `PUT`    | A typed `number \| null` edit-state, POST-or-PUT branch |

## Stack

- **TypeScript** — the whole point of the exercise
- **Vite** — dev server and build tool
- **[Tailwind CSS](https://tailwindcss.com/) v4** — via the Vite plugin, configured in CSS with OKLCH design tokens
- **pnpm** — package manager
- Plain `fetch` against the backend — no framework, no client library

## Getting started

**Prerequisites:** Node.js, [pnpm](https://pnpm.io/) (via `corepack enable pnpm`),
and the [backend API](../api) running.

```bash
# 1. Start the backend first (see ../api) — it serves http://localhost:5227/api/cars

# 2. Install dependencies
pnpm install

# 3. Point the app at your API
cp .env.example .env      # then edit VITE_API_URL if your backend differs

# 4. Run the dev server
pnpm dev                  # → http://localhost:5173
```

Other scripts:

```bash
pnpm build     # type-check with tsc, then bundle with Vite into dist/
pnpm preview   # serve the production build locally
```

## Project layout

```
web/
├── index.html        Entry point — carries the page markup; only #car-list is rendered from TS
└── src/
    ├── main.ts       Wires up form + list event listeners on load
    ├── api.ts        getCars / createCar / updateCar / deleteCar
    ├── types.ts      interface ICar
    ├── render.ts     DOM layer: buildCarCard, renderCars (HTML-escaped)
    └── style.css     Tailwind import, OKLCH design tokens, dark theme
```
