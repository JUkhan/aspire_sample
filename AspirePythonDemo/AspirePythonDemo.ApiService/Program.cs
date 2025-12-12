using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults & Aspire components
builder.AddServiceDefaults();
builder.AddRedisClient("cache");

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline
app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Get Python API URL from environment (injected by Aspire)
var pythonApiUrl = builder.Configuration["services:python-api:http:0"] 
                   ?? Environment.GetEnvironmentVariable("PythonApiUrl")
                   ?? "http://localhost:8000";

app.MapGet("/", () => new
{
    service = ".NET API Service",
    status = "running",
    pythonApiUrl = pythonApiUrl
});

app.MapGet("/weather", async (HttpClient httpClient) =>
{
    // Generate sample data using Python service
    var response = await httpClient.GetAsync($"{pythonApiUrl}/generate-sample/10");
    response.EnsureSuccessStatusCode();
    
    var jsonDoc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
    var data = jsonDoc.RootElement.GetProperty("data");
    
    // Analyze the data using Python service
    var analyzeResponse = await httpClient.PostAsJsonAsync(
        $"{pythonApiUrl}/analyze", 
        data
    );
    
    analyzeResponse.EnsureSuccessStatusCode();
    var analysis = await analyzeResponse.Content.ReadFromJsonAsync<JsonElement>();
    
    return Results.Ok(new
    {
        message = "Weather analysis from Python service",
        statistics = analysis,
        timestamp = DateTime.UtcNow
    });
});

app.MapGet("/predict/{value}", async (double value, HttpClient httpClient) =>
{
    // Call Python ML prediction endpoint
    var response = await httpClient.GetAsync($"{pythonApiUrl}/ml-predict/{value}");
    response.EnsureSuccessStatusCode();
    
    var prediction = await response.Content.ReadFromJsonAsync<JsonElement>();
    
    return Results.Ok(new
    {
        dotnetService = ".NET API Service",
        pythonPrediction = prediction,
        processedAt = DateTime.UtcNow
    });
});

app.MapPost("/analyze-custom", async (List<DataPoint> data, HttpClient httpClient) =>
{
    // Forward to Python service for analysis
    var response = await httpClient.PostAsJsonAsync($"{pythonApiUrl}/analyze", data);
    response.EnsureSuccessStatusCode();
    
    var analysis = await response.Content.ReadFromJsonAsync<AnalysisResult>();
    
    return Results.Ok(new
    {
        input = data,
        analysis = analysis,
        processedBy = new[] { ".NET", "Python" }
    });
});

app.Run();

// DTOs
record DataPoint(double Value, string Timestamp);
record AnalysisResult(double Mean, double Median, double StdDev, double Min, double Max, int Count);
