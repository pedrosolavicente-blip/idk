// ─── Roblox Payment Service ─────────────────────────────────────────────────────

export interface RobloxProduct {
  id: string;
  name: string;
  price: number; // In Robux
  description: string;
  imageUrl?: string;
}

export interface RobloxTransaction {
  id: string;
  productId: string;
  playerId: string;
  amount: number;
  currency: 'ROBUX';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface RobloxUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  robuxBalance: number;
}

class RobloxService {
  private isInitialized = false;
  private currentUser: RobloxUser | null = null;

  // Initialize Roblox SDK
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load Roblox SDK if not already loaded
      if (!(window as any).Roblox) {
        await this.loadRobloxSDK();
      }

      // Initialize authentication
      await this.authenticate();
      this.isInitialized = true;
    } catch (error) {
      console.error('Roblox SDK initialization failed:', error);
      throw error;
    }
  }

  // Load Roblox SDK
  private async loadRobloxSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://roblox.com/sdk/js/v1';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Roblox SDK'));
      document.head.appendChild(script);
    });
  }

  // Authenticate with Roblox
  private async authenticate(): Promise<void> {
    try {
      // In a real implementation, this would use Roblox's OAuth flow
      const authData = await (window as any).Roblox?.authenticate?.({
        clientId: (import.meta.env as any).VITE_ROBLOX_CLIENT_ID || 'test-client-id',
        scope: 'transactions.profile',
      });

      if (authData) {
        this.currentUser = {
          id: authData.userId || 'mock-user-id',
          username: authData.username || 'MockUser',
          displayName: authData.displayName || 'Mock User',
          avatarUrl: authData.avatarUrl,
          robuxBalance: authData.robuxBalance || 1000,
        };
      }
    } catch (error) {
      console.error('Roblox authentication failed:', error);
      // For development, create mock user
      this.currentUser = {
        id: 'mock-user-id',
        username: 'MockUser',
        displayName: 'Mock User',
        robuxBalance: 1000,
      };
    }
  }

  // Get current user
  getCurrentUser(): RobloxUser | null {
    return this.currentUser;
  }

  // Check if user has sufficient Robux balance
  hasSufficientBalance(amount: number): boolean {
    return this.currentUser ? this.currentUser.robuxBalance >= amount : false;
  }

  // Convert USD to Robux (mock conversion rate)
  convertUSDToRobux(usdAmount: number): number {
    // Mock conversion: 1 USD = 100 Robux
    return Math.round(usdAmount * 100);
  }

  // Convert Robux to USD
  convertRobuxToUSD(robuxAmount: number): number {
    // Mock conversion: 100 Robux = 1 USD
    return robuxAmount / 100;
  }

  // Create Roblox payment
  async createPayment(
    cartItems: any[],
    totalUSD: number
  ): Promise<RobloxTransaction> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const totalRobux = this.convertUSDToRobux(totalUSD);

    if (!this.hasSufficientBalance(totalRobux)) {
      throw new Error('Insufficient Robux balance');
    }

    try {
      // Create transaction via Roblox API
      const response = await fetch('/api/roblox/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          userId: this.currentUser?.id,
          items: cartItems.map(item => ({
            productId: item.id,
            name: item.name,
            price: this.convertUSDToRobux(item.price),
            quantity: item.quantity,
          })),
          totalAmount: totalRobux,
          currency: 'ROBUX',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Roblox payment');
      }

      const transaction = await response.json();
      return transaction;
    } catch (error) {
      console.error('Roblox payment creation failed:', error);
      throw error;
    }
  }

  // Process Roblox payment
  async processPayment(transactionId: string): Promise<RobloxTransaction> {
    try {
      const response = await fetch(`/api/roblox/process-payment/${transactionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to process Roblox payment');
      }

      const transaction = await response.json();
      return transaction;
    } catch (error) {
      console.error('Roblox payment processing failed:', error);
      throw error;
    }
  }

  // Get user's transaction history
  async getTransactionHistory(): Promise<RobloxTransaction[]> {
    try {
      const response = await fetch('/api/roblox/transactions', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return [];
    }
  }

  // Get authentication token
  private getAuthToken(): string {
    // In a real implementation, this would return the actual auth token
    return localStorage.getItem('roblox_auth_token') || 'mock-token';
  }

  // Mock payment for development
  async createMockPayment(
    cartItems: any[],
    totalUSD: number
  ): Promise<RobloxTransaction> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalRobux = this.convertUSDToRobux(totalUSD);

    return {
      id: `ROBLOX-${Date.now()}`,
      productId: cartItems[0]?.id || 'mock-product',
      playerId: this.currentUser?.id || 'mock-user-id',
      amount: totalRobux,
      currency: 'ROBUX',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      metadata: {
        cartItems: cartItems,
        totalUSD,
      },
    };
  }

  async processMockPayment(transactionId: string): Promise<RobloxTransaction> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      id: transactionId,
      productId: 'mock-product',
      playerId: this.currentUser?.id || 'mock-user-id',
      amount: 1000,
      currency: 'ROBUX',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  // Open Roblox purchase modal
  openPurchaseModal(transaction: RobloxTransaction): void {
    // In a real implementation, this would open Roblox's purchase modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80';
    modal.innerHTML = `
      <div class="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-md mx-4">
        <h3 class="text-lg font-bold text-white mb-4">Roblox Purchase</h3>
        <p class="text-zinc-300 mb-4">Confirm purchase of ${transaction.amount} Robux</p>
        <div class="flex gap-3">
          <button id="confirm-purchase" class="flex-1 py-2 bg-[#c4ff0d] text-black font-semibold rounded-lg hover:bg-[#d4ff3d] transition-colors">
            Confirm
          </button>
          <button id="cancel-purchase" class="flex-1 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const confirmBtn = modal.querySelector('#confirm-purchase');
    const cancelBtn = modal.querySelector('#cancel-purchase');

    confirmBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.processPayment(transaction.id);
    });

    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
}

// Singleton instance
let robloxService: RobloxService | null = null;

export function getRobloxService(): RobloxService {
  if (!robloxService) {
    robloxService = new RobloxService();
  }
  return robloxService;
}

export default RobloxService;
