// ============================================================================
// WISHLIST API SERVICE - Production-Ready Wishlist Management
// ============================================================================

import { apiClient } from '../client';
import type { WishlistItem, PaginatedResponse } from '../types';

export class WishlistService {
  /**
   * Get user's wishlist
   */
  async getWishlist(): Promise<WishlistItem[]> {
    return apiClient.get<WishlistItem[]>('/wishlist');
  }

  /**
   * Get user's wishlist with pagination
   */
  async getWishlistPaginated(page: number = 1, limit: number = 20): Promise<PaginatedResponse<WishlistItem>> {
    return apiClient.get<PaginatedResponse<WishlistItem>>(`/wishlist?page=${page}&limit=${limit}`);
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(productId: string, variantId?: string): Promise<WishlistItem> {
    return apiClient.post<WishlistItem>('/wishlist', {
      product_id: productId,
      variant_id: variantId,
    });
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(wishlistItemId: string): Promise<void> {
    return apiClient.delete<void>(`/wishlist/${wishlistItemId}`);
  }

  /**
   * Remove product from wishlist by product ID
   */
  async removeFromWishlistByProduct(productId: string, variantId?: string): Promise<void> {
    const params = new URLSearchParams({ product_id: productId });
    if (variantId) params.append('variant_id', variantId);
    return apiClient.delete<void>(`/wishlist/by-product?${params.toString()}`);
  }

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(productId: string, variantId?: string): Promise<boolean> {
    const params = new URLSearchParams({ product_id: productId });
    if (variantId) params.append('variant_id', variantId);
    const result = await apiClient.get<{ in_wishlist: boolean }>(`/wishlist/check?${params.toString()}`);
    return result.in_wishlist;
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(): Promise<void> {
    return apiClient.delete<void>('/wishlist');
  }
}

// Singleton instance
export const wishlistService = new WishlistService();
