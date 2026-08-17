namespace Budgex.Domain.Entities;

public sealed class RefreshToken
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid UserId { get; init; }

    /// Aldrig själva token — bara dess SHA-256-avtryck. Ett läckt
    /// databasinnehåll går därför inte att logga in med.
    public required string TokenHash { get; init; }

    public required DateTime ExpiresAt { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; }
}
