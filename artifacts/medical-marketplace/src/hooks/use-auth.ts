import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { getToken, getStoredUser, clearAuth } from '@/lib/auth';

export function useAuth() {
  const token = getToken();
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ 
    query: { 
      enabled: !!token, 
      queryKey: getGetMeQueryKey() 
    } 
  });
  
  const logout = () => {
    clearAuth();
    setLocation('/login');
  };

  return { 
    user: user ?? getStoredUser(), 
    token, 
    isAuthenticated: !!token, 
    isLoading: !!token && isLoading, 
    logout 
  };
}