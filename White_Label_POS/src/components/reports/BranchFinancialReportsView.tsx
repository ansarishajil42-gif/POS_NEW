import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DollarSign,
  TrendingUp,
  Percent,
  CreditCard,
  Package,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  Lock,
  RefreshCw,
  FileText,
  Eye,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import {
  getMyBranchFinancialReportFn,
  submitBranchReportFn,
  getMySubmittedReportsFn,
  updateBranchSubmissionFn,
  deleteBranchSubmissionFn,
} from "@/lib/reports-server";

const formatAED = (amount: number) => {
  return `AED ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function BranchFinancialReportsView() {
  const today = useMemo(() => new Date(), []);
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const [startDate, setStartDate] = useState<string>(thirtyDaysAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(today.toISOString().slice(0, 10));
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<any>(null);

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // View Snapshot Modal
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);

  // Edit & Delete Submission State
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [deletingSubmission, setDeletingSubmission] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleOpenEdit = (sub: any) => {
    setEditingSubmission(sub);
    setEditNotes(sub.notes || "");
    setEditStartDate(sub.periodStart);
    setEditEndDate(sub.periodEnd);
  };

  const handleUpdateSubmit = async () => {
    if (!editingSubmission) return;
    try {
      setIsUpdating(true);
      const res = await updateBranchSubmissionFn({
        data: {
          submissionId: editingSubmission.id,
          notes: editNotes,
          startDate: editStartDate,
          endDate: editEndDate,
        },
      });
      if (res.success) {
        toast.success(
          editingSubmission.status === "returned"
            ? "Report resubmitted to Head Office successfully!"
            : "Submission updated successfully!"
        );
        setEditingSubmission(null);
        fetchSubmissions();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update submission");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingSubmission) return;
    try {
      setIsDeleting(true);
      const res = await deleteBranchSubmissionFn({
        data: { submissionId: deletingSubmission.id },
      });
      if (res.success) {
        toast.success("Report submission deleted successfully.");
        setDeletingSubmission(null);
        fetchSubmissions();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete submission");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await getMyBranchFinancialReportFn({
        data: { startDate, endDate },
      });
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load branch financial report");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const res = await getMySubmittedReportsFn();
      if (res.success) {
        setSubmissions(res.submissions);
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchSubmissions();
  }, [startDate, endDate]);

  const handleSubmitReport = async () => {
    if (!reportData) return;
    try {
      setSubmitting(true);
      const res = await submitBranchReportFn({
        data: {
          startDate,
          endDate,
          notes,
        },
      });
      if (res.success) {
        toast.success("Branch financial report submitted to Head Office successfully!");
        setNotes("");
        fetchSubmissions();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const exec = reportData?.executiveSummary;
  const margin = reportData?.salesMargin;
  const branch = reportData?.branch;

  return (
    <div className="space-y-6">
      {/* Header & Branch Lock Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-ink">Branch Financial Performance</h2>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold gap-1">
                <Lock className="h-3 w-3" />
                {branch?.name || "Own Branch"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live executive summary and margin performance scoped strictly to your branch
            </p>
          </div>
        </div>

        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent font-medium text-ink focus:outline-none cursor-pointer"
            />
            <span className="mx-1">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent font-medium text-ink focus:outline-none cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchReport();
              fetchSubmissions();
            }}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && !reportData ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Calculating branch financials...</span>
        </div>
      ) : (
        <>
          {/* 4 Stat KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Revenue
                </span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink">
                  {formatAED(exec?.totalRevenue || 0)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {exec?.orderCount || 0} completed orders
              </span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cost of Goods Sold (COGS)
                </span>
                <Package className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink">
                  {formatAED(exec?.cogs || 0)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Product inventory cost</span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Gross Profit
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-700">
                  {formatAED(exec?.grossProfit || 0)}
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-600">
                {exec?.grossMarginPct || 0}% Gross Margin
              </span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Inventory Asset Value
                </span>
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink">
                  {formatAED(exec?.inventoryAssetValue || 0)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {exec?.totalStockUnits || 0} units on hand
              </span>
            </div>
          </div>

          {/* Breakdown Sections: Top Products & Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products Table (2 cols) */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Top Products by Gross Profit
                </h3>
                <span className="text-xs text-muted-foreground">
                  {margin?.topProducts?.length || 0} ranked items
                </span>
              </div>
              <div className="overflow-x-auto flex-1">
                <Table>
                  <TableHeader className="bg-gray-50/80">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Product</TableHead>
                      <TableHead className="text-xs font-semibold">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Units</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Revenue</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Profit</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!margin?.topProducts || margin.topProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                          No sales data recorded in this date range
                        </TableCell>
                      </TableRow>
                    ) : (
                      margin.topProducts.map((p: any) => (
                        <TableRow key={p.productId} className="text-xs">
                          <TableCell className="font-semibold text-ink">{p.productName}</TableCell>
                          <TableCell className="text-muted-foreground">{p.category}</TableCell>
                          <TableCell className="text-right font-medium">{p.unitsSold}</TableCell>
                          <TableCell className="text-right font-medium">{formatAED(p.revenue)}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">{formatAED(p.grossProfit)}</TableCell>
                          <TableCell className="text-right font-semibold">{p.marginPct}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Payment & Channel Breakdown (1 col) */}
            <div className="space-y-6">
              {/* Payment Methods */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-sm text-ink mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Tender Methods
                </h3>
                <div className="space-y-2.5">
                  {!margin?.tenders || margin.tenders.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No payments recorded</p>
                  ) : (
                    margin.tenders.map((t: any) => (
                      <div key={t.method} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700 capitalize">{t.method}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{formatAED(t.amount)}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">({t.percentage}%)</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Channels */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-sm text-ink mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Order Channels
                </h3>
                <div className="space-y-2.5">
                  {!margin?.channels || margin.channels.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No channel data available</p>
                  ) : (
                    margin.channels.map((c: any) => (
                      <div key={c.channel} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">{c.channel}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{formatAED(c.amount)}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">({c.percentage}%)</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit to Head Office Section */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 text-emerald-800 mb-2">
              <Send className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-bold">Submit Report to Head Office</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Take a permanent, immutable financial snapshot of this date range ({startDate} to {endDate}) and submit it to Head Office management with your manager remarks.
            </p>

            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add optional notes or commentary for Head Office (e.g. key performance drivers, variance explanation, stock notes)..."
                rows={3}
                className="w-full text-sm rounded-xl border border-gray-300 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitReport}
                  disabled={submitting || !reportData}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Snapshot...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Report to Head Office
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Past Submissions History Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-ink">My Past Submissions</h3>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {submissions.length} submitted reports
              </span>
            </div>

            <div className="overflow-x-auto vip-scrollbar">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Report Period</TableHead>
                    <TableHead className="text-xs font-semibold">Submitted On</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Manager Notes / Feedback</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSubmissions ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary mb-1" />
                        Loading submission history...
                      </TableCell>
                    </TableRow>
                  ) : submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground">
                        No previous submissions found for this branch.
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((sub) => {
                      const isReviewed = sub.status === "reviewed";
                      const isReturned = sub.status === "returned";
                      const canModify = sub.status === "submitted" || sub.status === "returned";

                      return (
                        <TableRow key={sub.id} className="text-xs">
                          <TableCell className="font-semibold text-ink">
                            {sub.periodStart} to {sub.periodEnd}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(sub.createdAt).toLocaleDateString("en-AE", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            {isReviewed ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold gap-1 text-[11px]">
                                <CheckCircle2 className="h-3 w-3" />
                                Reviewed
                              </Badge>
                            ) : isReturned ? (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold gap-1 text-[11px]">
                                <RotateCcw className="h-3 w-3" />
                                Returned
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-semibold gap-1 text-[11px]">
                                <Clock className="h-3 w-3" />
                                Pending Review
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[320px]">
                            <p className="text-muted-foreground truncate">{sub.notes || "No notes attached"}</p>
                            {isReturned && sub.headOfficeMessage && (
                              <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-rose-600 shrink-0" />
                                <div>
                                  <span className="font-bold">Head Office:</span> {sub.headOfficeMessage}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSnapshot(sub)}
                                className="h-7 px-2 text-xs gap-1 text-emerald-700 border-emerald-300 bg-emerald-50/40 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors shadow-none font-medium"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Snapshot
                              </Button>

                              {canModify && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenEdit(sub)}
                                    className={`h-7 px-2 text-xs gap-1 font-medium transition-colors ${
                                      isReturned
                                        ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300"
                                    }`}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                    {isReturned ? "Resubmit" : "Edit"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isDeleting && deletingSubmission?.id === sub.id}
                                    onClick={() => setDeletingSubmission(sub)}
                                    className="h-7 px-2 text-xs gap-1 text-rose-600 border-rose-200 bg-white hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors font-medium"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </Button>
                                </>
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
          </div>
        </>
      )}

      {/* Edit / Resubmit Submission Modal */}
      {editingSubmission && (
        <Dialog open={!!editingSubmission} onOpenChange={() => !isUpdating && setEditingSubmission(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <Edit2 className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">
                  {editingSubmission.status === "returned" ? "Revise & Resubmit Report" : "Edit Submission"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                {editingSubmission.status === "returned"
                  ? "Address Head Office's comments and resubmit this report for review."
                  : "Update notes or adjust report date range for this pending submission."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {editingSubmission.status === "returned" && editingSubmission.headOfficeMessage && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-800">Head Office Feedback:</span>
                    <p className="mt-0.5 whitespace-pre-wrap">{editingSubmission.headOfficeMessage}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Period Start</Label>
                  <Input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Period End</Label>
                  <Input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Manager Commentary / Notes</Label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Explain revisions, variance factors, or general commentary..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => setEditingSubmission(null)}
                className="hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isUpdating}
                onClick={handleUpdateSubmit}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-none"
              >
                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {editingSubmission.status === "returned" ? "Resubmit to Head Office" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubmission && (
        <Dialog open={!!deletingSubmission} onOpenChange={() => !isDeleting && setDeletingSubmission(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <Trash2 className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">Delete Report Submission</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Are you sure you want to permanently delete your submission for{" "}
                <span className="font-semibold text-slate-800">
                  {deletingSubmission.periodStart} to {deletingSubmission.periodEnd}
                </span>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeletingSubmission(null)}
                className="hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteSubmit}
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-none"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Snapshot Details Modal */}
      {selectedSnapshot && (
        <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <FileText className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">
                  Frozen Report Snapshot ({selectedSnapshot.periodStart} to {selectedSnapshot.periodEnd})
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Frozen copy recorded at submission time — unaffected by subsequent live store activity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Snapshot KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Revenue</span>
                  <span className="text-base font-bold text-ink">
                    {formatAED(selectedSnapshot.snapshotData?.executiveSummary?.totalRevenue || 0)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-muted-foreground block">COGS</span>
                  <span className="text-base font-bold text-ink">
                    {formatAED(selectedSnapshot.snapshotData?.executiveSummary?.cogs || 0)}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 block">Gross Profit</span>
                  <span className="text-base font-bold text-emerald-700">
                    {formatAED(selectedSnapshot.snapshotData?.executiveSummary?.grossProfit || 0)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Gross Margin</span>
                  <span className="text-base font-bold text-ink">
                    {selectedSnapshot.snapshotData?.executiveSummary?.grossMarginPct || 0}%
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-ink block mb-1">Manager Commentary:</span>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {selectedSnapshot.notes || "No commentary was submitted with this report."}
                </p>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground border-t border-gray-100 pt-2.5">
                <span>Submitted by: <strong>{selectedSnapshot.snapshotData?.submittedByName || "Branch Manager"}</strong></span>
                <span>Captured on: {new Date(selectedSnapshot.createdAt).toLocaleString("en-AE")}</span>
                {selectedSnapshot.reviewedAt && (
                  <span className="text-emerald-700 font-semibold">
                    Reviewed: {new Date(selectedSnapshot.reviewedAt).toLocaleDateString("en-AE")}
                  </span>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setSelectedSnapshot(null)} className="hover:bg-slate-100 hover:text-slate-900">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
