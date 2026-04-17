import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { getDashboardPath } from "@/lib/utils";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  departmentId: number | null;
  departmentSlug: string | null;
  status: string;
  avatarUrl?: string;
  employeeId?: string;
  phone?: string;
  address?: string;
  isClockedIn?: boolean;
  isOnline?: boolean;
}

export function useAuth() {
  const qc = useQueryClient();

  const { data: user, isPending: isLoading } = useQuery<AuthUser | null>({
    queryKey: ["auth", "me"],
    queryFn: () =>
      apiFetch<AuthUser>("/api/auth/me").catch(() => null),
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (creds: { email: string; password: string }) =>
      apiPost<{ user: AuthUser }>("/api/auth/login", creds),
    onSuccess: (data) => {
      qc.setQueryData(["auth", "me"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiPost("/api/auth/logout", {}),
    onSuccess: () => {
      qc.setQueryData(["auth", "me"], null);
      qc.clear();
    },
  });

  const dashboardPath = user ? getDashboardPath(user.role, user.departmentSlug) : "/login";

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    dashboardPath,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    loginError: loginMutation.error?.message,
  };
}
