import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { getDashboardRoute } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'customer' | 'store_owner' | 'delivery_partner' | 'admin';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    // Admin routes send unauthenticated users to the dedicated admin portal
    return <Redirect to={role === 'admin' ? '/admin/login' : '/login'} />;
  }

  // Authenticated but wrong role
  if (role && user && user.role !== role) {
    // Non-admin trying to reach admin dashboard → home page (not their dashboard)
    if (role === 'admin') {
      return <Redirect to="/" />;
    }
    // Admin trying to reach a non-admin dashboard → their own dashboard
    if (user.role === 'admin') {
      return <Redirect to="/dashboard/admin" />;
    }
    // Wrong non-admin role → their correct dashboard
    return <Redirect to={getDashboardRoute(user.role)} />;
  }

  return <>{children}</>;
}
