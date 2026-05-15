// ============================================================================
// TAGS API SERVICE - Production-Ready Tag Management
// ============================================================================

import { apiClient } from '../client';
import type { Tag } from '../types';

export class TagsService {
  /**
   * Get all tags
   */
  async getTags(): Promise<Tag[]> {
    return apiClient.get<Tag[]>('/tags');
  }

  /**
   * Get a single tag by ID
   */
  async getTag(id: string): Promise<Tag> {
    return apiClient.get<Tag>(`/tags/${id}`);
  }

  /**
   * Get a single tag by slug
   */
  async getTagBySlug(slug: string): Promise<Tag> {
    return apiClient.get<Tag>(`/tags/slug/${slug}`);
  }

  /**
   * Create a new tag (admin only)
   */
  async createTag(data: Omit<Tag, 'id' | 'created_at'>): Promise<Tag> {
    return apiClient.post<Tag>('/tags', data);
  }

  /**
   * Update a tag (admin only)
   */
  async updateTag(id: string, data: Partial<Omit<Tag, 'id' | 'created_at'>>): Promise<Tag> {
    return apiClient.patch<Tag>(`/tags/${id}`, data);
  }

  /**
   * Delete a tag (admin only)
   */
  async deleteTag(id: string): Promise<void> {
    return apiClient.delete<void>(`/tags/${id}`);
  }
}

// Singleton instance
export const tagsService = new TagsService();
