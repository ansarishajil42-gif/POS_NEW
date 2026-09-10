import { useState, useEffect, useMemo } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Coins,
  Calendar,
  Building2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  Banknote,
  Plus,
  Eye,
  Trash2,
  Check,
  CreditCard,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  CalendarCheck2,
  Download,
} from "lucide-react";
import {
  getPayrollRunsFn,
  getPayrollRunDetailFn,
  generatePayrollRunFn,
  regenerateDraftPayrollRunFn,
  approvePayrollRunFn,
  markPayrollRunPaidFn,
  deletePayrollRunFn,
  getPayslipDataFn,
} from "@/lib/payroll-server";
import { generatePayslipPdf } from "@/lib/payslip-pdf";

interface PayrollRunItem {
  id: string;
  branchId: string | null;
  branchName: string;
  month: string;
  status: string; // 'Draft' | 'Approved' | 'Paid'
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  generatedByName: string;
  generatedAt: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

interface PayrollItemDetail {
  id: string;
  staffUserId: string;
  staffName: string;
  staffEmail: string | null;
  staffPhone: string;
  staffRole: string;
  branchName: string;
  basicSalary: number;
  totalAllowances: number;
  grossSalary: number;
  unpaidDays: number;
  unpaidDeduction: number;
  standardDeductions: number;
  netSalary: number;
  notes: string | null;
  bankName: string;
  iban: string;
}

const roleLabelMap: Record<string, string> = {
  super_admin: "Super Admin",
  head_office_admin: "Head Office Admin",
  branch_manager: "Branch Manager",
  inventory_manager: "Inventory Manager",
  purchasing_officer: "Purchasing Officer",
  cashier: "Cashier",
  vendor: "Vendor",
};

const formatAED = (amount: number) => {
  return `AED ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function PayrollRunsTab() {
  const [runs, setRuns] = useState<PayrollRunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Generate modal state
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(currentMonthStr);
  const [genBranch, setGenBranch] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRunItem | null>(null);
  const [runItems, setRunItems] = useState<PayrollItemDetail[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PayrollRunItem | null>(null);
  const [downloadingStaffId, setDownloadingStaffId] = useState<string | null>(null);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await getPayrollRunsFn({
        data: {
          branchId: selectedBranch,
          status: selectedStatus,
        },
      });
      if (res.success) {
        setRuns(res.runs as PayrollRunItem[]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load payroll runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [selectedBranch, selectedStatus]);

  // Extract unique branches
  const branches = useMemo(() => {
    const map = new Map<string, string>();
    runs.forEach((r) => {
      if (r.branchId && r.branchName && r.branchName !== "All Branches") {
        map.set(r.branchId, r.branchName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [runs]);

  // KPI calculations
  const totalRunsCount = runs.length;
  const draftCount = runs.filter((r) => r.status === "Draft").length;
  const totalDisbursed = runs
    .filter((r) => r.status === "Paid")
    .reduce((sum, r) => sum + r.totalNet, 0);
  const totalDraftLiability = runs
    .filter((r) => r.status === "Draft" || r.status === "Approved")
    .reduce((sum, r) => sum + r.totalNet, 0);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const res = await generatePayrollRunFn({
        data: {
          month: genMonth,
          branchId: genBranch,
        },
      });
      if (res.success) {
        toast.success(
          `Draft payroll run for ${genMonth} generated successfully (${res.itemCount} employees, Net AED ${res.totalNet})`
        );
        setGenerateModalOpen(false);
        fetchRuns();
        if (res.payrollRunId) {
          handleOpenDetailById(res.payrollRunId);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate payroll run");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenDetail = async (run: PayrollRunItem) => {
    setSelectedRun(run);
    setDetailModalOpen(true);
    try {
      setLoadingDetail(true);
      const res = await getPayrollRunDetailFn({
        data: { payrollRunId: run.id },
      });
      if (res.success) {
        setSelectedRun(res.run as PayrollRunItem);
        setRunItems(res.items as PayrollItemDetail[]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load payroll run details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenDetailById = async (payrollRunId: string) => {
    setDetailModalOpen(true);
    try {
      setLoadingDetail(true);
      const res = await getPayrollRunDetailFn({
        data: { payrollRunId },
      });
      if (res.success) {
        setSelectedRun(res.run as PayrollRunItem);
        setRunItems(res.items as PayrollItemDetail[]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load payroll run details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedRun) return;
    try {
      setActionLoading(true);
      const res = await regenerateDraftPayrollRunFn({
        data: { payrollRunId: selectedRun.id },
      });
      if (res.success) {
        toast.success("Payroll run recalculated with latest attendance and leave data!");
        handleOpenDetailById(selectedRun.id);
        fetchRuns();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate payroll calculations");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRun) return;
    try {
      setActionLoading(true);
      const res = await approvePayrollRunFn({
        data: { payrollRunId: selectedRun.id },
      });
      if (res.success) {
        toast.success("Payroll run approved and figures permanently locked!");
        handleOpenDetailById(selectedRun.id);
        fetchRuns();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve payroll run");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedRun) return;
    try {
      setActionLoading(true);
      const res = await markPayrollRunPaidFn({
        data: { payrollRunId: selectedRun.id },
      });
      if (res.success) {
        toast.success("Payroll run marked as Paid!");
        handleOpenDetailById(selectedRun.id);
        fetchRuns();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to mark payroll run as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRun = async () => {
    if (!itemToDelete) return;
    try {
      setActionLoading(true);
      const res = await deletePayrollRunFn({
        data: { payrollRunId: itemToDelete.id },
      });
      if (res.success) {
        toast.success("Draft payroll run deleted successfully.");
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
        if (detailModalOpen && selectedRun?.id === itemToDelete.id) {
          setDetailModalOpen(false);
        }
        fetchRuns();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete payroll run");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPayslip = async (staffUserId: string) => {
    if (!selectedRun) return;
    try {
      setDownloadingStaffId(staffUserId);
      const res = await getPayslipDataFn({
        data: {
          payrollRunId: selectedRun.id,
          staffUserId,
        },
      });
      if (res.success && res.payslip) {
        generatePayslipPdf(res.payslip as any);
        toast.success("Payslip PDF generated and downloaded successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate payslip PDF");
    } finally {
      setDownloadingStaffId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Payroll Runs
            </span>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{totalRunsCount}</span>
            <span className="text-xs text-muted-foreground">recorded periods</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Drafts / Pending
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{draftCount}</span>
            <span className="text-xs text-muted-foreground">runs in draft</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Net Liability
            </span>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-ink">{formatAED(totalDraftLiability)}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Draft + Approved runs</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Disbursed (Paid)
            </span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600">{formatAED(totalDisbursed)}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Completed salary disbursements</span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Branch Filter */}
          <div className="w-full sm:w-48">
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
                <SelectItem value="Draft" className="text-xs">Draft</SelectItem>
                <SelectItem value="Approved" className="text-xs">Approved</SelectItem>
                <SelectItem value="Paid" className="text-xs">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRuns}
            disabled={loading}
            className="h-9 gap-1.5 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setGenerateModalOpen(true)}
            className="h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            Generate Payroll Run
          </Button>
        </div>
      </div>

      {/* Payroll Runs List Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto vip-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75 hover:bg-gray-50/75 border-b border-gray-200">
                <TableHead className="sticky left-0 bg-gray-50/95 backdrop-blur-sm z-20 shadow-[4px_0_8px_rgba(0,0,0,0.06)] border-r border-gray-200/80 text-xs font-semibold text-muted-foreground min-w-[140px] pl-4">
                  Month
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[130px] whitespace-nowrap">Scope</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[110px] whitespace-nowrap">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[120px] whitespace-nowrap">Total Gross</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[120px] whitespace-nowrap">Deductions</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[130px] whitespace-nowrap font-bold">Total Net Pay</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[140px] whitespace-nowrap">Generated By / At</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground min-w-[130px] whitespace-nowrap">Approved Date</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[140px] whitespace-nowrap pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-xs">Loading payroll runs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-4">
                      <FileSpreadsheet className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No payroll runs found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Generate a monthly payroll run to calculate basic, allowances, unexcused absence/unpaid leave deductions, and net pay.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setGenerateModalOpen(true)}
                        className="mt-2 text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Generate Payroll Run
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((r) => {
                  const isDraft = r.status === "Draft";
                  const isApproved = r.status === "Approved";
                  const isPaid = r.status === "Paid";

                  return (
                    <TableRow key={r.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-100">
                      {/* Month - Sticky Left Column */}
                      <TableCell className="sticky left-0 bg-white group-hover:bg-gray-50/95 backdrop-blur-sm z-10 shadow-[4px_0_8px_rgba(0,0,0,0.06)] border-r border-gray-200/80 min-w-[140px] pl-4 transition-colors">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-bold text-sm text-ink">{r.month}</span>
                        </div>
                      </TableCell>

                      {/* Scope */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span>{r.branchName}</span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="whitespace-nowrap">
                        {isPaid ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold gap-1 text-[11px]">
                            <Banknote className="h-3 w-3" />
                            Paid
                          </Badge>
                        ) : isApproved ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-semibold gap-1 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-semibold gap-1 text-[11px]">
                            <Clock className="h-3 w-3" />
                            Draft
                          </Badge>
                        )}
                      </TableCell>

                      {/* Total Gross */}
                      <TableCell className="text-right text-xs whitespace-nowrap font-medium text-slate-700">
                        {formatAED(r.totalGross)}
                      </TableCell>

                      {/* Deductions */}
                      <TableCell className="text-right text-xs whitespace-nowrap text-rose-600 font-medium">
                        {r.totalDeductions > 0 ? `-${formatAED(r.totalDeductions)}` : "AED 0.00"}
                      </TableCell>

                      {/* Total Net */}
                      <TableCell className="text-right whitespace-nowrap">
                        <span className="font-bold text-sm text-ink">{formatAED(r.totalNet)}</span>
                      </TableCell>

                      {/* Generated By / At */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-ink">{r.generatedByName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {r.generatedAt ? new Date(r.generatedAt).toLocaleDateString("en-AE") : "-"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Approved Date */}
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {r.approvedAt ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-700">{r.approvedByName || "Admin"}</span>
                            <span className="text-[10px]">{new Date(r.approvedAt).toLocaleDateString("en-AE")}</span>
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Not approved</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right whitespace-nowrap pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(r)}
                            className="h-8 px-2.5 text-xs gap-1.5 text-ink hover:bg-slate-50 border-gray-200 font-medium"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Breakdown
                          </Button>

                          {isDraft && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setItemToDelete(r);
                                setDeleteConfirmOpen(true);
                              }}
                              className="h-8 px-2 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                              title="Delete draft run"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* Generate Payroll Run Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleGenerate}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Coins className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">Generate Payroll Run</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Computes Gross salaries, prorated unpaid leave & unexcused absence deductions (/30 rate), and freezes calculated figures in a Draft payroll run.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="payroll-month" className="text-xs font-semibold text-ink">
                  Payroll Month <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="payroll-month"
                  type="month"
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payroll-branch" className="text-xs font-semibold text-ink">
                  Branch Scope
                </Label>
                <Select value={genBranch} onValueChange={setGenBranch}>
                  <SelectTrigger id="payroll-branch" className="text-xs h-9">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Branches (Organization-wide)</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Select a specific branch or run for all branches simultaneously.
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  Formula Applied:
                </div>
                <p>
                  • <strong>Gross</strong> = Basic + Housing + Transport + Other Allowances<br />
                  • <strong>Daily Rate</strong> = Gross / 30<br />
                  • <strong>Unpaid Deduction</strong> = Daily Rate × (Approved Unpaid Leaves + Absent Days)<br />
                  • <strong>Net Pay</strong> = Gross − Unpaid Deduction − Standard Deductions
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isGenerating}
                onClick={() => setGenerateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isGenerating}
                className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Coins className="h-3.5 w-3.5" />
                    Calculate & Create Draft
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Itemized Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-ink">
                    Payroll Run: {selectedRun?.month}
                  </DialogTitle>
                  {selectedRun?.status === "Paid" ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold gap-1 text-[11px]">
                      <Banknote className="h-3 w-3" />
                      Paid
                    </Badge>
                  ) : selectedRun?.status === "Approved" ? (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved (Locked)
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      Draft
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Scope: <strong className="text-ink">{selectedRun?.branchName}</strong> • Generated by{" "}
                  {selectedRun?.generatedByName} on{" "}
                  {selectedRun?.generatedAt ? new Date(selectedRun.generatedAt).toLocaleDateString("en-AE") : "-"}
                </DialogDescription>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2">
                {selectedRun?.status === "Draft" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      onClick={handleRegenerate}
                      className="h-8 px-2.5 text-xs gap-1.5"
                      title="Recalculate with latest leave and attendance records"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                      Regenerate
                    </Button>

                    <Button
                      size="sm"
                      disabled={actionLoading}
                      onClick={handleApprove}
                      className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                      title="Approve and permanently lock calculated figures"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve Run
                    </Button>
                  </>
                )}

                {selectedRun?.status === "Approved" && (
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={handleMarkPaid}
                    className="h-8 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                    title="Mark payroll run as Paid"
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    Mark as Paid
                  </Button>
                )}

                {selectedRun?.status === "Paid" && selectedRun.paidAt && (
                  <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Paid on {new Date(selectedRun.paidAt).toLocaleDateString("en-AE")}
                  </span>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Run Totals Strip */}
          {selectedRun && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200 text-center">
              <div>
                <span className="text-[11px] text-muted-foreground block">Total Employees</span>
                <span className="text-sm font-bold text-ink">{runItems.length}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Total Gross</span>
                <span className="text-sm font-bold text-ink">{formatAED(selectedRun.totalGross)}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Total Deductions</span>
                <span className="text-sm font-bold text-rose-600">
                  {selectedRun.totalDeductions > 0 ? `-${formatAED(selectedRun.totalDeductions)}` : "AED 0.00"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Total Net Pay</span>
                <span className="text-sm font-black text-emerald-700">{formatAED(selectedRun.totalNet)}</span>
              </div>
            </div>
          )}

          {/* Itemized Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mt-1">
            <div className="overflow-x-auto vip-scrollbar max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold text-muted-foreground min-w-[180px]">Employee</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground min-w-[120px]">Branch</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[100px]">Basic</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[100px]">Allowances</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[105px]">Gross</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center min-w-[100px]">Unpaid Days</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[110px]">Unpaid Ded.</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[100px]">Std Ded.</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[115px] font-bold">Net Pay</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground min-w-[150px]">Bank / IBAN</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[120px] pr-4">Payslip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDetail ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-xs">Loading itemized calculations...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : runItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center text-xs text-muted-foreground">
                        No employees found in this payroll run.
                      </TableCell>
                    </TableRow>
                  ) : (
                    runItems.map((item) => (
                      <TableRow key={item.id} className="text-xs hover:bg-gray-50/50">
                        {/* Employee */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink">{item.staffName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {roleLabelMap[item.staffRole] || item.staffRole}
                            </span>
                          </div>
                        </TableCell>

                        {/* Branch */}
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {item.branchName}
                        </TableCell>

                        {/* Basic */}
                        <TableCell className="text-right whitespace-nowrap font-medium">
                          {formatAED(item.basicSalary)}
                        </TableCell>

                        {/* Allowances */}
                        <TableCell className="text-right whitespace-nowrap text-emerald-700">
                          {item.totalAllowances > 0 ? `+${formatAED(item.totalAllowances)}` : "0.00"}
                        </TableCell>

                        {/* Gross */}
                        <TableCell className="text-right whitespace-nowrap font-semibold text-ink">
                          {formatAED(item.grossSalary)}
                        </TableCell>

                        {/* Unpaid Days */}
                        <TableCell className="text-center whitespace-nowrap">
                          {item.unpaidDays > 0 ? (
                            <Badge
                              className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold cursor-help"
                              title={item.notes || "Unpaid leave/absence days"}
                            >
                              {item.unpaidDays} {item.unpaidDays === 1 ? "day" : "days"}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/60 text-[11px]">0</span>
                          )}
                        </TableCell>

                        {/* Unpaid Deduction */}
                        <TableCell className="text-right whitespace-nowrap text-rose-600 font-medium">
                          {item.unpaidDeduction > 0 ? `-${formatAED(item.unpaidDeduction)}` : "0.00"}
                        </TableCell>

                        {/* Std Deduction */}
                        <TableCell className="text-right whitespace-nowrap text-rose-600 font-medium">
                          {item.standardDeductions > 0 ? `-${formatAED(item.standardDeductions)}` : "0.00"}
                        </TableCell>

                        {/* Net Pay */}
                        <TableCell className="text-right whitespace-nowrap font-bold text-emerald-700 text-sm">
                          {formatAED(item.netSalary)}
                        </TableCell>

                        {/* Bank info */}
                        <TableCell className="whitespace-nowrap">
                          {item.bankName && item.bankName !== "Not set" ? (
                            <div className="flex flex-col max-w-[150px]">
                              <span className="text-xs font-medium text-ink truncate">{item.bankName}</span>
                              <span className="text-[10px] text-muted-foreground truncate font-mono">
                                {item.iban || "No IBAN"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic">Not set</span>
                          )}
                        </TableCell>

                        {/* Download Payslip Button */}
                        <TableCell className="text-right whitespace-nowrap pr-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPayslip(item.staffUserId)}
                            disabled={downloadingStaffId === item.staffUserId}
                            className="h-7 px-2 text-[11px] gap-1 text-slate-700 hover:text-slate-900 border-gray-200"
                            title="Download Payslip PDF"
                          >
                            {downloadingStaffId === item.staffUserId ? (
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            ) : (
                              <Download className="h-3 w-3 text-emerald-600" />
                            )}
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDetailModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <Trash2 className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">Delete Draft Payroll Run</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete the draft payroll run for{" "}
              <strong className="text-ink">{itemToDelete?.month}</strong> ({itemToDelete?.branchName})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionLoading}
              onClick={handleDeleteRun}
              className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Draft
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
