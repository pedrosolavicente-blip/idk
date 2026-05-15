// ============================================================================
// ORDERS API SERVICE - Production-Ready Order Management
// ============================================================================

import { apiClient } from '../client';
import type {
  Order,
  OrderItem,
  CreateOrderRequest,
  PaginatedResponse,
} from '../types';

export class OrdersService {
  /**
   * Get all orders for current user
   */
  async getOrders(filters: { page?: number; limit?: number; status?: string } = {}): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    
    const query = params.toString();
    return apiClient.get<PaginatedResponse<Order>>(`/orders${query ? `?${query}` : ''}`);
  }

  /**
   * Get a single order by ID
   */
  async getOrder(id: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/${id}`);
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/number/${orderNumber}`);
  }

  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/orders', data);
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return apiClient.patch<Order>(`/orders/${id}/status`, { status });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(id: string): Promise<Order> {
    return apiClient.post<Order>(`/orders/${id}/cancel`, {});
  }

  /**
   * Get order items
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return apiClient.get<OrderItem[]>(`/orders/${orderId}/items`);
  }
}

// Singleton instance
export const ordersService = new OrdersService();
