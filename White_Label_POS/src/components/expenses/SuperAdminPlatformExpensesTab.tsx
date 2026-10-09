import React, { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  ExternalLink,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  FileCheck,
  ShieldCheck,
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
  DialogDescription,
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
  getPlatformExpensesFn,
  createPlatformExpenseFn,
  updatePlatformExpenseFn,
  deletePlatformExpenseFn,
  uploadExpenseReceiptFn,
  getExpenseReceiptUrlFn,
} from "@/lib/expenses-server";

export function SuperAdminPlatformExpensesTab() {
  const [loading, setLoading] = useState(true);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [platformTotal, setPlatformTotal] = useState<number>(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [formCategory, setFormCategory] = useState<string>("Maintenance");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState<string>("");
  const [formReceiptUrl, setFormReceiptUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingExpense, setDeletingExpense] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Receipt Preview Dialog
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [openingReceiptId, setOpeningReceiptId] = useState<string | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await getPlatformExpensesFn({
        data: {
          category: selectedCategory === "all" ? undefined : selectedCategory,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      if (res.success) {
        setExpensesList(res.expenses || []);
        setPlatformTotal(res.total || 0);
      } else {
        toast.error("Failed to load platform expenses");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load platform expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, startDate, endDate]);

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setFormCategory("Maintenance");
    setFormAmount("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes("");
    setFormReceiptUrl("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (exp: any) => {
    setEditingExpense(exp);
    setFormCategory(exp.category || "Maintenance");
    setFormAmount(String(exp.amount || ""));
    setFormDate(exp.expenseDate || new Date().toISOString().slice(0, 10));
    setFormNotes(exp.notes || "");
    setFormReceiptUrl(exp.receiptUrl || "");
    setDialogOpen(true);
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image (JPG, PNG, WEBP) or PDF files are allowed.");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(",")[1];
          const uploadRes = await uploadExpenseReceiptFn({
            data: {
              base64Data,
              fileName: file.name,
              mimeType: file.type,
            },
          });
          const path = uploadRes.storagePath || (uploadRes as any).publicUrl;
          if (uploadRes.success && path) {
            setFormReceiptUrl(path);
            toast.success("Receipt attached successfully!");
          } else {
            toast.error(uploadRes.error || "Failed to attach receipt");
          }
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || "Failed to attach receipt");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploading(false);
      toast.error("Error reading file");
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!formDate) {
      toast.error("Please choose a valid expense date");
      return;
    }

    setIsSaving(true);
    try {
      if (editingExpense) {
        const res = await updatePlatformExpenseFn({
          data: {
            id: editingExpense.id,
            category: formCategory,
            amount: numAmount,
            expenseDate: formDate,
            notes: formNotes,
            receiptUrl: formReceiptUrl,
          },
        });
        if (res.success) {
          toast.success("Platform expense updated successfully!");
          setDialogOpen(false);
          fetchExpenses();
        }
      } else {
        const res = await createPlatformExpenseFn({
          data: {
            category: formCategory,
            amount: numAmount,
            expenseDate: formDate,
            notes: formNotes,
            receiptUrl: formReceiptUrl,
          },
        });
        if (res.success) {
          toast.success("Platform expense recorded successfully!");
          setDialogOpen(false);
          fetchExpenses();
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save platform expense");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    try {
      const res = await deletePlatformExpenseFn({
        data: { id: deletingExpense.id },
      });
      if (res.success) {
        toast.success("Platform expense record deleted.");
        setDeletingExpense(null);
        fetchExpenses();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete platform expense");
    } finally {
      setIsDeleting(false);
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
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-white">SaaS Platform Expenses</h1>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Dedicated internal ledger for Cloudynation POS platform operating expenses (hosting, software, marketing, overheads). Completely segregated from tenant expenditures.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="rounded-xl font-bold bg-lime-500 hover:bg-lime-600 text-slate-950 shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Record Platform Expense
        </Button>
      </div>

      {/* KPI & Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Expense KPI */}
        <div className="panel p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Platform Expenses</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-black text-ink">
            AED {platformTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {expensesList.length} platform expense records
          </div>
        </div>

        {/* Filter Controls */}
        <div className="panel p-5 rounded-2xl border border-border bg-surface sm:col-span-2 flex flex-col justify-between space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter Platform Expenses</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[180px]">
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

            <div className="flex items-center gap-1.5 flex-1">
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

            {(selectedCategory !== "all" || startDate || endDate) && (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-ink rounded-xl"
                onClick={() => {
                  setSelectedCategory("all");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Platform Expenses Ledger</h2>
          <Badge variant="outline" className="text-xs font-bold">
            {expensesList.length} Entries
          </Badge>
        </div>

        <div className="overflow-x-auto w-full rounded-2xl border border-border">
          <Table className="w-full">
            <TableHeader className="bg-surface-2/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes / Description</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount (AED)</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Receipt</TableHead>
                <TableHead className="py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs font-medium">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading platform expenses...
                  </TableCell>
                </TableRow>
              ) : expensesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs font-medium">
                    No platform expenses recorded yet. Click "Record Platform Expense" to add your first entry.
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
                        <Badge
                          variant="outline"
                          className={`rounded-xl px-2.5 py-0.5 text-[11px] font-bold ${
                            categoryColor[exp.category] || "bg-surface-2 text-ink"
                          }`}
                        >
                          {exp.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4 text-xs text-muted-foreground max-w-[280px] truncate">
                        {exp.notes || "—"}
                      </TableCell>
                      <TableCell className="p-4 font-extrabold text-sm text-ink whitespace-nowrap">
                        AED {Number(exp.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="p-4 whitespace-nowrap">
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
                      <TableCell className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold rounded-xl"
                            onClick={() => handleOpenEdit(exp)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-primary" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => setDeletingExpense(exp)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
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

      {/* Create / Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSaveExpense}>
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Platform Expense" : "Record Platform Expense"}</DialogTitle>
              <DialogDescription>
                Record SaaS platform operational costs (tenant_id will remain null).
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (AED) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expenseDate">Expense Date *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes / Provider</Label>
                <Input
                  id="notes"
                  placeholder="e.g. AWS cloud infrastructure, office internet"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Attach Receipt / Proof (Optional - Max 5MB, Images/PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
                  />
                </div>
                {isUploading && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading receipt...
                  </p>
                )}
                {formReceiptUrl && (
                  <div className="flex items-center justify-between p-2 rounded-xl border bg-surface-2 mt-1">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <FileCheck className="h-3.5 w-3.5" /> Receipt Attached
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-destructive px-2"
                      onClick={() => setFormReceiptUrl("")}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isUploading}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingExpense ? "Update Expense" : "Save Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deletingExpense)} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Platform Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense of AED {deletingExpense?.amount} ({deletingExpense?.category})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingExpense(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt View Modal */}
      <Dialog open={Boolean(previewReceiptUrl)} onOpenChange={(open) => !open && setPreviewReceiptUrl(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Attachment</DialogTitle>
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
