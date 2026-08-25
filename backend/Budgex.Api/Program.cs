using Budgex.Api.Endpoints;
using Budgex.Application.Interfaces;
using Budgex.Application.UseCases;
using Budgex.Infrastructure.Identity;
using Budgex.Infrastructure.Persistence;
using Budgex.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        // Vite byter port så fort 5173 är upptagen. I utvecklingsläge
        // godtas därför vilken loopback-adress som helst; i produktion
        // gäller bara de riktiga värdarna.
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(origin => new Uri(origin).IsLoopback);
        }
        else
        {
            policy.WithOrigins(
                "https://budgex-omega.vercel.app",
                "https://budgex-p0e4qmp6v-wilbardevan03-1705s-projects.vercel.app");
        }

        policy.AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<BudgexDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(JwtSettings.SectionName));

var jwtSettings = builder.Configuration
    .GetSection(JwtSettings.SectionName)
    .Get<JwtSettings>()
    ?? throw new InvalidOperationException("Jwt settings not found in configuration.");

// HMAC-SHA256 vill ha minst 256 bitar. En kortare nyckel går att signera
// med men är gissningsbar, och då är hela inloggningen värdelös.
if (Encoding.UTF8.GetByteCount(jwtSettings.SecretKey) < 32)
{
    throw new InvalidOperationException("Jwt:SecretKey must be at least 32 bytes.");
}

// Nyckeln i appsettings.Development.json ligger i git. Om den någonsin
// följer med till en riktig miljö ska appen vägra starta, inte signera
// riktiga sessioner med en publik hemlighet.
if (!builder.Environment.IsDevelopment() && jwtSettings.SecretKey.StartsWith("dev-secret"))
{
    throw new InvalidOperationException(
        "The development Jwt:SecretKey must not be used outside Development.");
}

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<BudgexDbContext>();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
        };
    });

builder.Services.AddAuthorization();

// Bakom Azures ingress är RemoteIpAddress proxyns adress. Utan detta
// hamnar alla användare i samma hink och begränsningen nedan blir
// verkningslös — den skulle strypa alla så fort någon en gör mycket.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Containern nås bara genom ingressen, så det finns ingen väg förbi
    // den där någon kan sätta sin egen X-Forwarded-For
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// Två lager mot lösenordsgissning: kontolåset stoppar angrepp mot ett
// enskilt konto, takgränserna stoppar volymen från en avsändare
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy(AuthEndpoints.RateLimitPolicy, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(1),
                PermitLimit = 60
            }));

    // Taket för allt annat. Inloggade endpoints är ägarskapsfiltrerade, så
    // det här handlar om last: ett konto ska inte kunna sänka tjänsten
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(1),
                PermitLimit = 300
            }));
});

builder.Services.AddProblemDetails();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISavingsRepository, SavingsRepository>();
builder.Services.AddScoped<IEntryRepository, EntryRepository>();

builder.Services.AddScoped<GetMonthPlan>();
builder.Services.AddScoped<GetSavingsMonth>();

var app = builder.Build();

// Först i kedjan — allt efter den ska se användarens adress och schema,
// inte proxyns
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Bara i utvecklingsläge. En container som ändrar schemat vid start är
    // fel i produktion — där körs migreringarna som ett eget steg.
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<BudgexDbContext>()
        .Database.MigrateAsync();
}
else
{
    // Utvecklingsläget behåller sin felsida. I produktion svarar vi med
    // ProblemDetails i stället, så ingen stacktrace kan följa med ut.
    app.UseExceptionHandler();
    app.UseHsts();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => new { status = "healthy" });
app.MapAuthEndpoints();
app.MapEntryEndpoints();
app.MapSavingsEndpoints();
app.MapProfileEndpoints();

app.Run();

public partial class Program { }
