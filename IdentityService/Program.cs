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
    var (accessToken, refreshToken, expiration) = tokenService.GenerateTokens(user);

    return Results.Ok(new AuthResponse(accessToken, refreshToken, expiration, user.Username, user.Roles));
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

    var (accessToken, refreshToken, expiration) = tokenService.GenerateTokens(user);

    return Results.Ok(new AuthResponse(accessToken, refreshToken, expiration, user.Username, user.Roles));
})
.WithName("Login")
.AllowAnonymous();

// Refresh token endpoint
app.MapPost("/auth/refresh", (RefreshTokenRequest request, UserStore userStore, TokenService tokenService) =>
{
    var storedToken = tokenService.ValidateRefreshToken(request.RefreshToken);

    if (storedToken is null)
    {
        return Results.Unauthorized();
    }

    var user = userStore.GetById(storedToken.UserId);

    if (user is null)
    {
        return Results.Unauthorized();
    }

    // Revoke old refresh token
    tokenService.RevokeRefreshToken(request.RefreshToken);

    // Generate new tokens
    var (accessToken, refreshToken, expiration) = tokenService.GenerateTokens(user);

    return Results.Ok(new AuthResponse(accessToken, refreshToken, expiration, user.Username, user.Roles));
})
.WithName("RefreshToken")
.AllowAnonymous();

// Logout endpoint (revoke refresh token)
app.MapPost("/auth/logout", (RefreshTokenRequest request, TokenService tokenService) =>
{
    tokenService.RevokeRefreshToken(request.RefreshToken);
    return Results.Ok(new { Message = "Logged out successfully" });
})
.WithName("Logout")
.AllowAnonymous();

// Validate token endpoint (for services to verify tokens)
app.MapGet("/auth/validate", () => Results.Ok(new { Valid = true, Timestamp = DateTime.UtcNow }))
    .WithName("ValidateToken")
    .RequireAuthorization();

app.MapDefaultEndpoints();

app.Run();
