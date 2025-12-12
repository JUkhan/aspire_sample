#!/bin/bash

echo "🚀 Starting .NET Aspire with Python Demo"
echo "========================================"

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK not found. Please install .NET 8.0 or later."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.11 or later."
    exit 1
fi

echo "✓ Prerequisites OK"

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
cd PythonApi
python3 -m pip install -r requirements.txt --quiet
cd ..

# Restore .NET dependencies
echo ""
echo "📦 Restoring .NET dependencies..."
dotnet restore --verbosity quiet

# Run Aspire AppHost
echo ""
echo "🎯 Starting Aspire Dashboard and Services..."
echo ""
echo "Services will be available at:"
echo "  - Aspire Dashboard: Check console output for URL (usually http://localhost:15888)"
echo "  - Python API: http://localhost:8000"
echo "  - .NET API: http://localhost:5001"
echo "  - Web Frontend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

dotnet run --project AspirePythonDemo.AppHost/AspirePythonDemo.AppHost.csproj
