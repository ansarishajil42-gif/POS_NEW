import { useState, useMemo, useEffect, useRef } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Monitor,
  Receipt,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  Tag,
  Menu,
} from "lucide-react";
import { aedShort, aed } from "@/lib/demo-data";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  getStoreManagerDataFn,
  requestPriceOverrideFn,
  createOverrideRequestFn,
  createRosterShiftFn,
  deleteRosterShiftFn,
  createTillFn,
  resetCashierPinByManagerFn,
  adjustStockFn,
  getStockAdjustmentHistoryFn,
  exportZReportFn,
  recordCashDropFn,
  closeShiftFn,
} from "@/lib/store-manager-server";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/store-manager")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (role !== "Branch Manager") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  loader: async () => {
    return await getStoreManagerDataFn();
  },
  component: StoreManager,
});

function StoreManager() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Price override request modal states
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [requestedPrice, setRequestedPrice] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");

  // Shift Roster modal states
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [selectedCashierId, setSelectedCashierId] = useState("");
  const [selectedTillId, setSelectedTillId] = useState("");
  const [shiftDate, setShiftDate] = useState("2026-08-21");
  const [shiftStartTime, setShiftStartTime] = useState("09:00");
  const [shiftEndTime, setShiftEndTime] = useState("17:00");
  const [shiftNotes, setShiftNotes] = useState("");
  const [isRosterSubmitting, setIsRosterSubmitting] = useState(false);
  const [rosterValidationErrors, setRosterValidationErrors] = useState<Record<string, string>>({});
  const [rosterErrorMsg, setRosterErrorMsg] = useState("");

  // Create Till modal states
  const [tillModalOpen, setTillModalOpen] = useState(false);
  const [tillName, setTillName] = useState("");
  const [tillDescription, setTillDescription] = useState("");
  const [tillOpeningFloat, setTillOpeningFloat] = useState("0.00");
  const [isTillSubmitting, setIsTillSubmitting] = useState(false);
  const [tillValidationErrors, setTillValidationErrors] = useState<Record<string, string>>({});
  const [tillErrorMsg, setTillErrorMsg] = useState("");

  // Manager Reset Cashier PIN states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetId, setResetTargetId] = useState("");
  const [resetTargetName, setResetTargetName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetErrorMsg, setResetErrorMsg] = useState("");

  // Stock Adjustment states
  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("Correction");
  const [adjustNote, setAdjustNote] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Stock History states
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyProductId, setHistoryProductId] = useState("");
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Cash Drop states
  const [cashDropModalOpen, setCashDropModalOpen] = useState(false);
  const [dropShiftId, setDropShiftId] = useState("");
  const [dropAmount, setDropAmount] = useState("");
  const [dropNote, setDropNote] = useState("");
  const [isDropping, setIsDropping] = useState(false);

  // Close Shift states
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [closeShiftId, setCloseShiftId] = useState("");
  const [closeActualCash, setCloseActualCash] = useState("");
  const [isClosingShift, setIsClosingShift] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const categoriesList = useMemo(() => {
    if (!data || !(data as any).stock) return [];
    const cats = ((data as any).stock || []).map((s: any) => s.category).filter(Boolean);
    return Array.from(new Set(cats)) as string[];
  }, [data]);

  const filteredStock = useMemo(() => {
    if (!data || !(data as any).stock) return [];
    return ((data as any).stock || []).filter((p: any) => {
      if (selectedCategory !== "All Categories" && p.category !== selectedCategory) {
        return false;
      }
      if (search.trim() !== "") {
        const s = search.toLowerCase().trim();
        const nameMatch = p.productName?.toLowerCase().includes(s);
        const skuMatch = p.sku?.toLowerCase().includes(s);
        const barcodeMatch = p.barcode?.toLowerCase().includes(s);
        return nameMatch || skuMatch || barcodeMatch;
      }
      return true;
    });
  }, [data, selectedCategory, search]);

  const selectedProduct = useMemo(() => {
    if (!data || !(data as any).stock || !selectedProductId) return null;
    return ((data as any).stock || []).find((s: any) => s.productId === selectedProductId) || null;
  }, [data, selectedProductId]);

  const tillsList = useMemo(() => {
    if (!data || !(data as any).tills) return [];
    return ((data as any).tills || []).map((t: any) => ({ id: t.id, name: t.name }));
  }, [data]);

  const eligibleStaff = useMemo(() => {
    if (!data || !(data as any).staff) return [];
    return ((data as any).staff || []).filter((st: any) => {
      if (st.isActive === false) return false;
      return st.role === "cashier";
    });
  }, [data]);

  const formatRoleName = (role: string) => {
    switch (role) {
      case "cashier":
        return "Cashier";
      case "branch_manager":
        return "Branch Manager";
      case "inventory_manager":
        return "Inventory Manager";
      case "purchasing_officer":
        return "Purchasing Officer";
      case "head_office_admin":
        return "Head Office Admin";
      case "super_admin":
        return "Super Admin";
      default:
        return role;
    }
  };

  const permissions = (data as any).permissions || [];
  const isPermEnabled = (key: string) => {
    const record = permissions.find((p: any) => p.permission === key);
    return record ? record.enabled : true;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!selectedProductId) {
      errors["productId"] = "Product is required.";
    }
    if (!requestedPrice) {
      errors["requestedPrice"] = "Requested price is required.";
    } else {
      const p = Number(requestedPrice);
      if (isNaN(p)) {
        errors["requestedPrice"] = "Requested price must be a valid number.";
      } else if (p < 0) {
        errors["requestedPrice"] = "Requested price must not be negative.";
      }
    }
    if (!overrideReason.trim()) {
      errors["reason"] = "Reason for override is required.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createOverrideRequestFn({
        data: {
          productId: selectedProductId,
          requestedPrice,
          reason: overrideReason,
        },
      });
      if (res.success) {
        toast.success("Price override request submitted successfully!");
        setOverrideModalOpen(false);
        setSelectedProductId("");
        setRequestedPrice("");
        setOverrideReason("");
        router.invalidate();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!selectedCashierId) {
      errors["cashierId"] = "Staff/Cashier is required.";
    }
    if (!selectedTillId) {
      errors["tillId"] = "Till assignment is required.";
    }
    if (!shiftDate) {
      errors["shiftDate"] = "Shift date is required.";
    }
    if (!shiftStartTime) {
      errors["startTime"] = "Start time is required.";
    }
    if (!shiftEndTime) {
      errors["endTime"] = "End time is required.";
    } else if (shiftStartTime && shiftEndTime < shiftStartTime) {
      errors["endTime"] = "End time cannot be earlier than start time.";
    }

    if (Object.keys(errors).length > 0) {
      setRosterValidationErrors(errors);
      return;
    }
    setRosterValidationErrors({});
    setIsRosterSubmitting(true);
    setRosterErrorMsg("");

    try {
      const res = await createRosterShiftFn({
        data: {
          cashierId: selectedCashierId,
          tillId: selectedTillId,
          shiftDate,
          startTime: shiftStartTime,
          endTime: shiftEndTime,
          notes: shiftNotes,
        },
      });
      if (res.success) {
        toast.success("Roster shift scheduled successfully!");
        setRosterModalOpen(false);
        setSelectedCashierId("");
        setSelectedTillId("");
        setShiftNotes("");
        router.invalidate();
      }
    } catch (err: any) {
      setRosterErrorMsg(err.message || "Failed to save roster.");
    } finally {
      setIsRosterSubmitting(false);
    }
  };

  const handleDeleteRoster = async (shiftId: string) => {
    if (!confirm("Are you sure you want to cancel this shift?")) return;
    try {
      const res = await deleteRosterShiftFn({
        data: { shiftId },
      });
      if (res.success) {
        toast.success("Shift cancelled successfully.");
        router.invalidate();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel shift.");
    }
  };

  const handleTillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!tillName.trim()) {
      errors["name"] = "Till name or number is required.";
    }
    const floatVal = Number(tillOpeningFloat || "0.00");
    if (isNaN(floatVal) || floatVal < 0) {
      errors["openingFloat"] = "Opening float must be a non-negative number.";
    }

    if (Object.keys(errors).length > 0) {
      setTillValidationErrors(errors);
      return;
    }
    setTillValidationErrors({});
    setIsTillSubmitting(true);
    setTillErrorMsg("");

    try {
      const res = await createTillFn({
        data: {
          name: tillName,
          description: tillDescription,
          openingFloat: tillOpeningFloat,
        },
      });
      if (res.success) {
        toast.success("Till created successfully!");
        setTillModalOpen(false);
        setTillName("");
        setTillDescription("");
        setTillOpeningFloat("0.00");
        router.invalidate();
      }
    } catch (err: any) {
      setTillErrorMsg(err.message || "Failed to create till.");
    } finally {
      setIsTillSubmitting(false);
    }
  };

  const handleManagerResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || !confirmPin) {
      setResetErrorMsg("Please enter new PIN and confirm it.");
      return;
    }
    if (newPin !== confirmPin) {
      setResetErrorMsg("PIN and confirmation PIN do not match.");
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setResetErrorMsg("PIN must be exactly 4 digits.");
      return;
    }
    setIsResetSubmitting(true);
    setResetErrorMsg("");

    try {
      const res = await resetCashierPinByManagerFn({
        data: {
          cashierId: resetTargetId,
          newPin,
          confirmPin,
        }
      });
      if (res.success) {
        toast.success("Cashier PIN reset successfully!");
        setResetModalOpen(false);
        setNewPin("");
        setConfirmPin("");
        setResetTargetId("");
        setResetTargetName("");
        router.invalidate();
      }
    } catch (err: any) {
      setResetErrorMsg(err.message || "Failed to reset Cashier PIN.");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleExportZReport = async () => {
    try {
      const res = await exportZReportFn();
      if (res.success && res.csvContent) {
        const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Z-Report-${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Z-Report exported successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to export Z-Report.");
    }
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(adjustQuantity);
    if (!adjustQuantity || isNaN(qty)) {
      toast.error("Please enter a valid quantity change.");
      return;
    }
    setIsAdjusting(true);
    try {
      const res = await adjustStockFn({
        data: {
          productId: adjustProductId,
          quantityChange: qty,
          reason: adjustReason,
          note: adjustNote,
        }
      });
      if (res.success) {
        toast.success("Stock adjusted successfully!");
        setAdjustStockModalOpen(false);
        setAdjustQuantity("");
        setAdjustNote("");
        router.invalidate();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock.");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleCashDropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(dropAmount);
    if (!dropAmount || isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid drop amount.");
      return;
    }
    setIsDropping(true);
    try {
      const res = await recordCashDropFn({
        data: {
          shiftId: dropShiftId,
          amount: amt,
          note: dropNote,
        }
      });
      if (res.success) {
        toast.success("Cash drop recorded successfully!");
        setCashDropModalOpen(false);
        setDropAmount("");
        setDropNote("");
        router.invalidate();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to record cash drop.");
    } finally {
      setIsDropping(false);
    }
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(closeActualCash);
    if (!closeActualCash || isNaN(amt) || amt < 0) {
      toast.error("Please enter a valid actual cash amount.");
      return;
    }
    setIsClosingShift(true);
    try {
      const res = await closeShiftFn({
        data: {
          shiftId: closeShiftId,
          actualCash: amt,
        }
      });
      if (res.success) {
        toast.success("Shift closed successfully!");
        setCloseShiftModalOpen(false);
        setCloseActualCash("");
        router.invalidate();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to close shift.");
    } finally {
      setIsClosingShift(false);
    }
  };

  if ((data as any).error) {
    return (
      <div className="p-8">
        <h1 className="text-red-500 font-bold text-xl">Backend API Error</h1>
        <pre className="mt-4 p-4 bg-red-50 text-red-900 rounded whitespace-pre-wrap">
          {(data as any).error}
        </pre>
      </div>
    );
  }

  try {
    // Local derived state
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = data.orders.filter(
      (o: any) => new Date(o.createdAt).toISOString().split("T")[0] === today,
    );
    const salesToday =
      todayOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0;
    const transactions = todayOrders.length;
    const avgBasket = transactions > 0 ? (salesToday / transactions).toFixed(2) : "0.00";

    const itemCounts: Record<string, any> = {};
    todayOrders.forEach((o: any) => {
      (o.items || []).forEach((i: any) => {
        if (!itemCounts[i.productId])
          itemCounts[i.productId] = { name: i.product?.name || "Unknown", qty: 0, value: 0 };
        itemCounts[i.productId].qty += Number(i.qty) || 0;
        itemCounts[i.productId].value += (Number(i.unitPrice) || 0) * (Number(i.qty) || 0);
      });
    });
    const topItems = Object.values(itemCounts)
      .sort((a: any, b: any) => b.qty - a.qty)
      .slice(0, 4);
    const lowStock = data.stock.filter((s: any) => s.stock < 20).length;

    const activeTills = data.shifts.filter(
      (s: any) => s.status === "Active" || s.status === "Open",
    ).length;
    const totalTills = data.tills ? data.tills.length : data.branch?.tillCount || 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayOrders = data.orders.filter(
      (o: any) => new Date(o.createdAt).toDateString() === yesterday.toDateString(),
    );
    const salesYesterday = yesterdayOrders.reduce(
      (sum: number, o: any) => sum + (Number(o.total) || 0),
      0,
    );
    const salesGrowth =
      salesYesterday > 0 ? (((salesToday - salesYesterday) / salesYesterday) * 100).toFixed(1) : 0;
    const growthText =
      salesYesterday > 0
        ? `${Number(salesGrowth) >= 0 ? "+" : ""}${salesGrowth}% vs yesterday`
        : undefined;

    // Generate dynamic 7-day trend
    const localTrend: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dayOrders = data.orders.filter(
        (o: any) => new Date(o.createdAt).toDateString() === date.toDateString(),
      );
      const daySales = dayOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
      localTrend.push({ d: dayName, Sales: daySales });
    }

    return (
      <DemoShell
        title="Store Dashboard"
        subtitle={`${data.branch?.name || "Branch"} · Manager View`}
        actions={
          <Button
            className="rounded-xl font-semibold"
            onClick={handleExportZReport}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export Z-Report
          </Button>
        }
      >
        <Tabs defaultValue="dashboard" onValueChange={() => setIsMobileMenuOpen(false)} className="mt-6 flex flex-col md:flex-row gap-8">
        <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
          <span className="font-semibold text-sm">Navigation Menu</span>
          <Button variant="outline" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <aside className={`w-full md:w-56 shrink-0 ${isMobileMenuOpen ? "block" : "hidden md:block"}`}>
            <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
              <TabsTrigger
                value="dashboard"
                className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Dashboard
              </TabsTrigger>
              {isPermEnabled("local_stock") && (
                <TabsTrigger
                  value="stock"
                  className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Local Stock
                </TabsTrigger>
              )}
              {isPermEnabled("pricing_adjustments") && (
                <TabsTrigger
                  value="pricing"
                  className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Pricing Adjustments
                </TabsTrigger>
              )}
              {isPermEnabled("shift_staff") && (
                <TabsTrigger
                  value="staff"
                  className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Shift & Staff
                </TabsTrigger>
              )}
            </TabsList>
          </aside>

          <main className="min-w-0 flex-1">
            <TabsContent value="dashboard" className="mt-0 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Sales today"
                  value={aedShort(salesToday)}
                  icon={TrendingUp}
                  tone="success"
                  {...(growthText ? { delta: growthText } : {})}
                />
                <StatCard
                  label="Transactions"
                  value={transactions.toLocaleString()}
                  delta={`Avg basket: ${avgBasket}`}
                  icon={Receipt}
                />
                <StatCard
                  label="Low stock items"
                  value={lowStock}
                  icon={AlertTriangle}
                  tone="accent"
                />
                <StatCard
                  label="Active tills"
                  value={`${activeTills} / ${totalTills}`}
                  icon={Monitor}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="panel p-6">
                  <h2 className="text-sm font-bold text-ink">
                    Branch Performance (Last 7 Days) · AED 000s
                  </h2>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={localTrend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                        />
                        <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                        <Tooltip cursor={{ fill: "var(--surface-2)" }} />
                        <Bar dataKey="Sales" fill="#39ff14" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel p-6">
                  <h2 className="text-sm font-bold text-ink">Top Selling Items Today</h2>
                  <div className="mt-4 space-y-4">
                    {topItems.length === 0 && (
                      <p className="text-sm text-muted-foreground">No sales yet today.</p>
                    )}
                    {topItems.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.qty} units sold</p>
                        </div>
                        <div className="text-right text-sm font-bold text-ink">
                          {aed(item.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stock" className="mt-0">
              {!isPermEnabled("local_stock") ? (
                <div className="panel p-8 text-center">
                  <h3 className="text-lg font-bold text-red-500">Access Denied</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You do not have permission to view local stock.
                  </p>
                </div>
              ) : (
                <div className="panel overflow-hidden p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative w-72">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Scan barcode or search SKU..."
                        className="pl-9 h-10 rounded-xl text-sm bg-surface-2 border-transparent focus:border-primary"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>

                    <div className="relative" ref={dropdownRef}>
                      <Button
                        variant="outline"
                        className="h-10 rounded-xl flex items-center gap-2"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        aria-haspopup="listbox"
                        aria-expanded={isCategoryOpen}
                      >
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedCategory === "All Categories"
                            ? "Filter by Category"
                            : `Category: ${selectedCategory}`}
                        </span>
                      </Button>
                      {isCategoryOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            <button
                              role="option"
                              aria-selected={selectedCategory === "All Categories"}
                              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                selectedCategory === "All Categories"
                                  ? "bg-primary/10 text-primary"
                                  : "text-ink hover:bg-surface-2"
                              }`}
                              onClick={() => {
                                setSelectedCategory("All Categories");
                                setIsCategoryOpen(false);
                              }}
                            >
                              All Categories
                            </button>
                            {categoriesList.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                No categories available
                              </p>
                            ) : (
                              categoriesList.map((cat) => (
                                <button
                                  key={cat}
                                  role="option"
                                  aria-selected={selectedCategory === cat}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    selectedCategory === cat
                                      ? "bg-primary/10 text-primary"
                                      : "text-ink hover:bg-surface-2"
                                  }`}
                                  onClick={() => {
                                    setSelectedCategory(cat);
                                    setIsCategoryOpen(false);
                                  }}
                                >
                                  {cat}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4 overflow-x-auto pb-2">
                    {filteredStock.length === 0 ? (
                      <div className="text-center py-10 rounded-2xl border border-dashed border-border bg-surface-2/45">
                        <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground animate-bounce mb-2" />
                        <p className="text-sm font-semibold text-ink">No products found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try adjusting your filters or search query.
                        </p>
                      </div>
                    ) : (
                      filteredStock.map((p: any, i: number) => {
                        const localQty = p.stock;
                        const isLow = localQty < 20;
                        return (
                          <div
                            key={p.id}
                            className="group flex min-w-[600px] items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationFillMode: "both", animationDelay: `${i * 50}ms` }}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${isLow ? "bg-accent/10 text-accent group-hover:bg-accent/20" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}
                              >
                                <Package className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-ink transition-colors group-hover:text-primary">
                                  {p.productName}
                                </h4>
                                <div className="mt-1 flex items-center gap-3 text-xs font-medium text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" /> {p.category}
                                  </span>
                                  <span className="h-1 w-1 rounded-full bg-border"></span>
                                  <span>SKU: {p.sku}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-8 text-right">
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                  In Stock
                                </p>
                                <p
                                  className={`text-lg font-extrabold ${isLow ? "text-accent" : "text-ink"}`}
                                >
                                  {localQty}{" "}
                                  <span className="text-sm font-semibold text-muted-foreground">
                                    {p.unit}
                                  </span>
                                </p>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                {isLow ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent shadow-sm ring-1 ring-inset ring-accent/20 shrink-0">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Low
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-bold text-success shadow-sm ring-1 ring-inset ring-success/20 shrink-0">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
                                  </span>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-primary"
                                  onClick={async () => {
                                    setHistoryProductId(p.productId);
                                    setHistoryModalOpen(true);
                                    setIsHistoryLoading(true);
                                    try {
                                      const hist = await getStockAdjustmentHistoryFn({ data: { productId: p.productId } });
                                      setHistoryData(hist || []);
                                    } catch (err: any) {
                                      toast.error(err.message || "Failed to load history");
                                    } finally {
                                      setIsHistoryLoading(false);
                                    }
                                  }}
                                  title="View History"
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 rounded-full px-4 text-xs font-semibold shrink-0 bg-surface hover:bg-surface-2 transition-colors border-border/50"
                                  onClick={() => {
                                    setAdjustProductId(p.productId);
                                    setAdjustStockModalOpen(true);
                                  }}
                                >
                                  Adjust
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}


              {/* Stock History Modal */}
              <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                <DialogContent className="sm:max-w-xl w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Stock Adjustment History</DialogTitle>
                    <DialogDescription>
                      Past adjustments for this product.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    {isHistoryLoading ? (
                      <div className="flex justify-center p-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                      </div>
                    ) : historyData.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground p-8">No adjustments found.</p>
                    ) : (
                      <div className="space-y-4">
                        {historyData.map((h, i) => (
                          <div key={i} className="flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-surface-2/50 text-sm">
                            <div className="flex justify-between font-semibold">
                              <span>{new Date(h.createdAt).toLocaleString()}</span>
                              <span className={h.quantityChange > 0 ? "text-success" : "text-accent"}>
                                {h.quantityChange > 0 ? "+" : ""}{h.quantityChange}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              Reason: {h.reason}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              By: {h.adjustedByName || "Unknown"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Adjust Stock Modal */}
              <Dialog
                open={adjustStockModalOpen}
                onOpenChange={(open) => {
                  if (!isAdjusting) {
                    setAdjustStockModalOpen(open);
                    if (!open) {
                      setAdjustQuantity("");
                      setAdjustReason("Correction");
                      setAdjustNote("");
                    }
                  }
                }}
              >
                <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                  <DialogHeader>
                    <DialogTitle>Adjust Stock</DialogTitle>
                    <DialogDescription>
                      Manually adjust the stock quantity for the selected product.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAdjustStockSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="adj-qty">Quantity Change (+/-)</Label>
                      <Input
                        id="adj-qty"
                        type="number"
                        placeholder="e.g. -5 or 10"
                        value={adjustQuantity}
                        onChange={(e) => setAdjustQuantity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="adj-reason">Reason</Label>
                      <select
                        id="adj-reason"
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                      >
                        <option value="Correction">Correction</option>
                        <option value="Wastage">Wastage</option>
                        <option value="Damage">Damage</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="adj-note">Note (Optional)</Label>
                      <Input
                        id="adj-note"
                        type="text"
                        placeholder="e.g. Found extra items in warehouse"
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                      />
                    </div>
                    <DialogFooter className="flex justify-end gap-2 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAdjustStockModalOpen(false)}
                        disabled={isAdjusting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isAdjusting}>
                        {isAdjusting ? "Saving..." : "Save Adjustment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="pricing" className="mt-0 space-y-5">
              {!isPermEnabled("pricing_adjustments") ? (
                <div className="panel p-8 text-center">
                  <h3 className="text-lg font-bold text-red-500">Access Denied</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You do not have permission to view pricing adjustments.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-ink">Local Pricing Adjustments</h3>
                      <p className="text-sm text-muted-foreground">
                        Request branch-specific price overrides for clearance or local competition.
                      </p>
                    </div>
                    {isPermEnabled("branch_override") ? (
                      <Button onClick={() => setOverrideModalOpen(true)}>Request Override</Button>
                    ) : (
                      <Button disabled className="opacity-50 cursor-not-allowed">
                        Override Disabled
                      </Button>
                    )}
                  </div>

                  <div className="panel overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Item</th>
                          <th className="px-4 py-3 font-medium">Standard Price</th>
                          <th className="px-4 py-3 font-medium">Requested Price</th>
                          <th className="px-4 py-3 font-medium">Reason</th>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(!data.requests || data.requests.length === 0) && (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">
                              No active price overrides or requests found.
                            </td>
                          </tr>
                        )}
                        {(data.requests || []).map((req: any) => (
                          <tr key={req.id} className="hover:bg-surface-2/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-ink">
                              {req.product?.name || "Unknown Product"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {aed(Number(req.standardPrice))}
                            </td>
                            <td className="px-4 py-3 font-bold text-ink">
                              {aed(Number(req.requestedPrice))}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">
                              {req.reason}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(req.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {req.status === "Approved" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success animate-in fade-in">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </span>
                              ) : req.status === "Rejected" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 animate-in fade-in">
                                  <Ban className="h-3 w-3" /> Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-700 animate-in fade-in">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Dialog
                    open={overrideModalOpen}
                    onOpenChange={(open) => {
                      if (!isSubmitting) {
                        setOverrideModalOpen(open);
                        if (!open) {
                          setSelectedProductId("");
                          setRequestedPrice("");
                          setOverrideReason("");
                          setValidationErrors({});
                          setErrorMsg("");
                        }
                      }
                    }}
                  >
                    <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                      <DialogHeader>
                        <DialogTitle>Request Price Override</DialogTitle>
                        <DialogDescription>
                          Submit a branch-specific price override request for manager review.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleRequestSubmit} className="space-y-4 py-2">
                        {errorMsg && (
                          <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 animate-in fade-in">
                            {errorMsg}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label htmlFor="product-select">Product</Label>
                          <select
                            id="product-select"
                            value={selectedProductId}
                            onChange={(e) => {
                              setSelectedProductId(e.target.value);
                              setValidationErrors((prev) => ({ ...prev, productId: "" }));
                            }}
                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Select a product...</option>
                            {(data.stock || []).map((s: any) => (
                              <option key={s.productId} value={s.productId}>
                                {s.productName} (SKU: {s.sku}) · Stock: {s.stock}
                              </option>
                            ))}
                          </select>
                          {validationErrors["productId"] && (
                            <p className="text-xs font-medium text-red-500">
                              {validationErrors["productId"]}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="standard-price">Standard Price (AED)</Label>
                            <Input
                              id="standard-price"
                              readOnly
                              disabled
                              value={
                                selectedProduct
                                  ? Number(selectedProduct.basePrice).toFixed(2)
                                  : "0.00"
                              }
                              className="bg-surface-2 cursor-not-allowed text-muted-foreground font-semibold"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="requested-price">Requested Price (AED)</Label>
                            <Input
                              id="requested-price"
                              type="text"
                              placeholder="e.g. 15.00"
                              value={requestedPrice}
                              onChange={(e) => {
                                setRequestedPrice(e.target.value);
                                setValidationErrors((prev) => ({ ...prev, requestedPrice: "" }));
                              }}
                              className={validationErrors["requestedPrice"] ? "border-red-500" : ""}
                            />
                            {validationErrors["requestedPrice"] && (
                              <p className="text-xs font-medium text-red-500">
                                {validationErrors["requestedPrice"]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="override-reason">Reason for Override</Label>
                          <Input
                            id="override-reason"
                            type="text"
                            placeholder="e.g. Near-expiry clearance / competitor price match"
                            value={overrideReason}
                            onChange={(e) => {
                              setOverrideReason(e.target.value);
                              setValidationErrors((prev) => ({ ...prev, reason: "" }));
                            }}
                            className={validationErrors["reason"] ? "border-red-500" : ""}
                          />
                          {validationErrors["reason"] && (
                            <p className="text-xs font-medium text-red-500">
                              {validationErrors["reason"]}
                            </p>
                          )}
                        </div>

                        <DialogFooter className="flex justify-end gap-2 mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setOverrideModalOpen(false);
                              setSelectedProductId("");
                              setRequestedPrice("");
                              setOverrideReason("");
                              setValidationErrors({});
                              setErrorMsg("");
                            }}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </TabsContent>

            <TabsContent value="staff" className="mt-0">
              {!isPermEnabled("shift_staff") ? (
                <div className="panel p-8 text-center">
                  <h3 className="text-lg font-bold text-red-500">Access Denied</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You do not have permission to view shift and staff roster.
                  </p>
                </div>
              ) : (
                <>
                  <div className="panel overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border p-4">
                      <h3 className="font-bold text-ink">Today's Shifts</h3>
                      <Button variant="outline" size="sm" onClick={() => setRosterModalOpen(true)}>
                        Manage Roster
                      </Button>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Cashier</th>
                          <th className="px-4 py-3 font-medium">Till Assignment</th>
                          <th className="px-4 py-3 font-medium">Shift Date/Time</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(!data.shifts || data.shifts.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
                              No shifts found for today.
                            </td>
                          </tr>
                        )}
                        {(data.shifts || []).map((shift: any) => {
                          const staffName =
                            shift.cashier?.name || shift.cashier?.email?.split("@")[0] || "Unknown";
                          const isCompleted = !!shift.closedAt;
                          return (
                            <tr key={shift.id} className="hover:bg-surface-2/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-ink flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center text-xs font-bold text-primary uppercase">
                                  {staffName.slice(0, 2)}
                                </div>
                                {staffName}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {shift.till?.name || "-"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {shift.shiftDate ? (
                                  <span className="font-semibold">
                                    {shift.shiftDate} ({shift.startTime} - {shift.endTime})
                                  </span>
                                ) : (
                                  <>
                                    {new Date(shift.openedAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {isCompleted
                                      ? new Date(shift.closedAt).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Ongoing"}
                                  </>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {shift.status === "Scheduled" && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 animate-in fade-in">
                                    Scheduled
                                  </span>
                                )}
                                {!isCompleted &&
                                  (shift.status === "Active" || shift.status === "Open") && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success animate-pulse">
                                      <span className="h-1.5 w-1.5 rounded-full bg-success" />{" "}
                                      Active
                                    </span>
                                  )}
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-border/50 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                                    Completed
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {shift.status === "Scheduled" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteRoster(shift.id)}
                                  >
                                    Cancel Shift
                                  </Button>
                                )}
                                {!isCompleted && (shift.status === "Active" || shift.status === "Open") && (
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 rounded-lg text-xs font-bold"
                                      onClick={() => {
                                        setDropShiftId(shift.id);
                                        setCashDropModalOpen(true);
                                      }}
                                    >
                                      Record Cash Drop
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 rounded-lg text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
                                      onClick={() => {
                                        setCloseShiftId(shift.id);
                                        setCloseShiftModalOpen(true);
                                      }}
                                    >
                                      Close Shift
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <Dialog
                      open={rosterModalOpen}
                      onOpenChange={(open) => {
                        if (!isRosterSubmitting) {
                          setRosterModalOpen(open);
                          if (!open) {
                            setSelectedCashierId("");
                            setSelectedTillId("");
                            setShiftNotes("");
                            setRosterValidationErrors({});
                            setRosterErrorMsg("");
                          }
                        }
                      }}
                    >
                      <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                        <DialogHeader>
                          <DialogTitle>Manage Shift Roster</DialogTitle>
                          <DialogDescription>
                            Schedule a cashier shift and assign a till.
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRosterSubmit} className="space-y-4 py-2">
                          {rosterErrorMsg && (
                            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 animate-in fade-in">
                              {rosterErrorMsg}
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <Label htmlFor="cashier-select">Cashier / Staff</Label>
                            <select
                              id="cashier-select"
                              value={selectedCashierId}
                              onChange={(e) => {
                                setSelectedCashierId(e.target.value);
                                setRosterValidationErrors((prev) => ({ ...prev, cashierId: "" }));
                              }}
                              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              {eligibleStaff.length === 0 ? (
                                <option value="">No eligible cashiers found</option>
                              ) : (
                                <>
                                  <option value="">Select a cashier...</option>
                                  {eligibleStaff.map((st: any) => (
                                    <option key={st.id} value={st.id}>
                                      {st.name} ({st.email}) · {formatRoleName(st.role)}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                            {rosterValidationErrors["cashierId"] && (
                              <p className="text-xs font-medium text-red-500">
                                {rosterValidationErrors["cashierId"]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="till-select">Till Assignment</Label>
                            <select
                              id="till-select"
                              value={selectedTillId}
                              onChange={(e) => {
                                setSelectedTillId(e.target.value);
                                setRosterValidationErrors((prev) => ({ ...prev, tillId: "" }));
                              }}
                              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              <option value="">Select a till...</option>
                              {tillsList.map((t: any) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            {rosterValidationErrors["tillId"] && (
                              <p className="text-xs font-medium text-red-500">
                                {rosterValidationErrors["tillId"]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="shift-date">Shift Date</Label>
                            <Input
                              id="shift-date"
                              type="date"
                              value={shiftDate}
                              onChange={(e) => {
                                setShiftDate(e.target.value);
                                setRosterValidationErrors((prev) => ({ ...prev, shiftDate: "" }));
                              }}
                              className={
                                rosterValidationErrors["shiftDate"] ? "border-red-500" : ""
                              }
                            />
                            {rosterValidationErrors["shiftDate"] && (
                              <p className="text-xs font-medium text-red-500">
                                {rosterValidationErrors["shiftDate"]}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="start-time">Start Time</Label>
                              <Input
                                id="start-time"
                                type="time"
                                value={shiftStartTime}
                                onChange={(e) => {
                                  setShiftStartTime(e.target.value);
                                  setRosterValidationErrors((prev) => ({ ...prev, startTime: "" }));
                                }}
                                className={
                                  rosterValidationErrors["startTime"] ? "border-red-500" : ""
                                }
                              />
                              {rosterValidationErrors["startTime"] && (
                                <p className="text-xs font-medium text-red-500">
                                  {rosterValidationErrors["startTime"]}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="end-time">End Time</Label>
                              <Input
                                id="end-time"
                                type="time"
                                value={shiftEndTime}
                                onChange={(e) => {
                                  setShiftEndTime(e.target.value);
                                  setRosterValidationErrors((prev) => ({ ...prev, endTime: "" }));
                                }}
                                className={
                                  rosterValidationErrors["endTime"] ? "border-red-500" : ""
                                }
                              />
                              {rosterValidationErrors["endTime"] && (
                                <p className="text-xs font-medium text-red-500">
                                  {rosterValidationErrors["endTime"]}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="shift-notes">Notes (Optional)</Label>
                            <Input
                              id="shift-notes"
                              type="text"
                              placeholder="e.g. Morning shift / weekend coverage"
                              value={shiftNotes}
                              onChange={(e) => setShiftNotes(e.target.value)}
                            />
                          </div>

                          <DialogFooter className="flex justify-end gap-2 mt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setRosterModalOpen(false);
                                setSelectedCashierId("");
                                setSelectedTillId("");
                                setShiftNotes("");
                                setRosterValidationErrors({});
                                setRosterErrorMsg("");
                              }}
                              disabled={isRosterSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isRosterSubmitting}>
                              {isRosterSubmitting ? "Saving..." : "Save Shift"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="panel overflow-hidden mt-6">
                    <div className="flex items-center justify-between border-b border-border p-4">
                      <div>
                        <h3 className="font-bold text-ink">Till Registry</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Manage POS terminal tills assigned to this branch.
                        </p>
                      </div>
                      {isPermEnabled("till_management") ? (
                        <Button variant="outline" size="sm" onClick={() => setTillModalOpen(true)}>
                          Add Till
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="opacity-50 cursor-not-allowed"
                        >
                          Add Till
                        </Button>
                      )}
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Till Name / Number</th>
                          <th className="px-4 py-3 font-medium">Description</th>
                          <th className="px-4 py-3 font-medium">Opening Float</th>
                          <th className="px-4 py-3 font-medium">Created Date</th>
                          <th className="px-4 py-3 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(!data.tills || data.tills.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
                              No tills found for this branch.
                            </td>
                          </tr>
                        )}
                        {(data.tills || []).map((till: any) => (
                          <tr key={till.id} className="hover:bg-surface-2/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-ink">{till.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {till.description || "No description"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {aed(Number(till.openingFloat))}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(till.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {till.status === "Open" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />{" "}
                                  Open
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-border/50 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                                  Closed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Create Till Modal Dialog */}
                    <Dialog
                      open={tillModalOpen}
                      onOpenChange={(open) => {
                        if (!isTillSubmitting) {
                          setTillModalOpen(open);
                          if (!open) {
                            setTillName("");
                            setTillDescription("");
                            setTillOpeningFloat("0.00");
                            setTillValidationErrors({});
                            setTillErrorMsg("");
                          }
                        }
                      }}
                    >
                      <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                        <DialogHeader>
                          <DialogTitle>Add POS Till</DialogTitle>
                          <DialogDescription>
                            Register a new till terminal for this branch. The till status defaults
                            to Closed.
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleTillSubmit} className="space-y-4 py-2">
                          {tillErrorMsg && (
                            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 animate-in fade-in">
                              {tillErrorMsg}
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <Label htmlFor="till-name-input">Till Name or Number</Label>
                            <Input
                              id="till-name-input"
                              type="text"
                              placeholder="e.g. Till 2"
                              value={tillName}
                              onChange={(e) => {
                                setTillName(e.target.value);
                                setTillValidationErrors((prev) => ({ ...prev, name: "" }));
                              }}
                              className={tillValidationErrors["name"] ? "border-red-500" : ""}
                            />
                            {tillValidationErrors["name"] && (
                              <p className="text-xs font-medium text-red-500">
                                {tillValidationErrors["name"]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="till-desc-input">Description (Optional)</Label>
                            <Input
                              id="till-desc-input"
                              type="text"
                              placeholder="e.g. Express checkout lane"
                              value={tillDescription}
                              onChange={(e) => setTillDescription(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="till-float-input">Opening Float (AED)</Label>
                            <Input
                              id="till-float-input"
                              type="text"
                              value={tillOpeningFloat}
                              onChange={(e) => {
                                setTillOpeningFloat(e.target.value);
                                setTillValidationErrors((prev) => ({ ...prev, openingFloat: "" }));
                              }}
                              className={
                                tillValidationErrors["openingFloat"] ? "border-red-500" : ""
                              }
                            />
                            {tillValidationErrors["openingFloat"] && (
                              <p className="text-xs font-medium text-red-500">
                                {tillValidationErrors["openingFloat"]}
                              </p>
                            )}
                          </div>

                          <DialogFooter className="flex justify-end gap-2 mt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setTillModalOpen(false);
                                setTillName("");
                                setTillDescription("");
                                setTillOpeningFloat("0.00");
                                setTillValidationErrors({});
                                setTillErrorMsg("");
                              }}
                              disabled={isTillSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isTillSubmitting}>
                              {isTillSubmitting ? "Creating..." : "Create Till"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Cashiers Directory Registry */}
                  <div className="panel overflow-hidden mt-6">
                    <div className="flex items-center justify-between border-b border-border p-4">
                      <div>
                        <h3 className="font-bold text-ink">Cashiers Directory</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          List of active cashiers assigned to this branch terminal.
                        </p>
                      </div>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Cashier Name</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(!data.staff || data.staff.filter((s: any) => s.role === "cashier").length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                              No cashiers found for this branch.
                            </td>
                          </tr>
                        )}
                        {(data.staff || [])
                          .filter((s: any) => s.role === "cashier")
                          .map((cashier: any) => (
                            <tr key={cashier.id} className="hover:bg-surface-2/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-ink">{cashier.name}</td>
                              <td className="px-4 py-3 text-muted-foreground">{cashier.email}</td>
                              <td className="px-4 py-3">
                                {cashier.isActive ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setResetTargetId(cashier.id);
                                    setResetTargetName(cashier.name);
                                    setResetModalOpen(true);
                                  }}
                                  disabled={!isPermEnabled("shift_staff")}
                                >
                                  Reset PIN
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Manager Reset Cashier PIN Modal Dialog */}
                  <Dialog
                    open={resetModalOpen}
                    onOpenChange={(open) => {
                      if (!isResetSubmitting) {
                        setResetModalOpen(open);
                        if (!open) {
                          setNewPin("");
                          setConfirmPin("");
                          setResetTargetId("");
                          setResetTargetName("");
                          setResetErrorMsg("");
                        }
                      }
                    }}
                  >
                    <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                      <DialogHeader>
                        <DialogTitle>Reset Cashier PIN</DialogTitle>
                        <DialogDescription>
                          Set a new 4-digit PIN for Cashier <span className="font-semibold text-ink">{resetTargetName}</span>.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleManagerResetSubmit} className="space-y-4 py-2">
                        {resetErrorMsg && (
                          <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 animate-in fade-in">
                            {resetErrorMsg}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="mgr-new-pin">New 4-digit PIN</Label>
                            <Input
                              id="mgr-new-pin"
                              type="password"
                              maxLength={4}
                              placeholder="••••"
                              value={newPin}
                              onChange={(e) => {
                                setNewPin(e.target.value.replace(/\D/g, ""));
                                setResetErrorMsg("");
                              }}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="mgr-confirm-pin">Confirm PIN</Label>
                            <Input
                              id="mgr-confirm-pin"
                              type="password"
                              maxLength={4}
                              placeholder="••••"
                              value={confirmPin}
                              onChange={(e) => {
                                setConfirmPin(e.target.value.replace(/\D/g, ""));
                                setResetErrorMsg("");
                              }}
                            />
                          </div>
                        </div>

                        <DialogFooter className="flex justify-end gap-2 mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setResetModalOpen(false);
                              setNewPin("");
                              setConfirmPin("");
                              setResetTargetId("");
                              setResetTargetName("");
                              setResetErrorMsg("");
                            }}
                            disabled={isResetSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isResetSubmitting}>
                            {isResetSubmitting ? "Resetting..." : "Reset PIN"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Cash Drop Modal */}
                  <Dialog
                    open={cashDropModalOpen}
                    onOpenChange={(open) => {
                      if (!isDropping) {
                        setCashDropModalOpen(open);
                        if (!open) {
                          setDropAmount("");
                          setDropNote("");
                        }
                      }
                    }}
                  >
                    <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                      <DialogHeader>
                        <DialogTitle>Record Cash Drop</DialogTitle>
                        <DialogDescription>
                          Record cash taken from the till during an active shift.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCashDropSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="drop-amount">Drop Amount (AED)</Label>
                          <Input
                            id="drop-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="e.g. 500"
                            value={dropAmount}
                            onChange={(e) => setDropAmount(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="drop-note">Note (Optional)</Label>
                          <Input
                            id="drop-note"
                            type="text"
                            placeholder="e.g. Safe deposit"
                            value={dropNote}
                            onChange={(e) => setDropNote(e.target.value)}
                          />
                        </div>
                        <DialogFooter className="flex justify-end gap-2 mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCashDropModalOpen(false)}
                            disabled={isDropping}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isDropping}>
                            {isDropping ? "Saving..." : "Record Drop"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Close Shift Modal */}
                  <Dialog
                    open={closeShiftModalOpen}
                    onOpenChange={(open) => {
                      if (!isClosingShift) {
                        setCloseShiftModalOpen(open);
                        if (!open) {
                          setCloseActualCash("");
                        }
                      }
                    }}
                  >
                    <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                      <DialogHeader>
                        <DialogTitle>Close Shift</DialogTitle>
                        <DialogDescription>
                          Enter the actual closing cash float to officially close this shift.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCloseShiftSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="close-cash">Actual Closing Cash (AED)</Label>
                          <Input
                            id="close-cash"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 1500"
                            value={closeActualCash}
                            onChange={(e) => setCloseActualCash(e.target.value)}
                            required
                          />
                        </div>
                        <DialogFooter className="flex justify-end gap-2 mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCloseShiftModalOpen(false)}
                            disabled={isClosingShift}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isClosingShift}>
                            {isClosingShift ? "Closing..." : "Close Shift"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </TabsContent>
          </main>
        </Tabs>
      </DemoShell>
    );
  } catch (e: any) {
    return (
      <div className="p-8">
        <h1 className="text-red-500 font-bold text-xl">Store Manager Render Crash</h1>
        <pre className="mt-4 p-4 bg-red-50 text-red-900 rounded">{e.stack}</pre>
      </div>
    );
  }
}
