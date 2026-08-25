namespace Budgex.Domain.Entities;

public sealed class User
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Email { get; set; }
    public string? Name { get; set; }
    public required string PasswordHash { get; set; }
}