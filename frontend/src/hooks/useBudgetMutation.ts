import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Varje skrivning mot budgeten gör både månaden och summeringen gammal.
 * Regeln bor här i stället för i varje enskild mutation.
 *
 * Nycklarna matchas på prefix: ["month"] träffar ["month", year, month].
 */
/**
 * Skrivningar som bara bockar av något syns direkt i gränssnittet, och
 * rullas tillbaka om servern säger nej. En bock som väntar på nätet innan
 * den rör sig får hela appen att kännas trög.
 */
export function useOptimisticMutation<TData, TVariables>(
  queryKey: readonly unknown[],
  mutationFn: (variables: TVariables) => Promise<unknown>,
  update: (data: TData, variables: TVariables) => TData
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // En hämtning som redan är på väg skulle annars skriva över bocken
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TData>(queryKey);
      if (previous) {
        queryClient.setQueryData<TData>(queryKey, update(previous, variables));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useBudgetMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["month"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["savings"] });
    },
  });
}
