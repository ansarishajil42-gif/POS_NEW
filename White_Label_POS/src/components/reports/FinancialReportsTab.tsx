import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getExecutiveFinancialSummaryFn,
  getSalesMarginAnalysisFn,
  getAccountsPayableAgingFn,
  getInventoryValuationFn,
  getVatReturnSummaryFn,
  getReportBranchesServerFn,
} from "@/lib/reports-server";
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
  TrendingUp,
  ShoppingBag,
  Percent,
  Receipt,
  Warehouse,
  Calendar,
  Building2,
  RefreshCw,
  Info,
  Coins,
  ArrowUpRight,
  CreditCard,
  Store,
  Layers,
  BarChart3,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldAlert,
  Download,
  Send,
} from "lucide-react";
import { BranchSubmissionsSubView } from "./BranchSubmissionsSubView";
import {
  generateExecutiveSummaryPdf,
  generateSalesMarginPdf,
  generateApAgingPdf,
  generateInventoryValuationPdf,
  generateVatReturnPdf,
} from "@/lib/financial-report-pdf";

interface FinancialReportsTabProps {
  selectedTenantId?: string;
  isSuperAdmin?: boolean;
}

export function FinancialReportsTab({
  selectedTenantId,
  isSuperAdmin,
}: FinancialReportsTabProps) {
  // Sub-view switcher state: Executive Summary vs Sales & Margin Analysis vs A/P Aging vs Inventory Valuation vs VAT Return
  const [activeSubView, setActiveSubView] = useState<
    "executive" | "sales_margin" | "ap_aging" | "inventory_val" | "vat_return" | "branch_submissions"
  >("executive");

  // Default to current month (e.g. 1st of current month to today)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [branchId, setBranchId] = useState<string>("all");

  // Fetch branches for filter
  const { data: branchesRes } = useQuery({
    queryKey: ["report-branches", selectedTenantId],
    queryFn: async () =>
      await getReportBranchesServerFn({
        data: { tenantId: selectedTenantId || undefined },
      }),
  });

  // Fetch Executive Financial Summary
  const {
    data: summaryRes,
    isLoading: isSummaryLoading,
    isRefetching: isSummaryRefetching,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: [
      "executive-financial-summary",
      startDate,
      endDate,
      branchId,
      selectedTenantId,
    ],
    queryFn: async () =>
      await getExecutiveFinancialSummaryFn({
        data: {
          startDate,
          endDate,
          branchId: branchId === "all" ? undefined : branchId,
          tenantId: selectedTenantId || undefined,
        },
      }),
    enabled: activeSubView === "executive",
  });

  // Fetch Sales & Margin Analysis
  const {
    data: marginRes,
    isLoading: isMarginLoading,
    isRefetching: isMarginRefetching,
    refetch: refetchMargin,
  } = useQuery({
    queryKey: [
      "sales-margin-analysis",
      startDate,
      endDate,
      branchId,
      selectedTenantId,
    ],
    queryFn: async () =>
      await getSalesMarginAnalysisFn({
        data: {
          startDate,
          endDate,
          branchId: branchId === "all" ? undefined : branchId,
          tenantId: selectedTenantId || undefined,
        },
      }),
    enabled: activeSubView === "sales_margin",
  });

  // Fetch Accounts Payable Aging
  const {
    data: apAgingRes,
    isLoading: isApAgingLoading,
    isRefetching: isApAgingRefetching,
    refetch: refetchApAging,
  } = useQuery({
    queryKey: [
      "ap-aging-analysis",
      branchId,
      selectedTenantId,
    ],
    queryFn: async () =>
      await getAccountsPayableAgingFn({
        data: {
          branchId: branchId === "all" ? undefined : branchId,
          tenantId: selectedTenantId || undefined,
        },
      }),
    enabled: activeSubView === "ap_aging",
  });

  // Fetch Inventory Valuation
  const {
    data: invValRes,
    isLoading: isInvValLoading,
    isRefetching: isInvValRefetching,
    refetch: refetchInvVal,
  } = useQuery({
    queryKey: [
      "inventory-valuation-analysis",
      branchId,
      selectedTenantId,
    ],
    queryFn: async () =>
      await getInventoryValuationFn({
        data: {
          branchId: branchId === "all" ? undefined : branchId,
          tenantId: selectedTenantId || undefined,
        },
      }),
    enabled: activeSubView === "inventory_val",
  });

  // Fetch Full UAE VAT Return
  const {
    data: vatReturnRes,
    isLoading: isVatReturnLoading,
    isRefetching: isVatReturnRefetching,
    refetch: refetchVatReturn,
  } = useQuery({
    queryKey: [
      "full-vat-return-analysis",
      startDate,
      endDate,
      branchId,
      selectedTenantId,
    ],
    queryFn: async () =>
      await getVatReturnSummaryFn({
        data: {
          startDate,
          endDate,
          branchId: branchId === "all" ? undefined : branchId,
          tenantId: selectedTenantId || undefined,
        },
      }),
    enabled: activeSubView === "vat_return",
  });

  const summary = summaryRes?.success ? summaryRes.data : null;
  const marginData = marginRes?.success ? marginRes.data : null;
  const apAgingData = apAgingRes?.success ? apAgingRes.data : null;
  const invValData = invValRes?.success ? invValRes.data : null;
  const vatReturnData = vatReturnRes?.success ? vatReturnRes.data : null;

  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const selectedBranchObj = branchesRes?.branches?.find((b: any) => b.id === branchId);
  const currentBranchName = branchId === "all" ? "All Branches" : selectedBranchObj?.name || "Selected Branch";

  const isCurrentDataReady =
    activeSubView === "executive"
      ? !!summary
      : activeSubView === "sales_margin"
      ? !!marginData
      : activeSubView === "ap_aging"
      ? !!apAgingData
      : activeSubView === "inventory_val"
      ? !!invValData
      : !!vatReturnData;

  const handleDownloadPdf = () => {
    setIsPdfGenerating(true);
    try {
      const filters = {
        startDate,
        endDate,
        branchName: currentBranchName,
        asOfDate: todayStr,
        trn: vatReturnData?.trn,
      };

      if (activeSubView === "executive" && summary) {
        generateExecutiveSummaryPdf(summary, filters);
      } else if (activeSubView === "sales_margin" && marginData) {
        generateSalesMarginPdf(marginData, filters);
      } else if (activeSubView === "ap_aging" && apAgingData) {
        generateApAgingPdf(apAgingData, filters);
      } else if (activeSubView === "inventory_val" && invValData) {
        generateInventoryValuationPdf(invValData, filters);
      } else if (activeSubView === "vat_return" && vatReturnData) {
        generateVatReturnPdf(vatReturnData, filters);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleRefresh = () => {
    if (activeSubView === "executive") {
      refetchSummary();
    } else if (activeSubView === "sales_margin") {
      refetchMargin();
    } else if (activeSubView === "ap_aging") {
      refetchApAging();
    } else if (activeSubView === "inventory_val") {
      refetchInvVal();
    } else {
      refetchVatReturn();
    }
  };

  const isCurrentLoading =
    activeSubView === "executive"
      ? isSummaryLoading || isSummaryRefetching
      : activeSubView === "sales_margin"
      ? isMarginLoading || isMarginRefetching
      : activeSubView === "ap_aging"
      ? isApAgingLoading || isApAgingRefetching
      : activeSubView === "inventory_val"
      ? isInvValLoading || isInvValRefetching
      : isVatReturnLoading || isVatReturnRefetching;

  // Preset Date Handlers
  const handleSetPreset = (preset: "thisMonth" | "lastMonth" | "last30Days" | "ytd") => {
    const d = new Date();
    if (preset === "thisMonth") {
      setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]);
      setEndDate(d.toISOString().split("T")[0]);
    } else if (preset === "lastMonth") {
      const startLastMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const endLastMonth = new Date(d.getFullYear(), d.getMonth(), 0);
      setStartDate(startLastMonth.toISOString().split("T")[0]);
      setEndDate(endLastMonth.toISOString().split("T")[0]);
    } else if (preset === "last30Days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(d.getDate() - 30);
      setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
      setEndDate(d.toISOString().split("T")[0]);
    } else if (preset === "ytd") {
      setStartDate(new Date(d.getFullYear(), 0, 1).toISOString().split("T")[0]);
      setEndDate(d.toISOString().split("T")[0]);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "0.00";
    return Number(val).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sub-View Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <Button
          variant={activeSubView === "executive" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubView("executive")}
          className="rounded-xl font-bold text-xs"
        >
          <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
          Executive Summary
        </Button>

        <Button
          variant={activeSubView === "sales_margin" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubView("sales_margin")}
          className="rounded-xl font-bold text-xs"
        >
          <Percent className="h-3.5 w-3.5 mr-1.5" />
          Sales & Margin Analysis
        </Button>

        <Button
          variant={activeSubView === "ap_aging" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubView("ap_aging")}
          className="rounded-xl font-bold text-xs"
        >
          <Receipt className="h-3.5 w-3.5 mr-1.5" />
          Accounts Payable Aging
        </Button>

        <Button
          variant={activeSubView === "inventory_val" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubView("inventory_val")}
          className="rounded-xl font-bold text-xs"
        >
          <Warehouse className="h-3.5 w-3.5 mr-1.5" />
          Inventory Valuation
        </Button>

        <Button
          variant={activeSubView === "vat_return" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubView("vat_return")}
          className="rounded-xl font-bold text-xs"
        >
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          VAT Return
        </Button>

        <Button
          variant={activeSubView === "branch_submissions" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubView("branch_submissions")}
          className="rounded-xl font-bold text-xs"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Branch Submissions
        </Button>
      </div>

      {/* Header & Controls Toolbar (Shared across all sub-views) */}
      {activeSubView !== "branch_submissions" && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-ink">
                {activeSubView === "executive"
                  ? "Executive Financial Summary"
                  : activeSubView === "sales_margin"
                  ? "Sales & Margin Breakdown"
                  : activeSubView === "ap_aging"
                  ? "Accounts Payable Aging"
                  : activeSubView === "inventory_val"
                  ? "Inventory Asset Valuation"
                  : "Full UAE VAT 201 Return"}
              </h2>
              <Badge
                variant="outline"
                className="bg-[#39ff14]/15 text-[#25b507] border-[#39ff14]/40 font-bold text-xs"
              >
                Live Metrics
              </Badge>
              {activeSubView === "vat_return" && vatReturnData?.trn && (
                <Badge variant="outline" className="text-[11px] font-mono bg-slate-50 text-slate-700 border-slate-200">
                  TRN: {vatReturnData.trn}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeSubView === "executive" 
                ? "High-level operational revenue, direct product margins, real-time inventory assets, and outstanding liabilities."
                : activeSubView === "sales_margin"
                ? "Detailed revenue distribution by payment tender, fulfillment channel, and top gross-margin products."
                : activeSubView === "ap_aging"
                ? "Real-time vendor liability maturity breakdown categorized by overdue aging buckets as of today."
                : activeSubView === "inventory_val"
                ? "Real-time stock valuation assessed at cost and retail price with potential gross margin analysis."
                : "Operational UAE Federal Tax Authority VAT 201 statement tracking Box 1 Output VAT against Box 9 Input VAT."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={!isCurrentDataReady || isCurrentLoading || isPdfGenerating}
              className="rounded-xl h-8 px-3 text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-200"
            >
              <Download className={`h-3.5 w-3.5 mr-1.5 ${isPdfGenerating ? "animate-bounce text-primary" : "text-primary"}`} />
              {isPdfGenerating ? "Generating PDF..." : "Download PDF"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isCurrentLoading}
              className="rounded-xl h-8 px-3 text-xs font-semibold"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${isCurrentLoading ? "animate-spin text-primary" : ""}`}
              />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 pt-2 border-t border-slate-100">
          <div className="space-y-1.5 flex-1 min-w-[140px]">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> Start Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs rounded-xl bg-surface"
            />
          </div>

          <div className="space-y-1.5 flex-1 min-w-[140px]">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> End Date
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs rounded-xl bg-surface"
            />
          </div>

          <div className="space-y-1.5 flex-1 min-w-[170px]">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" /> Branch Filter
            </Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="h-9 text-xs rounded-xl bg-surface">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branchesRes?.success &&
                  branchesRes.branches?.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 lg:pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSetPreset("thisMonth")}
              className="h-9 text-xs rounded-xl font-medium px-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
            >
              This Month
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSetPreset("lastMonth")}
              className="h-9 text-xs rounded-xl font-medium px-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
            >
              Last Month
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSetPreset("last30Days")}
              className="h-9 text-xs rounded-xl font-medium px-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
            >
              Last 30 Days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSetPreset("ytd")}
              className="h-9 text-xs rounded-xl font-medium px-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
            >
              YTD
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* SUB-VIEW 1: Executive Financial Summary */}
      {activeSubView === "executive" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 1. Total Revenue */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-[#39ff14]/60 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Revenue
                </span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  AED {formatCurrency(summary?.totalRevenue)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
                  <span>{summary?.orderCount ?? 0}</span> completed orders
                </p>
              </div>
            </div>

            {/* 2. Cost of Goods Sold (COGS) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-slate-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cost of Goods (COGS)
                </span>
                <div className="h-8 w-8 rounded-xl bg-slate-500/10 text-slate-700 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  AED {formatCurrency(summary?.cogs)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  Direct product wholesale cost
                </p>
              </div>
            </div>

            {/* 3. Gross Profit & Margin */}
            <div className="rounded-2xl border border-[#39ff14]/50 bg-gradient-to-br from-white via-[#39ff14]/5 to-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Gross Profit
                </span>
                <Badge className="bg-[#39ff14] text-slate-950 font-black text-[10px] px-2 py-0.5 border-none shadow-xs">
                  {summary?.grossMarginPct ?? 0}% Margin
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-black text-[#25b507]">
                  AED {formatCurrency(summary?.grossProfit)}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                  Revenue minus COGS
                </p>
              </div>
            </div>

            {/* 4. Outstanding Vendor Payables */}
            <div className="rounded-2xl border border-amber-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Vendor Payables
                </span>
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  AED {formatCurrency(summary?.outstandingPayables)}
                </div>
                <p className="text-[11px] text-amber-600 mt-0.5 font-semibold">
                  {summary?.unpaidInvoiceCount ?? 0} unpaid vendor invoices
                </p>
              </div>
            </div>

            {/* 5. Current Inventory Asset Value */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-sky-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Inventory Assets
                </span>
                <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <Warehouse className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  AED {formatCurrency(summary?.inventoryAssetValue)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  At cost ({summary?.totalStockUnits?.toLocaleString() ?? 0} stock units)
                </p>
              </div>
            </div>
          </div>

          {/* Accounting Scope & Notice Card */}
          <div className="rounded-2xl bg-surface-2 border border-border p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-ink">
                Financial Accounting Clarification
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gross Profit shown here excludes operating expenses (rent, salaries, utilities) — full Profit &amp; Loss will be available once expense tracking is added. Inventory Asset Valuation is computed at wholesale cost in real time across the selected branch scope.
              </p>
            </div>
          </div>
        </>
      )}

      {/* SUB-VIEW 2: Sales & Margin Analysis */}
      {activeSubView === "sales_margin" && (
        <div className="space-y-6">
          {/* Top Row: Tender Breakdown & Channel Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Revenue by Tender Method */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">Tender Method Breakdown</h3>
                    <p className="text-xs text-muted-foreground">Revenue by payment mechanism (Cash, Card, Loyalty)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-medium">Total Tenders</span>
                  <div className="text-sm font-black text-ink">
                    AED {formatCurrency(marginData?.totalTenderAmount)}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead className="py-2.5 text-xs font-bold">Payment Method</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-right">Transactions</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-right">Amount (AED)</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!marginData?.tenders || marginData.tenders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                          No payment records found for this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      marginData.tenders.map((t: any) => (
                        <TableRow key={t.method} className="hover:bg-slate-50/60 transition-colors">
                          <TableCell className="py-3 font-semibold text-xs text-ink flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            {t.method}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right font-mono text-muted-foreground">
                            {t.count}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right font-mono font-bold text-ink">
                            {formatCurrency(t.amount)}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.min(100, t.percentage)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-bold w-10 text-right">
                                {t.percentage}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* 2. Revenue by Channel */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                    <Store className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">Channel Breakdown</h3>
                    <p className="text-xs text-muted-foreground">In-store POS till vs quick-commerce delivery aggregators</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-medium">Total Revenue</span>
                  <div className="text-sm font-black text-ink">
                    AED {formatCurrency(marginData?.totalChannelAmount)}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead className="py-2.5 text-xs font-bold">Fulfillment Channel</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-right">Orders</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-right">Total (AED)</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!marginData?.channels || marginData.channels.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                          No order records found for this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      marginData.channels.map((c: any) => (
                        <TableRow key={c.channel} className="hover:bg-slate-50/60 transition-colors">
                          <TableCell className="py-3 font-semibold text-xs text-ink capitalize flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-sky-500" />
                            {c.channel}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right font-mono text-muted-foreground">
                            {c.count}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right font-mono font-bold text-ink">
                            {formatCurrency(c.amount)}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-sky-500 rounded-full"
                                  style={{ width: `${Math.min(100, c.percentage)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-bold w-10 text-right">
                                {c.percentage}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Bottom Table: Top 10 Products by Gross Profit */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#39ff14]/15 text-[#25b507] flex items-center justify-center">
                  <Percent className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Top 10 Products by Gross Profit</h3>
                  <p className="text-xs text-muted-foreground">
                    Highest profit-generating items ranked by (Selling Price − Cost Price) × Units Sold
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-muted-foreground">
                Ranked 1 to 10
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="py-3 text-xs font-bold w-12">#</TableHead>
                    <TableHead className="py-3 text-xs font-bold min-w-[180px]">Product</TableHead>
                    <TableHead className="py-3 text-xs font-bold">Category</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Units Sold</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Revenue (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">COGS (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Gross Profit (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!marginData?.topProducts || marginData.topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                        No product sales recorded in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    marginData.topProducts.map((p: any, idx: number) => (
                      <TableRow key={p.productId || idx} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="py-3 font-mono text-xs text-muted-foreground font-bold">
                          #{idx + 1}
                        </TableCell>
                        <TableCell className="py-3 font-semibold text-xs text-ink">
                          {p.productName}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="secondary" className="text-[11px] font-medium rounded-lg">
                            {p.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                          {p.unitsSold.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono text-slate-800">
                          {formatCurrency(p.revenue)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono text-muted-foreground">
                          {formatCurrency(p.cogs)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono font-bold text-[#25b507]">
                          +AED {formatCurrency(p.grossProfit)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right">
                          <Badge
                            className={`font-black text-[10px] px-2 py-0.5 border-none ${
                              p.marginPct >= 30
                                ? "bg-[#39ff14]/20 text-[#25b507]"
                                : p.marginPct >= 15
                                ? "bg-amber-500/15 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {p.marginPct}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Accounts Payable Aging */}
      {activeSubView === "ap_aging" && (
        <div className="space-y-6">
          {/* Summary Cards Row: Total Outstanding + 4 Aging Buckets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Outstanding Payables */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-slate-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Outstanding
                </span>
                <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  AED {formatCurrency(apAgingData?.summary.totalOutstanding)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  <span>{apAgingData?.summary.totalCount ?? 0}</span> unpaid invoices
                </p>
              </div>
            </div>

            {/* Bucket 1: Current (Not Yet Due) - Green */}
            <div className="rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Current (Not Due)
                </span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600">
                  AED {formatCurrency(apAgingData?.summary.current.amount)}
                </div>
                <p className="text-[11px] text-emerald-700/80 mt-0.5 font-medium">
                  <span>{apAgingData?.summary.current.count ?? 0}</span> invoices on schedule
                </p>
              </div>
            </div>

            {/* Bucket 2: 1-30 Days Overdue - Amber */}
            <div className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  1–30 Days Overdue
                </span>
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-600">
                  AED {formatCurrency(apAgingData?.summary.overdue1To30.amount)}
                </div>
                <p className="text-[11px] text-amber-700/80 mt-0.5 font-medium">
                  <span>{apAgingData?.summary.overdue1To30.count ?? 0}</span> invoices overdue
                </p>
              </div>
            </div>

            {/* Bucket 3: 31-60 Days Overdue - Orange */}
            <div className="rounded-2xl border border-orange-200/80 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-orange-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                  31–60 Days Overdue
                </span>
                <div className="h-8 w-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-orange-600">
                  AED {formatCurrency(apAgingData?.summary.overdue31To60.amount)}
                </div>
                <p className="text-[11px] text-orange-700/80 mt-0.5 font-medium">
                  <span>{apAgingData?.summary.overdue31To60.count ?? 0}</span> invoices overdue
                </p>
              </div>
            </div>

            {/* Bucket 4: 60+ Days Overdue - Red */}
            <div className="rounded-2xl border border-rose-200/80 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-rose-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  60+ Days Overdue
                </span>
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-rose-600">
                  AED {formatCurrency(apAgingData?.summary.overdue60Plus.amount)}
                </div>
                <p className="text-[11px] text-rose-700/80 mt-0.5 font-medium">
                  <span>{apAgingData?.summary.overdue60Plus.count ?? 0}</span> critical overdue
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Invoices Ledger Table */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Vendor Payables Aging Ledger</h3>
                  <p className="text-xs text-muted-foreground">
                    All unpaid vendor invoices sorted by days overdue (most overdue first)
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-muted-foreground w-fit">
                {apAgingData?.invoices?.length ?? 0} Invoices Listed
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="py-3 text-xs font-bold min-w-[180px]">Vendor Name</TableHead>
                    <TableHead className="py-3 text-xs font-bold">Invoice #</TableHead>
                    <TableHead className="py-3 text-xs font-bold">Invoice Date</TableHead>
                    <TableHead className="py-3 text-xs font-bold">Due Date</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-center">Days Overdue</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Total (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Paid (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Balance Due (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-center">Aging Bucket</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!apAgingData?.invoices || apAgingData.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground">
                        No outstanding vendor invoices found. All vendor bills are settled or none exist.
                      </TableCell>
                    </TableRow>
                  ) : (
                    apAgingData.invoices.map((inv: any) => (
                      <TableRow key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="py-3 font-semibold text-xs text-ink">
                          {inv.vendorName}
                        </TableCell>
                        <TableCell className="py-3 font-mono text-xs font-bold text-slate-700">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {inv.invoiceDate || "—"}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-slate-700 font-medium">
                          {inv.dueDate || "—"}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-center font-mono font-bold">
                          {inv.daysOverdue > 0 ? (
                            <span
                              className={
                                inv.daysOverdue > 60
                                  ? "text-rose-600"
                                  : inv.daysOverdue > 30
                                  ? "text-orange-600"
                                  : "text-amber-600"
                              }
                            >
                              {inv.daysOverdue}d overdue
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">On Schedule</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono text-slate-800">
                          {formatCurrency(inv.total)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono text-muted-foreground">
                          {formatCurrency(inv.paidAmount)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono font-bold text-ink">
                          AED {formatCurrency(inv.balanceDue)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-center">
                          <Badge
                            className={`font-black text-[10px] px-2 py-0.5 border-none ${
                              inv.bucket === "Current"
                                ? "bg-emerald-500/15 text-emerald-700"
                                : inv.bucket === "1-30 Days"
                                ? "bg-amber-500/15 text-amber-700"
                                : inv.bucket === "31-60 Days"
                                ? "bg-orange-500/15 text-orange-700"
                                : "bg-rose-500/15 text-rose-700"
                            }`}
                          >
                            {inv.bucket}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: Inventory Valuation */}
      {activeSubView === "inventory_val" && (
        <div className="space-y-6">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Value at Cost */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Value at Cost
                </span>
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Warehouse className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  AED {formatCurrency(invValData?.totals.totalCostValue)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  Asset acquisition cost basis
                </p>
              </div>
            </div>

            {/* 2. Value at Retail */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Value at Retail
                </span>
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  AED {formatCurrency(invValData?.totals.totalRetailValue)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  Potential gross revenue at shelf price
                </p>
              </div>
            </div>

            {/* 3. Unrealized Potential Margin */}
            <div className="rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Unrealized Margin
                </span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#25b507]">
                  +AED {formatCurrency(invValData?.totals.unrealizedMargin)}
                </div>
                <p className="text-[11px] text-emerald-700/80 mt-0.5 font-medium flex items-center gap-1.5">
                  <Badge className="bg-[#39ff14]/20 text-[#25b507] border-none font-bold text-[10px] px-1.5 py-0.5">
                    {invValData?.totals.unrealizedMarginPct ?? 0}%
                  </Badge>
                  <span>projected margin</span>
                </p>
              </div>
            </div>

            {/* 4. Total Stock Units */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-slate-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Stock Units on Hand
                </span>
                <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  {invValData?.totals.totalStockUnits?.toLocaleString() ?? 0}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  Across {invValData?.totals.totalProducts ?? 0} active products
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Warehouse className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Valuation by Category</h3>
                  <p className="text-xs text-muted-foreground">
                    Capital allocation and profit potential grouped by merchandise category (sorted by cost value)
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-muted-foreground w-fit">
                {invValData?.categories?.length ?? 0} Categories
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="py-3 text-xs font-bold min-w-[180px]">Category</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-center">Products</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Units in Stock</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Cost Value (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Retail Value (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Unrealized Margin (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!invValData?.categories || invValData.categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                        No active stock records found for this scope.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invValData.categories.map((c: any) => (
                      <TableRow key={c.category} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="py-3 font-semibold text-xs text-ink">
                          <Badge variant="secondary" className="text-[11px] font-medium rounded-lg">
                            {c.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-center font-mono text-muted-foreground">
                          {c.productCount}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                          {c.stockUnits.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono text-slate-800">
                          {formatCurrency(c.costValue)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono text-slate-800">
                          {formatCurrency(c.retailValue)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right font-mono font-bold text-[#25b507]">
                          +AED {formatCurrency(c.margin)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-right">
                          <Badge
                            className={`font-black text-[10px] px-2 py-0.5 border-none ${
                              c.marginPct >= 30
                                ? "bg-[#39ff14]/20 text-[#25b507]"
                                : c.marginPct >= 15
                                ? "bg-amber-500/15 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {c.marginPct}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Branch Breakdown Table (Only shown when 'all' branches is selected) */}
          {branchId === "all" && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">Valuation by Branch Location</h3>
                    <p className="text-xs text-muted-foreground">
                      Asset value and retail revenue distribution across store branches
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-semibold text-muted-foreground w-fit">
                  {invValData?.branches?.length ?? 0} Branches
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead className="py-3 text-xs font-bold min-w-[180px]">Branch Name</TableHead>
                      <TableHead className="py-3 text-xs font-bold text-center">Products</TableHead>
                      <TableHead className="py-3 text-xs font-bold text-right">Units in Stock</TableHead>
                      <TableHead className="py-3 text-xs font-bold text-right">Cost Value (AED)</TableHead>
                      <TableHead className="py-3 text-xs font-bold text-right">Retail Value (AED)</TableHead>
                      <TableHead className="py-3 text-xs font-bold text-right">Unrealized Margin (AED)</TableHead>
                      <TableHead className="py-3 text-xs font-bold text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!invValData?.branches || invValData.branches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                          No active stock records found across branches.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invValData.branches.map((b: any) => (
                        <TableRow key={b.branchId} className="hover:bg-slate-50/60 transition-colors">
                          <TableCell className="py-3 font-semibold text-xs text-ink">
                            {b.branchName}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-center font-mono text-muted-foreground">
                            {b.productCount}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                            {b.stockUnits.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right font-mono text-slate-800">
                            {formatCurrency(b.costValue)}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right font-mono text-slate-800">
                            {formatCurrency(b.retailValue)}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right font-mono font-bold text-[#25b507]">
                            +AED {formatCurrency(b.margin)}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-right">
                            <Badge
                              className={`font-black text-[10px] px-2 py-0.5 border-none ${
                                b.marginPct >= 30
                                  ? "bg-[#39ff14]/20 text-[#25b507]"
                                  : b.marginPct >= 15
                                  ? "bg-amber-500/15 text-amber-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {b.marginPct}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 5: Full UAE VAT Return */}
      {activeSubView === "vat_return" && (
        <div className="space-y-6">
          {/* 3 Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Output VAT (Box 1) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Output VAT Collected (Box 1)
                </span>
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  AED {formatCurrency(vatReturnData?.output.outputVat)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  From {vatReturnData?.output.salesCount ?? 0} completed orders (Net Sales: AED {formatCurrency(vatReturnData?.output.netSalesExVat)})
                </p>
              </div>
            </div>

            {/* 2. Input VAT (Box 9) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Input VAT Paid (Box 9)
                </span>
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-ink">
                  AED {formatCurrency(vatReturnData?.input.inputVat)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  From {vatReturnData?.input.purchasesCount ?? 0} vendor bills (Net Purchases: AED {formatCurrency(vatReturnData?.input.netPurchasesExVat)})
                </p>
              </div>
            </div>

            {/* 3. Net VAT Payable / Refundable */}
            <div
              className={`rounded-2xl border bg-white p-5 shadow-sm space-y-2 relative overflow-hidden group transition-all ${
                vatReturnData?.net.position === "payable"
                  ? "border-rose-200/90 hover:border-rose-400"
                  : vatReturnData?.net.position === "refundable"
                  ? "border-emerald-200/90 hover:border-emerald-400"
                  : "border-slate-200/90 hover:border-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    vatReturnData?.net.position === "payable"
                      ? "text-rose-700"
                      : vatReturnData?.net.position === "refundable"
                      ? "text-emerald-700"
                      : "text-muted-foreground"
                  }`}
                >
                  {vatReturnData?.net.position === "payable"
                    ? "Net VAT Payable"
                    : vatReturnData?.net.position === "refundable"
                    ? "Net VAT Refundable"
                    : "Net VAT Balanced"}
                </span>
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold ${
                    vatReturnData?.net.position === "payable"
                      ? "bg-rose-500/10 text-rose-600"
                      : vatReturnData?.net.position === "refundable"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div
                  className={`text-2xl font-black ${
                    vatReturnData?.net.position === "payable"
                      ? "text-rose-600"
                      : vatReturnData?.net.position === "refundable"
                      ? "text-[#25b507]"
                      : "text-ink"
                  }`}
                >
                  AED {formatCurrency(vatReturnData?.net.amount)}
                </div>
                <p className="text-[11px] mt-0.5 font-medium flex items-center gap-1.5">
                  <Badge
                    className={`border-none font-bold text-[10px] px-2 py-0.5 ${
                      vatReturnData?.net.position === "payable"
                        ? "bg-rose-500/15 text-rose-700"
                        : vatReturnData?.net.position === "refundable"
                        ? "bg-[#39ff14]/20 text-[#25b507]"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {vatReturnData?.net.position === "payable"
                      ? "Amount Due to FTA"
                      : vatReturnData?.net.position === "refundable"
                      ? "Refundable from FTA"
                      : "Balanced"}
                  </Badge>
                  <span className="text-muted-foreground">Output − Input</span>
                </p>
              </div>
            </div>
          </div>

          {/* Supporting Breakdown Table */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">UAE VAT 201 Return Statement</h3>
                  <p className="text-xs text-muted-foreground">
                    Comparative breakdown of Standard-Rated Supplies (Sales) vs Standard-Rated Expenses (Purchases)
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-muted-foreground w-fit">
                Standard Rate 5.00%
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="py-3 text-xs font-bold min-w-[240px]">Tax Box / Description</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-center">Txn Records</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Net Amount Ex-VAT (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-center">Tax Rate</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">VAT Amount (AED)</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-right">Gross Total Inc-VAT (AED)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Box 1: Output VAT */}
                  <TableRow className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="py-3.5">
                      <div className="font-semibold text-xs text-ink">Box 1: Standard Rated Supplies</div>
                      <div className="text-[11px] text-muted-foreground">Output VAT collected on customer sales orders</div>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-center font-mono text-slate-700">
                      {vatReturnData?.output.salesCount ?? 0}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-right font-mono text-slate-800">
                      {formatCurrency(vatReturnData?.output.netSalesExVat)}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-center font-semibold text-slate-700">
                      5.00%
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-right font-mono font-bold text-blue-600">
                      AED {formatCurrency(vatReturnData?.output.outputVat)}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-right font-mono text-slate-800">
                      {formatCurrency(vatReturnData?.output.totalSalesIncVat)}
                    </TableCell>
                  </TableRow>

                  {/* Box 9: Input VAT */}
                  <TableRow className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="py-3.5">
                      <div className="font-semibold text-xs text-ink">Box 9: Standard Rated Expenses & Purchases</div>
                      <div className="text-[11px] text-muted-foreground">Recoverable input VAT paid on vendor invoices</div>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-center font-mono text-slate-700">
                      {vatReturnData?.input.purchasesCount ?? 0}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-right font-mono text-slate-800">
                      {formatCurrency(vatReturnData?.input.netPurchasesExVat)}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-center font-semibold text-slate-700">
                      5.00%
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-right font-mono font-bold text-purple-600">
                      AED {formatCurrency(vatReturnData?.input.inputVat)}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-right font-mono text-slate-800">
                      {formatCurrency(vatReturnData?.input.totalPurchasesIncVat)}
                    </TableCell>
                  </TableRow>

                  {/* Net VAT Row */}
                  <TableRow className="bg-slate-50/90 font-bold border-t-2 border-slate-200">
                    <TableCell className="py-4">
                      <div className="font-black text-xs text-ink">
                        {vatReturnData?.net.position === "payable"
                          ? "Box 14: Net VAT Payable to FTA"
                          : vatReturnData?.net.position === "refundable"
                          ? "Box 14: Net VAT Refund Claimable from FTA"
                          : "Box 14: Net VAT Position"}
                      </div>
                      <div className="text-[11px] font-normal text-muted-foreground">
                        Total Output VAT minus Total Input VAT
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-xs text-center text-muted-foreground font-mono">
                      —
                    </TableCell>
                    <TableCell className="py-4 text-xs text-right font-mono text-slate-700">
                      AED {formatCurrency(((vatReturnData?.output.netSalesExVat ?? 0) - (vatReturnData?.input.netPurchasesExVat ?? 0)))}
                    </TableCell>
                    <TableCell className="py-4 text-xs text-center text-muted-foreground">
                      —
                    </TableCell>
                    <TableCell
                      className={`py-4 text-xs text-right font-mono font-black text-sm ${
                        vatReturnData?.net.position === "payable"
                          ? "text-rose-600"
                          : vatReturnData?.net.position === "refundable"
                          ? "text-[#25b507]"
                          : "text-slate-800"
                      }`}
                    >
                      AED {formatCurrency(vatReturnData?.net.amount)}
                    </TableCell>
                    <TableCell className="py-4 text-xs text-right font-mono text-muted-foreground">
                      —
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Disclaimer Banner */}
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-900">Regulatory Advisory & Compliance Notice</p>
              <p className="text-xs text-amber-700">
                This is an operational summary based on recorded transactions. Please verify against official FTA filing requirements before submission.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSubView === "branch_submissions" && (
        <BranchSubmissionsSubView branches={branchesRes?.branches || []} />
      )}
    </div>
  );
}
