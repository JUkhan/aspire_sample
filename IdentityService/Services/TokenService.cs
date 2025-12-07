using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using IdentityService.Models;
using Microsoft.IdentityModel.Tokens;

namespace IdentityService.Services;

public class TokenService
{
    private readonly IConfiguration _configuration;
    private readonly ConcurrentDictionary<string, RefreshToken> _refreshTokens = new();

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string AccessToken, string RefreshToken, DateTime Expiration) GenerateTokens(User user)
    {
        var (accessToken, expiration) = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken(user.Id);

        return (accessToken, refreshToken.Token, expiration);
    }

    private (string Token, DateTime Expiration) GenerateAccessToken(User user)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var issuer = _configuration["Jwt:Issuer"] ?? "IdentityService";
        var audience = _configuration["Jwt:Audience"] ?? "AspireSample";
        var expirationMinutes = int.Parse(_configuration["Jwt:AccessTokenExpirationMinutes"] ?? "15");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiration);
    }

    private RefreshToken GenerateRefreshToken(Guid userId)
    {
        var refreshTokenDays = int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7");

        var refreshToken = new RefreshToken
        {
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshTokenDays),
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

        _refreshTokens[refreshToken.Token] = refreshToken;

        return refreshToken;
    }

    public RefreshToken? ValidateRefreshToken(string token)
    {
        if (_refreshTokens.TryGetValue(token, out var refreshToken))
        {
            if (!refreshToken.IsRevoked && refreshToken.ExpiresAt > DateTime.UtcNow)
            {
                return refreshToken;
            }
        }
        return null;
    }

    public void RevokeRefreshToken(string token)
    {
        if (_refreshTokens.TryGetValue(token, out var refreshToken))
        {
            refreshToken.IsRevoked = true;
        }
    }

    public void RevokeAllUserTokens(Guid userId)
    {
        foreach (var token in _refreshTokens.Values.Where(t => t.UserId == userId))
        {
            token.IsRevoked = true;
        }
    }
}
