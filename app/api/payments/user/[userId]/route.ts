import { NextRequest, NextResponse } from 'next/server';
import type { PiPayment } from '@/lib/pi-payment-service';

// In-memory storage (replace with database in production)
const paymentsDB = new Map<string, PiPayment>();

/**
 * Get all payments for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const payments = Array.from(paymentsDB.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json(payments);
  } catch (error) {
    console.error('[v0] Get user payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user payments' },
      { status: 500 }
    );
  }
}
