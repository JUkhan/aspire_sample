var builder = DistributedApplication.CreateBuilder(args);

var cache = builder.AddRedis("cache");

var identityService = builder.AddProject<Projects.IdentityService>("identity-service")
    .WithHttpHealthCheck("/health");

var weatherService = builder.AddProject<Projects.AspireSample_ApiService>("weather-service")
    .WithHttpHealthCheck("/health")
    .WithReference(identityService);

var productService = builder.AddProject<Projects.Product>("product-service")
    .WithHttpHealthCheck("/health")
    .WithReference(identityService);

var apiGateway = builder.AddProject<Projects.ApiGateway>("api-gateway")
    .WithHttpHealthCheck("/health")
    .WithExternalHttpEndpoints()
    .WithReference(identityService)
    .WithReference(weatherService)
    .WithReference(productService)
    .WaitFor(identityService)
    .WaitFor(weatherService)
    .WaitFor(productService);

builder.AddProject<Projects.AspireSample_Web>("webfrontend")
    .WithExternalHttpEndpoints()
    .WithHttpHealthCheck("/health")
    .WithReference(cache)
    .WaitFor(cache)
    .WithReference(apiGateway)
    .WaitFor(apiGateway);

// React frontend
builder.AddNpmApp("react-frontend", "../react-frontend", "dev")
    .WithReference(apiGateway)
    .WaitFor(apiGateway)
    .WithEnvironment("VITE_API_URL", apiGateway.GetEndpoint("http"))
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
