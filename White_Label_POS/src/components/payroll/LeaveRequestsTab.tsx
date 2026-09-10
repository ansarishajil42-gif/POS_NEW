import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarRange,
  Search,
  Building2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  FileText,
  User,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getPendingLeaveRequestsFn,
  approveOrRejectLeaveFn,
  deleteLeaveRequestFn,
} from "@/lib/payroll-server";

interface LeaveAdminItem {
  id: string;
  leaveType: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string | null;
  status: string;
  approvedAt: string | null;
  createdAt: string | null;
  staffId: string;
  staffName: string;
  staffEmail: string | null;
  staffPhone: string | null;
  staffRole: string;
  branchId: string | null;
  branchName: string | null;
}

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  unpaid: "Unpaid Leave",
  emergency: "Emergency Leave",
  maternity_paternity: "Maternity / Paternity",
};

const roleLabelMap: Record<string, string> = {
  super_admin: "Super Admin",
  head_office_admin: "Head Office Admin",
  branch_manager: "Branch Manager",
  inventory_manager: "Inventory Manager",
  purchasing_officer: "Purchasing Officer",
  cashier: "Cashier",
  vendor: "Vendor",
};

export function LeaveRequestsTab() {
  const [requests, setRequests] = useState<LeaveAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LeaveAdminItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRequests = async (targetPage = page) => {
    try {
      setLoading(true);
      const res = await getPendingLeaveRequestsFn({
        data: {
          branchId: selectedBranch,
          status: selectedStatus,
          page: targetPage,
          limit: 10,
        },
      });
      if (res.success) {
        setRequests(res.leaveRequests as LeaveAdminItem[]);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
        setPage(res.page || targetPage);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1);
  }, [selectedBranch, selectedStatus]);

  // Extract unique branches from loaded list
  const branches = useMemo(() => {
    const map = new Map<string, string>();
    requests.forEach((r) => {
      if (r.branchId && r.branchName) {
        map.set(r.branchId, r.branchName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [requests]);

  // Search filter
  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(
      (r) =>
        r.staffName.toLowerCase().includes(q) ||
        (r.staffEmail && r.staffEmail.toLowerCase().includes(q)) ||
        (r.staffRole && r.staffRole.toLowerCase().includes(q)) ||
        (r.branchName && r.branchName.toLowerCase().includes(q))
    );
  }, [requests, search]);

  const handleDecision = async (leaveRequestId: string, decision: "approved" | "rejected") => {
    try {
      setProcessingId(leaveRequestId);
      const res = await approveOrRejectLeaveFn({
        data: {
          leaveRequestId,
          decision,
        },
      });

      if (res.success) {
        if (decision === "approved") {
          toast.success(
            "Leave request approved! Attendance roster automatically updated with 'On Leave' status."
          );
        } else {
          toast.info("Leave request rejected.");
        }
        fetchRequests(page);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to ${decision} leave request`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAdminDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const res = await deleteLeaveRequestFn({
        data: {
          leaveRequestId: itemToDelete.id,
        },
      });

      if (res.success) {
        toast.success(
          itemToDelete.status === "approved"
            ? "Leave request and associated attendance records deleted successfully."
            : "Leave request deleted successfully."
        );
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
        fetchRequests(page);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete leave request");
    } finally {
      setIsDeleting(false);
    }
  };

  // KPIs
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Requests
            </span>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{totalRecords}</span>
            <span className="text-xs text-muted-foreground">across all branches</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending on Page
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-muted-foreground">requires admin review</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Approved on Page
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{approvedCount}</span>
            <span className="text-xs text-muted-foreground">synced with attendance</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rejected on Page
            </span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{rejectedCount}</span>
            <span className="text-xs text-muted-foreground">declined requests</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search employee or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* Branch Filter */}
          <div className="w-full sm:w-44">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="pending" className="text-xs">Pending Review</SelectItem>
                <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRequests(page)}
          disabled={loading}
          className="h-9 gap-1.5 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Requests Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto vip-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75 hover:bg-gray-50/75 border-b border-gray-200">
                <TableHead className="sticky left-0 bg-gray-50/95 backdrop-blur-sm z-20 shadow-[4px_0_8px_rgba(0,0,0,0.06)] border-r border-gray-200/80 text-xs font-semibold text-muted-foreground min-w-[200px] pl-4">
                  Employee
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[120px] whitespace-nowrap">Role</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[120px] whitespace-nowrap">Branch</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[130px] whitespace-nowrap">Leave Type</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[160px] whitespace-nowrap">Duration & Dates</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[160px] whitespace-nowrap">Reason / Remarks</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[110px] whitespace-nowrap">Submitted On</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[130px] whitespace-nowrap">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[160px] whitespace-nowrap pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-xs">Loading leave requests...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                    No leave requests found matching your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((r) => {
                  const isApproved = r.status === "approved";
                  const isRejected = r.status === "rejected";
                  const isPending = r.status === "pending";
                  const isProcessing = processingId === r.id;

                  return (
                    <TableRow key={r.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-100">
                      {/* Employee - Sticky Left Column (Matching Image 1) */}
                      <TableCell className="sticky left-0 bg-white group-hover:bg-gray-50/95 backdrop-blur-sm z-10 shadow-[4px_0_8px_rgba(0,0,0,0.06)] border-r border-gray-200/80 min-w-[200px] pl-4 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-ink">{r.staffName}</span>
                          <span className="text-xs text-muted-foreground">{r.staffEmail || "No email"}</span>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-[11px] font-medium capitalize">
                          {roleLabelMap[r.staffRole || ""] || r.staffRole?.replace(/_/g, " ") || "Staff"}
                        </Badge>
                      </TableCell>

                      {/* Branch */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span>{r.branchName || "Unassigned"}</span>
                        </div>
                      </TableCell>

                      {/* Leave Type */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs text-ink">
                            {leaveTypeLabels[r.leaveType] || r.leaveType}
                          </span>
                          {r.isPaid ? (
                            <Badge className="w-fit mt-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium text-[10px]">
                              Paid Leave
                            </Badge>
                          ) : (
                            <Badge className="w-fit mt-0.5 bg-gray-100 text-gray-600 border-gray-200 font-medium text-[10px]">
                              Unpaid
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Duration & Dates */}
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium text-xs text-ink">
                          {r.startDate} <span className="text-muted-foreground">to</span> {r.endDate}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium">
                          {r.daysCount} {r.daysCount === 1 ? "day" : "days"}
                        </div>
                      </TableCell>

                      {/* Reason / Remarks */}
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-xs text-muted-foreground" title={r.reason || ""}>
                          {r.reason || <span className="italic text-muted-foreground/60">None</span>}
                        </p>
                      </TableCell>

                      {/* Submitted On */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString("en-AE", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="whitespace-nowrap">
                        {isApproved ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium gap-1 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : isRejected ? (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-medium gap-1 text-[11px]">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium gap-1 text-[11px]">
                            <Clock className="h-3 w-3" />
                            Pending Review
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right whitespace-nowrap pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <>
                              <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleDecision(r.id, "approved")}
                                className="h-8 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                                title="Approve leave request"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleDecision(r.id, "rejected")}
                                className="h-8 px-3 text-xs gap-1.5 text-rose-700 border-rose-200 bg-white hover:bg-rose-50 hover:text-rose-800 transition-colors font-medium"
                                title="Reject leave request"
                              >
                                <X className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setItemToDelete(r);
                                setDeleteConfirmOpen(true);
                              }}
                              className="h-8 px-2.5 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                              title="Delete leave request record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalRecords > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-ink">{(page - 1) * 10 + 1}</span> to{" "}
              <span className="font-semibold text-ink">{Math.min(page * 10, totalRecords)}</span> of{" "}
              <span className="font-semibold text-ink">{totalRecords}</span> requests
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newP = Math.max(1, page - 1);
                  setPage(newP);
                  fetchRequests(newP);
                }}
                disabled={page <= 1 || loading}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="text-xs font-medium text-ink px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newP = Math.min(totalPages, page + 1);
                  setPage(newP);
                  fetchRequests(newP);
                }}
                disabled={page >= totalPages || loading}
                className="h-8 px-2.5 text-xs gap-1"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <Trash2 className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">Delete Leave Request</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Are you sure you want to permanently delete this {itemToDelete?.status} leave request for{" "}
                <strong className="text-ink">{itemToDelete?.staffName}</strong> ({itemToDelete?.startDate} to{" "}
                {itemToDelete?.endDate})?
              </p>
              {itemToDelete?.status === "approved" && (
                <p className="p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                  ⚠️ Note: Deleting this approved leave request will also remove the automatically synced &quot;On Leave&quot; attendance records for this employee during this date period.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleAdminDelete}
              className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

