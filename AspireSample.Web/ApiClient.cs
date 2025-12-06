using System.Net;
using System.Net.Http.Headers;
using AspireSample.Web.Auth;

namespace AspireSample.Web;

public class ApiClient
{
    private readonly HttpClient _httpClient;
    private readonly TokenStorageService _tokenStorage;

    public ApiClient(HttpClient httpClient, TokenStorageService tokenStorage)
    {
        _httpClient = httpClient;
        _tokenStorage = tokenStorage;
    }

    private async Task AddAuthHeaderAsync()
    {
        try
        {
            var token = await _tokenStorage.GetTokenAsync();
            if (!string.IsNullOrEmpty(token))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }
        }
        catch (InvalidOperationException)
        {
            // Prerendering
        }
    }

    public async Task<(WeatherForecast[]? Data, bool Unauthorized)> GetWeatherAsync(int maxItems = 10, CancellationToken cancellationToken = default)
    {
        try
        {
            await AddAuthHeaderAsync();
            var response = await _httpClient.GetAsync("/api/weather/weatherforecast", cancellationToken);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                return (null, true);
            }

            response.EnsureSuccessStatusCode();

            List<WeatherForecast>? forecasts = null;
            await foreach (var forecast in response.Content.ReadFromJsonAsAsyncEnumerable<WeatherForecast>(cancellationToken))
            {
                if (forecasts?.Count >= maxItems)
                {
                    break;
                }
                if (forecast is not null)
                {
                    forecasts ??= [];
                    forecasts.Add(forecast);
                }
            }

            return (forecasts?.ToArray() ?? [], false);
        }
        catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
        {
            return (null, true);
        }
    }

    public async Task<(ProductData[]? Data, bool Unauthorized)> GetProductsAsync(int maxItems = 10, CancellationToken cancellationToken = default)
    {
        try
        {
            await AddAuthHeaderAsync();
            var response = await _httpClient.GetAsync("/api/products/product-list", cancellationToken);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                return (null, true);
            }

            response.EnsureSuccessStatusCode();

            List<ProductData>? products = null;
            await foreach (var data in response.Content.ReadFromJsonAsAsyncEnumerable<ProductData>(cancellationToken))
            {
                if (products?.Count >= maxItems)
                {
                    break;
                }
                if (data is not null)
                {
                    products ??= [];
                    products.Add(data);
                }
            }

            return (products?.ToArray() ?? [], false);
        }
        catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
        {
            return (null, true);
        }
    }
}

public record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

public record ProductData(string Name, int Price);
