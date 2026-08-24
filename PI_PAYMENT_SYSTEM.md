# Pi Network Official Payment SDK Integration

## Overview

This document describes the complete integration of the official Pi Network Payment SDK with a comprehensive payment approval workflow and admin management system.

## System Architecture

### Payment States

The payment system supports 6 different states:

```
pending ──→ approved ──→ completed ✓
   ↓           ↓
rejected    cancelled
   ↓
  failed
```

### State Descriptions

- **Pending**: Payment created, waiting for admin approval
- **Approved**: Admin approved the payment, ready for user to sign
- **Completed**: Payment signed by user and blockchain transaction confirmed
- **Rejected**: Admin rejected the payment with a reason
- **Cancelled**: User cancelled the payment before approval
- **Failed**: Payment failed due to error

## API Endpoints

### Create Payment

```
POST /api/payments/create
Content-Type: application/json

{
  "userId": "user_123",
  "amount": 100,
  "memo": "Purchase premium features",
  "metadata": {
    "orderId": "order_456",
    "productId": "prod_789"
  }
}

Response (201):
{
  "id": "pay_user_123_1234567890_abc123",
  "userId": "user_123",
  "amount": 100,
  "memo": "Purchase premium features",
  "status": "pending",
  "walletAddress": "pending",
  "metadata": {...},
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Get All Payments (Admin)

```
GET /api/payments?status=pending&userId=user_123

Response (200):
[
  { payment object... },
  { payment object... }
]
```

### Get User Payments

```
GET /api/payments/user/user_123

Response (200):
[
  { payment object... }
]
```

### Approve Payment (Admin)

```
POST /api/payments/{paymentId}/approve
Content-Type: application/json

{
  "adminId": "admin_xyz"
}

Response (200):
{
  "success": true,
  "payment": {
    "id": "pay_...",
    "status": "approved",
    "approvedBy": "admin_xyz",
    "approvedAt": "2024-01-15T10:35:00Z",
    ...
  }
}
```

### Reject Payment (Admin)

```
POST /api/payments/{paymentId}/reject
Content-Type: application/json

{
  "adminId": "admin_xyz",
  "reason": "User account under review"
}

Response (200):
{
  "success": true,
  "payment": {
    "id": "pay_...",
    "status": "rejected",
    "rejectedBy": "admin_xyz",
    "rejectedAt": "2024-01-15T10:35:00Z",
    "rejectionReason": "User account under review",
    ...
  }
}
```

### Complete Payment (Backend)

```
POST /api/payments/{paymentId}/complete
Content-Type: application/json

{
  "transactionId": "0x1234567890abcdef..."
}

Response (200):
{
  "success": true,
  "payment": {
    "id": "pay_...",
    "status": "completed",
    "transactionId": "0x1234567890abcdef...",
    "completedAt": "2024-01-15T10:40:00Z",
    ...
  }
}
```

### Get Payment Details

```
GET /api/payments/{paymentId}

Response (200):
{
  "id": "pay_...",
  "userId": "user_123",
  "amount": 100,
  "status": "approved",
  ...
}
```

### Get Audit Log

```
GET /api/payments/{paymentId}/audit

Response (200):
[
  {
    "id": "log_...",
    "paymentId": "pay_...",
    "action": "created",
    "actor": "system",
    "actorId": "system",
    "details": "Payment created for user user_123, amount: 100 Pi",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  {
    "id": "log_...",
    "paymentId": "pay_...",
    "action": "approved",
    "actor": "admin",
    "actorId": "admin_xyz",
    "details": "Payment approved by admin",
    "timestamp": "2024-01-15T10:35:00Z"
  }
]
```

## Payment Flow

### Complete Payment Flow

```
1. User Initiates Payment
   └─→ POST /api/payments/create
       └─→ Payment created with status=pending

2. Admin Approves Payment
   └─→ POST /api/payments/{id}/approve
       └─→ Status changes to approved
       └─→ Audit log entry created

3. User Signs Transaction
   └─→ Pi SDK calls createPayment with payment details
   └─→ User approves in Pi Wallet

4. Backend Completes Payment
   └─→ POST /api/payments/{id}/complete
       └─→ Status changes to completed
       └─→ Transaction recorded
       └─→ User balance updated

5. Audit Trail
   └─→ Every action logged with timestamp and actor
```

## Admin Dashboard Features

### Payment Management Page

Located at `/admin` → Payments tab

Features:
- View all payments with filtering by status
- Search payments by user ID
- Real-time auto-refresh (10-second polling)
- Inline approval/rejection of pending payments
- View detailed payment information
- See complete audit log for each payment
- Status indicators with color coding

### Statistics

- Total payments
- Pending payments count
- Approved payments count
- Completed payments count

### Bulk Actions

Admin can:
- Approve pending payments individually
- Reject pending payments with custom reason
- View transaction ID after completion
- Trace all state changes via audit log

## Security Features

### Backend Validation

1. **Input Validation**
   - Amount must be > 0
   - Required fields checked
   - Transaction ID format validated

2. **Duplicate Prevention**
   - Same user/amount/memo within 30 seconds prevented
   - Idempotent payment creation

3. **State Validation**
   - Only valid state transitions allowed
   - Can't approve already-completed payment
   - Can't reject completed payment

4. **Audit Logging**
   - Every action logged with timestamp
   - Actor identification (admin/system/user)
   - Detailed action description
   - Immutable audit trail

### Frontend Protection

1. **Role-based Access**
   - Admin dashboard only accessible to admins
   - Payment history only shows user's own payments

2. **Error Handling**
   - Graceful error messages
   - Automatic retry on transient failures
   - User-friendly notifications

## Implementation Details

### Files Created

```
/lib/pi-payment-service.ts          - Pi SDK wrapper and client API
/components/admin-payment-manager.tsx - Admin dashboard component
/app/api/payments/route.ts          - List and create payments
/app/api/payments/create/route.ts   - Create payment endpoint
/app/api/payments/[paymentId]/route.ts - Get/manage payment
/app/api/payments/[paymentId]/approve/route.ts - Approve action
/app/api/payments/[paymentId]/reject/route.ts - Reject action
/app/api/payments/[paymentId]/complete/route.ts - Complete action
/app/api/payments/[paymentId]/cancel/route.ts - Cancel action
/app/api/payments/[paymentId]/fail/route.ts - Fail action
/app/api/payments/[paymentId]/audit/route.ts - Audit log
/app/api/payments/user/[userId]/route.ts - User payments
```

### Database Schema (for production)

```sql
-- Payments table
CREATE TABLE pi_payments (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  memo TEXT NOT NULL,
  status TEXT NOT NULL,
  transactionId TEXT,
  walletAddress TEXT,
  metadata JSON,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  approvedAt TIMESTAMP,
  approvedBy TEXT,
  rejectedAt TIMESTAMP,
  rejectedBy TEXT,
  rejectionReason TEXT,
  completedAt TIMESTAMP,
  INDEX (userId),
  INDEX (status),
  INDEX (createdAt)
);

-- Audit log table
CREATE TABLE pi_payment_audit_logs (
  id TEXT PRIMARY KEY,
  paymentId TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  actorId TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP,
  FOREIGN KEY (paymentId) REFERENCES pi_payments(id),
  INDEX (paymentId),
  INDEX (timestamp)
);
```

## Usage Example

### From Client Code

```typescript
import { piPaymentService } from '@/lib/pi-payment-service';

// Initiate a payment
async function buyPremium() {
  try {
    const payment = await piPaymentService.createPayment('user_123', {
      amount: 100,
      memo: 'Premium subscription - 1 month',
      metadata: {
        subscriptionId: 'sub_456',
        duration: '1 month'
      }
    });

    // Initiate payment flow
    await piPaymentService.initiatePayment(
      {
        amount: 100,
        memo: 'Premium subscription',
      },
      // Callback when admin approves
      async (paymentId) => {
        console.log('Admin approved, waiting for user signature...');
      },
      // Callback when payment completes
      async (paymentId, txid) => {
        console.log('Payment completed with txid:', txid);
        // Update user's premium status
      }
    );
  } catch (error) {
    console.error('Payment failed:', error);
  }
}
```

### From Admin Panel

The admin panel automatically:
1. Polls for pending payments every 10 seconds
2. Shows real-time status updates
3. Allows one-click approval/rejection
4. Displays detailed audit trail
5. Prevents invalid state transitions

## Monitoring and Debugging

### View Payment Status

```typescript
// Get payment details
const payment = await piPaymentService.getPayment('pay_...');
console.log(payment.status); // pending, approved, completed, etc.

// Get audit log
const logs = await piPaymentService.getPaymentAuditLog('pay_...');
logs.forEach(log => {
  console.log(`[${log.timestamp}] ${log.actor}: ${log.action} - ${log.details}`);
});
```

### Common Issues

**Issue**: Payment stuck in "pending" state
- **Solution**: Admin needs to approve it via admin dashboard

**Issue**: Payment fails after approval
- **Solution**: Check error logs, user may have cancelled in Pi Wallet

**Issue**: Duplicate payment created
- **Solution**: System automatically detects and prevents within 30 seconds

## Production Deployment Checklist

- [ ] Replace in-memory storage with database
- [ ] Implement proper admin authentication
- [ ] Add rate limiting to payment endpoints
- [ ] Enable HTTPS for all payment endpoints
- [ ] Set up audit log archival
- [ ] Configure database backups
- [ ] Add monitoring and alerting
- [ ] Implement payment reconciliation
- [ ] Test refund/chargeback handling
- [ ] Document payment recovery procedures

## References

- [Pi Network Official Docs](https://pi.dev)
- [Pi Payment SDK Docs](https://pi.dev/docs/payments)
- [Backend Integration Guide](https://pi.dev/docs/payments/backend)
