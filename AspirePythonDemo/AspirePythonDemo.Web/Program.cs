var builder = WebApplication.CreateBuilder(args);

// Add service defaults & Aspire components
builder.AddServiceDefaults();
builder.AddRedisClient("cache");

builder.Services.AddRazorPages();
builder.Services.AddHttpClient();

var app = builder.Build();

app.MapDefaultEndpoints();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.MapRazorPages();

// Simple API endpoint for the frontend
app.MapGet("/api/demo", async (HttpClient httpClient) =>
{
    var apiServiceUrl = builder.Configuration["services:apiservice:http:0"] ?? "http://localhost:5000";
    
    try
    {
        var response = await httpClient.GetAsync($"{apiServiceUrl}/weather");
        response.EnsureSuccessStatusCode();
        var data = await response.Content.ReadAsStringAsync();
        return Results.Ok(data);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error calling API service: {ex.Message}");
    }
});

app.Run();
