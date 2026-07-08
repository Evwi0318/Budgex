# Budgex — Entity-Relationship Diagram

The domain model for Budgex. A `User` owns many monthly budgets; each
`BudgetMonth` owns its income sources, expenses, and savings accounts.

```mermaid
erDiagram
    User ||--o{ BudgetMonth : has
    BudgetMonth ||--o{ IncomeSource : contains
    BudgetMonth ||--o{ Expense : contains
    BudgetMonth ||--o{ SavingsAccount : contains

    User {
        Guid Id PK
        string Email
        string PasswordHash
    }
    BudgetMonth {
        Guid Id PK
        Guid UserId FK
        int Year
        int Month
    }
    IncomeSource {
        Guid Id PK
        Guid BudgetMonthId FK
        IncomeType Type
        decimal Amount
        decimal LoanAmount "nullable, CSN only"
    }
    Expense {
        Guid Id PK
        Guid BudgetMonthId FK
        string Name
        decimal Amount
        string Category
    }
    SavingsAccount {
        Guid Id PK
        Guid BudgetMonthId FK
        string Name
        string Icon
        RuleType RuleType "Fixed | Percentage"
        decimal RuleValue
    }
```

## Notes

- **`LoanAmount`** is only set when `Type = Csn`. It is the loan portion read
  directly from the user's CSN decision and is never counted as spendable income.
- **`AllocationRule`** (Fixed / Percentage) is a _domain concept_ implemented with
  the strategy pattern, not a table. It is persisted as `RuleType` + `RuleValue`
  on `SavingsAccount` and reconstructed into a rule object in the domain layer.
