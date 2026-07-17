# .NET 10 Minimal API validation — mechanism and 400 shape

Research spike for [#5](https://github.com/laszloprekop/fe-08-typescript-crud/issues/5). Branch: `research/dotnet-validation`.

Everything below is marked **[RUN]** (verified by executing it on this machine) or **[DOCS]** (read in a primary
source, not independently executed). Nothing here is from memory.

## Environment

| Fact | Value | How |
|---|---|---|
| SDK | `10.0.103` | `dotnet --version` **[RUN]** |
| ASP.NET Core runtime | `10.0.3` | `dotnet --list-runtimes` **[RUN]** |
| Target framework | `net10.0` | `api/api.csproj` **[RUN]** |
| API port (http profile) | `5227` | `api/Properties/launchSettings.json` **[RUN]** |

The spike ran on **port 5230**, not 5227: a live `api` process from the main checkout was already listening on
5227 and being mutated by another session. 5227 is correct per `launchSettings.json`, but do not assume it is free.

## Answers

### 1. Does .NET 10 ship built-in validation for Minimal APIs? — Yes, opt-in.

`Microsoft.Extensions.Validation`, new in .NET 10. Enabled with one line **[DOCS]**:

```csharp
builder.Services.AddValidation();
```

It is **off by default** and **on-by-request**; it is supported for minimal APIs and Blazor, and *not* supported
by default in MVC **[DOCS]**. `AddValidation()` registers an endpoint filter per endpoint; a failure returns
400 **[DOCS]**.

**No `PackageReference` is needed** — the library and its Roslyn generator ship in the ASP.NET Core shared
framework **[RUN]**: `AddValidation()` compiled with zero package changes, and the generator is on disk at
`/usr/local/share/dotnet/packs/Microsoft.AspNetCore.App.Ref/10.0.3/analyzers/dotnet/cs/Microsoft.Extensions.Validation.ValidationsGenerator.dll`.

### 2. The failure response — RFC 9457 `application/problem+json`, but only if you ask.

The shape depends on whether `AddProblemDetails()` is also registered. Both captured **[RUN]**:

**`AddValidation()` alone** → `Content-Type: application/json; charset=utf-8`, and only two members:

```json
{"title":"One or more validation errors occurred.","errors":{"Brand":["The Brand field is required."]}}
```

**`AddValidation()` + `AddProblemDetails()`** → `Content-Type: application/problem+json`, full RFC 9457:

```json
{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Brand":["The Brand field is required."]},"traceId":"00-35b55ffb5370eba9b6af97ce6745881c-b0b9e94ea255aa81-00"}
```

Contract notes for the client:

- **`errors` keys are PascalCase** (`Brand`, `Year`) while the payload the client sends and receives is
  camelCase (`brand`, `year`). The error keys are C# property names, not JSON field names. A client mapping
  errors back onto form fields must case-fold. **[RUN]**
- `errors` values are **arrays** of strings — a field can carry several messages.
- `traceId` changes per request; a captured fixture must not assert on it.
- `type` points at RFC **9110** §15.5.1 (the HTTP 400 definition), not RFC 9457.
- Multiple invalid fields arrive in one response — the client can render them all at once **[RUN]**:

```json
{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Brand":["The Brand field is required."],"Model":["The Model field is required."],"Year":["The field Year must be between 1886 and 2100."],"Color":["The Color field is required."]},"traceId":"..."}
```

### 3. DataAnnotations vs manual checks vs endpoint filter — DataAnnotations.

Declarative and it works. The whole server-side rule set is attributes on the model **[RUN]**:

```csharp
public class Car
{
    public int Id { get; set; }

    [Required]
    [StringLength(60, MinimumLength = 1)]
    public string Brand { get; set; } = string.Empty;

    [Required]
    [StringLength(60, MinimumLength = 1)]
    public string Model { get; set; } = string.Empty;

    [Range(1886, 2100)]
    public int Year { get; set; }

    [Required]
    [StringLength(30, MinimumLength = 1)]
    public string Color { get; set; } = string.Empty;
}
```

The endpoint filter is what `AddValidation()` installs for you **[DOCS]** — writing one by hand is the
imperative version of the same thing and is not warranted here. Custom `ValidationAttribute` subclasses and
`IValidatableObject` exist for logic attributes can't express **[DOCS]**; not needed for `Car`.

### 4. Is it additive? — Yes.

Total change: **18 inserted lines in `api/Program.cs`, nothing else** — no csproj edit, no package, no endpoint
rewritten. All five endpoints re-verified against the exact committed state **[RUN]**:

| Request | Status |
|---|---|
| `GET /api/cars` | 200 |
| `GET /api/cars/1` | 200 |
| `POST /api/cars` (valid) | 201 |
| `PUT /api/cars/1` (valid) | 204 |
| `DELETE /api/cars/4` | 200 |

`PUT` gets validated **for free** — it binds the same `Car` type, so it returns the same 400 shape with no extra
code **[RUN]**.

### 5. The latent `Id` bug — validation does **not** make hardening free.

`MapPost` still honours a client-supplied `Id` after validation is on **[RUN]**:

```
POST {"id":999,"brand":"Volvo","model":"Hijack","year":1999,"color":"Red"}
→ 201 Created  {"id":999,...}
```

DataAnnotations can express "this value is out of range", not "this field must be absent" — `Id` is a valid
`int` either way. The answer is **no**: hardening costs a separate line. One line suffices, verified **[RUN]**:

```csharp
app.MapPost("/api/cars", async (Car bil, VehicleContext db) =>
{
    bil.Id = 0; // ignore any client-supplied Id; let the DB assign it
    db.Cars.Add(bil);
```

With it, `{"id":999,...}` → `201` with a DB-assigned `id`, and validation still fires **[RUN]**.

The bug is worse than "dormant": a client-supplied `Id` **poisons the autoincrement sequence**. Posting `id:999`
and then a normal car yielded `id:1000` **[RUN]**.

## The trap: `AddValidation()` fails silently on a non-`public` model

**The model type must be `public` or the source generator never discovers it, and `AddValidation()` silently
does nothing.** The vendored `class Car` is implicitly `internal` — so the obvious change (add attributes, call
`AddValidation()`) compiles, runs, emits no warning, and still returns `201 Created` for an empty brand.

Isolated with a 2×2, all four cells run **[RUN]**:

| `Car` accessibility | `InterceptorsNamespaces` set | `POST {"brand":""}` |
|---|---|---|
| `internal` | absent | **201 Created** — no validation |
| `internal` | present | **201 Created** — no validation |
| `public` | present | **400** |
| `public` | absent | **400** |

`public` is necessary and sufficient. Proof from the generator's own output: with `internal`, the emitted
`ValidatableInfoResolver.g.cs` contains **zero** occurrences of `Car` and its `TryGetValidatableTypeInfo`
returns `false` unconditionally; flipping to `public` populates it with `typeof(global::Car)` **[RUN]**.

Reproduce with:

```bash
dotnet build /p:EmitCompilerGeneratedFiles=true /p:CompilerGeneratedFilesOutputPath=obj/GX
# then read obj/GX/**/ValidatableInfoResolver.g.cs  (needs a clean obj/ — incremental builds skip generator output)
```

### `InterceptorsNamespaces` is **not** required — the blogs are stale

Widely-repeated blog guidance says you must add this to the csproj:

```xml
<InterceptorsNamespaces>$(InterceptorsNamespaces);Microsoft.AspNetCore.Http.Validation.Generated</InterceptorsNamespaces>
```

Two things are wrong with it on SDK 10.0.103 **[RUN]**:

1. **It is unnecessary.** With `public class Car` and no such property, validation returns 400 correctly. The
   generator emits an `[InterceptsLocation]` interceptor either way, and the runtime falls back to
   reflection-based resolution when it isn't wired.
2. **The namespace is wrong anyway.** The generated code declares
   `namespace Microsoft.Extensions.Validation.Generated` — not `Microsoft.AspNetCore.Http.Validation.Generated`.
   That is the pre-rename preview name; the assembly was renamed to `Microsoft.Extensions.Validation` before
   RTM.

Microsoft Learn does not mention `InterceptorsNamespaces` at all. Adding it is harmless but cargo-cult; it does
not belong in the doc.

## The lesson this supports

The API returned **`201 Created`** for every one of these before the change — empty brand, `year: 0`,
`year: 99999`, a 1 MB brand string, and an all-empty body **[RUN]**. A `<form required>` would have stopped none
of them, because `curl` never loaded the form. Same rule, two jobs: the client's copy is fast feedback, the
server's copy is the boundary. The 400 above is what the client must be ready to receive when its own check is
bypassed.

## Sources

Primary:

- [Validation in ASP.NET Core — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/validation/overview?view=aspnetcore-10.0) — `AddValidation`, source generator, `SkipValidationAttribute`, `ValidatableTypeAttribute`, not supported by default in MVC.
- [What's new in ASP.NET Core in .NET 10 — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0) — validation support for Minimal APIs, `DisableValidation`, 400 on failure, `AddValidation` stable/non-experimental.
- The installed SDK itself (10.0.103) — build output, generated `ValidatableInfoResolver.g.cs`, and live HTTP responses.

Secondary, and **contradicted** by the run above — recorded so the claim isn't re-imported:

- [Minimal API Validation in .NET 10 (remigiuszzalewski.com)](https://remigiuszzalewski.com/blog/minimal-api-validation-in-dotnet-10) and several similar posts — assert `InterceptorsNamespaces` with `Microsoft.AspNetCore.Http.Validation.Generated` is required.
