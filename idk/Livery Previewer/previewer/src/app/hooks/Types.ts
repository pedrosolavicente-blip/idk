// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  image?: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  description: string;
  features: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  badge?: string;
  variants?: ProductVariant[];
  specifications?: Record<string, string>;
  shippingInfo?: string;
  returnPolicy?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  inStock: boolean;
}

export interface AdminStats {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  pendingReviews: number;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  verified: boolean;
  helpful: number;
  content: string;
}