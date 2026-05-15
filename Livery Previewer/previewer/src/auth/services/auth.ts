// ============================================================================
// AUTH SERVICE - Production-Ready Authentication with Role-Based Access
// ============================================================================

import { validateStoredToken, clearAuth, type DiscordUser } from '../../lib/discordAuth';
import type { UserRole, User } from '../../api/types';

export interface AuthContextValue {
  user: DiscordUser | null;
  appUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<UserRole, number> = {
  member: 1,
  admin: 2,
  super_admin: 3,
};

// Permissions by role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  member: [
    'products.view',
    'products.search',
    'wishlist.view',
    'wishlist.add',
    'wishlist.remove',
    'orders.view_own',
    'orders.create',
    'reviews.view',
    'reviews.create_own',
  ],
  admin: [
    'products.view',
    'products.search',
    'products.create',
    'products.edit',
    'products.delete',
    'products.toggle_featured',
    'products.toggle_active',
    'categories.view',
    'categories.create',
    'categories.edit',
    'categories.delete',
    'tags.view',
    'tags.create',
    'tags.edit',
    'tags.delete',
    'wishlist.view',
    'wishlist.add',
    'wishlist.remove',
    'orders.view_own',
    'orders.create',
    'orders.view_all',
    'orders.update_status',
    'reviews.view',
    'reviews.create_own',
    'reviews.approve',
    'reviews.reject',
    'reviews.delete',
    'analytics.view',
  ],
  super_admin: [
    // All permissions
    '*',
  ],
};

export class AuthService {
  private currentUser: DiscordUser | null = null;
  private currentAppUser: User | null = null;
  private currentRole: UserRole = 'member';
  private isLoading = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.isLoading = true;
    try {
      const discordUser = await validateStoredToken();
      if (discordUser) {
        this.currentUser = discordUser;
        await this.fetchAppUser(discordUser.id);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.clearAuth();
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchAppUser(discordId: string): Promise<void> {
    try {
      const response = await fetch(`/api/shop/users/discord/${discordId}`);
      if (response.ok) {
        const appUser: User = await response.json();
        this.currentAppUser = appUser;
        this.currentRole = appUser.role;
      } else {
        // User doesn't exist in app database, create them
        await this.createAppUser(discordId);
      }
    } catch (error) {
      console.error('Failed to fetch app user:', error);
      // Fallback to member role
      this.currentRole = 'member';
    }
  }

  private async createAppUser(discordId: string): Promise<void> {
    try {
      const response = await fetch('/api/shop/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discord_id: discordId }),
      });
      if (response.ok) {
        const appUser: User = await response.json();
        this.currentAppUser = appUser;
        this.currentRole = appUser.role;
      }
    } catch (error) {
      console.error('Failed to create app user:', error);
    }
  }

  getUser(): DiscordUser | null {
    return this.currentUser;
  }

  getAppUser(): User | null {
    return this.currentAppUser;
  }

  getRole(): UserRole {
    return this.currentRole;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.currentRole === 'admin' || this.currentRole === 'super_admin';
  }

  isSuperAdmin(): boolean {
    return this.currentRole === 'super_admin';
  }

  hasPermission(permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[this.currentRole];
    
    // Super admin has all permissions
    if (permissions.includes('*')) return true;
    
    // Check exact permission match
    if (permissions.includes(permission)) return true;
    
    // Check wildcard permissions (e.g., 'products.*' matches 'products.create')
    const wildcardMatch = permissions.some(p => {
      if (p.endsWith('*')) {
        const prefix = p.slice(0, -1);
        return permission.startsWith(prefix);
      }
      return false;
    });
    
    return wildcardMatch;
  }

  hasRole(roles: UserRole | UserRole[]): boolean {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(this.currentRole);
  }

  hasRoleOrHigher(requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[this.currentRole] >= ROLE_HIERARCHY[requiredRole];
  }

  async login(): Promise<void> {
    // This should trigger Discord OAuth flow
    const { redirectToDiscordLogin } = await import('../../lib/discordAuth');
    await redirectToDiscordLogin();
  }

  logout(): void {
    this.clearAuth();
  }

  async refreshUser(): Promise<void> {
    await this.initialize();
  }

  private clearAuth(): void {
    clearAuth();
    this.currentUser = null;
    this.currentAppUser = null;
    this.currentRole = 'member';
  }
}

// Singleton instance
export const authService = new AuthService();
