/**
 * Pi Network Official Payment SDK Integration
 * Handles all payment flows with proper state management
 */

export type PaymentStatus = 'pending' | 'approved' | 'completed' | 'failed' | 'cancelled' | 'rejected';

export interface PiPaymentRequest {
  amount: number;
  memo: string;
  metadata?: Record<string, string | number>;
}

export interface PiPayment {
  id: string;
  userId: string;
  amount: number;
  memo: string;
  status: PaymentStatus;
  transactionId?: string;
  walletAddress: string;
  metadata?: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string; // Admin ID
  rejectedAt?: string;
  rejectedBy?: string; // Admin ID
  rejectionReason?: string;
  completedAt?: string;
}

export interface PaymentAuditLog {
  id: string;
  paymentId: string;
  action: 'created' | 'approved' | 'rejected' | 'completed' | 'failed' | 'cancelled';
  actor: 'system' | 'admin' | 'user';
  actorId: string;
  details: string;
  timestamp: string;
}

declare global {
  interface Window {
    Pi: {
      Payment: {
        /**
         * Create a payment request that user must approve
         */
        createPayment: (
          paymentRequest: {
            amount: number;
            memo: string;
            metadata?: Record<string, string | number>;
          },
          callbacks: {
            onReadyForServerApproval: (paymentId: string) => Promise<void>;
            onReadyForServerCompletion: (paymentId: string, txid: string) => Promise<void>;
            onCancel: (paymentId: string) => void;
            onError: (error: Error, paymentId?: string) => void;
          }
        ) => Promise<void>;

        /**
         * Server-side approval of payment
         */
        approvePayment: (paymentId: string) => Promise<{ success: boolean }>;

        /**
         * Server-side completion of payment
         */
        completePayment: (paymentId: string, txid: string) => Promise<{ success: boolean }>;
      };
    };
  }
}

/**
 * Pi Payment Service - Manages all payment operations
 */
export class PiPaymentService {
  private static instance: PiPaymentService;
  private apiUrl = '/api/payments';

  private constructor() {}

  static getInstance(): PiPaymentService {
    if (!PiPaymentService.instance) {
      PiPaymentService.instance = new PiPaymentService();
    }
    return PiPaymentService.instance;
  }

  /**
   * Initiate a payment request with user approval
   */
  async initiatePayment(
    request: PiPaymentRequest,
    onApprovalCallback: (paymentId: string) => Promise<void>,
    onCompletionCallback: (paymentId: string, txid: string) => Promise<void>
  ): Promise<void> {
    if (!window.Pi?.Payment?.createPayment) {
      throw new Error('Pi Payment SDK not loaded');
    }

    return window.Pi.Payment.createPayment(request, {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log('[v0] Payment ready for server approval:', paymentId);
        await onApprovalCallback(paymentId);
      },
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log('[v0] Payment ready for completion:', paymentId, txid);
        await onCompletionCallback(paymentId, txid);
      },
      onCancel: (paymentId: string) => {
        console.log('[v0] Payment cancelled:', paymentId);
        this.cancelPayment(paymentId).catch(console.error);
      },
      onError: (error: Error, paymentId?: string) => {
        console.error('[v0] Payment error:', error, paymentId);
        if (paymentId) {
          this.failPayment(paymentId, error.message).catch(console.error);
        }
      },
    });
  }

  /**
   * Create payment record on backend
   */
  async createPayment(userId: string, request: PiPaymentRequest): Promise<PiPayment> {
    const response = await fetch(`${this.apiUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        amount: request.amount,
        memo: request.memo,
        metadata: request.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create payment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Approve payment (Admin action)
   */
  async approvePayment(
    paymentId: string,
    adminId: string
  ): Promise<{ success: boolean; payment: PiPayment }> {
    const response = await fetch(`${this.apiUrl}/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to approve payment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Reject payment (Admin action)
   */
  async rejectPayment(
    paymentId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; payment: PiPayment }> {
    const response = await fetch(`${this.apiUrl}/${paymentId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminId,
        reason,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to reject payment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Complete payment (Server-side after user approval)
   */
  async completePayment(
    paymentId: string,
    transactionId: string
  ): Promise<{ success: boolean; payment: PiPayment }> {
    const response = await fetch(`${this.apiUrl}/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactionId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete payment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string): Promise<{ success: boolean; payment: PiPayment }> {
    const response = await fetch(`${this.apiUrl}/${paymentId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel payment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Mark payment as failed
   */
  async failPayment(
    paymentId: string,
    reason: string
  ): Promise<{ success: boolean; payment: PiPayment }> {
    const response = await fetch(`${this.apiUrl}/${paymentId}/fail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark payment as failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<PiPayment> {
    const response = await fetch(`${this.apiUrl}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all pending payments (Admin)
   */
  async getPendingPayments(): Promise<PiPayment[]> {
    const response = await fetch(`${this.apiUrl}?status=pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pending payments: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all payments (Admin)
   */
  async getAllPayments(status?: PaymentStatus): Promise<PiPayment[]> {
    const query = status ? `?status=${status}` : '';
    const response = await fetch(`${this.apiUrl}${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get audit log for payment
   */
  async getPaymentAuditLog(paymentId: string): Promise<PaymentAuditLog[]> {
    const response = await fetch(`${this.apiUrl}/${paymentId}/audit`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit log: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get payments for user
   */
  async getUserPayments(userId: string): Promise<PiPayment[]> {
    const response = await fetch(`${this.apiUrl}/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user payments: ${response.statusText}`);
    }

    return response.json();
  }
}

export const piPaymentService = PiPaymentService.getInstance();
