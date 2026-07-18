# Roger's Retro Cars — Backend (C# Minimal API)

The backend half of the exercise: a small **C# Minimal API** exposing full CRUD
over a collection of cars, backed by SQLite. It's consumed by the
[TypeScript frontend](../web) over `fetch`.

This API is inherited from the earlier JavaScript exercise — the whole point of
Övning 8 is to rebuild the _frontend_ in TypeScript against essentially the same
backend. The CRUD surface is untouched; the only later additions are a narrow
hardening pass (validation, error shape, and id handling) described under
[Validation and errors](#validation-and-errors) below.

## Stack

- **.NET 10** Minimal API
- **Entity Framework Core** with **SQLite** (`cars.db`, created and seeded on first run)
- **Swagger / Swashbuckle** for interactive API docs
- **Data annotations + `AddValidation()`** for server-side model validation,
  with **`AddProblemDetails()`** for a consistent error body
- CORS is wide open (any origin/method/header) so the dev frontend can call it

## Getting started

**Prerequisites:** the [.NET 10 SDK](https://dotnet.microsoft.com/download).

```bash
dotnet run --launch-profile http    # → http://localhost:5227
```

On first run the database is created and seeded with four cars. Swagger UI is at
`/swagger`.

### Resetting the database

Testing the frontend leaves junk cars behind, and there is no bulk-delete
endpoint. To get back to a clean, freshly seeded database, stop the API, delete
the SQLite file, and start it again:

```bash
rm cars.db          # from the api/ directory
dotnet run --launch-profile http
```

Startup calls `EnsureCreated()` and reseeds whenever the `Cars` table is empty,
so the schema and the original four cars — **with ids 1–4 restored** — come back
on the next run. There are no EF migrations to reapply, and `cars.db` is
gitignored, so deleting it leaves no trace in `git status`.

Launch profiles (see `Properties/launchSettings.json`):

| Profile | URL(s)                                             |
| ------- | -------------------------------------------------- |
| `http`  | `http://localhost:5227`                            |
| `https` | `https://localhost:7109` + `http://localhost:5227` |

Point the frontend's `VITE_API_URL` at whichever base URL you run.

## Endpoints

Base path: `/api/cars`

| Method   | Route            | Description   | Success          | Failure                             |
| -------- | ---------------- | ------------- | ---------------- | ----------------------------------- |
| `GET`    | `/api/cars`      | List all cars | `200 OK`         | —                                   |
| `GET`    | `/api/cars/{id}` | Get one car   | `200 OK`         | `404 Not Found`                     |
| `POST`   | `/api/cars`      | Create a car  | `201 Created`    | `400 Bad Request`                   |
| `PUT`    | `/api/cars/{id}` | Update a car  | `204 No Content` | `400 Bad Request`, `404 Not Found`  |
| `DELETE` | `/api/cars/{id}` | Delete a car  | `200 OK`         | `404 Not Found`                     |

Routes are constrained with `{id:int}`, so a non-numeric id never reaches a
handler — it simply fails to match and returns `404`.

## Validation and errors

Every write is validated **server-side**, independently of whatever the frontend
checks. The rules live as data annotations on the `Car` model:

| Field   | Rule                                     |
| ------- | ---------------------------------------- |
| `Brand` | required, 1–50 characters                |
| `Model` | required, 1–50 characters                |
| `Color` | required, 1–50 characters                |
| `Year`  | integer in the range 1886–2100           |

A violation returns `400 Bad Request` as a **problem details** document
(`application/problem+json`) with the offending fields under `errors` — the
standard ASP.NET validation-problem shape:

```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Year": ["Year must be between 1886 and next year."]
  }
}
```

**Ids are server-owned.** `POST` forces `Id = 0` before saving, so a client
cannot pick its own primary key by smuggling an `id` into the request body; the
database always assigns it.

> **Note:** the frontend applies a tighter year ceiling than the API does — it
> rejects anything past _next year_, while the API accepts up to 2100. The API's
> error text says "next year" but the `[Range]` attribute is the authority. The
> two are deliberately not identical: the client aims for a helpful message, the
> server for a hard backstop.

### Car shape

```json
{
  "id": 1,
  "brand": "Volvo",
  "model": "244 GL",
  "year": 1978,
  "color": "Blå"
}
```
