using Budgex.Application.Interfaces;

namespace Budgex.Infrastructure.Email;

// För lokal utveckling: länken i ett återställningsmejl ska gå att öppna utan
// e-posttjänst, men den får aldrig hamna i loggen
public sealed class PickupDirectoryEmailSender(string directory) : IEmailSender
{
    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(directory);

        var file = Path.Combine(directory, $"{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid():N}.txt");
        var content = $"Till: {message.To}\nÄmne: {message.Subject}\n\n{message.Text}";

        await File.WriteAllTextAsync(file, content, cancellationToken);
    }
}
