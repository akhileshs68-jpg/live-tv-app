import { NextRequest, NextResponse } from 'next/server';
import type { PaymentAuditLog } from '@/lib/pi-payment-service';

// In-memory storage (replace with database in production)
const auditLogsDB = new Map<string, PaymentAuditLog[]>();

/**
 * Get audit log for a specific payment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;

    const logs = auditLogsDB.get(paymentId) || [];
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[v0] Get audit log error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
