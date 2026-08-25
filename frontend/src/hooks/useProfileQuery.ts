import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export interface Profile {
  email: string;
  name: string | null;
}

export function useProfileQuery() {
  const { request } = useApi();

  return useQuery({
    queryKey: ["profile"],
    queryFn: () => request<Profile>("/api/profile"),
    retry: 1,
  });
}

export function useUpdateNameMutation() {
  const { request } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      request<Profile>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useChangePasswordMutation() {
  const { request } = useApi();

  return useMutation({
    mutationFn: (passwords: { currentPassword: string; newPassword: string }) =>
      request<null>("/api/profile/password", {
        method: "PUT",
        body: JSON.stringify(passwords),
      }),
  });
}

export function useDeleteAccountMutation() {
  const { request } = useApi();

  return useMutation({
    mutationFn: () => request<null>("/api/profile", { method: "DELETE" }),
  });
}
