namespace AspireSample.Web.Auth;

public record LoginRequest(string Username, string Password);
public record RegisterRequest(string Username, string Email, string Password);
public record AuthResponse(string Token, DateTime Expiration, string Username, List<string> Roles);
