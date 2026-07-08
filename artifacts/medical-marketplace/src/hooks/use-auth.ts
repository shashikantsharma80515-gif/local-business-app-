import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { getToken, getStoredUser, clearAuth } from '@/lib/auth';
import { useLocation } from 'wouter';

export function useAuth() {
  const token = getToken();
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
    }
  });

  const resolvedUser = user ?? getStoredUser();

  const logout = () => {
    const isAdmin = resolvedUser?.role === 'admin';
    clearAuth();
    // Admin always returns to the admin portal, not the public login page
    setLocation(isAdmin ? '/admin/login' : '/login');
  };

  return {
    user: resolvedUser,
    token,
    isAuthenticated: !!token,
    isLoading: !!token && isLoading,
    logout,
  };
}
