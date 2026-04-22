// ─── PayPal Payment Service ──────────────────────────────────────────────────────

export interface PayPalOrder {
  id: string;
  status: 'CREATED' | 'APPROVED' | 'COMPLETED' | 'FAILED';
  amount: {
    currency_code: string;
    value: string;
  };
  payer?: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
  };
  purchase_units: Array<{
    reference_id: string;
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
  }>;
}

export interface PayPalConfig {
  clientId: string;
  currency: string;
  intent: 'CAPTURE' | 'AUTHORIZE';
}

class PayPalService {
  private config: PayPalConfig;
  private isLoaded = false;

  constructor(config: PayPalConfig) {
    this.config = config;
  }

  // Load PayPal SDK
  async loadSDK(): Promise<void> {
    if (this.isLoaded || (window as any).paypal) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${this.config.clientId}&currency=${this.config.currency}&intent=${this.config.intent}`;
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
      document.head.appendChild(script);
    });
  }

  // Create PayPal order
  async createOrder(cartItems: any[], total: number): Promise<string> {
    if (!this.isLoaded) {
      await this.loadSDK();
    }

    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            name: item.name,
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2),
            },
            quantity: item.quantity,
          })),
          amount: {
            currency_code: 'USD',
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2),
              },
            },
          },
        }),
      });

      const order = await response.json();
      return order.id;
    } catch (error) {
      console.error('PayPal order creation failed:', error);
      throw error;
    }
  }

  // Capture payment for approved order
  async captureOrder(orderID: string): Promise<PayPalOrder> {
    try {
      const response = await fetch(`/api/paypal/capture-order/${orderID}`, {
        method: 'POST',
      });

      const order = await response.json();
      return order;
    } catch (error) {
      console.error('PayPal capture failed:', error);
      throw error;
    }
  }

  // Render PayPal buttons
  renderButtons(
    container: HTMLElement,
    options: {
      createOrder: () => Promise<string>;
      onApprove: (data: { orderID: string }) => void;
      onError: (error: any) => void;
      onCancel?: () => void;
      style?: any;
    }
  ): void {
    if (!this.isLoaded) {
      throw new Error('PayPal SDK not loaded');
    }

    (window as any).paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 40,
        ...options.style,
      },
      createOrder: options.createOrder,
      onApprove: async (data: any) => {
        try {
          const order = await this.captureOrder(data.orderID);
          options.onApprove({ orderID: data.orderID });
        } catch (error) {
          options.onError(error);
        }
      },
      onError: options.onError,
      onCancel: options.onCancel,
    }).render(container);
  }

  // Mock implementation for development
  async createMockOrder(cartItems: any[], total: number): Promise<PayPalOrder> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      id: `MOCK-${Date.now()}`,
      status: 'CREATED',
      amount: {
        currency_code: 'USD',
        value: total.toFixed(2),
      },
      purchase_units: [{
        reference_id: `order-${Date.now()}`,
        amount: {
          currency_code: 'USD',
          value: total.toFixed(2),
        },
        description: 'Purchase from Livery Marketplace',
      }],
    };
  }

  async captureMockOrder(orderID: string): Promise<PayPalOrder> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      id: orderID,
      status: 'COMPLETED',
      amount: {
        currency_code: 'USD',
        value: '0.00',
      },
      payer: {
        name: {
          given_name: 'Test',
          surname: 'User',
        },
        email_address: 'test@example.com',
      },
      purchase_units: [{
        reference_id: `order-${Date.now()}`,
        amount: {
          currency_code: 'USD',
          value: '0.00',
        },
      }],
    };
  }
}

// Singleton instance
let paypalService: PayPalService | null = null;

export function getPayPalService(): PayPalService {
  if (!paypalService) {
    paypalService = new PayPalService({
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test-client-id',
      currency: 'USD',
      intent: 'CAPTURE',
    });
  }
  return paypalService;
}

export default getPayPalService;