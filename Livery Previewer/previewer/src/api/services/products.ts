// ============================================================================
// PRODUCTS API SERVICE - Production-Ready Product Management
// ============================================================================

import { apiClient } from '../client';
import type {
  Product,
  ProductVariant,
  ProductFilters,
  PaginatedResponse,
  CreateProductRequest,
  UpdateProductRequest,
} from '../types';

export class ProductsService {
  /**
   * Get all products with optional filtering and pagination
   */
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.tag_id) params.append('tag_id', filters.tag_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.is_featured !== undefined) params.append('is_featured', filters.is_featured.toString());
    if (filters.is_new !== undefined) params.append('is_new', filters.is_new.toString());
    if (filters.is_on_sale !== undefined) params.append('is_on_sale', filters.is_on_sale.toString());
    if (filters.in_stock !== undefined) params.append('in_stock', filters.in_stock.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    return apiClient.get<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`);
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`);
  }

  /**
   * Get a single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    return apiClient.get<Product>(`/products/slug/${slug}`);
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/featured?limit=${limit}`);
  }

  /**
   * Get new products
   */
  async getNewProducts(limit: number = 8): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/new?limit=${limit}`);
  }

  /**
   * Get products on sale
   */
  async getSaleProducts(limit: number = 8): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/sale?limit=${limit}`);
  }

  /**
   * Search products
   */
  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  /**
   * Create a new product (admin only)
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>('/products', data);
  }

  /**
   * Update a product (admin only)
   */
  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    return apiClient.patch<Product>(`/products/${id}`, data);
  }

  /**
   * Delete a product (admin only)
   */
  async deleteProduct(id: string): Promise<void> {
    return apiClient.delete<void>(`/products/${id}`);
  }

  /**
   * Toggle product featured status (admin only)
   */
  async toggleFeatured(id: string, is_featured: boolean): Promise<Product> {
    return apiClient.patch<Product>(`/products/${id}/featured`, { is_featured });
  }

  /**
   * Toggle product active status (admin only)
   */
  async toggleActive(id: string, is_active: boolean): Promise<Product> {
    return apiClient.patch<Product>(`/products/${id}/active`, { is_active });
  }

  /**
   * Get product variants
   */
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return apiClient.get<ProductVariant[]>(`/products/${productId}/variants`);
  }

  /**
   * Add product variant (admin only)
   */
  async addProductVariant(productId: string, data: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>): Promise<ProductVariant> {
    return apiClient.post<ProductVariant>(`/products/${productId}/variants`, data);
  }

  /**
   * Update product variant (admin only)
   */
  async updateProductVariant(variantId: string, data: Partial<Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>>): Promise<ProductVariant> {
    return apiClient.patch<ProductVariant>(`/products/variants/${variantId}`, data);
  }

  /**
   * Delete product variant (admin only)
   */
  async deleteProductVariant(variantId: string): Promise<void> {
    return apiClient.delete<void>(`/products/variants/${variantId}`);
  }
}

// Singleton instance
export const productsService = new ProductsService();
