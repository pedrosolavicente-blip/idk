// ============================================================================
// REVIEWS API SERVICE - Production-Ready Review Management
// ============================================================================

import { apiClient } from '../client';
import type {
  Review,
  ReviewVote,
  CreateReviewRequest,
  PaginatedResponse,
} from '../types';

export class ReviewsService {
  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: string, filters: { page?: number; limit?: number; status?: string } = {}): Promise<PaginatedResponse<Review>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    
    const query = params.toString();
    return apiClient.get<PaginatedResponse<Review>>(`/reviews/product/${productId}${query ? `?${query}` : ''}`);
  }

  /**
   * Get a single review by ID
   */
  async getReview(id: string): Promise<Review> {
    return apiClient.get<Review>(`/reviews/${id}`);
  }

  /**
   * Get user's reviews
   */
  async getUserReviews(filters: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Review>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    return apiClient.get<PaginatedResponse<Review>>(`/reviews/user${query ? `?${query}` : ''}`);
  }

  /**
   * Create a new review
   */
  async createReview(data: CreateReviewRequest): Promise<Review> {
    return apiClient.post<Review>('/reviews', data);
  }

  /**
   * Update a review
   */
  async updateReview(id: string, data: Partial<CreateReviewRequest>): Promise<Review> {
    return apiClient.patch<Review>(`/reviews/${id}`, data);
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string): Promise<void> {
    return apiClient.delete<void>(`/reviews/${id}`);
  }

  /**
   * Vote on a review (helpful/not helpful)
   */
  async voteReview(reviewId: string, isHelpful: boolean): Promise<ReviewVote> {
    return apiClient.post<ReviewVote>(`/reviews/${reviewId}/vote`, { is_helpful: isHelpful });
  }

  /**
   * Remove vote from a review
   */
  async removeVoteReview(reviewId: string): Promise<void> {
    return apiClient.delete<void>(`/reviews/${reviewId}/vote`);
  }

  /**
   * Approve a review (admin only)
   */
  async approveReview(id: string): Promise<Review> {
    return apiClient.patch<Review>(`/reviews/${id}/approve`, {});
  }

  /**
   * Reject a review (admin only)
   */
  async rejectReview(id: string): Promise<Review> {
    return apiClient.patch<Review>(`/reviews/${id}/reject`, {});
  }
}

// Singleton instance
export const reviewsService = new ReviewsService();
