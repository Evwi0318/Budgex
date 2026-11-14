using System.Net.Http.Json;
using Budgex.Application.Interfaces;

namespace Budgex.Infrastructure.Email;

// https://resend.com/docs/api-reference/emails/send-email
public sealed class ResendEmailSender(HttpClient http, EmailSettings settings) : IEmailSender
{
    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        var response = await http.PostAsJsonAsync("emails", new
        {
            from = settings.From,
            to = new[] { message.To },
            subject = message.Subject,
            text = message.Text,
        }, cancellationToken);

        response.EnsureSuccessStatusCode();
    }
}
