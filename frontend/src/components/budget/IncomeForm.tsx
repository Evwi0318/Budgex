import { useState } from "react";
import { Card } from "../ui/Card";
import { Eyebrow } from "../ui/Eyebrow";
import { Button } from "../ui/Button";
import { NumberField } from "../ui/NumberField";
import { useIncomeMutation } from "../../hooks/useIncomeMutation";
import { formatKr } from "../../lib/format";
import type { IncomeSource } from "../../hooks/useMonthQuery";

interface IncomeFormProps {
  monthId: string;
  incomeSources: IncomeSource[];
}

export function IncomeForm({ monthId, incomeSources }: IncomeFormProps) {
  // API:t lagrar inkomster som en lista av källor. Formuläret vill ha
  // tre enskilda tal, så vi plockar ut dem här.
  const existingSalary =
    incomeSources.find((i) => i.type === "Salary")?.amount ?? 0;
  const existingCsn = incomeSources.find((i) => i.type === "Csn");

  const [salary, setSalary] = useState(existingSalary);
  const [csnAmount, setCsnAmount] = useState(existingCsn?.amount ?? 0);
  const [csnLoanPart, setCsnLoanPart] = useState(existingCsn?.loanAmount ?? 0);

  const saveIncome = useIncomeMutation(monthId);

  // Lånet är aldrig spenderbart. Resten av CSN är bidrag, och det är
  // bara bidraget som räknas in i "kvar att spendera".
  const csnGrant = csnAmount - csnLoanPart;
  const loanPartTooLarge = csnLoanPart > csnAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loanPartTooLarge) return;
    saveIncome.mutate({ salary, csnAmount, csnLoanPart });
  };

  return (
    <Card className="mb-6">
      <Eyebrow className="mb-4">Inkomst</Eyebrow>

      <form onSubmit={handleSubmit} className="space-y-4">
        <NumberField label="Lön" value={salary} onChange={setSalary} />

        <NumberField
          label="CSN totalt"
          value={csnAmount}
          onChange={setCsnAmount}
        />

        <NumberField
          label="Varav lån"
          value={csnLoanPart}
          onChange={setCsnLoanPart}
          hint={
            loanPartTooLarge
              ? undefined
              : `Bidrag: ${formatKr(csnGrant)} — det är den del du får spendera`
          }
        />

        {loanPartTooLarge && (
          <p className="text-sm text-[var(--color-danger)]">
            Lånedelen kan inte vara större än CSN totalt.
          </p>
        )}

        {saveIncome.isError && (
          <p className="text-sm text-[var(--color-danger)]">
            Kunde inte spara inkomsten. Försök igen.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={saveIncome.isPending || loanPartTooLarge}
        >
          {saveIncome.isPending ? "Sparar" : "Spara inkomst"}
        </Button>
      </form>
    </Card>
  );
}
