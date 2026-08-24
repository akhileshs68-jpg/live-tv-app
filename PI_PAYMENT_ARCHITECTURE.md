# Pi Payment System - Architecture Reference

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATION                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         PiPaymentService (Client Library)            │  │
│  │  - initiatePayment()                                 │  │
│  │  - createPayment()                                   │  │
│  │  - getPayment()                                      │  │
│  │  - getUserPayments()                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                    HTTP/JSON
                         │
┌────────────────────────┴─────────────────────────────────────┐
│                   BACKEND APIS                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          REST Endpoints (Next.js Routes)             │  │
│  │  - POST   /api/payments/create                       │  │
│  │  - GET    /api/payments                              │  │
│  │  - GET    /api/payments/{id}                         │  │
│  │  - POST   /api/payments/{id}/approve                 │  │
│  │  - POST   /api/payments/{id}/reject                  │  │
│  │  - POST   /api/payments/{id}/complete                │  │
│  │  - POST   /api/payments/{id}/cancel                  │  │
│  │  - POST   /api/payments/{id}/fail                    │  │
│  │  - GET    /api/payments/{id}/audit                   │  │
│  │  - GET    /api/payments/user/{userId}                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Payment State Machine                         │  │
│  │  - Validation Layer                                  │  │
│  │  - State Transition Logic                            │  │
│  │  - Audit Log Creation                                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                    Database Layer (In-memory for now)
                         │
┌────────────────────────┴─────────────────────────────────────┐
│                   DATA STORAGE                               │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  Payments        │    │  Audit Logs                  │   │
│  │  ─────────────── │    │  ─────────────────────────── │   │
│  │  id              │    │  id                          │   │
│  │  userId          │    │  paymentId (FK)              │   │
│  │  amount          │    │  action                      │   │
│  │  memo            │    │  actor                       │   │
│  │  status          │    │  actorId                     │   │
│  │  transactionId   │    │  details                     │   │
│  │  walletAddress   │    │  timestamp                   │   │
│  │  metadata        │    └──────────────────────────────┘   │
│  │  createdAt       │                                       │
│  │  updatedAt       │                                       │
│  │  approvedAt      │                                       │
│  │  approvedBy      │                                       │
│  │  rejectedAt      │                                       │
│  │  rejectedBy      │                                       │
│  │  rejectionReason │                                       │
│  │  completedAt     │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. PiPaymentService (Client Layer)

**Location**: `/lib/pi-payment-service.ts`

**Responsibilities**:
- Wrap official Pi SDK Payment interface
- Manage payment lifecycle from client
- Make API calls to backend
- Handle callbacks and errors
- Provide convenient methods

**Key Methods**:
```typescript
class PiPaymentService {
  // User-initiated operations
  initiatePayment(request, onApproval, onCompletion)
  createPayment(userId, request)
  cancelPayment(paymentId)
  getUserPayments(userId)
  
  // Admin operations
  approvePayment(paymentId, adminId)
  rejectPayment(paymentId, adminId, reason)
  completePayment(paymentId, transactionId)
  
  // Query operations
  getPayment(paymentId)
  getPendingPayments()
  getAllPayments(status?)
  getPaymentAuditLog(paymentId)
}
```

### 2. API Layer

**File Structure**:
```
/app/api/payments/
├── route.ts                      # List + Create
├── create/route.ts               # Create (legacy)
├── [paymentId]/
│   ├── route.ts                  # Get + Main handler
│   ├── approve/route.ts          # Approve action
│   ├── reject/route.ts           # Reject action
│   ├── complete/route.ts         # Complete action
│   ├── cancel/route.ts           # Cancel action
│   ├── fail/route.ts             # Fail action
│   ├── audit/route.ts            # Audit log
│   └── [No folder for nested route]
└── user/
    └── [userId]/route.ts         # User payments
```

**Main Handler Logic**:
```
POST /api/payments/create
  └─> Validate input
  └─> Check for duplicates
  └─> Create payment record
  └─> Log creation
  └─> Return payment

POST /api/payments/{id}/approve
  └─> Validate status is "pending"
  └─> Update status to "approved"
  └─> Set approvedBy + approvedAt
  └─> Create audit log
  └─> Return updated payment

POST /api/payments/{id}/complete
  └─> Validate status is "approved"
  └─> Validate transaction ID
  └─> Update status to "completed"
  └─> Set completedAt
  └─> Create audit log
  └─> Return updated payment
```

### 3. Admin Component

**Location**: `/components/admin-payment-manager.tsx`

**Responsibilities**:
- Display payments in sortable table
- Provide filtering and search
- Show payment details
- Handle approve/reject actions
- Display real-time statistics
- Manage auto-refresh

**Sub-Components**:
- Payment table with columns
- Status badge renderer
- Payment details modal
- Reject confirmation dialog
- Statistics cards

### 4. Data Models

**TypeScript Interfaces** in `/lib/pi-payment-service.ts`:

```typescript
interface PiPaymentRequest {
  amount: number;
  memo: string;
  metadata?: Record<string, string | number>;
}

interface PiPayment {
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
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  completedAt?: string;
}

interface PaymentAuditLog {
  id: string;
  paymentId: string;
  action: 'created'|'approved'|'rejected'|'completed'|'failed'|'cancelled';
  actor: 'system'|'admin'|'user';
  actorId: string;
  details: string;
  timestamp: string;
}

type PaymentStatus = 
  'pending' | 'approved' | 'completed' | 
  'failed' | 'cancelled' | 'rejected';
```

## Request/Response Flow

### 1. Create Payment Flow

```
Client Code
  │
  ├─> piPaymentService.createPayment(userId, request)
  │
  ├─> POST /api/payments/create
  │   {
  │     userId: "user_123",
  │     amount: 100,
  │     memo: "Premium feature",
  │     metadata: { ... }
  │   }
  │
  ├─> Backend Validation
  │   ├─ Check required fields ✓
  │   ├─ Check amount > 0 ✓
  │   ├─ Check for duplicates ✓
  │   └─ Create payment object
  │
  ├─> Store in database
  │   ├─ Save to paymentsDB
  │   ├─ Create audit log entry
  │   └─ Track for duplicate detection
  │
  └─> Response (201)
      {
        id: "pay_user_123_1234567890_abc123",
        status: "pending",
        ...
      }
```

### 2. Approval Flow

```
Admin Dashboard
  │
  ├─> User clicks "Approve Payment"
  │
  ├─> piPaymentService.approvePayment(paymentId, adminId)
  │
  ├─> POST /api/payments/{id}/approve
  │   {
  │     adminId: "admin_xyz"
  │   }
  │
  ├─> Backend Processing
  │   ├─ Load payment from DB
  │   ├─ Validate status == "pending"
  │   ├─ Update status to "approved"
  │   ├─ Set approvedBy, approvedAt
  │   ├─ Create audit log
  │   └─ Save back to DB
  │
  ├─> Response (200)
      {
        success: true,
        payment: {
          id: "pay_...",
          status: "approved",
          approvedBy: "admin_xyz",
          approvedAt: "2024-01-15T10:35:00Z"
        }
      }
  │
  └─> Dashboard updates
      ├─ Refresh payment list
      ├─ Update status badge (green)
      └─ Show success toast
```

### 3. Completion Flow

```
User Signs in Pi Wallet
  │
  ├─> Pi SDK onReadyForServerCompletion callback
  │
  ├─> piPaymentService.completePayment(paymentId, txid)
  │
  ├─> POST /api/payments/{id}/complete
  │   {
  │     transactionId: "0xabc123def456..."
  │   }
  │
  ├─> Backend Processing
  │   ├─ Load payment from DB
  │   ├─ Validate status == "approved"
  │   ├─ Validate transaction ID format
  │   ├─ Update status to "completed"
  │   ├─ Store transaction ID
  │   ├─ Set completedAt
  │   ├─ Create audit log
  │   └─ Save to DB
  │
  ├─> Response (200)
      {
        success: true,
        payment: {
          id: "pay_...",
          status: "completed",
          transactionId: "0xabc123def456...",
          completedAt: "2024-01-15T10:40:00Z"
        }
      }
  │
  └─> Update User
      ├─ Add coins to balance
      ├─ Update subscription
      └─ Show success message
```

## State Machine Implementation

```typescript
const StateTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  'pending': ['approved', 'rejected', 'cancelled'],
  'approved': ['completed', 'cancelled', 'failed'],
  'completed': [], // Final state
  'rejected': [], // Final state
  'cancelled': [], // Final state
  'failed': ['pending'] // Can retry
};

// Validation in backend
function canTransition(from: Status, to: Status): boolean {
  return StateTransitions[from].includes(to);
}
```

## Duplicate Prevention Algorithm

```typescript
// Hash key: userId + amount + memo
const duplicateKey = `${userId}-${amount}-${memo}`;

// Check if same payment was created < 30 seconds ago
const lastCreatedTime = duplicateCheckDB.get(duplicateKey);
if (lastCreatedTime && Date.now() - lastCreatedTime < 30000) {
  return error('Duplicate payment request detected');
}

// Create payment and track it
duplicateCheckDB.set(duplicateKey, Date.now());
```

## Audit Trail Implementation

```typescript
// Every action creates an audit log entry
interface AuditEntry {
  id: `log_${paymentId}_${timestamp}`,
  paymentId: string,
  action: enum(created|approved|rejected|completed|failed|cancelled),
  actor: enum(system|admin|user),
  actorId: string,
  details: string,
  timestamp: ISO8601
}

// Queries return logs sorted by timestamp DESC
```

## Admin Dashboard Data Flow

```
┌─ Component Mount
│  └─ useEffect: loadPayments()
│
├─ Load Initial Data
│  └─ piPaymentService.getAllPayments()
│  └─ Store in state
│
├─ Apply Filters
│  ├─ Filter by status
│  ├─ Filter by user ID
│  └─ Update filtered list
│
├─ Set up Auto-Refresh
│  └─ setInterval(loadPayments, 10000ms)
│
└─ User Interactions
   ├─ Click Approve
   │  └─> piPaymentService.approvePayment()
   │  └─> Reload payments
   │  └─> Show toast
   │
   ├─ Click Details
   │  └─> Show modal with full details
   │
   └─ Change Filters
      └─> Reapply filters to current data
```

## Database Schema (For Production)

```sql
CREATE TABLE pi_payments (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL INDEXED,
  amount DECIMAL NOT NULL,
  memo TEXT NOT NULL,
  status TEXT NOT NULL INDEXED,
  transactionId TEXT UNIQUE,
  walletAddress TEXT,
  metadata JSON,
  createdAt TIMESTAMP INDEXED,
  updatedAt TIMESTAMP,
  approvedAt TIMESTAMP,
  approvedBy TEXT,
  rejectedAt TIMESTAMP,
  rejectedBy TEXT,
  rejectionReason TEXT,
  completedAt TIMESTAMP,
  CONSTRAINT amount_positive CHECK (amount > 0),
  CONSTRAINT valid_status CHECK (status IN 
    ('pending', 'approved', 'completed', 'rejected', 'failed', 'cancelled')),
  INDEX idx_user_created (userId, createdAt),
  INDEX idx_status_created (status, createdAt)
);

CREATE TABLE pi_payment_audit_logs (
  id TEXT PRIMARY KEY,
  paymentId TEXT NOT NULL INDEXED REFERENCES pi_payments(id),
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  actorId TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP NOT NULL INDEXED,
  CONSTRAINT valid_action CHECK (action IN 
    ('created', 'approved', 'rejected', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_actor CHECK (actor IN ('system', 'admin', 'user'))
);
```

## Error Handling

```typescript
// Input Validation
if (!userId) throw new Error('userId required')
if (amount <= 0) throw new Error('amount must be > 0')
if (!memo) throw new Error('memo required')

// State Validation
if (payment.status !== 'pending') 
  throw new Error(`Cannot approve payment with status: ${payment.status}`)

// Business Logic
if (isDuplicate) 
  throw new Error('Duplicate payment request detected')

// Database
if (!payment) 
  throw new Error('Payment not found')
```

## Deployment Architecture

```
┌─────────────────────────────┐
│   Frontend (Next.js)        │
│   - Components              │
│   - Pages                   │
│   - Client libraries        │
└────────────┬────────────────┘
             │
     ┌───────┴───────┐
     │               │
┌────▼─────┐    ┌───▼─────────┐
│  Routes  │    │ API Handlers │
│  (Pages) │    │ (app/api)    │
└────┬─────┘    └───┬──────────┘
     │              │
     └──────┬───────┘
            │
      ┌─────▼──────────────┐
      │  Database Layer    │
      │  (PostgreSQL/etc)  │
      └────────────────────┘
```

## Summary

- **Clean Separation**: Service layer → API → Database
- **Type-Safe**: Full TypeScript throughout
- **Stateless APIs**: Each request is independent
- **Audit Trail**: Complete history of all actions
- **Real-time**: Admin dashboard auto-updates
- **Secure**: Validation at every layer
- **Scalable**: Ready for production database

All components are designed for easy migration from in-memory to persistent storage.
