import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  Eye,
  Check,
  RefreshCw,
  Loader2,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  RotateCcw,
  MessageSquare,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  getBranchSubmissionsFn,
  markSubmissionReviewedFn,
  returnBranchSubmissionFn,
  adminUpdateBranchSubmissionFn,
  deleteBranchSubmissionFn,
} from "@/lib/reports-server";

interface BranchSubmissionsSubViewProps {
  branches: Array<{ id: string; name: string }>;
}

const formatAED = (amount: number) => {
  return `AED ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function BranchSubmissionsSubView({ branches }: BranchSubmissionsSubViewProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Return with Message State
  const [returningSubmission, setReturningSubmission] = useState<any>(null);
  const [returnMessage, setReturnMessage] = useState<string>("");
  const [isReturning, setIsReturning] = useState<boolean>(false);

  // Edit Submission State
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editHeadOfficeMessage, setEditHeadOfficeMessage] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("submitted");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Delete Submission State
  const [deletingSubmission, setDeletingSubmission] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await getBranchSubmissionsFn({
        data: {
          branchId: selectedBranch,
          status: selectedStatus,
        },
      });
      if (res.success) {
        setSubmissions(res.submissions);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load branch submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [selectedBranch, selectedStatus]);

  const handleMarkReviewed = async (submissionId: string) => {
    try {
      setReviewingId(submissionId);
      const res = await markSubmissionReviewedFn({
        data: { submissionId },
      });
      if (res.success) {
        toast.success("Submission marked as reviewed");
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, status: "reviewed", reviewedAt: new Date().toISOString() } : s))
        );
        if (selectedSnapshot && selectedSnapshot.id === submissionId) {
          setSelectedSnapshot((prev: any) => ({ ...prev, status: "reviewed", reviewedAt: new Date().toISOString() }));
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to mark submission reviewed");
    } finally {
      setReviewingId(null);
    }
  };

  const handleReturnSubmit = async () => {
    if (!returningSubmission) return;
    const msg = returnMessage.trim();
    if (!msg) {
      toast.error("Please enter a message explaining why this report is returned.");
      return;
    }
    try {
      setIsReturning(true);
      const res = await returnBranchSubmissionFn({
        data: {
          submissionId: returningSubmission.id,
          message: msg,
        },
      });
      if (res.success) {
        toast.success("Submission returned to branch manager with feedback.");
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === returningSubmission.id
              ? {
                  ...s,
                  status: "returned",
                  headOfficeMessage: msg,
                  reviewedAt: new Date().toISOString(),
                }
              : s
          )
        );
        if (selectedSnapshot && selectedSnapshot.id === returningSubmission.id) {
          setSelectedSnapshot((prev: any) => ({
            ...prev,
            status: "returned",
            headOfficeMessage: msg,
            reviewedAt: new Date().toISOString(),
          }));
        }
        setReturningSubmission(null);
        setReturnMessage("");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to return submission");
    } finally {
      setIsReturning(false);
    }
  };

  const handleOpenEdit = (sub: any) => {
    setEditingSubmission(sub);
    setEditNotes(sub.notes || "");
    setEditHeadOfficeMessage(sub.headOfficeMessage || "");
    setEditStatus(sub.status || "submitted");
  };

  const handleSaveEdit = async () => {
    if (!editingSubmission) return;
    try {
      setIsUpdating(true);
      const res = await adminUpdateBranchSubmissionFn({
        data: {
          submissionId: editingSubmission.id,
          notes: editNotes,
          headOfficeMessage: editHeadOfficeMessage,
          status: editStatus,
        },
      });
      if (res.success) {
        toast.success("Submission updated successfully!");
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === editingSubmission.id
              ? {
                  ...s,
                  notes: editNotes,
                  headOfficeMessage: editHeadOfficeMessage,
                  status: editStatus,
                }
              : s
          )
        );
        if (selectedSnapshot && selectedSnapshot.id === editingSubmission.id) {
          setSelectedSnapshot((prev: any) => ({
            ...prev,
            notes: editNotes,
            headOfficeMessage: editHeadOfficeMessage,
            status: editStatus,
          }));
        }
        setEditingSubmission(null);
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
        setSubmissions((prev) => prev.filter((s) => s.id !== deletingSubmission.id));
        if (selectedSnapshot && selectedSnapshot.id === deletingSubmission.id) {
          setSelectedSnapshot(null);
        }
        setDeletingSubmission(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete submission");
    } finally {
      setIsDeleting(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "submitted").length;
  const reviewedCount = submissions.filter((s) => s.status === "reviewed").length;
  const returnedCount = submissions.filter((s) => s.status === "returned").length;

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Filter */}
          <div className="w-48">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-40">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Pending Review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubmissions}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Status Counter Pills */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold gap-1 py-1 px-2.5">
            <Clock className="h-3 w-3" />
            {pendingCount} Pending Review
          </Badge>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold gap-1 py-1 px-2.5">
            <CheckCircle2 className="h-3 w-3" />
            {reviewedCount} Reviewed
          </Badge>
          {returnedCount > 0 && (
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold gap-1 py-1 px-2.5">
              <RotateCcw className="h-3 w-3" />
              {returnedCount} Returned
            </Badge>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto vip-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs font-semibold text-ink">Branch</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Period</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Submitted By</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Submitted On</TableHead>
                <TableHead className="text-xs font-semibold text-ink">Status</TableHead>
                <TableHead className="min-w-[180px] text-xs font-semibold text-ink">Manager Notes</TableHead>
                <TableHead className="text-xs font-semibold text-ink text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs">Loading branch report submissions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    No branch report submissions found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((sub) => {
                  const isReviewed = sub.status === "reviewed";
                  const isReturned = sub.status === "returned";
                  const isReviewingThis = reviewingId === sub.id;

                  return (
                    <TableRow key={sub.id} className="text-xs hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-ink">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          {sub.branchName}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium text-slate-700">
                        {sub.periodStart} <span className="text-muted-foreground">to</span> {sub.periodEnd}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-ink">{sub.submitterName}</div>
                        <div className="text-[11px] text-muted-foreground">{sub.submitterEmail}</div>
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
                            Submitted
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[260px]">
                        <p className="truncate text-muted-foreground">{sub.notes || <span className="italic text-slate-400">None</span>}</p>
                        {isReturned && sub.headOfficeMessage && (
                          <div className="mt-1 p-1.5 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 text-[11px] flex items-start gap-1">
                            <MessageSquare className="h-3 w-3 mt-0.5 text-rose-600 shrink-0" />
                            <span className="truncate"><strong className="font-semibold">Returned:</strong> {sub.headOfficeMessage}</span>
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
                            <Eye className="h-3 w-3" />
                            Snapshot
                          </Button>

                          {!isReviewed && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleMarkReviewed(sub.id)}
                                disabled={isReviewingThis}
                                className="h-7 px-2 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-none"
                                title="Approve Report"
                              >
                                {isReviewingThis ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReturningSubmission(sub);
                                  setReturnMessage(sub.headOfficeMessage || "");
                                }}
                                className="h-7 px-2 text-xs gap-1 text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 font-medium"
                                title="Return with Message"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Return
                              </Button>
                            </>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(sub)}
                            className="h-7 px-2 text-xs gap-1 text-slate-700 border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium shadow-none"
                            title="Edit Submission Details"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isDeleting && deletingSubmission?.id === sub.id}
                            onClick={() => setDeletingSubmission(sub)}
                            className="h-7 px-2 text-xs gap-1 text-rose-600 border-rose-200 bg-white hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors font-medium shadow-none"
                            title="Delete Submission"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
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

      {/* Snapshot Modal */}
      {selectedSnapshot && (
        <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <DialogTitle className="text-lg font-bold">
                    {selectedSnapshot.branchName} Report Snapshot
                  </DialogTitle>
                </div>
                {selectedSnapshot.status === "reviewed" ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Reviewed</Badge>
                ) : selectedSnapshot.status === "returned" ? (
                  <Badge className="bg-rose-50 text-rose-700 border-rose-200">Returned</Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Period: {selectedSnapshot.periodStart} to {selectedSnapshot.periodEnd} · Submitted by {selectedSnapshot.submitterName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Returned Feedback Banner inside Snapshot Modal */}
              {selectedSnapshot.status === "returned" && selectedSnapshot.headOfficeMessage && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-800">Head Office Feedback:</span>
                    <p className="mt-0.5 whitespace-pre-wrap">{selectedSnapshot.headOfficeMessage}</p>
                  </div>
                </div>
              )}

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Revenue</span>
                  <span className="text-base font-bold text-ink">
                    {formatAED(selectedSnapshot.snapshotData?.executiveSummary?.totalRevenue || 0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {selectedSnapshot.snapshotData?.executiveSummary?.orderCount || 0} orders
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold text-muted-foreground block">COGS</span>
                  <span className="text-base font-bold text-ink">
                    {formatAED(selectedSnapshot.snapshotData?.executiveSummary?.cogs || 0)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 block">Gross Profit</span>
                  <span className="text-base font-bold text-emerald-700">
                    {formatAED(selectedSnapshot.snapshotData?.executiveSummary?.grossProfit || 0)}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                    {selectedSnapshot.snapshotData?.executiveSummary?.grossMarginPct || 0}% Margin
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Inventory Value</span>
                  <span className="text-base font-bold text-ink">
                    {formatAED(selectedSnapshot.snapshotData?.executiveSummary?.inventoryAssetValue || 0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {selectedSnapshot.snapshotData?.executiveSummary?.totalStockUnits || 0} units
                  </span>
                </div>
              </div>

              {/* Manager Commentary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-ink block mb-1">Branch Manager Commentary:</span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">
                  {selectedSnapshot.notes || "No manager commentary provided."}
                </p>
              </div>

              {/* Top Products from Snapshot */}
              {selectedSnapshot.snapshotData?.salesMargin?.topProducts?.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 border-b border-slate-200">
                    Top Gross Margin Products in Snapshot
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="text-[11px]">
                          <TableHead className="py-1.5 font-semibold">Product</TableHead>
                          <TableHead className="py-1.5 font-semibold text-right">Units</TableHead>
                          <TableHead className="py-1.5 font-semibold text-right">Revenue</TableHead>
                          <TableHead className="py-1.5 font-semibold text-right">Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSnapshot.snapshotData.salesMargin.topProducts.map((p: any) => (
                          <TableRow key={p.productId} className="text-[11px]">
                            <TableCell className="py-1.5 font-medium">{p.productName}</TableCell>
                            <TableCell className="py-1.5 text-right">{p.unitsSold}</TableCell>
                            <TableCell className="py-1.5 text-right">{formatAED(p.revenue)}</TableCell>
                            <TableCell className="py-1.5 text-right font-bold text-emerald-600">{formatAED(p.grossProfit)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between pt-3">
              <Button size="sm" variant="outline" onClick={() => setSelectedSnapshot(null)} className="hover:bg-slate-100 hover:text-slate-900">
                Close
              </Button>

              {selectedSnapshot.status !== "reviewed" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReturningSubmission(selectedSnapshot);
                      setReturnMessage(selectedSnapshot.headOfficeMessage || "");
                    }}
                    className="text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 font-semibold gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Return with Message
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleMarkReviewed(selectedSnapshot.id)}
                    disabled={reviewingId === selectedSnapshot.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Return with Message Dialog */}
      {returningSubmission && (
        <Dialog open={!!returningSubmission} onOpenChange={() => !isReturning && setReturningSubmission(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-rose-600">
                <RotateCcw className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">Return Report to Branch Manager</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Provide feedback explaining why the report for{" "}
                <strong>{returningSubmission.branchName}</strong> ({returningSubmission.periodStart} to {returningSubmission.periodEnd}) is being returned. The Branch Manager will be able to revise and resubmit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="return-msg" className="text-xs font-semibold text-ink">
                  Feedback / Reason for Return <span className="text-rose-500">*</span>
                </Label>
                <textarea
                  id="return-msg"
                  rows={4}
                  value={returnMessage}
                  onChange={(e) => setReturnMessage(e.target.value)}
                  placeholder="e.g. Please verify variance on food inventory, update gross margin commentary, or re-run date range to end of month..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isReturning}
                onClick={() => setReturningSubmission(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isReturning || !returnMessage.trim()}
                onClick={handleReturnSubmit}
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {isReturning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Return with Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Submission Dialog */}
      {editingSubmission && (
        <Dialog open={!!editingSubmission} onOpenChange={() => !isUpdating && setEditingSubmission(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Edit2 className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">Edit Submission Remarks & Status</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Update notes, Head Office feedback, or status for{" "}
                <strong>{editingSubmission.branchName}</strong> ({editingSubmission.periodStart} to {editingSubmission.periodEnd}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-ink">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted" className="text-xs">Submitted (Pending Review)</SelectItem>
                    <SelectItem value="reviewed" className="text-xs">Reviewed (Approved)</SelectItem>
                    <SelectItem value="returned" className="text-xs">Returned (Requires Revision)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-ink">Manager Notes</Label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Manager commentary..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-ink">Head Office Message / Feedback</Label>
                <textarea
                  rows={3}
                  value={editHeadOfficeMessage}
                  onChange={(e) => setEditHeadOfficeMessage(e.target.value)}
                  placeholder="Head Office instructions or feedback..."
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
                onClick={handleSaveEdit}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save Changes
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
                Are you sure you want to permanently delete the submission from{" "}
                <span className="font-semibold text-slate-800">{deletingSubmission.branchName}</span> for{" "}
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
    </div>
  );
}
