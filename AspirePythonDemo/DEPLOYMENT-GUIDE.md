# .NET Aspire + Python Integration Guide

## Quick Start

### Option 1: Development (Aspire Dashboard)
```bash
# Linux/Mac
./start.sh

# Windows
start.bat
```

### Option 2: Docker Deployment
```bash
docker-compose up -d
```

## Architecture Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Aspire AppHost                        │
│              (Development Orchestrator)                 │
│  - Service Discovery                                    │
│  - Observability Dashboard                              │
│  - Resource Management                                  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        v            v            v
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Redis      │ │  Python API  │ │  .NET API    │
│   Cache      │ │   (FastAPI)  │ │   Service    │
│   :6379      │ │    :8000     │ │    :5001     │
└──────────────┘ └──────┬───────┘ └──────┬───────┘
                        │                 │
                        │  HTTP Calls     │
                        └────────┬────────┘
                                 │
                        ┌────────v────────┐
                        │   .NET Web      │
                        │   Frontend      │
                        │    :5000        │
                        └─────────────────┘
```

## Service Communication

### 1. Aspire Service Discovery (Development)
```csharp
// AppHost automatically injects URLs
var pythonApi = builder.AddPythonProject("python-api", ...)
var apiService = builder.AddProject<ApiService>("apiservice")
    .WithReference(pythonApi); // Injects URL automatically
```

Configuration injected:
```json
{
  "services": {
    "python-api": {
      "http": ["http://localhost:8000"]
    }
  }
}
```

### 2. Docker Service Discovery (Production)
```yaml
services:
  apiservice:
    environment:
      - services__python-api__http__0=http://python-api:8000
```

## Python Service Features

### Data Analysis
```python
POST /analyze
{
  "data": [
    {"value": 10.5, "timestamp": "2024-01-01T00:00:00"},
    {"value": 20.3, "timestamp": "2024-01-01T00:01:00"}
  ]
}

Response:
{
  "mean": 15.4,
  "median": 15.4,
  "std_dev": 6.93,
  "min": 10.5,
  "max": 20.3,
  "count": 2
}
```

### ML Prediction
```python
GET /ml-predict/42.5

Response:
{
  "input": 42.5,
  "prediction": 65.23,
  "confidence": 0.87,
  "model": "mock_linear_v1"
}
```

## .NET API Integration

```csharp
// Calling Python service from .NET
app.MapGet("/weather", async (HttpClient httpClient) =>
{
    // Get sample data from Python
    var response = await httpClient.GetAsync(
        $"{pythonApiUrl}/generate-sample/10"
    );
    
    // Analyze with Python service
    var analyzeResponse = await httpClient.PostAsJsonAsync(
        $"{pythonApiUrl}/analyze",
        data
    );
    
    return Results.Ok(analysis);
});
```

## Observability with OpenTelemetry

Both .NET and Python services are instrumented with OpenTelemetry:

### Python
```python
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
FastAPIInstrumentor.instrument_app(app)
```

### .NET
```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => {
        tracing.AddAspNetCoreInstrumentation()
               .AddHttpClientInstrumentation();
    });
```

View traces in Aspire Dashboard or export to:
- Jaeger
- Zipkin
- Application Insights
- Prometheus

## Deployment Options

### 1. Azure Container Apps (Recommended for Aspire)
```bash
azd init
azd up
```

### 2. Kubernetes
```bash
# Generate manifest
dotnet run --project AppHost --publisher manifest

# Convert to K8s (use aspirate or custom tool)
aspirate generate --output-format k8s
kubectl apply -f ./manifests
```

### 3. Docker Compose (Simple)
```bash
docker-compose up -d
```

### 4. Docker Swarm
```bash
docker swarm init
docker stack deploy -c docker-compose.yml aspire
```

## Environment Variables

### Python Service
```bash
PORT=8000
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

### .NET Services
```bash
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__cache=cache:6379
services__python-api__http__0=http://python-api:8000
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

## Testing the Integration

### 1. Health Checks
```bash
curl http://localhost:8000/health  # Python
curl http://localhost:5001/health  # .NET API
curl http://localhost:5000/health  # Web
```

### 2. Python Direct
```bash
curl http://localhost:8000/generate-sample/5
```

### 3. .NET calling Python
```bash
curl http://localhost:5001/weather
curl http://localhost:5001/predict/42.5
```

### 4. End-to-End
```bash
curl -X POST http://localhost:5001/analyze-custom \
  -H "Content-Type: application/json" \
  -d '[
    {"value": 10.5, "timestamp": "2024-01-01T00:00:00"},
    {"value": 20.3, "timestamp": "2024-01-01T00:01:00"}
  ]'
```

## Common Issues

### Port Conflicts
```bash
# Check if ports are in use
netstat -an | grep "8000\|5000\|5001\|6379"

# Change ports in docker-compose.yml or AppHost
```

### Python Dependencies
```bash
cd PythonApi
pip install -r requirements.txt
# or
python -m pip install -r requirements.txt
```

### Service Discovery Not Working
- Check Aspire dashboard for service URLs
- Verify environment variables are injected
- Check container networking: `docker network inspect aspire-network`

## Scaling Services

### Docker Compose
```bash
docker-compose up -d --scale python-api=3
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-api
spec:
  replicas: 3
```

## Monitoring

Access monitoring endpoints:
- Aspire Dashboard: http://localhost:15888
- Python API Docs: http://localhost:8000/docs
- .NET API Swagger: http://localhost:5001/swagger
- Prometheus Metrics: http://localhost:8889

## Next Steps

1. Add PostgreSQL database to Python service
2. Implement real ML models (scikit-learn, PyTorch)
3. Add authentication/authorization
4. Implement message queue (RabbitMQ, Kafka)
5. Add distributed tracing dashboard
6. Implement CI/CD pipeline

## Resources

- [Aspire Documentation](https://learn.microsoft.com/dotnet/aspire)
- [Aspire Python Support](https://learn.microsoft.com/dotnet/aspire/get-started/build-aspire-apps-with-python)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenTelemetry](https://opentelemetry.io/)
