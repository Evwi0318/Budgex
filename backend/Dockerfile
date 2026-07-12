# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Budgex.sln .
COPY Budgex.Domain/Budgex.Domain.csproj Budgex.Domain/
COPY Budgex.Application/Budgex.Application.csproj Budgex.Application/
COPY Budgex.Infrastructure/Budgex.Infrastructure.csproj Budgex.Infrastructure/
COPY Budgex.Api/Budgex.Api.csproj Budgex.Api/
COPY Budgex.Tests/Budgex.Tests.csproj Budgex.Tests/

RUN dotnet restore Budgex.sln

COPY . .
RUN dotnet publish Budgex.Api/Budgex.Api.csproj -c Release -o /app/publish --no-restore

# Stage 2: Run
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "Budgex.Api.dll"]