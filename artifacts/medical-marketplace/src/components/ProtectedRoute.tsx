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

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (role && user && user.role !== role) {
    return <Redirect to={getDashboardRoute(user.role)} />;
  }

  return <>{children}</>;
}