# .NET Aspire with Python Integration Demo

This project demonstrates how to integrate Python services with .NET Aspire for orchestrating polyglot microservices applications.

## Architecture

```
┌─────────────────┐
│  Web Frontend   │ (.NET Blazor/Razor)
│     :5000       │
└────────┬────────┘
         │
         v
┌─────────────────┐      ┌──────────────┐
│  .NET API       │─────>│ Python API   │
│  Service :5001  │      │   :8000      │
└────────┬────────┘      └──────────────┘
         │                FastAPI + ML
         v
┌─────────────────┐
│  Redis Cache    │
│     :6379       │
└─────────────────┘
```

## Components

1. **AspirePythonDemo.AppHost** - Aspire orchestrator (development only)
2. **AspirePythonDemo.ApiService** - .NET 8 API that consumes Python service
3. **AspirePythonDemo.Web** - .NET 8 Web frontend
4. **PythonApi** - FastAPI service for data processing and ML predictions
5. **Redis** - Distributed cache

## Features

### Python Service (FastAPI)
- Data analysis endpoints (mean, median, std dev)
- ML prediction endpoint (mock model)
- Sample data generation
- OpenTelemetry instrumentation for Aspire observability

### .NET API Service
- Calls Python service for data processing
- Integrates with Redis cache
- Service discovery via Aspire
- OpenTelemetry tracing

## Prerequisites

- .NET 8.0 SDK or later
- Python 3.11 or later
- Docker Desktop (for Docker deployment)
- Visual Studio 2022 or VS Code with C# extension

## Running Locally with Aspire

### 1. Install Python Dependencies

```bash
cd PythonApi
pip install -r requirements.txt
cd ..
```

### 2. Run with Aspire Dashboard

```bash
# From solution root
dotnet run --project AspirePythonDemo.AppHost
```

This will:
- Start the Aspire dashboard
- Launch Redis container
- Start Python FastAPI service
- Start .NET API service
- Start .NET Web frontend
- Provide service discovery and observability

Access the Aspire dashboard at: `http://localhost:15888` (check console for exact URL)

### 3. Test the Services

**Python API directly:**
```bash
curl http://localhost:8000/generate-sample/10
curl http://localhost:8000/ml-predict/42.5
```

**.NET API calling Python:**
```bash
curl http://localhost:5001/weather
curl http://localhost:5001/predict/42.5
```

**Web Frontend:**
Open browser to `http://localhost:5000`

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Access Services

- Python API: http://localhost:8000
- .NET API: http://localhost:5001
- Web Frontend: http://localhost:5000
- Redis: localhost:6379
- OpenTelemetry Collector: localhost:4317 (gRPC), localhost:4318 (HTTP)

### Individual Service Builds

```bash
# Build Python service
docker build -t aspire-python-api ./PythonApi

# Build .NET API service
docker build -t aspire-dotnet-api -f AspirePythonDemo.ApiService/Dockerfile .

# Build Web frontend
docker build -t aspire-web -f AspirePythonDemo.Web/Dockerfile .
```

## API Endpoints

### Python Service (localhost:8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/analyze` | POST | Analyze data points (mean, median, etc.) |
| `/generate-sample/{count}` | GET | Generate sample data |
| `/ml-predict/{value}` | GET | ML prediction |
| `/docs` | GET | Swagger/OpenAPI docs |

### .NET API Service (localhost:5001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/weather` | GET | Get weather analysis from Python |
| `/predict/{value}` | GET | Get ML prediction via Python |
| `/analyze-custom` | POST | Custom data analysis |

## Aspire Features Demonstrated

1. **Service Discovery**: .NET services automatically discover Python service URLs
2. **Observability**: OpenTelemetry integration across .NET and Python
3. **Resource Management**: Redis container orchestration
4. **Development Dashboard**: Real-time monitoring and logs
5. **Health Checks**: Automatic health monitoring
6. **Polyglot Support**: Seamless .NET + Python integration

## Key Aspire Concepts

### AddPythonProject
```csharp
builder.AddPythonProject("python-api", "../PythonApi", "main.py")
    .WithHttpEndpoint(port: 8000, env: "PORT")
    .WithExternalHttpEndpoints();
```

### Service References
```csharp
var apiService = builder.AddProject<Projects.AspirePythonDemo_ApiService>("apiservice")
    .WithReference(cache)        // Injects Redis connection
    .WithReference(pythonApi)    // Injects Python API URL
```

### Configuration Injection
Aspire automatically injects service URLs as configuration:
```csharp
var pythonApiUrl = builder.Configuration["services:python-api:http:0"];
```

## Production Deployment

For production, consider:

1. **Azure Container Apps**: Aspire's primary deployment target
   ```bash
   azd init
   azd up
   ```

2. **Kubernetes**: Use manifest generation
   ```bash
   dotnet run --project AspirePythonDemo.AppHost --publisher manifest
   # Convert manifest to K8s manifests
   ```

3. **Docker Swarm**: Use docker-compose.yml with swarm mode

## Project Structure

```
AspirePythonDemo/
├── AspirePythonDemo.sln
├── AspirePythonDemo.AppHost/          # Aspire orchestrator
│   ├── Program.cs
│   └── *.csproj
├── AspirePythonDemo.ApiService/       # .NET API
│   ├── Program.cs
│   ├── Dockerfile
│   └── *.csproj
├── AspirePythonDemo.Web/              # .NET Web
│   ├── Program.cs
│   ├── Dockerfile
│   └── *.csproj
├── AspirePythonDemo.ServiceDefaults/  # Shared config
│   ├── Extensions.cs
│   └── *.csproj
├── PythonApi/                         # Python FastAPI
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── otel-collector-config.yaml
```

## Troubleshooting

### Python service not starting
- Ensure Python 3.11+ is installed
- Check dependencies: `pip install -r requirements.txt`
- Verify port 8000 is available

### Service discovery issues
- Check Aspire dashboard for service status
- Verify environment variables are injected
- Check container networking in Docker

### Redis connection errors
- Ensure Redis container is running
- Check connection string configuration
- Verify port 6379 is available

## Learn More

- [.NET Aspire Documentation](https://learn.microsoft.com/dotnet/aspire)
- [Aspire Python Support](https://learn.microsoft.com/dotnet/aspire/get-started/build-aspire-apps-with-python)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)

## License

MIT
