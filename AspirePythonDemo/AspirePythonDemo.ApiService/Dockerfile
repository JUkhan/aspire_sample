FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["AspirePythonDemo.ApiService/AspirePythonDemo.ApiService.csproj", "AspirePythonDemo.ApiService/"]
COPY ["AspirePythonDemo.ServiceDefaults/AspirePythonDemo.ServiceDefaults.csproj", "AspirePythonDemo.ServiceDefaults/"]
RUN dotnet restore "AspirePythonDemo.ApiService/AspirePythonDemo.ApiService.csproj"
COPY . .
WORKDIR "/src/AspirePythonDemo.ApiService"
RUN dotnet build "AspirePythonDemo.ApiService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AspirePythonDemo.ApiService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AspirePythonDemo.ApiService.dll"]
