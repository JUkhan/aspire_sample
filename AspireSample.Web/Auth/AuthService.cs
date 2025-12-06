using System.Net.Http.Json;

namespace AspireSample.Web.Auth;

public class AuthService
{
    private readonly HttpClient _httpClient;
    private readonly TokenStorageService _tokenStorage;
    private readonly CustomAuthStateProvider _authStateProvider;

    public AuthService(
        HttpClient httpClient,
        TokenStorageService tokenStorage,
        CustomAuthStateProvider authStateProvider)
    {
        _httpClient = httpClient;
        _tokenStorage = tokenStorage;
        _authStateProvider = authStateProvider;
    }

    public async Task<(bool Success, string? Error)> LoginAsync(string username, string password)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/auth/login", new LoginRequest(username, password));

            if (response.IsSuccessStatusCode)
            {
                var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
                if (auth != null)
                {
                    await _tokenStorage.SetAuthAsync(auth);
                    _authStateProvider.NotifyAuthenticationStateChanged();
                    return (true, null);
                }
            }

            return (false, "Invalid username or password");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }

    public async Task<(bool Success, string? Error)> RegisterAsync(string username, string email, string password)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/auth/register",
                new RegisterRequest(username, email, password));

            if (response.IsSuccessStatusCode)
            {
                var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
                if (auth != null)
                {
                    await _tokenStorage.SetAuthAsync(auth);
                    _authStateProvider.NotifyAuthenticationStateChanged();
                    return (true, null);
                }
            }

            if (response.StatusCode == System.Net.HttpStatusCode.Conflict)
            {
                return (false, "Username already exists");
            }

            return (false, "Registration failed");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }

    public async Task LogoutAsync()
    {
        await _tokenStorage.ClearAuthAsync();
        _authStateProvider.NotifyAuthenticationStateChanged();
    }
}
