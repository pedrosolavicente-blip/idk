// ============================================================================
// PROTECTED ROUTE - Route Component with Role-Based Access Control
// ============================================================================

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRequireAuth, useRequirePermission } from '../hooks/useAuth';
import type { UserRole } from '../../api/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  if (requiredPermission) {
    const { isAuthorized, isLoading } = useRequirePermission(requiredPermission);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#000527]">
          <div className="w-8 h-8 border-2 border-[#D8FF63] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isAuthorized) {
      return fallback || <Navigate to="/shop" replace />;
    }

    return <>{children}</>;
  }

  if (requiredRole) {
    const { isAuthorized, isLoading } = useRequireAuth(requiredRole);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#000527]">
          <div className="w-8 h-8 border-2 border-[#D8FF63] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isAuthorized) {
      return fallback || <Navigate to="/shop" replace />;
    }

    return <>{children}</>;
  }

  // Just require authentication
  const { isAuthorized, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#000527]">
        <div className="w-8 h-8 border-2 border-[#D8FF63] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return fallback || <Navigate to="/shop" replace />;
  }

  return <>{children}</>;
}

interface AdminRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminRoute({ children, fallback }: AdminRouteProps) {
  return (
    <ProtectedRoute requiredRole="admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

interface SuperAdminRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SuperAdminRoute({ children, fallback }: SuperAdminRouteProps) {
  return (
    <ProtectedRoute requiredRole="super_admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}
