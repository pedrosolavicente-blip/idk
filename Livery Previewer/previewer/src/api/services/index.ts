// ============================================================================
// API SERVICES INDEX - Central Export Point for All API Services
// ============================================================================

export { apiClient } from '../client';
export type { ApiResponse, ApiError } from '../client';
export * from '../types';

export { productsService } from './products';
export { wishlistService } from './wishlist';
export { ordersService } from './orders';
export { categoriesService } from './categories';
export { tagsService } from './tags';
export { reviewsService } from './reviews';
