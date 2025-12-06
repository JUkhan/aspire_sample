using System.Text;
using IdentityService.Models;
using IdentityService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddSingleton<UserStore>();
builder.Services.AddSingleton<TokenService>();

// Configure JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Register endpoint
app.MapPost("/auth/register", (RegisterRequest request, UserStore userStore, TokenService tokenService) =>
{
    if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { Error = "Username and password are required" });
    }

    if (userStore.UserExists(request.Username))
    {
        return Results.Conflict(new { Error = "Username already exists" });
    }

    var user = userStore.CreateUser(request.Username, request.Email, request.Password);
    var (token, expiration) = tokenService.GenerateToken(user);

    return Results.Ok(new AuthResponse(token, expiration, user.Username, user.Roles));
})
.WithName("Register")
.AllowAnonymous();

// Login endpoint
app.MapPost("/auth/login", (LoginRequest request, UserStore userStore, TokenService tokenService) =>
{
    var user = userStore.GetByUsername(request.Username);

    if (user is null || !userStore.ValidatePassword(user, request.Password))
    {
        return Results.Unauthorized();
    }

    var (token, expiration) = tokenService.GenerateToken(user);

    return Results.Ok(new AuthResponse(token, expiration, user.Username, user.Roles));
})
.WithName("Login")
.AllowAnonymous();

// Validate token endpoint (for services to verify tokens)
app.MapGet("/auth/validate", () => Results.Ok(new { Valid = true, Timestamp = DateTime.UtcNow }))
    .WithName("ValidateToken")
    .RequireAuthorization();

app.MapDefaultEndpoints();

app.Run();
