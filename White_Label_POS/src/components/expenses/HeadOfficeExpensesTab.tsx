import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  ExternalLink,
  Download,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  Layers,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  EXPENSE_CATEGORIES,
  getHeadOfficeExpensesFn,
  getExpenseReceiptUrlFn,
} from "@/lib/expenses-server";

interface Props {
  branches: Array<{ id: string; name: string }>;
}

export function HeadOfficeExpensesTab({ branches = [] }: Props) {
  const [loading, setLoading] = useState(true);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [branchTotals, setBranchTotals] = useState<Record<string, { name: string; total: number; count: number }>>({});
  const [categoryTotals, setCategoryTotals] = useState<Record<string, { total: number; count: number }>>({});

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Receipt Preview
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [openingReceiptId, setOpeningReceiptId] = useState<string | null>(null);

  const handleViewReceipt = async (exp: any) => {
    if (!exp.receiptUrl) return;
    if (exp.receiptUrl.startsWith("http")) {
      setPreviewReceiptUrl(exp.receiptUrl);
      return;
    }
    setOpeningReceiptId(exp.id);
    try {
      const res = await getExpenseReceiptUrlFn({ data: { expenseId: exp.id } });
      if (res.success && res.signedUrl) {
        setPreviewReceiptUrl(res.signedUrl);
      } else {
        toast.error("Failed to load secure receipt URL");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load secure receipt URL");
    } finally {
      setOpeningReceiptId(null);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await getHeadOfficeExpensesFn({
        data: {
          branchId: selectedBranch === "all" ? undefined : selectedBranch,
          category: selectedCategory === "all" ? undefined : selectedCategory,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      if (res.success) {
        setExpensesList(res.expenses || []);
        setGrandTotal(res.grandTotal || 0);
        setBranchTotals(res.branchTotals || {});
        setCategoryTotals(res.categoryTotals || {});
      } else {
        toast.error("Failed to load tenant expenses");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load tenant expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedBranch, selectedCategory, startDate, endDate]);

  const handleResetFilters = () => {
    setSelectedBranch("all");
    setSelectedCategory("all");
    setStartDate("");
    setEndDate("");
  };

  const handleExportCsv = () => {
    if (expensesList.length === 0) {
      toast.error("No expenses to export.");
      return;
    }

    try {
      let csv = "TENANT OPERATIONAL EXPENSES REPORT\n";
      csv += `Generated At,${new Date().toLocaleString()}\n`;
      csv += `Grand Total (AED),${grandTotal.toFixed(2)}\n`;
      csv += `Total Records,${expensesList.length}\n\n`;

      csv += "Date,Branch,Category,Amount (AED),Notes / Description,Recorded By,Has Receipt\n";
      expensesList.forEach((exp) => {
        const row = [
          `"${exp.expenseDate || ""}"`,
          `"${(exp.branchName || "Unassigned").replace(/"/g, '""')}"`,
          `"${(exp.category || "").replace(/"/g, '""')}"`,
          Number(exp.amount || 0).toFixed(2),
          `"${(exp.notes || "").replace(/"/g, '""')}"`,
          `"${(exp.createdByName || "").replace(/"/g, '""')}"`,
          exp.receiptUrl ? "Yes" : "No",
        ];
        csv += row.join(",") + "\n";
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `head_office_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Expenses CSV report downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to export CSV: " + err.message);
    }
  };

  const categoryColor: Record<string, string> = {
    Maintenance: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    "Utilities (Electricity/Water)": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    Rent: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    Cleaning: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
    Repair: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    "Salaries-Other": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    Other: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-md border border-slate-700">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-lime-400/20 text-lime-400 border border-lime-400/30">
              <Wallet className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-white">Consolidated Branch Expenses</h1>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Audit and aggregate operational expenses logged across all supermarket outlets with breakdown analytics and CSV export.
          </p>
        </div>
        <Button
          onClick={handleExportCsv}
          className="rounded-xl font-bold bg-lime-500 hover:bg-lime-600 text-slate-950 shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Download className="h-4 w-4 mr-1.5" /> Export CSV Report
        </Button>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Grand Total */}
        <div className="panel p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Grand Total Expenses</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-ink">
            AED {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {expensesList.length} total entries matching filter
          </div>
        </div>

        {/* Active Branches Reporting */}
        <div className="panel p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Outlets With Expenses</span>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-ink">
            {Object.keys(branchTotals).length} / {branches.length || 1}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Active reporting branches
          </div>
        </div>

        {/* Top Expense Category */}
        <div className="panel p-5 rounded-2xl border border-border bg-surface sm:col-span-2">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Category Breakdown Summary</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.keys(categoryTotals).length === 0 ? (
              <span className="text-xs text-muted-foreground italic">No expense entries</span>
            ) : (
              Object.entries(categoryTotals).map(([cat, val]) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="rounded-xl px-2.5 py-1 text-xs font-semibold bg-surface-2 flex items-center gap-1.5"
                >
                  <span className="font-bold text-ink">{cat}:</span>
                  <span className="text-primary font-bold">AED {val.total.toFixed(0)}</span>
                  <span className="text-[10px] text-muted-foreground">({val.count})</span>
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-surface-2/60 p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-2 text-xs font-bold text-ink">
          <Filter className="h-4 w-4 text-muted-foreground" /> Filters:
        </div>

        {/* Branch Filter */}
        <div className="w-full md:w-[200px]">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-9 text-xs rounded-xl bg-surface">
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

        {/* Category Filter */}
        <div className="w-full md:w-[200px]">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 text-xs rounded-xl bg-surface">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filters */}
        <div className="flex items-center gap-2 flex-1">
          <Input
            type="date"
            placeholder="From Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 text-xs rounded-xl bg-surface"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            placeholder="To Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 text-xs rounded-xl bg-surface"
          />
        </div>

        {(selectedBranch !== "all" || selectedCategory !== "all" || startDate || endDate) && (
          <Button
            size="sm"
            variant="ghost"
            className="h-9 px-3 text-xs text-muted-foreground hover:text-ink rounded-xl"
            onClick={handleResetFilters}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Per-Branch Totals Cards */}
      {Object.keys(branchTotals).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(branchTotals).map(([bId, bData]) => (
            <div key={bId} className="panel p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
              <div className="text-xs font-bold text-ink truncate">{bData.name}</div>
              <div className="mt-2 text-lg font-extrabold text-ink">
                AED {bData.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {bData.count} {bData.count === 1 ? "expense" : "expenses"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Expenses Table */}
      <div className="panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">All Branch Expenses (Read-Only)</h2>
          <Badge variant="outline" className="text-xs font-bold">
            {expensesList.length} Records
          </Badge>
        </div>

        <div className="overflow-x-auto w-full rounded-2xl border border-border">
          <Table className="w-full">
            <TableHeader className="bg-surface-2/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Branch</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes / Description</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Recorded By</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount (AED)</TableHead>
                <TableHead className="py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-medium">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading branch expenses...
                  </TableCell>
                </TableRow>
              ) : expensesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-medium">
                    No branch expenses found matching the selected filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                expensesList.map((exp) => {
                  const isPdf = exp.receiptUrl?.toLowerCase().includes(".pdf");
                  return (
                    <TableRow key={exp.id} className="group hover:bg-primary/[0.03] transition-colors">
                      <TableCell className="p-4 text-xs font-semibold text-ink whitespace-nowrap">
                        {exp.expenseDate}
                      </TableCell>
                      <TableCell className="p-4 whitespace-nowrap">
                        <span className="font-bold text-xs text-ink">{exp.branchName || "Unassigned"}</span>
                      </TableCell>
                      <TableCell className="p-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`rounded-xl px-2.5 py-0.5 text-[11px] font-bold ${
                            categoryColor[exp.category] || "bg-surface-2 text-ink"
                          }`}
                        >
                          {exp.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4 text-xs text-muted-foreground max-w-[260px] truncate">
                        {exp.notes || "—"}
                      </TableCell>
                      <TableCell className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                        {exp.createdByName || "Staff"}
                      </TableCell>
                      <TableCell className="p-4 font-extrabold text-sm text-ink whitespace-nowrap">
                        AED {Number(exp.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="p-4 text-right whitespace-nowrap">
                        {exp.receiptUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-semibold rounded-lg gap-1"
                            disabled={openingReceiptId === exp.id}
                            onClick={() => handleViewReceipt(exp)}
                          >
                            {openingReceiptId === exp.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isPdf ? (
                              <FileText className="h-3 w-3 text-red-500" />
                            ) : (
                              <ImageIcon className="h-3 w-3 text-emerald-500" />
                            )}
                            View
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Receipt View Modal */}
      <Dialog open={Boolean(previewReceiptUrl)} onOpenChange={(open) => !open && setPreviewReceiptUrl(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Receipt Attachment</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex items-center justify-center">
            {previewReceiptUrl && (
              previewReceiptUrl.startsWith("data:application/pdf") || previewReceiptUrl.endsWith(".pdf") ? (
                <iframe
                  src={previewReceiptUrl}
                  title="Receipt PDF"
                  className="w-full h-[450px] border rounded-xl"
                />
              ) : (
                <img
                  src={previewReceiptUrl}
                  alt="Expense Receipt"
                  className="max-w-full max-h-[450px] object-contain rounded-xl border"
                />
              )
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              asChild
            >
              <a href={previewReceiptUrl || "#"} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open in New Tab
              </a>
            </Button>
            <Button onClick={() => setPreviewReceiptUrl(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
