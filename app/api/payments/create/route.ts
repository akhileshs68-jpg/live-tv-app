import { NextRequest, NextResponse } from 'next/server';
import type { PiPayment } from '@/lib/pi-payment-service';
import type { PaymentAuditLog } from '@/lib/pi-payment-service';

// In-memory storage (replace with database in production)
const paymentsDB = new Map<string, PiPayment>();
const auditLogsDB = new Map<string, PaymentAuditLog[]>();
const duplicateCheckDB = new Map<string, string>(); // hash -> paymentId

/**
 * Create a new payment record
 * Called when user initiates payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, memo, metadata } = body;

    // Validation
    if (!userId || !amount || !memo) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, memo' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Prevent duplicate payments (same user, amount, memo within 30 seconds)
    const duplicateKey = `${userId}-${amount}-${memo}`;
    const existingPaymentId = duplicateCheckDB.get(duplicateKey);

    if (existingPaymentId) {
      const existingPayment = paymentsDB.get(existingPaymentId);
      const createdTime = new Date(existingPayment!.createdAt).getTime();
      const now = new Date().getTime();

      if (now - createdTime < 30000) {
        // 30 seconds
        return NextResponse.json(
          { error: 'Duplicate payment request detected' },
          { status: 409 }
        );
      }
    }

    // Create payment record
    const paymentId = `pay_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payment: PiPayment = {
      id: paymentId,
      userId,
      amount,
      memo,
      status: 'pending',
      walletAddress: 'pending', // Will be updated after user approval
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store payment
    paymentsDB.set(paymentId, payment);

    // Track for duplicate detection
    duplicateCheckDB.set(duplicateKey, paymentId);

    // Create audit log entry
    const auditLog: PaymentAuditLog = {
      id: `log_${paymentId}_${Date.now()}`,
      paymentId,
      action: 'created',
      actor: 'system',
      actorId: 'system',
      details: `Payment created for user ${userId}, amount: ${amount} Pi`,
      timestamp: new Date().toISOString(),
    };

    if (!auditLogsDB.has(paymentId)) {
      auditLogsDB.set(paymentId, []);
    }
    auditLogsDB.get(paymentId)!.push(auditLog);

    console.log('[v0] Payment created:', paymentId);

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('[v0] Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
