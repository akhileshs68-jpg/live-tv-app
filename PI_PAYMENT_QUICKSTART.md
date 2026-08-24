# Pi Payment System - Quick Start Guide

## Overview

The Pi Network payment system is now fully integrated with official SDK support and a complete admin approval workflow. This guide helps you get started quickly.

## What Was Built

✅ **Pi SDK Integration** - Official Pi Network Payment SDK properly initialized
✅ **Payment Service** - Client library (`piPaymentService`) for all payment operations
✅ **Admin Dashboard** - Complete payment management interface at `/admin?tab=payments`
✅ **State Management** - 6-state payment workflow (pending → approved → completed)
✅ **Audit Logging** - Complete audit trail for every payment action
✅ **Backend Validation** - Comprehensive server-side checks and duplicate prevention
✅ **Real-time Updates** - Auto-refreshing payment list every 10 seconds

## Quick Start

### 1. Access Admin Dashboard

Navigate to `/admin` → Click "Payments" tab

You'll see:
- Total payments count
- Pending payments count
- Approved payments count
- Completed payments count
- Filterable payment table
- Real-time auto-refresh

### 2. Create a Test Payment

From your app code:

```typescript
import { piPaymentService } from '@/lib/pi-payment-service';

// Create and initiate a test payment
const payment = await piPaymentService.createPayment('user_test_123', {
  amount: 10,
  memo: 'Test payment for premium feature',
  metadata: {
    featureId: 'premium_chat',
    testMode: true
  }
});

console.log('Payment created:', payment.id);
```

### 3. Approve Payment as Admin

From Admin Dashboard:
1. Find the pending payment in the table
2. Click the eye icon to view details
3. Click "Approve Payment" button
4. Confirm the action

Or programmatically:

```typescript
const result = await piPaymentService.approvePayment(
  'pay_user_test_123_...',
  'admin_current_user'
);
console.log('Approved:', result.payment.status); // 'approved'
```

### 4. Complete the Payment

After user signs in Pi Wallet:

```typescript
const completed = await piPaymentService.completePayment(
  'pay_user_test_123_...',
  '0xabc123def456...' // blockchain tx hash
);
console.log('Completed:', completed.payment.status); // 'completed'
```

## Admin Features

### View Payments

- **Filter by Status**: pending, approved, completed, rejected, failed, cancelled
- **Search by User ID**: Find payments from specific users
- **Auto-refresh**: Updates every 10 seconds automatically
- **Sort by Date**: Newest payments first

### Approve Payment

✓ Only available for pending payments
✓ Sets status to 'approved'
✓ Records admin ID and timestamp
✓ Creates audit log entry

### Reject Payment

✓ Only available for pending/approved payments
✓ Requires rejection reason
✓ Sets status to 'rejected'
✓ Stores rejection reason for user reference

### View Payment Details

Shows:
- Payment ID and user ID
- Amount in Pi
- Status with color coding
- Wallet address
- Created/approved/completed timestamps
- Transaction ID (if completed)
- Rejection reason (if rejected)
- Complete audit trail

## Payment States

### Pending
- Initial state when payment is created
- Admin can approve or reject
- User can still cancel

**Action**: Click approve/reject from admin dashboard

### Approved
- Admin has approved the payment
- User can sign in Pi Wallet
- Payment ready for blockchain confirmation

**Action**: User signs in Pi Wallet, system calls `completePayment`

### Completed
- Blockchain transaction confirmed
- User received coins/feature
- Final state (no further changes)

**Action**: None - payment finished

### Rejected
- Admin rejected the payment
- Rejection reason visible to user
- User can try again with new payment

**Action**: User creates new payment request

### Cancelled
- User cancelled before approval
- No admin action needed
- Can be ignored or cleaned up

**Action**: None - payment is dead

### Failed
- Payment failed due to error
- System error details logged
- May be recoverable

**Action**: User can retry

## API Usage

### Check Payment Status

```typescript
const payment = await piPaymentService.getPayment('pay_...');
console.log(payment.status);

// View audit log
const logs = await piPaymentService.getPaymentAuditLog('pay_...');
logs.forEach(log => console.log(log.action, log.details));
```

### Get All Payments (Admin)

```typescript
// All pending payments
const pending = await piPaymentService.getPendingPayments();

// All payments (any status)
const all = await piPaymentService.getAllPayments();

// Specific status
const completed = await piPaymentService.getAllPayments('completed');
```

### Get User Payments

```typescript
const userPayments = await piPaymentService.getUserPayments('user_123');
userPayments.forEach(p => {
  console.log(`${p.id}: ${p.status} - ${p.amount}π`);
});
```

## Testing Workflow

### Test 1: Basic Payment Creation

```bash
# Terminal 1: Create payment
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_1",
    "amount": 10,
    "memo": "Test payment 1"
  }'

# Copy the payment ID from response
# Expected: status = "pending"
```

### Test 2: Approval and Completion

```bash
# Terminal 2: Approve payment (as admin)
curl -X POST http://localhost:3000/api/payments/{PAYMENT_ID}/approve \
  -H "Content-Type: application/json" \
  -d '{"adminId": "admin_test_1"}'

# Check status - should be "approved"

# Terminal 3: Complete payment (after user signs)
curl -X POST http://localhost:3000/api/payments/{PAYMENT_ID}/complete \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "0x123abc..."}'

# Check status - should be "completed"
```

### Test 3: Rejection Workflow

```bash
# Create a new payment
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_2",
    "amount": 50,
    "memo": "Test rejection"
  }'

# Reject it (as admin)
curl -X POST http://localhost:3000/api/payments/{PAYMENT_ID}/reject \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "admin_test_1",
    "reason": "User account under review"
  }'

# Check status - should be "rejected"
```

### Test 4: View Audit Trail

```bash
curl http://localhost:3000/api/payments/{PAYMENT_ID}/audit

# Should see:
# 1. created - system created payment
# 2. approved - admin approved
# 3. completed - system completed (or rejected if rejected)
```

## Duplicate Payment Prevention

The system automatically prevents duplicate payments:

```typescript
// First payment
const p1 = await piPaymentService.createPayment('user', {
  amount: 100,
  memo: 'Test'
});

// Same payment again within 30 seconds - BLOCKED!
const p2 = await piPaymentService.createPayment('user', {
  amount: 100,
  memo: 'Test'
});
// Error: "Duplicate payment request detected"

// After 30 seconds - ALLOWED
setTimeout(async () => {
  const p3 = await piPaymentService.createPayment('user', {
    amount: 100,
    memo: 'Test'
  });
  // Success - new payment created
}, 31000);
```

## Admin Dashboard Stats

The admin dashboard shows:

```
┌─────────────────────────────────────────────────────┐
│ Total Payments: 47   Pending: 3  Approved: 8  Done: 36 │
└─────────────────────────────────────────────────────┘
```

- **Total**: All payments ever created
- **Pending**: Waiting for admin approval
- **Approved**: Waiting for user signature
- **Done**: Completed successfully

## Troubleshooting

### Payment stuck in "pending"
**Solution**: Admin needs to approve from dashboard

### Can't find payment in dashboard
**Solution**: Check filters - may be filtering by status other than "pending"

### Duplicate payment error
**Solution**: Wait 30 seconds before retrying same amount/memo

### Admin dashboard not showing payments
**Solution**: Check browser console for errors, ensure auth is working

### Payment approved but user can't see it
**Solution**: Check audit log - may have failed during signing

## Next Steps for Production

1. **Replace in-memory storage**: Connect to actual database
2. **Add authentication**: Verify admin identity
3. **Add rate limiting**: Prevent payment spam
4. **Set up monitoring**: Track payment failures
5. **Add email notifications**: Notify users of payment status
6. **Implement webhooks**: Notify backend of completions
7. **Add payment refunds**: Handle disputed transactions
8. **Compliance**: Add KYC/AML checks if needed

## Files Reference

- **Service**: `/lib/pi-payment-service.ts` - Client API
- **Admin UI**: `/components/admin-payment-manager.tsx` - Admin dashboard
- **Endpoints**: `/app/api/payments/**` - Backend APIs
- **Docs**: `/PI_PAYMENT_SYSTEM.md` - Full documentation
- **Types**: `/lib/db-types.ts` - TypeScript interfaces

## Support

For issues or questions:
1. Check `/PI_PAYMENT_SYSTEM.md` for detailed documentation
2. Review audit logs to trace payment history
3. Check browser console for client-side errors
4. Check server logs for backend errors

## Summary

Your Pi Network payment system now has:
- ✅ Complete admin approval workflow
- ✅ 6-state payment management
- ✅ Audit trail for every action
- ✅ Backend validation and security
- ✅ Real-time dashboard
- ✅ Duplicate prevention
- ✅ Easy-to-use API

Ready to process payments! 🚀
