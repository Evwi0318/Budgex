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
      queryClient.invalidateQueries({ queryKey: ["month", monthId] });
      queryClient.invalidateQueries({ queryKey: ["summary", monthId] });
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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["month"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}
