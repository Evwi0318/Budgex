import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export interface IncomeInput {
  salary: number;
  csnAmount: number;
  /** Lånedelen i kronor, läst rakt av från CSN-beslutet */
  csnLoanPart: number;
}

export function useIncomeMutation(monthId: string) {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (income: IncomeInput) => {
      const response = await request(
        `${import.meta.env.VITE_API_URL}/api/months/${monthId}/income`,
        {
          method: "PUT",
          body: JSON.stringify(income),
        },
      );

      if (!response.ok) {
        throw new Error("Kunde inte spara inkomsten.");
      }

      return response.json();
    },
    onSuccess: () => {
      // Månadens nyckel är ["month", year, month] — vi vet inte år och
      // månad här, så vi invaliderar hela "month"-grenen. React Query
      // matchar på prefix, så allt som börjar med "month" räknas som gammalt.
      queryClient.invalidateQueries({ queryKey: ["month"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}
