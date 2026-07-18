# Cars CRUD — TypeScript

![Roger's Retro Cars in use — adding a car and being stopped by year validation, correcting it, generating a random car, editing a card in place, deleting one behind an inline confirmation, and switching to dark theme](./Docs/demo-600.gif)

A full-stack CRUD app for a collection of classic cars, built for **Lexicon
Övning 8 — _Cars med Typescript_** (LTU 2026). A TypeScript + Vite frontend
talks to a C# Minimal API over `fetch`.

Run the backend first, then the frontend.

- **[`api/`](./api)** — C# Minimal API (.NET 10, EF Core + SQLite). The backend.
- **[`web/`](./web)** — TypeScript + Vite single-page app. The frontend. See its
  [README](./web/README.md) for setup and the full walkthrough.

## Beyond the MVP

Past the handout's three tasks, the app is taken to something closer to
production-grade:

- **Tailwind CSS v4** with OKLCH design tokens and a dark theme.
- **Escaped output** — every interpolated value is HTML-escaped before it reaches
  `innerHTML`, closing a stored-XSS hole.
- **Validation on both sides** — a pure `validateCar` in the browser for fast
  feedback, [data annotations and problem-details responses](./api#validation-and-errors)
  on the server as the real backstop.
- **Guarded delete** — an inline, in-card confirmation instead of an immediate
  destructive click.
- **Toast feedback** — no silent successes and no swallowed fetch failures.
- **Vitest coverage** of the pure functions, plus a contract test pinning the
  API's response shape.
