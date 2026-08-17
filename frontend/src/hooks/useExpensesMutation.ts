import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export function useAddExpenseMutation(monthId: string) {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      amount: number;
      category: string;
    }) => {
      const response = await request(
        `${import.meta.env.VITE_API_URL}/api/months/${monthId}/expenses`,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to add expense");
      }
      return response.json();
    },
    onSuccess: () => {
      // Prefixmatchning: ["month"] träffar ["month", year, month].
      // ["month", monthId] matchade aldrig — id:t är inte del av nyckeln.
      queryClient.invalidateQueries({ queryKey: ["month"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useDeleteExpenseMutation() {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const response = await request(
        `${import.meta.env.VITE_API_URL}/api/expenses/${expenseId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }
      // DELETE svarar 204 No Content — tom kropp, så .json() skulle kasta
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["month"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}
