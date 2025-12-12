@echo off
echo Starting .NET Aspire with Python Demo
echo ========================================

REM Check prerequisites
echo Checking prerequisites...

where dotnet >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo .NET SDK not found. Please install .NET 8.0 or later.
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Python not found. Please install Python 3.11 or later.
    exit /b 1
)

echo Prerequisites OK
echo.

REM Install Python dependencies
echo Installing Python dependencies...
cd PythonApi
python -m pip install -r requirements.txt --quiet
cd ..
echo.

REM Restore .NET dependencies
echo Restoring .NET dependencies...
dotnet restore --verbosity quiet
echo.

REM Run Aspire AppHost
echo Starting Aspire Dashboard and Services...
echo.
echo Services will be available at:
echo   - Aspire Dashboard: Check console output for URL (usually http://localhost:15888)
echo   - Python API: http://localhost:8000
echo   - .NET API: http://localhost:5001
echo   - Web Frontend: http://localhost:5000
echo.
echo Press Ctrl+C to stop all services
echo.

dotnet run --project AspirePythonDemo.AppHost\AspirePythonDemo.AppHost.csproj
