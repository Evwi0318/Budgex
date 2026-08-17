import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Varje skrivning mot budgeten gör både månaden och summeringen gammal.
 * Regeln bor här i stället för i varje enskild mutation.
 *
 * Nycklarna matchas på prefix: ["month"] träffar ["month", year, month].
 */
export function useBudgetMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["month"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}
