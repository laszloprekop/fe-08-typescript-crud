using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
// =========================================================
// 1. CORS-inställningar (så att JavaScript-kod kan anropa alla metoder)
// =========================================================
#region

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()  // Tillåter GET, POST, PUT, DELETE
              .AllowAnyHeader();
    });
});
#endregion

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// =========================================================
// 2. Registrera databaskontexten (SQLite)
// =========================================================
#region
builder.Services.AddDbContext<VehicleContext>(options =>
    options.UseSqlite("Data Source=cars.db"));
#endregion
var app = builder.Build();
// Aktivera Swagger-gränssnittet
app.UseSwagger();
app.UseSwaggerUI();
// Aktivera Cors
app.UseCors();
// =========================================================
// 3. SEEDING: Lägg till startdata om databasen är tom
// =========================================================
#region
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VehicleContext>();
    db.Database.EnsureCreated();

    if (!db.Cars.Any())
    {
        db.Cars.AddRange(
            new Car { Id = 1, Brand = "Volvo", Model = "244 GL", Year = 1978, Color = "Blå" },
            new Car { Id = 2, Brand = "Saab", Model = "900 T", Year = 1980, Color = "Röd" },
            new Car { Id = 3, Brand = "Volvo", Model = "245 GLT", Year = 1979, Color = "Vit" },
            new Car { Id = 4, Brand = "Opel", Model = "Ascona", Year = 1977, Color = "Brun" }
        );
        db.SaveChanges();
    }
}
#endregion
// =========================================================
// 4. API ENDPOINTS (FULL CRUD)
// =========================================================
#region
// READ ALL (GET /api/cars)
app.MapGet("/api/cars", async (VehicleContext db) =>
    Results.Ok(await db.Cars.ToListAsync()));

// READ ONE (GET /api/cars/{id})
app.MapGet("/api/cars/{id:int}", async (int id, VehicleContext db) =>
    await db.Cars.FindAsync(id) is Car bil
        ? Results.Ok(bil)
        : Results.NotFound($"Bil med ID {id} hittades inte."));

// CREATE (POST /api/cars) - Nivå 2
app.MapPost("/api/cars", async (Car bil, VehicleContext db) =>
{
    db.Cars.Add(bil);
    await db.SaveChangesAsync();
    return Results.Created($"/api/cars/{bil.Id}", bil);
});

// UPDATE (PUT /api/cars/{id}) - Nivå 4
app.MapPut("/api/cars/{id:int}", async (int id, Car bilInput, VehicleContext db) =>
{
    var car = await db.Cars.FindAsync(id);
    if (car is null) return Results.NotFound($"Bil med ID {id} hittades inte.");

    // Uppdatera egenskaperna
    car.Brand = bilInput.Brand;
    car.Model = bilInput.Model;
    car.Year = bilInput.Year;
    car.Color = bilInput.Color;

    await db.SaveChangesAsync();
    return Results.NoContent(); // Standardrespons vid lyckad uppdatering (204)
});

// DELETE (DELETE /api/cars/{id}) - Nivå 3
app.MapDelete("/api/cars/{id:int}", async (int id, VehicleContext db) =>
{
    var car = await db.Cars.FindAsync(id);
    if (car is null) return Results.NotFound($"Bil med ID {id} hittades inte.");

    db.Cars.Remove(car);
    await db.SaveChangesAsync();
    return Results.Ok(new { Message = $"Bilen med ID {id} har raderats." });
});
#endregion
app.Run();
// =========================================================
// 5. DATABASKONFIGURATION & MODELL
// =========================================================
#region
class VehicleContext : DbContext
{
    public VehicleContext(DbContextOptions<VehicleContext> options) : base(options) { }
    public DbSet<Car> Cars => Set<Car>();
}

class Car
{
    public int Id { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Color { get; set; } = string.Empty;
}
#endregion
