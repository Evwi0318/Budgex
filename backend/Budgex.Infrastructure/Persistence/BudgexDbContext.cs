using Budgex.Domain.Common;
using Budgex.Domain.Entities;
using Budgex.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Budgex.Infrastructure.Persistence;

public sealed class BudgexDbContext(DbContextOptions<BudgexDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<User> DomainUsers => Set<User>();
    public DbSet<BudgetMonth> BudgetMonths => Set<BudgetMonth>();
    public DbSet<IncomeSource> IncomeSources => Set<IncomeSource>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<SavingsAccount> SavingsAccounts => Set<SavingsAccount>();
    public DbSet<Entry> Entries => Set<Entry>();
    public DbSet<EntryMonthState> EntryMonthStates => Set<EntryMonthState>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var monthKey = new ValueConverter<MonthKey, string>(
            key => key.ToString(),
            value => MonthKey.Parse(value));

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

        modelBuilder.Entity<Entry>(e =>
        {
            e.HasKey(entry => entry.Id);
            e.Property(entry => entry.Id).ValueGeneratedNever();
            e.Property(entry => entry.Name).HasMaxLength(40);
            e.Property(entry => entry.Amount).HasPrecision(18, 2);
            e.Property(entry => entry.Kind).HasConversion<string>().HasMaxLength(16);
            e.Property(entry => entry.Category).HasConversion<string>().HasMaxLength(32);
            e.Property(entry => entry.From).HasConversion(monthKey).HasMaxLength(7);
            e.Property(entry => entry.To).HasConversion(monthKey).HasMaxLength(7);
            e.HasIndex(entry => entry.UserId);
            e.HasOne<User>()
             .WithMany()
             .HasForeignKey(entry => entry.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EntryMonthState>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).ValueGeneratedNever();
            e.Property(s => s.Amount).HasPrecision(18, 2);
            e.Property(s => s.Month).HasConversion(monthKey).HasMaxLength(7);
            e.HasIndex(s => new { s.EntryId, s.Month }).IsUnique();
            e.HasOne<Entry>()
             .WithMany()
             .HasForeignKey(s => s.EntryId)
             .OnDelete(DeleteBehavior.Cascade);
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