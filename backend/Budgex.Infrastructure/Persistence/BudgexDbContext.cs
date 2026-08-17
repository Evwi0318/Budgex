using Budgex.Domain.Entities;
using Budgex.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Budgex.Infrastructure.Persistence;

public sealed class BudgexDbContext(DbContextOptions<BudgexDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<User> DomainUsers => Set<User>();
    public DbSet<BudgetMonth> BudgetMonths => Set<BudgetMonth>();
    public DbSet<IncomeSource> IncomeSources => Set<IncomeSource>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<SavingsAccount> SavingsAccounts => Set<SavingsAccount>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Domänen sätter alltid sina egna Id:n (Guid.NewGuid() i entiteterna).
        // Utan detta tror EF att nycklarna är databas-genererade, och en ny
        // entitet som upptäcks via en navigation med satt Id spåras då som
        // Modified i stället för Added → UPDATE mot en rad som inte finns
        // → DbUpdateConcurrencyException.
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Id).ValueGeneratedNever();
            e.HasIndex(u => u.Email).IsUnique();
            e.HasMany(u => u.BudgetMonths)
             .WithOne()
             .HasForeignKey(bm => bm.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BudgetMonth>(e =>
        {
            e.HasKey(bm => bm.Id);
            e.Property(bm => bm.Id).ValueGeneratedNever();
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
            e.Property(i => i.Id).ValueGeneratedNever();
            e.Property(i => i.Amount).HasPrecision(18, 2);
            e.Property(i => i.LoanAmount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Expense>(e =>
        {
            e.HasKey(ex => ex.Id);
            e.Property(ex => ex.Id).ValueGeneratedNever();
            e.Property(ex => ex.Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<SavingsAccount>(e =>
        {
            e.HasKey(sa => sa.Id);
            e.Property(sa => sa.Id).ValueGeneratedNever();
            e.Property(sa => sa.RuleValue).HasPrecision(18, 2);
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasKey(rt => rt.Id);
            e.Property(rt => rt.Id).ValueGeneratedNever();
            e.HasIndex(rt => rt.TokenHash).IsUnique();
            e.HasOne<User>()
             .WithMany()
             .HasForeignKey(rt => rt.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}