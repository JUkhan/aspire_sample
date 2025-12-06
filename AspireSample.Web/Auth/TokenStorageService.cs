using Microsoft.AspNetCore.Components.Server.ProtectedBrowserStorage;

namespace AspireSample.Web.Auth;

public class TokenStorageService
{
    private readonly ProtectedSessionStorage _sessionStorage;
    private const string TokenKey = "authToken";
    private const string UserKey = "authUser";

    // In-memory cache to avoid prerendering issues
    private string? _cachedToken;
    private AuthResponse? _cachedUser;
    private bool _isInitialized;

    public TokenStorageService(ProtectedSessionStorage sessionStorage)
    {
        _sessionStorage = sessionStorage;
    }

    public async Task<string?> GetTokenAsync()
    {
        if (_isInitialized)
        {
            return _cachedToken;
        }

        try
        {
            var result = await _sessionStorage.GetAsync<string>(TokenKey);
            _cachedToken = result.Success ? result.Value : null;
            return _cachedToken;
        }
        catch (InvalidOperationException)
        {
            // Prerendering - JS interop not available
            return null;
        }
    }

    public async Task<AuthResponse?> GetUserAsync()
    {
        if (_isInitialized)
        {
            return _cachedUser;
        }

        try
        {
            var result = await _sessionStorage.GetAsync<AuthResponse>(UserKey);
            _cachedUser = result.Success ? result.Value : null;
            _isInitialized = true;
            return _cachedUser;
        }
        catch (InvalidOperationException)
        {
            // Prerendering - JS interop not available
            return null;
        }
    }

    public async Task SetAuthAsync(AuthResponse auth)
    {
        _cachedToken = auth.Token;
        _cachedUser = auth;
        _isInitialized = true;

        try
        {
            await _sessionStorage.SetAsync(TokenKey, auth.Token);
            await _sessionStorage.SetAsync(UserKey, auth);
        }
        catch (InvalidOperationException)
        {
            // Prerendering - will be set when interactive
        }
    }

    public async Task ClearAuthAsync()
    {
        _cachedToken = null;
        _cachedUser = null;

        try
        {
            await _sessionStorage.DeleteAsync(TokenKey);
            await _sessionStorage.DeleteAsync(UserKey);
        }
        catch (InvalidOperationException)
        {
            // Prerendering
        }
    }
}
