'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { piPaymentService, type PiPayment, type PaymentStatus } from '@/lib/pi-payment-service';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface PaymentFilters {
  status: PaymentStatus | 'all';
  searchUser: string;
}

export function AdminPaymentManager() {
  const [payments, setPayments] = useState<PiPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PiPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PaymentFilters>({
    status: 'all',
    searchUser: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<PiPayment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load payments
  useEffect(() => {
    loadPayments();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = payments;

    if (filters.status !== 'all') {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    if (filters.searchUser) {
      filtered = filtered.filter((p) =>
        p.userId.toLowerCase().includes(filters.searchUser.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  }, [payments, filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const allPayments = await piPaymentService.getAllPayments();
      setPayments(allPayments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('[v0] Failed to load payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payment: PiPayment) => {
    try {
      setActionLoading(true);
      const adminId = 'admin_' + Date.now(); // In production, use actual admin ID from auth
      await piPaymentService.approvePayment(payment.id, adminId);
      
      toast.success(`Payment ${payment.id} approved`);
      await loadPayments();
      setSelectedPayment(null);
      setShowDetails(false);
    } catch (error) {
      console.error('[v0] Approve error:', error);
      toast.error('Failed to approve payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      setActionLoading(true);
      const adminId = 'admin_' + Date.now(); // In production, use actual admin ID from auth
      await piPaymentService.rejectPayment(
        selectedPayment.id,
        adminId,
        rejectionReason
      );
      
      toast.success(`Payment ${selectedPayment.id} rejected`);
      await loadPayments();
      setSelectedPayment(null);
      setShowDetails(false);
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('[v0] Reject error:', error);
      toast.error('Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: <Clock className="w-4 h-4" />,
      },
      approved: {
        bg: 'bg-blue-100 dark:bg-blue-900',
        text: 'text-blue-800 dark:text-blue-200',
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
      completed: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-800 dark:text-green-200',
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
      failed: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-800 dark:text-red-200',
        icon: <XCircle className="w-4 h-4" />,
      },
      cancelled: {
        bg: 'bg-gray-100 dark:bg-gray-900',
        text: 'text-gray-800 dark:text-gray-200',
        icon: <AlertCircle className="w-4 h-4" />,
      },
      rejected: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-800 dark:text-red-200',
        icon: <XCircle className="w-4 h-4" />,
      },
    };

    const variant = variants[status];
    return (
      <Badge className={`${variant.bg} ${variant.text} flex items-center gap-1 w-fit`}>
        {variant.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const completedCount = payments.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Payments</p>
              <p className="text-3xl font-bold">{payments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {pendingCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Approved</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {approvedCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {completedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Management</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPayments}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Status</label>
              <Select value={filters.status} onValueChange={(value) =>
                setFilters({ ...filters, status: value as PaymentStatus | 'all' })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search User ID</label>
              <input
                type="text"
                placeholder="Search user ID..."
                value={filters.searchUser}
                onChange={(e) =>
                  setFilters({ ...filters, searchUser: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Payments
            {filteredPayments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredPayments.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Payment ID</th>
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-right py-3 px-4 font-medium">Amount (π)</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                    <th className="text-center py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{payment.id.slice(0, 20)}...</td>
                      <td className="py-3 px-4">{payment.userId}</td>
                      <td className="py-3 px-4 text-right font-medium">{payment.amount}</td>
                      <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetails && selectedPayment && (
        <Card className="fixed inset-0 z-50 m-4 max-h-screen overflow-auto bg-background border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Payment Details</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDetails(false);
                setSelectedPayment(null);
              }}
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Payment ID</p>
                <p className="font-mono text-sm break-all">{selectedPayment.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-medium">{selectedPayment.userId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-lg font-bold">{selectedPayment.amount} π</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-sm">{selectedPayment.walletAddress}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Memo</p>
                <p className="text-sm">{selectedPayment.memo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
              </div>
              {selectedPayment.transactionId && (
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm break-all">{selectedPayment.transactionId}</p>
                </div>
              )}
              {selectedPayment.approvedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-sm">{new Date(selectedPayment.approvedAt).toLocaleString()}</p>
                </div>
              )}
              {selectedPayment.rejectionReason && (
                <div className="col-span-full">
                  <p className="text-sm text-muted-foreground">Rejection Reason</p>
                  <p className="text-sm text-red-600">{selectedPayment.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedPayment.status === 'pending' && (
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button
                  onClick={() => handleApprove(selectedPayment)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? 'Processing...' : 'Approve Payment'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Reject Payment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Reject Payment</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4 my-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  rows={3}
                />
              </div>
            </div>
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? 'Processing...' : 'Reject'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
