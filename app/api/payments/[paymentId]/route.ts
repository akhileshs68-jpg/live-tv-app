import { NextRequest, NextResponse } from 'next/server';
import type { PiPayment, PaymentAuditLog } from '@/lib/pi-payment-service';

// In-memory storage (replace with database in production)
const paymentsDB = new Map<string, PiPayment>();
const auditLogsDB = new Map<string, PaymentAuditLog[]>();

/**
 * Get payment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;

    const payment = paymentsDB.get(paymentId);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('[v0] Get payment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

/**
 * Approve payment (Admin action)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;
    const body = await request.json();
    const { action, adminId, reason, transactionId } = body;

    const payment = paymentsDB.get(paymentId);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Handle different actions based on route
    const pathname = request.nextUrl.pathname;

    if (pathname.includes('/approve')) {
      // Approve payment
      if (payment.status !== 'pending') {
        return NextResponse.json(
          { error: `Cannot approve payment with status: ${payment.status}` },
          { status: 400 }
        );
      }

      const updatedPayment: PiPayment = {
        ...payment,
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      paymentsDB.set(paymentId, updatedPayment);

      // Add audit log
      const auditLog: PaymentAuditLog = {
        id: `log_${paymentId}_${Date.now()}`,
        paymentId,
        action: 'approved',
        actor: 'admin',
        actorId: adminId,
        details: `Payment approved by admin`,
        timestamp: new Date().toISOString(),
      };

      if (!auditLogsDB.has(paymentId)) {
        auditLogsDB.set(paymentId, []);
      }
      auditLogsDB.get(paymentId)!.push(auditLog);

      console.log('[v0] Payment approved:', paymentId);

      return NextResponse.json({ success: true, payment: updatedPayment });
    } else if (pathname.includes('/reject')) {
      // Reject payment
      if (payment.status !== 'pending' && payment.status !== 'approved') {
        return NextResponse.json(
          { error: `Cannot reject payment with status: ${payment.status}` },
          { status: 400 }
        );
      }

      const updatedPayment: PiPayment = {
        ...payment,
        status: 'rejected',
        rejectedBy: adminId,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      };

      paymentsDB.set(paymentId, updatedPayment);

      // Add audit log
      const auditLog: PaymentAuditLog = {
        id: `log_${paymentId}_${Date.now()}`,
        paymentId,
        action: 'rejected',
        actor: 'admin',
        actorId: adminId,
        details: `Payment rejected: ${reason}`,
        timestamp: new Date().toISOString(),
      };

      if (!auditLogsDB.has(paymentId)) {
        auditLogsDB.set(paymentId, []);
      }
      auditLogsDB.get(paymentId)!.push(auditLog);

      console.log('[v0] Payment rejected:', paymentId);

      return NextResponse.json({ success: true, payment: updatedPayment });
    } else if (pathname.includes('/complete')) {
      // Complete payment (after user approval and blockchain confirmation)
      if (payment.status !== 'approved') {
        return NextResponse.json(
          { error: `Cannot complete payment with status: ${payment.status}` },
          { status: 400 }
        );
      }

      if (!transactionId) {
        return NextResponse.json(
          { error: 'Transaction ID is required' },
          { status: 400 }
        );
      }

      // Validate transaction ID format (basic check)
      if (typeof transactionId !== 'string' || transactionId.length < 10) {
        return NextResponse.json(
          { error: 'Invalid transaction ID' },
          { status: 400 }
        );
      }

      const updatedPayment: PiPayment = {
        ...payment,
        status: 'completed',
        transactionId,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      paymentsDB.set(paymentId, updatedPayment);

      // Add audit log
      const auditLog: PaymentAuditLog = {
        id: `log_${paymentId}_${Date.now()}`,
        paymentId,
        action: 'completed',
        actor: 'system',
        actorId: 'system',
        details: `Payment completed. Transaction ID: ${transactionId}`,
        timestamp: new Date().toISOString(),
      };

      if (!auditLogsDB.has(paymentId)) {
        auditLogsDB.set(paymentId, []);
      }
      auditLogsDB.get(paymentId)!.push(auditLog);

      console.log('[v0] Payment completed:', paymentId);

      return NextResponse.json({ success: true, payment: updatedPayment });
    } else if (pathname.includes('/cancel')) {
      // Cancel payment
      if (
        payment.status !== 'pending' &&
        payment.status !== 'approved'
      ) {
        return NextResponse.json(
          { error: `Cannot cancel payment with status: ${payment.status}` },
          { status: 400 }
        );
      }

      const updatedPayment: PiPayment = {
        ...payment,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      };

      paymentsDB.set(paymentId, updatedPayment);

      // Add audit log
      const auditLog: PaymentAuditLog = {
        id: `log_${paymentId}_${Date.now()}`,
        paymentId,
        action: 'cancelled',
        actor: 'user',
        actorId: payment.userId,
        details: `Payment cancelled by user`,
        timestamp: new Date().toISOString(),
      };

      if (!auditLogsDB.has(paymentId)) {
        auditLogsDB.set(paymentId, []);
      }
      auditLogsDB.get(paymentId)!.push(auditLog);

      console.log('[v0] Payment cancelled:', paymentId);

      return NextResponse.json({ success: true, payment: updatedPayment });
    } else if (pathname.includes('/fail')) {
      // Mark payment as failed
      const failureReason = reason || 'Unknown error';

      const updatedPayment: PiPayment = {
        ...payment,
        status: 'failed',
        updatedAt: new Date().toISOString(),
      };

      paymentsDB.set(paymentId, updatedPayment);

      // Add audit log
      const auditLog: PaymentAuditLog = {
        id: `log_${paymentId}_${Date.now()}`,
        paymentId,
        action: 'failed',
        actor: 'system',
        actorId: 'system',
        details: `Payment failed: ${failureReason}`,
        timestamp: new Date().toISOString(),
      };

      if (!auditLogsDB.has(paymentId)) {
        auditLogsDB.set(paymentId, []);
      }
      auditLogsDB.get(paymentId)!.push(auditLog);

      console.log('[v0] Payment failed:', paymentId);

      return NextResponse.json({ success: true, payment: updatedPayment });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Payment action error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment action' },
      { status: 500 }
    );
  }
}
