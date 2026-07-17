using Budgex.Application.DTOs;
using Budgex.Application.Interfaces;
using Budgex.Domain.Entities;

namespace Budgex.Application.UseCases;

public sealed class GetOrCreateBudgetMonth(IBudgetMonthRepository repo)
{
    public async Task<BudgetMonthDto> ExecuteAsync(Guid userId, int year, int month)
    {
        var budgetMonth = await repo.GetByYearMonthAsync(userId, year, month);

        if (budgetMonth is null)
        {
            budgetMonth = new BudgetMonth
            {
                UserId = userId,
                Year = year,
                Month = month
            };
            await repo.AddAsync(budgetMonth);
            await repo.SaveChangesAsync();
        }

        return ToDto(budgetMonth);
    }

    public static BudgetMonthDto ToDto(BudgetMonth bm) => new(
        bm.Id,
        bm.Year,
        bm.Month,
        bm.IncomeSources.Select(i => new IncomeSourceDto(
            i.Id, i.Type.ToString(), i.Amount, i.LoanAmount)).ToList(),
        bm.Expenses.Select(e => new ExpenseDto(
            e.Id, e.Name, e.Amount, e.Category)).ToList(),
        bm.SavingsAccounts.Select(sa => new SavingsAccountDto(
            sa.Id, sa.Name, sa.Icon, sa.RuleType.ToString(), sa.RuleValue)).ToList()
    );
}