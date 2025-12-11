var builder = DistributedApplication.CreateBuilder(args);

var cache = builder.AddRedis("cache");

var rabbitmq = builder.AddRabbitMQ("rabbitmq")
    .WithManagementPlugin();

var identityService = builder.AddProject<Projects.IdentityService>("identity-service")
    .WithHttpHealthCheck("/health");

var weatherService = builder.AddProject<Projects.AspireSample_ApiService>("weather-service")
    .WithHttpHealthCheck("/health")
    .WithReference(identityService);

var productService = builder.AddProject<Projects.Product>("product-service")
    .WithHttpHealthCheck("/health")
    .WithReference(identityService).WithReplicas(2);

// Order System - API Server (defined before apiGateway so it can be referenced)
var orderApiServer = builder.AddNpmApp("order-api", "../order-system", "start:api")
    .WithReference(rabbitmq)
    .WithReference(cache)
    .WaitFor(rabbitmq)
    .WaitFor(cache)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();
    //.WithReplicas(2);

var apiGateway = builder.AddProject<Projects.ApiGateway>("api-gateway")
    .WithHttpHealthCheck("/health")
    .WithExternalHttpEndpoints()
    .WithReference(identityService)
    .WithReference(weatherService)
    .WithReference(productService)
    .WithReference(orderApiServer)
    .WaitFor(identityService)
    .WaitFor(weatherService)
    .WaitFor(productService)
    .WaitFor(orderApiServer);

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
    .WithReference(orderApiServer)
    .WaitFor(apiGateway)
    .WithEnvironment("VITE_API_URL", apiGateway.GetEndpoint("http"))
    .WithEnvironment("VITE_ORDER_API_URL", orderApiServer.GetEndpoint("http"))
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

// Order System - Workers (multiple instances)
builder.AddNpmApp("order-worker-1", "../order-system", "start:worker")
    .WithReference(rabbitmq)
    .WaitFor(rabbitmq)
    .WaitFor(orderApiServer);

builder.AddNpmApp("order-worker-2", "../order-system", "start:worker")
    .WithReference(rabbitmq)
    .WaitFor(rabbitmq)
    .WaitFor(orderApiServer);

builder.AddNpmApp("order-worker-3", "../order-system", "start:worker")
    .WithReference(rabbitmq)
    .WaitFor(rabbitmq)
    .WaitFor(orderApiServer);

builder.Build().Run();
