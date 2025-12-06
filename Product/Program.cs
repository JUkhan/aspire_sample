using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults & Aspire client integrations.
builder.AddServiceDefaults();

// Add services to the container.
builder.Services.AddProblemDetails();

// Configure JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ThisIsASecretKeyForDevelopment1234567890!@#$";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "IdentityService",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AspireSample",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}



var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/product-list", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new Product
        (
            summaries[Random.Shared.Next(summaries.Length)],
            Random.Shared.Next(10, 155)
        ))
        .ToArray();
    return forecast;
})
.WithName("GetProductList")
.RequireAuthorization();

app.MapDefaultEndpoints();

app.Run();

internal record Product(string Name, int Price);

