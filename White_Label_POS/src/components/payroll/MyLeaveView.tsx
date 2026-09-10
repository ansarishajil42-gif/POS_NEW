import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  CalendarRange,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Loader2,
  FileText,
  AlertCircle,
  Check,
  ShieldCheck,
  Send,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  submitLeaveRequestFn,
  getMyLeaveRequestsFn,
  updateLeaveRequestFn,
  deleteMyLeaveRequestFn,
} from "@/lib/payroll-server";

interface LeaveRequestItem {
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
  approverName: string | null;
}

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  unpaid: "Unpaid Leave",
  emergency: "Emergency Leave",
  maternity_paternity: "Maternity / Paternity",
};

export function MyLeaveView() {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Request Modal State (Create & Edit)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeaveRequestItem | null>(null);
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LeaveRequestItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMyLeaves = async (p = page) => {
    try {
      setLoading(true);
      const res = await getMyLeaveRequestsFn({
        data: { page: p, limit: 10 },
      });
      if (res.success) {
        setRequests(res.leaveRequests as LeaveRequestItem[]);
        setTotalRecords(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load your leave history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves(page);
  }, [page]);

  // Compute duration in days
  const calculatedDays = (() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diff = end.getTime() - start.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  })();

  const isPaidPreview = leaveType !== "unpaid";

  const handleOpenNewDialog = () => {
    setEditingItem(null);
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
    setLeaveType("annual");
    setReason("");
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (item: LeaveRequestItem) => {
    setEditingItem(item);
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setLeaveType(item.leaveType);
    setReason(item.reason || "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be earlier than start date.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const res = await updateLeaveRequestFn({
          data: {
            leaveRequestId: editingItem.id,
            leaveType,
            startDate,
            endDate,
            reason: reason.trim() || undefined,
          },
        });
        if (res.success) {
          toast.success("Leave request updated successfully!");
          setDialogOpen(false);
          setEditingItem(null);
          fetchMyLeaves(page);
        }
      } else {
        const res = await submitLeaveRequestFn({
          data: {
            leaveType,
            startDate,
            endDate,
            reason: reason.trim() || undefined,
          },
        });

        if (res.success) {
          toast.success(
            `Leave request submitted for ${res.daysCount} day(s)! Awaiting approval.`
          );
          setDialogOpen(false);
          fetchMyLeaves(1);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMyLeave = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const res = await deleteMyLeaveRequestFn({
        data: { leaveRequestId: itemToDelete.id },
      });
      if (res.success) {
        toast.success("Leave request deleted successfully.");
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
        fetchMyLeaves(page);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete leave request");
    } finally {
      setIsDeleting(false);
    }
  };

  // KPIs
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const totalApprovedDays = requests
    .filter((r) => r.status === "approved")
    .reduce((acc, r) => acc + (r.daysCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <CalendarRange className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-ink">My Leave Requests</h2>
              <Badge variant="outline" className="text-[11px] font-medium border-primary/30 text-primary bg-primary/5">
                Self Service
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Request time off, track approval status, and view your personal leave history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMyLeaves(page)}
            disabled={loading}
            className="h-9 gap-1.5 hover:bg-slate-100 hover:text-slate-900"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenNewDialog}
            className="h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total Requests
            </span>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-black text-ink mt-2">{totalRecords}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Submitted requests</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
              Pending Review
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">{pendingCount}</div>
          <p className="text-[11px] text-amber-700 mt-1">Awaiting management action</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
              Approved
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">{approvedCount}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Approved time off</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
              Days Taken
            </span>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">{totalApprovedDays}</div>
          <p className="text-[11px] text-blue-700 mt-1">Approved calendar days</p>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">My Past & Current Requests</h3>
          <span className="text-xs text-muted-foreground font-medium">
            {totalRecords} records found
          </span>
        </div>

        <div className="overflow-x-auto vip-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs font-semibold text-ink">Leave Type</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Duration & Dates</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Compensation</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Reason / Remarks</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Submitted On</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Status</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Reviewed By</TableHead>
                <TableHead className="text-xs font-semibold text-ink text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-xs">Loading leave history...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-4">
                      <CalendarRange className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No leave requests found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        You have not submitted any time off requests yet. Click "Request Leave" to apply.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleOpenNewDialog}
                        className="mt-2 text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Request Leave
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => {
                  const isApproved = r.status === "approved";
                  const isRejected = r.status === "rejected";
                  const isPending = r.status === "pending";

                  return (
                    <TableRow key={r.id} className="text-xs hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-ink">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {leaveTypeLabels[r.leaveType] || r.leaveType}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-slate-800">
                          {r.startDate} <span className="text-muted-foreground">to</span> {r.endDate}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium">
                          {r.daysCount} {r.daysCount === 1 ? "day" : "days"}
                        </div>
                      </TableCell>

                      <TableCell>
                        {r.isPaid ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold text-[11px]">
                            Paid Leave
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 font-semibold text-[11px]">
                            Unpaid
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[220px]">
                        <p className="truncate text-slate-600" title={r.reason || ""}>
                          {r.reason || <span className="italic text-slate-400">No reason provided</span>}
                        </p>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString("en-AE", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </TableCell>

                      <TableCell>
                        {isApproved ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold gap-1 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : isRejected ? (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold gap-1 text-[11px]">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-semibold gap-1 text-[11px]">
                            <Clock className="h-3 w-3" />
                            Pending Review
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-slate-600">
                        {r.approverName ? (
                          <div>
                            <span className="font-medium text-ink">{r.approverName}</span>
                            {r.approvedAt && (
                              <div className="text-[10px] text-muted-foreground">
                                {new Date(r.approvedAt).toLocaleDateString("en-AE")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Awaiting review</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditDialog(r)}
                              className="h-7 px-2 text-xs gap-1 text-slate-700 hover:text-slate-900 border-gray-200"
                              title="Edit pending request"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setItemToDelete(r);
                                setDeleteConfirmOpen(true);
                              }}
                              className="h-7 px-2 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                              title="Delete pending request"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            {isApproved ? "Approved (Locked)" : "Rejected (Locked)"}
                          </span>
                        )}
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Submit / Edit Leave Request Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <CalendarRange className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">
                  {editingItem ? "Edit Leave Request" : "Request Time Off"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                {editingItem
                  ? "Update your pending leave request details before management reviews it."
                  : "Submit a leave request for management approval. Approved leaves are automatically synced with attendance."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Leave Type */}
              <div className="space-y-1.5">
                <Label htmlFor="leave-type" className="text-xs font-semibold text-ink">
                  Leave Type
                </Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger id="leave-type" className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual" className="text-xs">Annual Leave (Paid)</SelectItem>
                    <SelectItem value="sick" className="text-xs">Sick Leave (Paid)</SelectItem>
                    <SelectItem value="unpaid" className="text-xs">Unpaid Leave</SelectItem>
                    <SelectItem value="emergency" className="text-xs">Emergency Leave (Paid)</SelectItem>
                    <SelectItem value="maternity_paternity" className="text-xs">Maternity / Paternity (Paid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start-date" className="text-xs font-semibold text-ink">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!endDate || new Date(e.target.value) > new Date(endDate)) {
                        setEndDate(e.target.value);
                      }
                    }}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="end-date" className="text-xs font-semibold text-ink">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Summary */}
              {calculatedDays > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                      Total Duration:{" "}
                      <strong className="text-ink">
                        {calculatedDays} {calculatedDays === 1 ? "day" : "days"}
                      </strong>
                    </span>
                  </div>
                  <Badge
                    className={
                      isPaidPreview
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-[11px]"
                        : "bg-slate-200 text-slate-700 border-slate-300 font-semibold text-[11px]"
                    }
                  >
                    {isPaidPreview ? "Paid Leave" : "Unpaid Leave"}
                  </Badge>
                </div>
              )}

              {/* Reason / Remarks */}
              <div className="space-y-1.5">
                <Label htmlFor="leave-reason" className="text-xs font-semibold text-ink">
                  Reason / Notes <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <textarea
                  id="leave-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain reason for time off, handover notes, or emergency contact..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setDialogOpen(false)}
                className="hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || calculatedDays <= 0}
                className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    {editingItem ? "Save Changes" : "Submit Request"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <Trash2 className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">Delete Leave Request</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete your pending{" "}
              <span className="font-semibold text-ink">
                {itemToDelete ? leaveTypeLabels[itemToDelete.leaveType] || itemToDelete.leaveType : "leave"}
              </span>{" "}
              request ({itemToDelete?.startDate} to {itemToDelete?.endDate})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
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
              onClick={handleDeleteMyLeave}
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
                  Delete Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
