using Budgex.Application.DTOs;
using Budgex.Application.Interfaces;
using Budgex.Domain.Allocation;
using Budgex.Domain.Budget;
using Budgex.Domain.Entities;

namespace Budgex.Application.UseCases;

public sealed class GetBudgetSummary(IBudgetMonthRepository repo)
{
    public async Task<SummaryDto?> ExecuteAsync(Guid budgetMonthId, Guid userId)
    {
        var bm = await repo.GetByIdAsync(budgetMonthId, userId);
        if (bm is null) return null;

        var salary = bm.IncomeSources
            .Where(i => i.Type == IncomeType.Salary)
            .Sum(i => i.Amount);

        var csn = bm.IncomeSources
            .FirstOrDefault(i => i.Type == IncomeType.Csn);

        var expenses = bm.Expenses.Sum(e => e.Amount);

        var rules = bm.SavingsAccounts.Select<SavingsAccount, IAllocationRule>(sa =>
            sa.RuleType == RuleType.Fixed
                ? new FixedRule(sa.RuleValue)
                : new PercentageRule(sa.RuleValue));

        var result = BudgetCalculator.Calculate(
            salary, csn?.Amount ?? 0m, csn?.LoanAmount ?? 0m, expenses, rules);

        return new SummaryDto(
            result.DisposableIncome,
            expenses,
            result.TotalSavings,
            result.SafeToSpend,
            result.TransferToBank);
    }
}
