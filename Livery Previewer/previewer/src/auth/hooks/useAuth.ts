// ============================================================================
// AUTH HOOKS - React Hooks for Authentication and Authorization
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { authService, type AuthContextValue } from '../services/auth';
import type { UserRole } from '../../api/types';

export function useAuth(): AuthContextValue {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [appUser, setAppUser] = useState<AuthContextValue['appUser']>(null);
  const [role, setRole] = useState<UserRole>('member');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    await authService.refreshUser();
    setUser(authService.getUser());
    setAppUser(authService.getAppUser());
    setRole(authService.getRole());
    setIsAuthenticated(authService.isAuthenticated());
    setIsAdmin(authService.isAdmin());
    setIsSuperAdmin(authService.isSuperAdmin());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async () => {
    await authService.login();
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setAppUser(null);
    setRole('member');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsSuperAdmin(false);
  }, []);

  const hasPermission = useCallback((permission: string) => {
    return authService.hasPermission(permission);
  }, []);

  const hasRole = useCallback((roles: UserRole | UserRole[]) => {
    return authService.hasRole(roles);
  }, []);

  return {
    user,
    appUser,
    role,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isLoading,
    login,
    logout,
    refreshUser: refreshAuth,
    hasPermission,
    hasRole,
  };
}

export function useRequireAuth(requiredRole?: UserRole): {
  isAuthorized: boolean;
  isLoading: boolean;
} {
  const { isAuthenticated, hasRole, isLoading } = useAuth();

  if (isLoading) {
    return { isAuthorized: false, isLoading: true };
  }

  if (!isAuthenticated) {
    return { isAuthorized: false, isLoading: false };
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return { isAuthorized: false, isLoading: false };
  }

  return { isAuthorized: true, isLoading: false };
}

export function useRequirePermission(permission: string): {
  isAuthorized: boolean;
  isLoading: boolean;
} {
  const { isAuthenticated, hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return { isAuthorized: false, isLoading: true };
  }

  if (!isAuthenticated) {
    return { isAuthorized: false, isLoading: false };
  }

  if (!hasPermission(permission)) {
    return { isAuthorized: false, isLoading: false };
  }

  return { isAuthorized: true, isLoading: false };
}
