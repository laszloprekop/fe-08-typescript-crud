# Roger's Retro Cars — Backend (C# Minimal API)

The backend half of the exercise: a small **C# Minimal API** exposing full CRUD
over a collection of cars, backed by SQLite. It's consumed by the
[TypeScript frontend](../web) over `fetch`.

This API is inherited unchanged from the earlier JavaScript exercise — the whole
point of Övning 8 is to rebuild the _frontend_ in TypeScript against the same
fixed backend.

## Stack

- **.NET 10** Minimal API
- **Entity Framework Core** with **SQLite** (`cars.db`, created and seeded on first run)
- **Swagger / Swashbuckle** for interactive API docs
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

| Method   | Route            | Description   | Success          |
| -------- | ---------------- | ------------- | ---------------- |
| `GET`    | `/api/cars`      | List all cars | `200 OK`         |
| `GET`    | `/api/cars/{id}` | Get one car   | `200 OK`         |
| `POST`   | `/api/cars`      | Create a car  | `201 Created`    |
| `PUT`    | `/api/cars/{id}` | Update a car  | `204 No Content` |
| `DELETE` | `/api/cars/{id}` | Delete a car  | `200 OK`         |

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
