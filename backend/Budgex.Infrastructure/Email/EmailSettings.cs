namespace Budgex.Infrastructure.Email;

public sealed class EmailSettings
{
    public const string SectionName = "Email";

    public string? ResendApiKey { get; init; }
    public string From { get; init; } = "Divunds <noreply@divunds.se>";

    /// Lokalt: mejlen sparas som filer här i stället för att skickas
    public string? PickupDirectory { get; init; }
}
