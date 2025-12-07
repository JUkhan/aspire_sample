using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using IdentityService.Models;

namespace IdentityService.Services;

public class UserStore
{
    private readonly ConcurrentDictionary<string, User> _users = new(StringComparer.OrdinalIgnoreCase);

    public UserStore()
    {
        // Seed a demo user
        var demoUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "demo",
            Email = "demo@example.com",
            PasswordHash = HashPassword("demo123"),
            Roles = ["User"],
            CreatedAt = DateTime.UtcNow
        };
        _users.TryAdd(demoUser.Username, demoUser);
    }

    public User? GetByUsername(string username)
    {
        _users.TryGetValue(username, out var user);
        return user;
    }

    public User? GetById(Guid id)
    {
        return _users.Values.FirstOrDefault(u => u.Id == id);
    }

    public bool UserExists(string username) => _users.ContainsKey(username);

    public User CreateUser(string username, string email, string password)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            PasswordHash = HashPassword(password),
            Roles = ["User"],
            CreatedAt = DateTime.UtcNow
        };

        if (!_users.TryAdd(username, user))
        {
            throw new InvalidOperationException("User already exists");
        }

        return user;
    }

    public bool ValidatePassword(User user, string password)
    {
        return user.PasswordHash == HashPassword(password);
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}
