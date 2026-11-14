using System.Collections.Concurrent;
using Budgex.Application.Interfaces;

namespace Budgex.Tests.Integration;

public sealed class TestOutbox : IEmailSender
{
    public ConcurrentQueue<EmailMessage> Sent { get; } = new();

    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        Sent.Enqueue(message);
        return Task.CompletedTask;
    }
}
