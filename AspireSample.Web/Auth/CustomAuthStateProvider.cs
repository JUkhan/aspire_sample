using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;

namespace AspireSample.Web.Auth;

public class CustomAuthStateProvider : AuthenticationStateProvider
{
    private readonly TokenStorageService _tokenStorage;
    private ClaimsPrincipal _anonymous = new(new ClaimsIdentity());

    public CustomAuthStateProvider(TokenStorageService tokenStorage)
    {
        _tokenStorage = tokenStorage;
    }

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        try
        {
            var user = await _tokenStorage.GetUserAsync();

            if (user == null || user.Expiration < DateTime.UtcNow)
            {
                return new AuthenticationState(_anonymous);
            }

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, user.Username)
            };

            foreach (var role in user.Roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var identity = new ClaimsIdentity(claims, "jwt");
            var principal = new ClaimsPrincipal(identity);

            return new AuthenticationState(principal);
        }
        catch
        {
            return new AuthenticationState(_anonymous);
        }
    }

    public void NotifyAuthenticationStateChanged()
    {
        NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
    }
}
