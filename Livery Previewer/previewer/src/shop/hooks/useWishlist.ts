// ============================================================================
// WISHLIST HOOK - Production-Ready Wishlist Management Hook
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../../api/services';
import type { WishlistItem } from '../../api/types';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await wishlistService.getWishlist();
      setWishlist(items);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wishlist');
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (productId: string, variantId?: string) => {
    setError(null);
    try {
      const item = await wishlistService.addToWishlist(productId, variantId);
      setWishlist(prev => [...prev, item]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to add to wishlist');
      console.error('Failed to add to wishlist:', err);
      return false;
    }
  }, []);

  const removeFromWishlist = useCallback(async (wishlistItemId: string) => {
    setError(null);
    try {
      await wishlistService.removeFromWishlist(wishlistItemId);
      setWishlist(prev => prev.filter(item => item.id !== wishlistItemId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to remove from wishlist');
      console.error('Failed to remove from wishlist:', err);
      return false;
    }
  }, []);

  const removeFromWishlistByProduct = useCallback(async (productId: string, variantId?: string) => {
    setError(null);
    try {
      await wishlistService.removeFromWishlistByProduct(productId, variantId);
      setWishlist(prev => prev.filter(
        item => !(item.product_id === productId && item.variant_id === variantId)
      ));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to remove from wishlist');
      console.error('Failed to remove from wishlist:', err);
      return false;
    }
  }, []);

  const isInWishlist = useCallback((productId: string, variantId?: string) => {
    return wishlist.some(
      item => item.product_id === productId && item.variant_id === variantId
    );
  }, [wishlist]);

  const toggleWishlist = useCallback(async (productId: string, variantId?: string) => {
    if (isInWishlist(productId, variantId)) {
      return await removeFromWishlistByProduct(productId, variantId);
    } else {
      return await addToWishlist(productId, variantId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlistByProduct]);

  const clearWishlist = useCallback(async () => {
    setError(null);
    try {
      await wishlistService.clearWishlist();
      setWishlist([]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to clear wishlist');
      console.error('Failed to clear wishlist:', err);
      return false;
    }
  }, []);

  const wishlistCount = wishlist.length;

  return {
    wishlist,
    wishlistCount,
    isLoading,
    error,
    addToWishlist,
    removeFromWishlist,
    removeFromWishlistByProduct,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    refreshWishlist: fetchWishlist,
  };
}
