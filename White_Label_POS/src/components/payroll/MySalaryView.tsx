import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  AlertCircle,
  RefreshCw,
  Landmark,
  User,
  ShieldCheck,
  Coins,
  ReceiptText,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  getMySalaryProfileFn,
  getMyPayslipsListFn,
  getPayslipDataFn,
} from "@/lib/payroll-server";
import { generatePayslipPdf } from "@/lib/payslip-pdf";

interface MySalaryData {
  hasProfile: boolean;
  employee: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    role: string;
    branchName: string;
    joinDate: string | null;
  };
  salary: {
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: number;
    totalAllowances: number;
    grossSalary: number;
    standardDeductions: number;
    netEstimated: number;
    paymentFrequency: string;
    currency: string;
    bankName: string;
    maskedIban: string | null;
    joinDate: string | null;
    updatedAt: string | null;
  } | null;
}

interface MyPayslipItem {
  itemId: string;
  payrollRunId: string;
  month: string;
  status: string;
  branchName: string;
  grossSalary: number;
  netSalary: number;
  unpaidDays: number;
  unpaidDeduction: number;
  standardDeductions: number;
  approvedAt: string | null;
  paidAt: string | null;
  generatedAt: string | null;
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

const formatAED = (amount?: number) => {
  if (amount === undefined || amount === null) return "AED 0.00";
  return `AED ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function MySalaryView() {
  const [data, setData] = useState<MySalaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Payslips history state
  const [payslips, setPayslips] = useState<MyPayslipItem[]>([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [downloadingRunId, setDownloadingRunId] = useState<string | null>(null);

  const fetchMySalary = async () => {
    try {
      setLoading(true);
      const res = await getMySalaryProfileFn();
      if (res.success) {
        setData(res as MySalaryData);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load salary profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPayslips = async () => {
    try {
      setLoadingPayslips(true);
      const res = await getMyPayslipsListFn();
      if (res.success) {
        setPayslips(res.payslips as MyPayslipItem[]);
      }
    } catch (err: any) {
      // non-blocking
    } finally {
      setLoadingPayslips(false);
    }
  };

  useEffect(() => {
    fetchMySalary();
    fetchMyPayslips();
  }, []);

  const handleDownloadPayslip = async (payrollRunId: string) => {
    try {
      setDownloadingRunId(payrollRunId);
      const res = await getPayslipDataFn({
        data: { payrollRunId },
      });
      if (res.success && res.payslip) {
        generatePayslipPdf(res.payslip as any);
        toast.success("Payslip PDF generated and downloaded successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download payslip");
    } finally {
      setDownloadingRunId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[350px]">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading your confidential salary profile...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-ink">Unable to load salary data</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Please check your connection or contact your branch administrator.
        </p>
        <Button variant="outline" size="sm" onClick={fetchMySalary}>
          Retry
        </Button>
      </div>
    );
  }

  const { employee, salary, hasProfile } = data;

  return (
    <div className="space-y-6">
      {/* 1. Header & Identity Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-ink">{employee.name}</h2>
                <Badge variant="outline" className="text-xs font-semibold capitalize">
                  {roleLabelMap[employee.role] || employee.role}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {employee.branchName}
                </span>
                {employee.email && <span>• {employee.email}</span>}
                {employee.joinDate && (
                  <span className="flex items-center gap-1">
                    • <Calendar className="h-3.5 w-3.5" /> Joined: {employee.joinDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1 gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Private Self-View
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchMySalary();
                fetchMyPayslips();
              }}
              className="h-8 gap-1 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Empty State (If HR has not set up profile yet) */}
      {!hasProfile || !salary ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-8 text-center space-y-3 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-ink">Salary Profile Pending</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Your salary profile has not yet been configured by Head Office HR.
            Please contact your manager if you have questions.
          </p>
        </div>
      ) : (
        <>
          {/* 3. Four Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Basic Salary */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Basic Salary
                </span>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-ink">
                {formatAED(salary.basicSalary)}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Contracted base compensation
              </p>
            </div>

            {/* Total Allowances */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Allowances
                </span>
                <Coins className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                +{formatAED(salary.totalAllowances)}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Housing, transport & other
              </p>
            </div>

            {/* Gross Compensation */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Gross Compensation
                </span>
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-ink">
                {formatAED(salary.grossSalary)}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Basic + all fixed allowances
              </p>
            </div>

            {/* Estimated Net Pay */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Estimated Net Pay
                </span>
                <ReceiptText className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {formatAED(salary.netEstimated)}
              </div>
              <p className="text-[11px] text-emerald-800/80 font-medium">
                Gross minus standard deductions
              </p>
            </div>
          </div>

          {/* 4. Two-Column Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Itemized Earnings & Allowances */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Banknote className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Monthly Earnings Breakdown</h3>
                  <p className="text-xs text-muted-foreground">Detailed view of allowances</p>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-sm">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Basic Salary</span>
                  <span className="font-semibold text-ink">{formatAED(salary.basicSalary)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Housing Allowance</span>
                  <span className="font-medium text-ink">{formatAED(salary.housingAllowance)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Transport Allowance</span>
                  <span className="font-medium text-ink">{formatAED(salary.transportAllowance)}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Other Allowances</span>
                  <span className="font-medium text-ink">{formatAED(salary.otherAllowances)}</span>
                </div>
                <div className="pt-3 flex items-center justify-between font-bold text-ink text-base">
                  <span>Total Gross Monthly</span>
                  <span className="text-emerald-600">{formatAED(salary.grossSalary)}</span>
                </div>
              </div>
            </div>

            {/* Right: Deductions & Banking Details */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Deductions & Disbursement Terms</h3>
                  <p className="text-xs text-muted-foreground">Standard terms and banking details</p>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-sm">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Standard Deductions</span>
                  <span className="font-medium text-amber-700">
                    {salary.standardDeductions > 0
                      ? `-${formatAED(salary.standardDeductions)}`
                      : "AED 0.00"}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Payment Frequency</span>
                  <span className="font-semibold text-ink capitalize">{salary.paymentFrequency}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Currency</span>
                  <span className="font-mono font-semibold text-ink">{salary.currency}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Bank Name</span>
                  <span className="font-medium text-ink">{salary.bankName || "Not configured"}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Account / IBAN</span>
                  <span className="font-mono text-xs text-ink bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    {salary.maskedIban || "Not configured"}
                  </span>
                </div>
              </div>

              {salary.updatedAt && (
                <p className="text-[11px] text-muted-foreground pt-1 italic">
                  Profile last updated on {new Date(salary.updatedAt).toLocaleDateString("en-AE", { dateStyle: "medium" })}
                </p>
              )}
            </div>
          </div>

          {/* 5. My Payslips History Section (Phase 5) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">My Official Payslips</h3>
                  <p className="text-xs text-muted-foreground">Download PDF statements of past approved and paid salary runs</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMyPayslips}
                disabled={loadingPayslips}
                className="h-8 gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${loadingPayslips ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/75 hover:bg-gray-50/75">
                    <TableHead className="text-xs font-semibold text-muted-foreground min-w-[120px]">Month</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground min-w-[100px]">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[110px]">Gross Salary</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[110px]">Deductions</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[120px] font-bold">Net Salary</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground min-w-[130px]">Approved / Paid</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[130px] pr-4">Payslip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPayslips ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-xs">Loading payslips history...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : payslips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                        No finalized payslips available yet. When monthly payroll is approved by management, your official payslips will appear here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payslips.map((p) => {
                      const totalDeductions = p.unpaidDeduction + p.standardDeductions;
                      const isPaid = p.status === "Paid";

                      return (
                        <TableRow key={p.itemId} className="text-xs hover:bg-gray-50/50">
                          {/* Month */}
                          <TableCell className="font-semibold text-ink">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              {p.month}
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {isPaid ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold gap-1 text-[10px]">
                                <Banknote className="h-3 w-3" />
                                Paid
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold gap-1 text-[10px]">
                                <CheckCircle2 className="h-3 w-3" />
                                Approved
                              </Badge>
                            )}
                          </TableCell>

                          {/* Gross */}
                          <TableCell className="text-right font-medium">
                            {formatAED(p.grossSalary)}
                          </TableCell>

                          {/* Deductions */}
                          <TableCell className="text-right text-rose-600 font-medium">
                            {totalDeductions > 0 ? `-${formatAED(totalDeductions)}` : "AED 0.00"}
                          </TableCell>

                          {/* Net Pay */}
                          <TableCell className="text-right font-bold text-emerald-700">
                            {formatAED(p.netSalary)}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-muted-foreground">
                            {p.paidAt
                              ? `Paid: ${new Date(p.paidAt).toLocaleDateString("en-AE")}`
                              : p.approvedAt
                              ? `Approved: ${new Date(p.approvedAt).toLocaleDateString("en-AE")}`
                              : "-"}
                          </TableCell>

                          {/* Download Button */}
                          <TableCell className="text-right pr-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPayslip(p.payrollRunId)}
                              disabled={downloadingRunId === p.payrollRunId}
                              className="h-7 px-2.5 text-xs gap-1.5 text-ink hover:bg-slate-50 border-gray-200 font-medium"
                            >
                              {downloadingRunId === p.payrollRunId ? (
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              ) : (
                                <Download className="h-3 w-3 text-emerald-600" />
                              )}
                              Download PDF
                            </Button>
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
    </div>
  );
}

