import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import List
import random

# OpenTelemetry instrumentation for Aspire observability
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Configure OpenTelemetry
otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)
span_processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint))
trace.get_tracer_provider().add_span_processor(span_processor)

app = FastAPI(title="Python Data Processing API")

# Instrument FastAPI for tracing
FastAPIInstrumentor.instrument_app(app)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DataPoint(BaseModel):
    value: float
    timestamp: str

class AnalysisResult(BaseModel):
    mean: float
    median: float
    std_dev: float
    min: float
    max: float
    count: int

@app.get("/")
async def root():
    return {
        "service": "Python Data Processing API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_data(data: List[DataPoint]):
    """Analyze a list of data points and return statistics"""
    with tracer.start_as_current_span("analyze_data"):
        values = [point.value for point in data]
        
        if not values:
            return AnalysisResult(
                mean=0, median=0, std_dev=0, min=0, max=0, count=0
            )
        
        # Calculate statistics
        sorted_values = sorted(values)
        n = len(values)
        mean = sum(values) / n
        
        # Median
        if n % 2 == 0:
            median = (sorted_values[n//2 - 1] + sorted_values[n//2]) / 2
        else:
            median = sorted_values[n//2]
        
        # Standard deviation
        variance = sum((x - mean) ** 2 for x in values) / n
        std_dev = variance ** 0.5
        
        return AnalysisResult(
            mean=round(mean, 2),
            median=round(median, 2),
            std_dev=round(std_dev, 2),
            min=min(values),
            max=max(values),
            count=n
        )

@app.get("/generate-sample/{count}")
async def generate_sample_data(count: int):
    """Generate sample data points for testing"""
    with tracer.start_as_current_span("generate_sample_data"):
        if count > 1000:
            count = 1000  # Limit to prevent abuse
        
        from datetime import datetime, timedelta
        base_time = datetime.now()
        
        data = [
            DataPoint(
                value=round(random.uniform(10, 100), 2),
                timestamp=(base_time - timedelta(seconds=i)).isoformat()
            )
            for i in range(count)
        ]
        
        return {"data": data, "count": len(data)}

@app.get("/ml-predict/{value}")
async def ml_predict(value: float):
    """Simple prediction endpoint (mock ML model)"""
    with tracer.start_as_current_span("ml_predict"):
        # Mock ML prediction - in reality, you'd load a model here
        prediction = value * 1.5 + random.uniform(-5, 5)
        confidence = random.uniform(0.7, 0.99)
        
        return {
            "input": value,
            "prediction": round(prediction, 2),
            "confidence": round(confidence, 2),
            "model": "mock_linear_v1"
        }

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
