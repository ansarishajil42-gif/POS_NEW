import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Boxes,
  AlertTriangle,
  ArrowRightLeft,
  CalendarDays,
  Search,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Plus,
  Building2,
  X,
  History,
  Menu,
  FileText,
  DollarSign,
  Download,
  Edit,
  Trash,
  FileSpreadsheet,
  Upload,
  Loader2,
} from "lucide-react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getInventoryDataServerFn,
  stockTransferServerFn,
  draftPurchaseOrderServerFn,
  getInventoryLedgerFn,
  applyClearanceFn,
  editStockTransferServerFn,
  deleteStockTransferServerFn,
  exportOutOfStockExcelServerFn,
  bulkUpdateStockFromExcelServerFn,
} from "@/lib/inventory-manager-server";

export const Route = createFileRoute("/inventory-manager")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (role !== "Inventory Manager") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  loader: async () => {
    return await getInventoryDataServerFn();
  },
  component: InventoryManager,
  errorComponent: ({ error }) => {
    if (error.message.includes("No branch is assigned to this user.")) {
      return (
        <div className="flex h-[80vh] items-center justify-center p-4">
          <div className="panel max-w-md w-full p-8 text-center space-y-4">
            <h1 className="text-xl font-bold text-ink">No Branch Assigned</h1>
            <p className="text-sm text-muted-foreground">No branch is assigned to this user.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-[80vh] items-center justify-center p-4">
        <div className="panel max-w-md w-full p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-destructive">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || "You do not have permission to access this page."}
          </p>
        </div>
      </div>
    );
  },
});

function InventoryManager() {
  const data = Route.useLoaderData();
  const router = useRouter();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferForm, setTransferForm] = useState({
    productId: "",
    sourceBranchId: "",
    targetBranchId: "",
    quantity: 1,
  });

  const [draftPoOpen, setDraftPoOpen] = useState(false);
  const [isDraftingPo, setIsDraftingPo] = useState(false);
  const [draftPoForm, setDraftPoForm] = useState({
    productId: "",
    branchId: "",
    vendorId: "",
    qty: 10,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<any>(null);
  const [editQty, setEditQty] = useState(1);

  const handleEditTransfer = (t: any) => {
    setEditingTransfer(t);
    setEditQty(t.quantity);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editQty || editQty <= 0) {
      toast.error("Quantity must be a positive number greater than 0");
      return;
    }
    setIsEditing(true);
    try {
      await editStockTransferServerFn({ data: { id: editingTransfer.id, quantity: Number(editQty) } });
      toast.success("Stock transfer updated successfully!");
      setEditModalOpen(false);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update stock transfer");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTransfer = async (t: any) => {
    const confirmed = window.confirm(
      t.status === "Completed"
        ? `Are you sure you want to delete this completed stock transfer? Stock levels will be rolled back (reversed) from target and source branches.`
        : `Are you sure you want to delete this stock transfer?`
    );
    if (!confirmed) return;

    try {
      await deleteStockTransferServerFn({ data: { id: t.id } });
      toast.success("Stock transfer deleted successfully!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete stock transfer");
    }
  };
  const applyClearance = async (productId: string) => {
    try {
      await applyClearanceFn({ data: { productId, discountPct: 20 } });
      toast.success("Clearance pricing (20% off) applied successfully!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to apply clearance pricing");
    }
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    tenant,
    role,
    branchScope,
    branches,
    allTenantBranches,
    stockLevels,
    batches,
    transfers,
    stats,
    vendors,
    allowPoDraft,
    alerts,
  } = data;

  const subtitle =
    role === "Inventory Manager"
      ? branchScope?.length === 1
        ? `${tenant?.name || "Company"} · ${branches.find((b: any) => b.id === branchScope[0])?.name || "Assigned Branch"}`
        : `${tenant?.name || "Company"} · Assigned Branches`
      : `${tenant?.name || "Company"} · Global View`;

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    branchScope && branchScope.length === 1 ? branchScope[0] : "all"
  );
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    totalProcessed: number;
    totalUpdated: number;
    totalSkipped: number;
    skippedDetails: Array<{ sku: string; reason: string }>;
  } | null>(null);
  const [isImportSummaryModalOpen, setIsImportSummaryModalOpen] = useState(false);

  const filteredStockLevels = stockLevels.filter((s: any) => {
    if (selectedBranchId && selectedBranchId !== "all" && s.branchId !== selectedBranchId) {
      return false;
    }
    if (outOfStockOnly && Number(s.stock) > 0) {
      return false;
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const productName = (s.productName || "").toLowerCase();
    const sku = (s.sku || s.barcode || "").toLowerCase();
    return productName.includes(query) || sku.includes(query);
  });

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const res = await exportOutOfStockExcelServerFn({
        data: {
          branchId: selectedBranchId,
          outOfStockOnly: outOfStockOnly,
        },
      });

      if (!res.success || !res.base64) {
        throw new Error(res.error || "Failed to generate Excel file");
      }

      const byteCharacters = atob(res.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename || "stock_update.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${res.count || 0} products to Excel`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let targetBranchId = selectedBranchId;
    if (branchScope && branchScope.length === 1) {
      targetBranchId = branchScope[0];
    }

    if (!targetBranchId || targetBranchId === "all") {
      toast.error("Please select a specific branch from the dropdown before importing stock.");
      e.target.value = "";
      return;
    }

    setIsImportingExcel(true);
    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("Excel file contains no sheets");

      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (!rawJson || rawJson.length === 0) {
        throw new Error("No data rows found in the uploaded Excel file.");
      }

      const parsedRows: Array<{ sku?: string; barcode?: string; stock: number }> = [];
      for (const row of rawJson) {
        const sku = row["SKU"] || row["sku"] || row["Sku"] || "";
        const barcode = row["Barcode"] || row["barcode"] || row["BARCODE"] || "";
        const rawStock =
          row["Stock"] ??
          row["stock"] ??
          row["STOCK"] ??
          row["Qty"] ??
          row["qty"] ??
          row["Quantity"] ??
          row["quantity"];

        if (rawStock !== undefined && rawStock !== null && rawStock !== "") {
          const numStock = Number(rawStock);
          if (!isNaN(numStock)) {
            parsedRows.push({
              sku: sku ? String(sku).trim() : undefined,
              barcode: barcode ? String(barcode).trim() : undefined,
              stock: numStock,
            });
          }
        }
      }

      if (parsedRows.length === 0) {
        throw new Error("No valid rows with Stock numbers found in Excel file.");
      }

      const res = await bulkUpdateStockFromExcelServerFn({
        data: {
          branchId: targetBranchId,
          rows: parsedRows,
        },
      });

      if (!res.success) {
        throw new Error(res.error || "Bulk stock update failed");
      }

      setImportSummary({
        totalProcessed: res.totalProcessed,
        totalUpdated: res.totalUpdated,
        totalSkipped: res.totalSkipped,
        skippedDetails: res.skippedDetails || [],
      });
      setIsImportSummaryModalOpen(true);

      toast.success(`Updated stock for ${res.totalUpdated} products!`);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to process Excel file");
    } finally {
      setIsImportingExcel(false);
      e.target.value = "";
    }
  };

  const handleExport = () => {
    if (filteredStockLevels.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = ["SKU", "Item", "Branch", "In Stock", "Reorder Level", "Status"];
      const csvRows = [headers.join(",")];

      for (const s of filteredStockLevels) {
        const sku = s.sku || s.barcode || "";
        const isLow = s.stock <= s.reorderLevel;
        const status = isLow ? "Low Stock" : "Healthy";

        const row = [
          `"${sku}"`,
          `"${s.productName?.replace(/"/g, '""') || ""}"`,
          `"${s.branchName?.replace(/"/g, '""') || ""}"`,
          `"${s.stock} ${s.unit}"`,
          `"${s.reorderLevel} ${s.unit}"`,
          `"${status}"`,
        ];
        csvRows.push(row.join(","));
      }

      const csvData = csvRows.join("\n");
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stock_levels_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export successful");
    } catch (err) {
      toast.error("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const openTransferModal = () => {
    let sourceBranch = transferForm.sourceBranchId;
    if (role === "Inventory Manager" && branches.length === 1) {
      sourceBranch = branches[0].id;
    }
    setTransferForm((prev) => ({ ...prev, sourceBranchId: sourceBranch }));
    setTransferModalOpen(true);
  };

  return (
    <DemoShell
      title="Inventory Control Dashboard"
      subtitle={subtitle}
      actions={
        <Button
          className="rounded-xl font-semibold"
          onClick={() => toast.success("Stock count initiated")}
        >
          <Boxes className="mr-1.5 h-4 w-4" /> Start Stock Count
        </Button>
      }
    >
      <Tabs defaultValue="stock" onValueChange={() => setIsMobileMenuOpen(false)} className="mt-6 flex flex-col md:flex-row gap-8">
        <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
          <span className="font-semibold text-sm">Navigation Menu</span>
          <Button variant="outline" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <aside className={`w-full md:w-56 shrink-0 ${isMobileMenuOpen ? "block" : "hidden md:block"}`}>
          <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
            <TabsTrigger
              value="stock"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Stock Levels
            </TabsTrigger>
            <TabsTrigger
              value="transfers"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Stock Transfers
            </TabsTrigger>
            <TabsTrigger
              value="batches"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Batch & Expiry (FEFO)
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Low-Stock Alerts
            </TabsTrigger>
          <TabsTrigger value="ledger" className="w-full justify-start rounded-lg px-4 py-3 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"><History className="mr-2 h-5 w-5" />Ledger</TabsTrigger>
            <TabsTrigger value="reports" className="w-full justify-start rounded-lg px-4 py-3 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"><FileText className="mr-2 h-5 w-5" />Reports</TabsTrigger></TabsList>
        </aside>

        <main className="min-w-0 flex-1">
          <TabsContent value="stock" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total SKUs" value={stats.totalSkus.toLocaleString()} icon={Boxes} />
              <StatCard
                label="Low Stock Items"
                value={stats.lowStockCount.toLocaleString()}
                icon={AlertTriangle}
                tone={stats.lowStockCount > 0 ? "accent" : "success"}
              />
              <StatCard
                label="Near Expiry Batches"
                value={stats.nearExpiryCount.toLocaleString()}
                icon={Clock}
                tone={stats.nearExpiryCount > 0 ? "accent" : "success"}
              />
              <StatCard
                label="Expired Batches"
                value={stats.expiredCount.toLocaleString()}
                icon={AlertTriangle}
                tone={stats.expiredCount > 0 ? "accent" : "success"}
              />
            </div>

            <div className="panel overflow-hidden">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between border-b border-border p-4 gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search SKU or Product Name..."
                      className="pl-9 h-9 text-sm w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {branches.length > 1 && (
                    <Select
                      value={selectedBranchId}
                      onValueChange={(val) => setSelectedBranchId(val)}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs font-medium">
                        <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOutOfStockOnly(!outOfStockOnly)}
                    className={`h-9 rounded-xl text-xs font-bold border transition-all ${
                      outOfStockOnly
                        ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm"
                        : "bg-white hover:bg-amber-50/60 text-slate-800 hover:text-slate-950 border-slate-300"
                    }`}
                  >
                    <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                    {outOfStockOnly ? "Out of Stock (ON)" : "Out of Stock Only"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={isExportingExcel}
                    className="h-9 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-950 border-2 border-emerald-400 hover:border-emerald-500 shadow-sm transition-all"
                  >
                    {isExportingExcel ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-emerald-700" />
                    ) : (
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    )}
                    Export Excel
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("inv-excel-upload")?.click()}
                    disabled={isImportingExcel}
                    className="h-9 rounded-xl text-xs font-bold bg-white hover:bg-blue-50 text-blue-800 hover:text-blue-950 border-2 border-blue-400 hover:border-blue-500 shadow-sm transition-all"
                  >
                    {isImportingExcel ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-blue-700" />
                    ) : (
                      <Upload className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                    )}
                    Import Excel
                  </Button>
                  <input
                    id="inv-excel-upload"
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleImportExcel}
                  />

                  <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-950 border-slate-300" onClick={handleExport}>
                    <Download className="mr-1.5 h-3.5 w-3.5 text-slate-600" /> Export CSV
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">SKU / Item</th>
                      <th className="px-4 py-3 font-medium">Branch</th>
                      <th className="px-4 py-3 font-medium text-right">In Stock</th>
                      <th className="px-4 py-3 font-medium text-right">Reorder Level</th>
                      <th className="px-4 py-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStockLevels.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          {searchQuery ? "No products found." : "No stock data available."}
                        </td>
                      </tr>
                    )}
                    {filteredStockLevels.map((s: any) => {
                      const isLow = s.stock <= s.reorderLevel;
                      return (
                        <tr key={s.id} className="hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-ink">{s.productName}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {s.sku || s.barcode} · {s.category}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{s.branchName}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {s.stock} {s.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {s.reorderLevel} {s.unit}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isLow ? (
                              <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                                Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transfers" className="mt-0 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">Stock Transfers</h3>
                <p className="text-sm text-muted-foreground">
                  Move inventory between branches or central warehouse.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Button
                  className="font-semibold"
                  onClick={openTransferModal}
                  disabled={allTenantBranches.length < 2}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" /> New Transfer
                </Button>
                {allTenantBranches.length < 2 && (
                  <span className="text-[10px] text-muted-foreground text-right max-w-[250px]">
                    No eligible destination branch or warehouse is available for transfer.
                  </span>
                )}
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">TRN ID</th>
                    <th className="px-4 py-3 font-medium">Origin</th>
                    <th className="px-4 py-3 font-medium">Destination</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transfers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No recent transfers.
                      </td>
                    </tr>
                  )}
                  {transfers.map((t: any) => (
                    <tr key={t.id} className="hover:bg-surface-2/50 transition-colors">
                      <td
                        className="px-4 py-3 font-semibold text-primary font-mono text-xs"
                        title={t.id}
                      >
                        {t.id.split("-")[0].toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-ink">{t.sourceBranchName}</td>
                      <td className="px-4 py-3 text-ink">{t.destinationBranchName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="font-medium text-ink">{t.quantity} units</div>
                        <div className="text-xs">{t.productName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                          <CheckCircle2 className="h-3 w-3" /> {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {t.status !== "Completed" && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-ink"
                              onClick={() => handleEditTransfer(t)}
                              title="Edit Transfer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteTransfer(t)}
                            title="Delete Transfer"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="batches" className="mt-0">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-bold text-ink">Batch & Expiry Tracker (FEFO)</h3>
                <div className="relative w-64">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search batch number..." className="pl-9 h-9 text-sm" />
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Batch No.</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Expiry Date</th>
                    <th className="px-4 py-3 font-medium text-right">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No batch data available.
                      </td>
                    </tr>
                  )}
                  {batches.map((b: any) => {
                    const expiry = b.expiryDate ? new Date(b.expiryDate) : null;
                    const now = new Date();
                    const daysLeft = expiry
                      ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isExpired = daysLeft !== null && daysLeft <= 0;
                    const isNearExpiry = daysLeft !== null && !isExpired && daysLeft <= 30;
                    return (
                      <tr key={b.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {b.batchNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">
                          {b.productName}
                          <div className="text-xs text-muted-foreground font-normal mt-0.5">
                            {b.branchName}
                          </div>
                        </td>
                        <td className="px-4 py-3">{b.stock}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {expiry ? expiry.toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">
                              <AlertTriangle className="h-3 w-3" /> Expired
                            </span>
                          ) : isNearExpiry ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                              <AlertTriangle className="h-3 w-3" /> Near Expiry ({daysLeft} days)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                              <CheckCircle2 className="h-3 w-3" /> Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-2">
              {alerts.lowStock.length === 0 &&
                alerts.nearExpiry.length === 0 &&
                alerts.expired.length === 0 && (
                  <div className="col-span-2 text-center text-muted-foreground p-8">
                    No alerts. Everything is healthy!
                  </div>
                )}
              {alerts.expired.map((alert: any) => (
                <div
                  key={alert.id}
                  className="panel p-5 border-l-4 border-l-destructive flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive uppercase">
                        Expired
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Batch: {alert.batchNumber}
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-ink">{alert.productName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Expired on:{" "}
                      <span className="font-bold text-ink">
                        {new Date(alert.expiryDate).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Branch: {alert.branchName}</p>
                  </div>
                </div>
              ))}
              {alerts.nearExpiry.map((alert: any) => {
                const daysLeft = Math.ceil(
                  (new Date(alert.expiryDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                return (
                  <div
                    key={alert.id}
                    className="panel p-5 border-l-4 border-l-accent flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase">
                          Near Expiry
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Batch: {alert.batchNumber}
                        </span>
                      </div>
                      <h3 className="mt-2 font-bold text-ink">{alert.productName}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Expires in: <span className="font-bold text-ink">{daysLeft} days</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Branch: {alert.branchName}
                      </p>
                    </div>
                  </div>
                );
              })}
              {alerts.lowStock.map((alert: any) => (
                <div
                  key={alert.id}
                  className="panel p-5 border-l-4 border-l-accent flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase">
                        Critical Stock
                      </span>
                      <span className="text-xs text-muted-foreground">
                        SKU: {alert.sku || alert.barcode}
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-ink">{alert.productName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Current Stock: <span className="font-bold text-ink">{alert.stock}</span>{" "}
                      (Reorder at {alert.reorderLevel})
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Branch: {alert.branchName}</p>
                  </div>
                  {allowPoDraft ? (
                    <Button
                      className="mt-4 w-full"
                      variant="secondary"
                      onClick={() => {
                        setDraftPoForm({
                          productId: alert.productId,
                          branchId: alert.branchId,
                          vendorId: vendors.length > 0 ? vendors[0].id : "",
                          qty: Math.max(10, alert.reorderLevel - alert.stock),
                        });
                        setDraftPoOpen(true);
                      }}
                    >
                      <ShoppingCart className="mr-1.5 h-4 w-4" /> Raise PO Draft
                    </Button>
                  ) : (
                    <div className="relative group mt-4 w-full">
                      <Button className="w-full" variant="secondary" disabled>
                        <ShoppingCart className="mr-1.5 h-4 w-4" /> Raise PO Draft
                      </Button>
                      <div className="absolute right-0 bottom-full mb-1 hidden w-48 z-10 p-2 text-xs text-white bg-black rounded group-hover:block text-center">
                        Only Purchasing Officer can create purchase orders.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ledger" className="mt-0">
            <LedgerTabContent />
          </TabsContent>

          <TabsContent value="reports" className="mt-0 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink">Inventory Valuation Report</h2>
                <p className="text-muted-foreground">Value of current stock on hand.</p>
              </div>
              <Button onClick={() => {
                const header = ["Product", "SKU", "Branch", "Quantity", "Unit Cost", "Total Value"];
                const rows = stockLevels.map((s: any) => [
                  s.productName,
                  s.sku || "-",
                  s.branchName || "Main Branch",
                  s.stock,
                  Number(s.costPrice || 0),
                  s.stock * Number(s.costPrice || 0)
                ]);
                const csv = [header, ...rows].map((r: any[]) => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "inventory-valuation.csv";
                a.click();
              }}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" /> Total Value
                </div>
                <div className="text-3xl font-bold text-ink">
                  {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(
                    stockLevels.reduce((acc: number, s: any) => acc + (s.stock * Number(s.costPrice || 0)), 0)
                  )}
                </div>
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Branch</th>
                    <th className="px-4 py-3 font-medium text-right">Quantity</th>
                    <th className="px-4 py-3 font-medium text-right">Unit Cost</th>
                    <th className="px-4 py-3 font-medium text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stockLevels.map((s: any, idx: number) => {
                    const unitCost = Number(s.costPrice || 0);
                    const totalValue = s.stock * unitCost;
                    return (
                      <tr key={idx} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink">{s.productName}</div>
                          <div className="text-xs text-muted-foreground">{s.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{s.branchName || "-"}</td>
                        <td className="px-4 py-3 text-right font-medium">{s.stock}</td>
                        <td className="px-4 py-3 text-right">{new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(unitCost)}</td>
                        <td className="px-4 py-3 text-right font-bold text-primary">{new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalValue)}</td>
                      </tr>
                    );
                  })}
                  {stockLevels.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">No data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </TabsContent>
        </main>
      </Tabs>

      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-ink">New Stock Transfer</h2>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-muted-foreground hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-ink">Product / SKU</label>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                >
                  <option value="">Select a product...</option>
                  {Array.from(new Set(stockLevels.map((s: any) => s.productId))).map((id: any) => {
                    const s = stockLevels.find((st: any) => st.productId === id);
                    return (
                      <option key={id} value={id}>
                        {s.productName} (SKU: {s.sku || s.barcode})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-ink">From Branch</label>
                  <select
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                    value={transferForm.sourceBranchId}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, sourceBranchId: e.target.value })
                    }
                    disabled={role === "Inventory Manager" && branches.length === 1}
                  >
                    <option value="">Select origin...</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-ink">To Branch</label>
                  <select
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                    value={transferForm.targetBranchId}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, targetBranchId: e.target.value })
                    }
                  >
                    <option value="">Select destination...</option>
                    {allTenantBranches
                      .filter((b: any) => b.id !== transferForm.sourceBranchId)
                      .map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  className="mt-1"
                  value={transferForm.quantity}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, quantity: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    isTransferring ||
                    !transferForm.productId ||
                    !transferForm.sourceBranchId ||
                    !transferForm.targetBranchId ||
                    transferForm.sourceBranchId === transferForm.targetBranchId
                  }
                  onClick={async () => {
                    setIsTransferring(true);
                    try {
                      await stockTransferServerFn({ data: transferForm });
                      toast.success("Stock transferred successfully!");
                      setTransferModalOpen(false);
                      router.invalidate();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to transfer stock");
                    } finally {
                      setIsTransferring(false);
                    }
                  }}
                >
                  {isTransferring ? "Processing..." : "Transfer Stock"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {draftPoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-ink">Raise PO Draft</h2>
              <button
                onClick={() => setDraftPoOpen(false)}
                className="text-muted-foreground hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-ink">Product</label>
                <div className="mt-1 p-2 bg-surface-2 rounded-md text-sm border border-border text-muted-foreground">
                  {stockLevels.find((s: any) => s.productId === draftPoForm.productId)
                    ?.productName || "Unknown Product"}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Branch</label>
                <div className="mt-1 p-2 bg-surface-2 rounded-md text-sm border border-border text-muted-foreground">
                  {branches.find((b: any) => b.id === draftPoForm.branchId)?.name ||
                    "Unknown Branch"}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Vendor</label>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={draftPoForm.vendorId}
                  onChange={(e) => setDraftPoForm({ ...draftPoForm, vendorId: e.target.value })}
                >
                  {vendors?.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Order Quantity</label>
                <Input
                  type="number"
                  min="1"
                  className="mt-1"
                  value={draftPoForm.qty}
                  onChange={(e) =>
                    setDraftPoForm({ ...draftPoForm, qty: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDraftPoOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={isDraftingPo || !draftPoForm.vendorId || draftPoForm.qty <= 0}
                  onClick={async () => {
                    setIsDraftingPo(true);
                    try {
                      await draftPurchaseOrderServerFn({ data: draftPoForm });
                      toast.success("Draft PO created successfully!");
                      setDraftPoOpen(false);
                      router.invalidate();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to create Draft PO");
                    } finally {
                      setIsDraftingPo(false);
                    }
                  }}
                >
                  {isDraftingPo ? "Processing..." : "Create Draft"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Stock Transfer Modal */}
      {editModalOpen && editingTransfer && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-ink">Edit Stock Transfer</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-muted-foreground hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">
                Editing transfer quantity for <span className="font-semibold text-ink">{editingTransfer.productName}</span> from <span className="font-semibold text-ink">{editingTransfer.sourceBranchName}</span> to <span className="font-semibold text-ink">{editingTransfer.destinationBranchName}</span>.
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Transfer Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={editQty}
                  onChange={(e) => setEditQty(Number(e.target.value))}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isEditing}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} disabled={isEditing}>
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* --- BULK EXCEL IMPORT SUMMARY MODAL --- */}
      <Dialog open={isImportSummaryModalOpen} onOpenChange={setIsImportSummaryModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Bulk Stock Import Summary
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Results from your Excel bulk stock update.
            </DialogDescription>
          </DialogHeader>

          {importSummary && (
            <div className="space-y-3 my-2 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-surface-2 border border-border/50">
                  <span className="text-muted-foreground block text-[11px]">Total Rows</span>
                  <span className="text-sm font-bold text-ink">{importSummary.totalProcessed}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <span className="block text-[11px]">Updated</span>
                  <span className="text-sm font-bold">{importSummary.totalUpdated}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  <span className="block text-[11px]">Skipped</span>
                  <span className="text-sm font-bold">{importSummary.totalSkipped}</span>
                </div>
              </div>

              {importSummary.skippedDetails && importSummary.skippedDetails.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="font-semibold text-ink block">Skipped Details ({importSummary.skippedDetails.length}):</span>
                  <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-xl bg-surface-2 border border-border/50">
                    {importSummary.skippedDetails.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] py-0.5 border-b border-border/30 last:border-0">
                        <span className="font-mono text-muted-foreground">{s.sku}</span>
                        <span className="text-destructive font-medium">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              className="w-full rounded-xl font-semibold"
              onClick={() => setIsImportSummaryModalOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DemoShell>
  );
}


function LedgerTabContent() {
  const fetchLedger = useServerFn(getInventoryLedgerFn);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLedger();
      if (res.success) {
        setLedger(res.ledger);
      } else {
        setError('Failed to fetch ledger');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading ledger records...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>{error}</p>
        <button onClick={loadLedger} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">Retry</button>
      </div>
    );
  }

  if (ledger.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No ledger records found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Product</th>
            <th className="pb-3 font-medium">Branch</th>
            <th className="pb-3 font-medium">Batch</th>
            <th className="pb-3 font-medium text-right">Previous</th>
            <th className="pb-3 font-medium text-right">Change</th>
            <th className="pb-3 font-medium text-right">New</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {ledger.map((row) => (
            <tr key={row.id}>
              <td className="py-3">{new Date(row.createdAt).toLocaleString()}</td>
              <td className="py-3">{row.transactionType}</td>
              <td className="py-3 font-medium">{row.productName}</td>
              <td className="py-3">{row.branchName}</td>
              <td className="py-3">{row.batchNumber || '-'}</td>
              <td className="py-3 text-right">{row.previousQuantity}</td>
              <td className={`py-3 text-right font-bold ${row.changedQuantity > 0 ? 'text-success' : 'text-destructive'}`}>
                {row.changedQuantity > 0 ? '+' : ''}{row.changedQuantity}
              </td>
              <td className="py-3 text-right">{row.newQuantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

