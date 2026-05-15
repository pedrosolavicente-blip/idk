// ============================================================================
// API TYPES - Production-Ready TypeScript Types for Shop API
// ============================================================================

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'member' | 'admin' | 'super_admin';

export interface User {
  id: string;
  discord_id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  email: string | null;
  role: UserRole;
  created_at: number;
  updated_at: number;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

// ============================================================================
// TAG TYPES
// ============================================================================

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  created_at: number;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface Product {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  description: string;
  category_id: string | null;
  price_gbp: number;
  original_price_gbp: number | null;
  currency: string;
  
  // Product flags
  is_featured: boolean;
  is_active: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  in_stock: boolean;
  stock_quantity: number;
  
  // Product details
  badge: string | null;
  specifications: Record<string, string> | null;
  shipping_info: string | null;
  return_policy: string | null;
  
  // Rating system
  rating: number;
  review_count: number;
  
  // Metadata
  image_urls: string[];
  thumbnail_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  
  // Timestamps
  created_at: number;
  updated_at: number;
  created_by: string | null;
  
  // Computed fields (from joins)
  category?: Category;
  tags?: Tag[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_gbp: number | null;
  in_stock: boolean;
  stock_quantity: number;
  image_url: string | null;
  sort_order: number;
  created_at: number;
}

// ============================================================================
// WISHLIST TYPES
// ============================================================================

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  created_at: number;
  product?: Product;
  variant?: ProductVariant;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'paypal' | 'roblox';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  
  // Order details
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_id: string | null;
  payment_status: PaymentStatus;
  
  // Pricing
  subtotal_gbp: number;
  shipping_gbp: number;
  tax_gbp: number;
  total_gbp: number;
  currency: string;
  
  // Shipping
  shipping_name: string | null;
  shipping_email: string | null;
  shipping_address: Record<string, unknown> | null;
  
  // Timestamps
  created_at: number;
  updated_at: number;
  paid_at: number | null;
  shipped_at: number | null;
  
  // Computed fields
  items?: OrderItem[];
  user?: User;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price_gbp: number;
  total_gbp: number;
  created_at: number;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  username: string;
  avatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  is_verified: boolean;
  helpful_count: number;
  status: ReviewStatus;
  created_at: number;
  updated_at: number;
  
  // Computed fields
  product?: Product;
  user?: User;
}

export interface ReviewVote {
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  category_id?: string;
  tag_id?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  is_featured?: boolean;
  is_new?: boolean;
  is_on_sale?: boolean;
  in_stock?: boolean;
  sort_by?: 'created_at' | 'price_gbp' | 'rating' | 'review_count' | 'name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateProductRequest {
  title: string;
  subtitle?: string;
  description: string;
  category_id?: string;
  price_gbp: number;
  original_price_gbp?: number;
  is_featured?: boolean;
  is_active?: boolean;
  is_new?: boolean;
  is_on_sale?: boolean;
  in_stock?: boolean;
  stock_quantity?: number;
  badge?: string;
  specifications?: Record<string, string>;
  shipping_info?: string;
  return_policy?: string;
  image_urls?: string[];
  thumbnail_url?: string;
  meta_title?: string;
  meta_description?: string;
  tag_ids?: string[];
  variants?: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface CreateOrderRequest {
  items: Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
  }>;
  shipping_name?: string;
  shipping_email?: string;
  shipping_address?: Record<string, unknown>;
}

export interface CreateReviewRequest {
  product_id: string;
  rating: number;
  title?: string;
  content: string;
}
