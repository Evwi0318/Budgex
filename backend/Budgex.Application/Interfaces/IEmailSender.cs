namespace Budgex.Application.Interfaces;

public sealed record EmailMessage(string To, string Subject, string Text);

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
}
