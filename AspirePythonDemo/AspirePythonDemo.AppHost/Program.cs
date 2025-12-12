var builder = DistributedApplication.CreateBuilder(args);

// Add Redis cache
var cache = builder.AddRedis("cache");

// Add Python FastAPI service
var pythonApi = builder.AddPythonProject("python-api", "../PythonApi", "main.py")
    .WithHttpEndpoint(port: 8000, env: "PORT")
    .WithExternalHttpEndpoints();

// Add .NET API service that depends on Python service
var apiService = builder.AddProject<Projects.AspirePythonDemo_ApiService>("apiservice")
    .WithReference(cache)
    .WithReference(pythonApi)
    .WithEnvironment("PythonApiUrl", pythonApi.GetEndpoint("http"));

// Add .NET Web frontend
builder.AddProject<Projects.AspirePythonDemo_Web>("webfrontend")
    .WithExternalHttpEndpoints()
    .WithReference(cache)
    .WithReference(apiService);

builder.Build().Run();
