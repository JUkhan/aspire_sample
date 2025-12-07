namespace IdentityService.Models;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class RefreshToken
{
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsRevoked { get; set; }
}

public record RegisterRequest(string Username, string Email, string Password);
public record LoginRequest(string Username, string Password);
public record RefreshTokenRequest(string RefreshToken);
public record AuthResponse(string Token, string RefreshToken, DateTime Expiration, string Username, List<string> Roles);
