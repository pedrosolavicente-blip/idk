// ============================================================================
// CATEGORIES API SERVICE - Production-Ready Category Management
// ============================================================================

import { apiClient } from '../client';
import type { Category } from '../types';

export class CategoriesService {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories');
  }

  /**
   * Get active categories only
   */
  async getActiveCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories/active');
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: string): Promise<Category> {
    return apiClient.get<Category>(`/categories/${id}`);
  }

  /**
   * Get a single category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    return apiClient.get<Category>(`/categories/slug/${slug}`);
  }

  /**
   * Create a new category (admin only)
   */
  async createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    return apiClient.post<Category>('/categories', data);
  }

  /**
   * Update a category (admin only)
   */
  async updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>): Promise<Category> {
    return apiClient.patch<Category>(`/categories/${id}`, data);
  }

  /**
   * Delete a category (admin only)
   */
  async deleteCategory(id: string): Promise<void> {
    return apiClient.delete<void>(`/categories/${id}`);
  }
}

// Singleton instance
export const categoriesService = new CategoriesService();
