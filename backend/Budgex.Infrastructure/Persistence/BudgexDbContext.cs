using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Persistence;

public class BudgexDbContext : DbContext
{
    public BudgexDbContext(DbContextOptions<BudgexDbContext> options) : base(options)
    {

    }
}