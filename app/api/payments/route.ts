import { NextRequest, NextResponse } from 'next/server';
import type { PiPayment } from '@/lib/pi-payment-service';

// In-memory storage (replace with database in production)
const paymentsDB = new Map<string, PiPayment>();

/**
 * Get all payments with optional filtering by status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let payments = Array.from(paymentsDB.values());

    // Filter by status
    if (status && status !== 'all') {
      payments = payments.filter((p) => p.status === status);
    }

    // Filter by userId
    if (userId) {
      payments = payments.filter((p) => p.userId === userId);
    }

    // Sort by creation date (newest first)
    payments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(payments);
  } catch (error) {
    console.error('[v0] Get payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

/**
 * Create a new payment
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

    // Create payment
    const paymentId = `pay_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payment: PiPayment = {
      id: paymentId,
      userId,
      amount,
      memo,
      status: 'pending',
      walletAddress: 'pending',
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    paymentsDB.set(paymentId, payment);

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
