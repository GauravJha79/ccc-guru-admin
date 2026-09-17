import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  GraduationCap,
  Copy,
  Check,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Shield,
  Eye,
  Plus,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { CoursePayment, Course, CoursePaymentStatus } from '../../types/database';
import { courseService } from '../../services/courseService';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { Pagination } from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { formatDate } from '../../lib/utils';
import {
  COURSE_PAYMENT_STATUS_OPTIONS,
  APP_CONFIG,
} from '../../constants/config';

export const CoursePaymentsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [payments, setPayments] = useState<CoursePayment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    successfulPaymentsCount: 0,
    pendingPaymentsCount: 0,
    failedRefundedCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);

  // Copy ID State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Details Modal
  const [selectedPayment, setSelectedPayment] = useState<CoursePayment | null>(null);

  // Admin Manual Record Modal (for offline/admin reconciliation)
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [reconcileCourseId, setReconcileCourseId] = useState('');
  const [reconcileUserName, setReconcileUserName] = useState('');
  const [reconcileUserEmail, setReconcileUserEmail] = useState('');
  const [reconcileAmount, setReconcileAmount] = useState<number | string>(199);
  const [reconcileOrderId, setReconcileOrderId] = useState('');
  const [reconcilePaymentId, setReconcilePaymentId] = useState('');
  const [reconcileStatus, setReconcileStatus] = useState<CoursePaymentStatus>('success');
  const [isSavingReconcile, setIsSavingReconcile] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsData, coursesData, revData] = await Promise.all([
        courseService.getPayments(),
        courseService.getCourses(),
        courseService.getRevenueStats(),
      ]);
      setPayments(paymentsData);
      setCourses(coursesData);
      setRevenueStats(revData);
    } catch (err: any) {
      toastError('Fetch Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    success('Copied', `Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenReconcile = () => {
    setReconcileCourseId(courses.find((c) => c.is_paid)?.id || courses[0]?.id || '');
    setReconcileUserName('');
    setReconcileUserEmail('');
    setReconcileAmount(199);
    setReconcileOrderId(`order_${Date.now().toString().slice(-8)}`);
    setReconcilePaymentId(`pay_${Date.now().toString().slice(-8)}`);
    setReconcileStatus('success');
    setIsReconcileModalOpen(true);
  };

  const handleSaveReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileCourseId || !reconcileUserName.trim() || !reconcileUserEmail.trim()) {
      toastError('Validation', 'Please fill in all required fields.');
      return;
    }

    setIsSavingReconcile(true);
    try {
      const payload = {
        user_id: `usr-${Date.now()}`,
        user_name: reconcileUserName.trim(),
        user_email: reconcileUserEmail.trim().toLowerCase(),
        course_id: reconcileCourseId,
        order_id: reconcileOrderId.trim() || null,
        payment_id: reconcilePaymentId.trim() || null,
        signature: null,
        amount: Number(reconcileAmount) || 0,
        currency: 'INR',
        payment_gateway: 'razorpay',
        status: reconcileStatus,
        paid_at: reconcileStatus === 'success' ? new Date().toISOString() : null,
      };

      await courseService.createPayment(payload);
      success('Payment Recorded', 'Transaction logged for reconciliation.');
      setIsReconcileModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError('Save Error', err.message);
    } finally {
      setIsSavingReconcile(false);
    }
  };

  const handleUpdateStatus = async (paymentId: string, nextStatus: CoursePaymentStatus) => {
    try {
      const updated = await courseService.updatePaymentStatus(paymentId, nextStatus);
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, ...updated } : p))
      );
      if (selectedPayment && selectedPayment.id === paymentId) {
        setSelectedPayment({ ...selectedPayment, ...updated });
      }
      success('Status Updated', `Transaction marked as ${nextStatus}.`);
      // Refresh revenue stats
      const revData = await courseService.getRevenueStats();
      setRevenueStats(revData);
    } catch (err: any) {
      toastError('Update Failed', err.message);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      (p.user_name && p.user_name.toLowerCase().includes(query)) ||
      (p.user_email && p.user_email.toLowerCase().includes(query)) ||
      (p.order_id && p.order_id.toLowerCase().includes(query)) ||
      (p.payment_id && p.payment_id.toLowerCase().includes(query));

    const matchCourse = courseFilter === '' ? true : p.course_id === courseFilter;
    const matchStatus = statusFilter === '' ? true : p.status === statusFilter;

    return matchSearch && matchCourse && matchStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns: Column<CoursePayment>[] = [
    {
      key: 'user',
      header: 'Student / Customer',
      render: (item) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 rounded-xl bg-lavender-500/20 text-lavender-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
            {item.user_name ? item.user_name[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="font-bold text-white text-xs truncate">{item.user_name || 'Customer'}</p>
            <p className="text-[11px] text-dark-muted truncate">{item.user_email || 'No email'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course Purchased',
      render: (item) => {
        const c = item.course || courses.find((x) => x.id === item.course_id);
        return (
          <div className="flex items-center gap-2 text-xs text-white">
            <GraduationCap className="w-4 h-4 text-lavender-400 shrink-0" />
            <span className="font-semibold truncate">{c?.title || 'Unknown Course'}</span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '130px',
      render: (item) => (
        <div className="font-bold text-xs text-white">
          ₹{Number(item.amount).toFixed(2)}
        </div>
      ),
    },
    {
      key: 'ids',
      header: 'Transaction IDs',
      width: '180px',
      render: (item) => (
        <div className="space-y-1 font-mono text-[10px]">
          {item.payment_id ? (
            <div
              onClick={() => handleCopy(item.payment_id!, 'Payment ID')}
              className="flex items-center gap-1.5 text-lavender-300 hover:text-white cursor-pointer group"
              title="Click to copy Payment ID"
            >
              <span className="truncate">Pay: {item.payment_id.slice(0, 14)}...</span>
              {copiedId === item.payment_id ? (
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-dark-dim group-hover:text-lavender-400 shrink-0" />
              )}
            </div>
          ) : (
            <span className="text-dark-dim">No Payment ID</span>
          )}

          {item.order_id && (
            <div
              onClick={() => handleCopy(item.order_id!, 'Order ID')}
              className="flex items-center gap-1.5 text-dark-muted hover:text-white cursor-pointer group"
              title="Click to copy Order ID"
            >
              <span className="truncate">Ord: {item.order_id.slice(0, 14)}...</span>
              {copiedId === item.order_id ? (
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-dark-dim group-hover:text-lavender-400 shrink-0" />
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'gateway',
      header: 'Gateway',
      width: '110px',
      render: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          {item.payment_gateway}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (item) => {
        const variant =
          item.status === 'success'
            ? 'success'
            : item.status === 'pending'
            ? 'warning'
            : item.status === 'refunded'
            ? 'primary'
            : 'danger';

        return (
          <Badge variant={variant} dot className="capitalize">
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'date',
      header: 'Date',
      width: '130px',
      render: (item) => (
        <span className="text-xs text-dark-muted">
          {formatDate(item.paid_at || item.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Details',
      width: '80px',
      align: 'right',
      render: (item) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSelectedPayment(item)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-lavender-400" />
            Course Payments & Revenue
          </h2>
          <p className="text-xs text-dark-muted mt-0.5">
            Audit trail of Razorpay course transactions, order IDs, and verified receipts.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleOpenReconcile}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Transaction
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Verified Revenue"
          value={`₹${revenueStats.totalRevenue.toLocaleString('en-IN')}`}
          icon={<Sparkles className="w-5 h-5" />}
          subtitle="From successful payments only"
        />
        <StatCard
          title="Successful"
          value={revenueStats.successfulPaymentsCount}
          icon={<CheckCircle className="w-5 h-5" />}
          subtitle="Paid orders"
        />
        <StatCard
          title="Pending"
          value={revenueStats.pendingPaymentsCount}
          icon={<Clock className="w-5 h-5" />}
          subtitle="Awaiting gateway confirmation"
        />
        <StatCard
          title="Failed / Refunded"
          value={revenueStats.failedRefundedCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          subtitle="Incomplete or returned"
        />
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by student, order ID, or payment ID..."
        filters={[
          {
            key: 'course',
            label: 'Course',
            value: courseFilter,
            options: courses.map((c) => ({ value: c.id, label: c.title })),
            onChange: setCourseFilter,
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            options: COURSE_PAYMENT_STATUS_OPTIONS,
            onChange: setStatusFilter,
          },
        ]}
        hasActiveFilters={Boolean(searchQuery || courseFilter || statusFilter)}
        onClearFilters={() => {
          setSearchQuery('');
          setCourseFilter('');
          setStatusFilter('');
        }}
      />

      {/* Data Table */}
      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={paginatedPayments}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyTitle="No payment transactions logged"
          emptyDescription="When students pay for courses via Razorpay checkout, the audit logs will appear here."
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPayments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Payment Details Modal */}
      <Modal
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title="Transaction Details"
        subtitle={`Payment ID: ${selectedPayment?.payment_id || selectedPayment?.id}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-muted">Admin Override:</span>
              <select
                value={selectedPayment?.status || 'pending'}
                onChange={(e) =>
                  selectedPayment &&
                  handleUpdateStatus(selectedPayment.id, e.target.value as CoursePaymentStatus)
                }
                className="bg-background-elevated border border-dark-border text-xs text-white rounded-lg px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <Button onClick={() => setSelectedPayment(null)}>Close</Button>
          </div>
        }
      >
        {selectedPayment && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-background-elevated/60 border border-dark-border grid grid-cols-2 gap-4">
              <div>
                <span className="text-dark-muted">Student Name:</span>
                <p className="font-bold text-white mt-0.5">{selectedPayment.user_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-dark-muted">Student Email:</span>
                <p className="font-bold text-white mt-0.5">{selectedPayment.user_email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-dark-muted">Course:</span>
                <p className="font-bold text-white mt-0.5">{selectedPayment.course?.title || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-dark-muted">Amount Paid:</span>
                <p className="font-extrabold text-lavender-300 text-sm mt-0.5">
                  ₹{Number(selectedPayment.amount).toFixed(2)} {selectedPayment.currency}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-dark-border space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-dark-muted">Order ID:</span>
                <span className="text-white select-all">{selectedPayment.order_id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-muted">Payment ID:</span>
                <span className="text-white select-all">{selectedPayment.payment_id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-muted">Gateway:</span>
                <span className="text-indigo-400 uppercase font-bold">{selectedPayment.payment_gateway}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-muted">Timestamp:</span>
                <span className="text-dark-text">{formatDate(selectedPayment.paid_at || selectedPayment.created_at)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background-elevated/40 border border-dark-border text-dark-muted flex items-center gap-2 text-[11px]">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Razorpay secret keys are never exposed in frontend code. Status verification is secure.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Record Transaction Modal */}
      <Modal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        title="Record Payment Transaction"
        subtitle="Manually log a student transaction for admin reconciliation."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsReconcileModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReconcile} isLoading={isSavingReconcile}>
              Save Transaction
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveReconcile} className="space-y-4">
          <Select
            label="Purchased Course *"
            value={reconcileCourseId}
            onChange={(e) => setReconcileCourseId(e.target.value)}
            options={courses.map((c) => ({
              value: c.id,
              label: `${c.title} (${c.is_paid ? `₹${c.price}` : 'Free'})`,
            }))}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Student Name *"
              placeholder="e.g. Amit Kumar"
              value={reconcileUserName}
              onChange={(e) => setReconcileUserName(e.target.value)}
              required
            />
            <Input
              label="Student Email *"
              type="email"
              placeholder="amit@example.com"
              value={reconcileUserEmail}
              onChange={(e) => setReconcileUserEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount (₹) *"
              type="number"
              value={reconcileAmount}
              onChange={(e) => setReconcileAmount(e.target.value)}
              required
            />
            <Select
              label="Payment Status"
              value={reconcileStatus}
              onChange={(e) => setReconcileStatus(e.target.value as CoursePaymentStatus)}
              options={COURSE_PAYMENT_STATUS_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Razorpay Order ID"
              placeholder="order_xxxxxxxx"
              value={reconcileOrderId}
              onChange={(e) => setReconcileOrderId(e.target.value)}
            />
            <Input
              label="Razorpay Payment ID"
              placeholder="pay_xxxxxxxx"
              value={reconcilePaymentId}
              onChange={(e) => setReconcilePaymentId(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
