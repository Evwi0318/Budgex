using Budgex.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Persistence;

public sealed class BudgexDbContext(DbContextOptions<BudgexDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<BudgetMonth> BudgetMonths => Set<BudgetMonth>();
    public DbSet<IncomeSource> IncomeSources => Set<IncomeSource>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<SavingsAccount> SavingsAccounts => Set<SavingsAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.HasMany(u => u.BudgetMonths)
             .WithOne()
             .HasForeignKey(bm => bm.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BudgetMonth>(e =>
        {
            e.HasKey(bm => bm.Id);
            e.HasIndex(bm => new { bm.UserId, bm.Year, bm.Month }).IsUnique();
            e.HasMany(bm => bm.IncomeSources)
             .WithOne()
             .HasForeignKey(i => i.BudgetMonthId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasMany(bm => bm.Expenses)
             .WithOne()
             .HasForeignKey(ex => ex.BudgetMonthId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasMany(bm => bm.SavingsAccounts)
             .WithOne()
             .HasForeignKey(sa => sa.BudgetMonthId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IncomeSource>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Amount).HasPrecision(18, 2);
            e.Property(i => i.LoanAmount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Expense>(e =>
        {
            e.HasKey(ex => ex.Id);
            e.Property(ex => ex.Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<SavingsAccount>(e =>
        {
            e.HasKey(sa => sa.Id);
            e.Property(sa => sa.RuleValue).HasPrecision(18, 2);
        });
    }
}