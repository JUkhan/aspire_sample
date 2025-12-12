FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["AspirePythonDemo.Web/AspirePythonDemo.Web.csproj", "AspirePythonDemo.Web/"]
COPY ["AspirePythonDemo.ServiceDefaults/AspirePythonDemo.ServiceDefaults.csproj", "AspirePythonDemo.ServiceDefaults/"]
RUN dotnet restore "AspirePythonDemo.Web/AspirePythonDemo.Web.csproj"
COPY . .
WORKDIR "/src/AspirePythonDemo.Web"
RUN dotnet build "AspirePythonDemo.Web.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AspirePythonDemo.Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AspirePythonDemo.Web.dll"]
