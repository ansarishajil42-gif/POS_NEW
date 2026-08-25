import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Printer,
  Scale,
  ScanBarcode,
  Trash2,
  Wallet,
  WifiOff,
  Wifi,
  User,
  UserMinus,
  Search
} from "lucide-react";
import { DemoShell } from "@/components/demo/DemoShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { aed } from "@/lib/demo-data";
import {
  getPosCatalogServerFn,
  getActiveShiftServerFn,
  openShiftServerFn,
  closeShiftServerFn,
  recordCashDropServerFn,
  checkoutServerFn,
  getBranchTillsServerFn,
  generateShiftReportFn,
  searchPosCustomersFn
} from "@/lib/pos-server";
import { toast } from "sonner";

export const Route = createFileRoute("/pos-till")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (role !== "Cashier") throw redirect({ to: roleRoutes[role] });
  },
  head: () => ({
    meta: [
      { title: "POS Till Terminal Demo — cloudynationpos" },
      {
        name: "description",
        content:
          "Try the cloudynationpos cashier till: touch checkout, barcode search, VAT breakdown, split payments across cash, card, loyalty and store credit, plus offline mode and X/Z reports.",
      },
      { property: "og:title", content: "cloudynationpos POS Till Terminal Demo" },
      {
        property: "og:description",
        content: "Touch-first checkout that keeps billing during outages.",
      },
    ],
  }),
  loader: async () => {
    const [sessionRes, catalogRes, shiftRes, tillsRes] = await Promise.all([
      getSessionServerFn(),
      getPosCatalogServerFn(),
      getActiveShiftServerFn(),
      getBranchTillsServerFn().catch(() => ({ success: false, tills: [] })),
    ]);
    return {
      session: sessionRes.success ? sessionRes.session : null,
      catalog: catalogRes.catalog,
      promotions: catalogRes.promotions,
      shift: shiftRes.shift,
      tills: (tillsRes as any).tills || [],
    };
  },
  component: PosTill,
});

type Line = any & { qty: number };

function PosTill() {
  const { session, catalog, promotions, shift, tills } = Route.useLoaderData();
  const router = useRouter();

  const [selectedTillId, setSelectedTillId] = useState(session?.tillId || "");

  // Customer state
  const [customer, setCustomer] = useState<any>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  const [cart, setCart] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [online, setOnline] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [split, setSplit] = useState({ cash: 0, card: 0, points: 0, credit: 0 });
  const [selectedTenders, setSelectedTenders] = useState<Record<string, boolean>>({});

  // Shift states
  const [openingFloat, setOpeningFloat] = useState(500);
  const [cashDropAmount, setCashDropAmount] = useState(0);
  const [dropOpen, setDropOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printData, setPrintData] = useState<any | null>(null);
  const [xReportConfirmOpen, setXReportConfirmOpen] = useState(false);
  const [zReportConfirmOpen, setZReportConfirmOpen] = useState(false);
  const [cashReceivedInput, setCashReceivedInput] = useState("");

  const idempotencyKey = useMemo(() => {
    return Math.random().toString(36).substring(7) + "-" + Date.now();
  }, [payOpen]);

  useEffect(() => {
    if (!printData) return () => {};
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error("Print dialog failed to open:", err);
        toast.error("Failed to open print preview.");
      } finally {
        setPrintData(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [printData]);

  const filtered = useMemo(
    () =>
      catalog.filter(
        (p: any) =>
          p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search),
      ),
    [search, catalog],
  );

  // If a product has a priceOverride in the branch, use it. Else use basePrice.
  const getPrice = (p: any, qty = 1) => {
    const basePrice = Number(p.priceOverride || p.basePrice || 0);
    if (!promotions || promotions.length === 0) return basePrice;

    const now = new Date();
    const formatTime = (d: Date) => (d.toTimeString().split(" ")[0] || "00:00").slice(0, 5);
    const currentTime = formatTime(now);

    const activePromotions = promotions.filter((promo: any) => {
      if (promo.status !== "Active") return false;

      // Date range check
      const start = new Date(promo.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(promo.endDate);
      end.setHours(23, 59, 59, 999);
      if (now < start || now > end) return false;

      // Time condition check
      if (promo.startTime && currentTime < promo.startTime) return false;
      if (promo.endTime && currentTime > promo.endTime) return false;

      // Qty conditions
      if (promo.minQty && qty < promo.minQty) return false;
      if (promo.maxQty && qty > promo.maxQty) return false;

      // Target scope check
      if (promo.target === "All products") return true;
      if (promo.target.startsWith("Category:")) {
        const catName = promo.target.replace("Category: ", "").trim();
        return p.category?.toLowerCase() === catName.toLowerCase();
      }
      if (promo.target.endsWith("selected products")) {
        const ids = (promo.targetProductIds || "").split(",").filter(Boolean);
        return ids.includes(p.id);
      }

      return false;
    });

    if (activePromotions.length === 0) return basePrice;

    // Deterministic best discount rule (lowest final price)
    let bestPrice = basePrice;

    activePromotions.forEach((promo: any) => {
      let finalPrice = basePrice;
      const val = Number(promo.discountValue || 0);

      if (promo.discountType === "percentage") {
        finalPrice = basePrice - basePrice * (val / 100);
      } else if (promo.discountType === "fixed") {
        finalPrice = basePrice - val;
      } else if (promo.pricingBasis === "Percentage adjustment") {
        finalPrice = basePrice - basePrice * (val / 100);
      } else if (promo.pricingBasis === "Fixed amount adjustment") {
        finalPrice = basePrice - val;
      } else if (promo.pricingBasis === "Fixed final price") {
        finalPrice = val;
      }

      finalPrice = Math.max(0, finalPrice);
      if (finalPrice < bestPrice) {
        bestPrice = finalPrice;
      }
    });

    return bestPrice;
  };

  const net = cart.reduce((s, l) => s + getPrice(l, l.qty) * l.qty, 0);
  const vat = net * 0.05; // 5% VAT assumption
  const total = net + vat;
  const allocated = split.cash + split.card + split.points + split.credit;
  
  const allocatedTenders = (
    [
      ["cash", split.cash],
      ["card", split.card],
      ["points", split.points],
      ["credit", split.credit],
    ] as const
  ).filter(([key]) => selectedTenders[key]);

  const allocatedTotal = allocatedTenders.reduce((sum, [, val]) => sum + (val || 0), 0);
  const hasSelectedTender = Object.keys(selectedTenders).some(key => selectedTenders[key]);
  const allSelectedTendersHavePositiveValue = allocatedTenders.every(([, val]) => val > 0);
  const isAllocationExact = Math.abs(allocatedTotal - total) <= 0.01;
  const isSettleEnabled = hasSelectedTender && allSelectedTendersHavePositiveValue && isAllocationExact && !isSubmitting;

  const add = (p: any) =>
    setCart((prev) => {
      const found = prev.find((l) => l.id === p.id);
      return found
        ? prev.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { ...p, qty: 1 }];
    });

  const step = (id: string, d: number) =>
    setCart((prev) =>
      prev.flatMap((l) => (l.id === id ? (l.qty + d <= 0 ? [] : [{ ...l, qty: l.qty + d }]) : [l])),
    );

  const settle = async () => {
    if (split.points > 0 && !customer) {
      toast.error("You must attach a customer to use loyalty points.");
      return;
    }
    if (split.credit > 0 && !customer) {
      toast.error("You must attach a customer to use store credit.");
      return;
    }
    const payments = [];
    if (selectedTenders["cash"] && split.cash > 0) payments.push({ method: "Cash", amount: split.cash });
    if (selectedTenders["card"] && split.card > 0) payments.push({ method: "Card", amount: split.card });
    if (selectedTenders["points"] && split.points > 0) payments.push({ method: "Loyalty Points", amount: split.points });
    if (selectedTenders["credit"] && split.credit > 0) payments.push({ method: "Store Credit", amount: split.credit });

    if (!hasSelectedTender || payments.length === 0) {
      toast.error("Select a payment method.");
      return;
    }

  const handleSearchCustomer = async (term: string) => {
    setCustomerSearchTerm(term);
    if (term.length < 2) {
      setCustomerResults([]);
      return;
    }
    setIsSearchingCustomer(true);
    try {
      const res = await searchPosCustomersFn({ data: { term } });
      if (res.success) setCustomerResults(res.customers);
    } catch (e: any) {
      toast.error(e.message);
    }
    setIsSearchingCustomer(false);
  };
    }

    if (Math.abs(allocatedTotal - total) > 0.01) {
      toast.error("Allocate the full amount before completing payment.");
      return;
    }

    if (isSubmitting) return;

    let cashReceived: number | undefined;
    let changeGiven: number | undefined;

    if (selectedTenders["cash"]) {
      const received = Number(cashReceivedInput) || 0;
      cashReceived = received;
      changeGiven = Math.max(received - split.cash, 0);
    }

    if (online) {
      setIsSubmitting(true);
      try {
        const res = await checkoutServerFn({
          data: {
            customerId: customer?.id || undefined,
            subtotal: net,
            vat: vat,
            total: total,
            payments,
            items: cart.map((l) => ({
              productId: l.id,
              qty: l.qty,
              unitPrice: getPrice(l, l.qty),
            })),
            ...(cashReceived !== undefined ? { cashReceived } : {}),
            ...(changeGiven !== undefined ? { changeGiven } : {}),
            ...(idempotencyKey ? { idempotencyKey } : {}),
          },
        });

        const receiptData = {
          type: "receipt" as const,
          receiptNumber: res.orderId || "N/A",
          branchName: shift.branch?.name || "Test Branch",
          tillName: shift.till?.name || shift.tillId || "Till Terminal",
          cashierEmail: shift.cashier?.email || "cashier",
          date: new Date().toLocaleString(),
          items: cart.map((l) => ({
            name: l.name,
            qty: l.qty,
            unitPrice: getPrice(l, l.qty),
            total: getPrice(l, l.qty) * l.qty,
          })),
          subtotal: net,
          vat: vat,
          total: total,
          payments,
          cashReceived,
          changeGiven,
        };

        setPrintData(receiptData);
        toast.success("Sale completed · receipt printed");
        router.invalidate();
      } catch (err: any) {
        toast.error(err.message || "Failed to process sale");
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    } else {
      setBuffered((b) => b + 1);
      toast.success("Sale stored offline · will sync on reconnect");
    }

    setPayOpen(false);
    setCart([]);
    setSplit({ cash: 0, card: 0, points: 0, credit: 0 });
    setCashReceivedInput("");
    setSelectedTenders({});
    setCustomer(null);
  };

  const handleOpenShift = async () => {
    if (!selectedTillId) {
      toast.error("Please assign a till terminal before opening shift.");
      return;
    }
    setIsSubmitting(true);
    try {
      await openShiftServerFn({ data: { openingFloat, tillId: selectedTillId } });
      toast.success("Shift opened successfully");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message);
    }
    setIsSubmitting(false);
  };

  const handleRecordDrop = async () => {
    if (cashDropAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setIsSubmitting(true);
    try {
      await recordCashDropServerFn({
        data: { shiftId: shift.id, amount: cashDropAmount, reason: "Mid-shift drop" },
      });
      toast.success(`Cash drop of ${aed(cashDropAmount)} recorded`);
      setDropOpen(false);
      setCashDropAmount(0);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message);
    }
    setIsSubmitting(false);
  };

  const handlePrintXReport = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await generateShiftReportFn({ data: { shiftId: shift.id } });
      if (res.success && res.report) {
        setPrintData({
          type: "report" as const,
          reportTitle: "X REPORT (Mid-Shift)",
          ...res.report,
        });
        toast.success("X report generated and printed successfully.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate X report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (isSubmitting) return;
    if (!confirm("Are you sure you want to close this shift? This cannot be undone.")) return;
    setIsSubmitting(true);
    try {
      const reportRes = await generateShiftReportFn({ data: { shiftId: shift.id } });
      const res = await closeShiftServerFn({ data: { shiftId: shift.id, actualCash: 0 } });
      
      if (reportRes.success && reportRes.report) {
        setPrintData({
          type: "report" as const,
          reportTitle: "Z REPORT (Shift Close)",
          ...reportRes.report,
          status: "Closed",
          closedAt: new Date().toISOString(),
        });
      }

      toast.success(`Z report generated · shift closed with variance of ${aed(res.variance)}`);
      setSelectedTillId("");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shift) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-4">
        <div className="panel max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-ink">Till Closed</h2>
          <p className="text-sm text-muted-foreground">
            You must open a shift and declare the opening float to start processing sales.
          </p>
          <div className="text-left space-y-4 mt-6">
            {!session?.tillId && (
              <div className="space-y-1.5">
                <Label htmlFor="till-selection">Select Till Terminal</Label>
                <select
                  id="till-selection"
                  value={selectedTillId}
                  onChange={(e) => setSelectedTillId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select a till...</option>
                  {tills.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Opening Float Amount (AED)</Label>
              <Input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(Number(e.target.value))}
              />
            </div>
          </div>
          <Button
            disabled={isSubmitting}
            onClick={handleOpenShift}
            className="w-full text-base py-6 font-bold rounded-xl mt-4"
          >
            {isSubmitting ? "Opening..." : "Open Shift"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DemoShell
      title="POS Till Terminal"
      subtitle={`Till ${(shift as any).till?.name || shift.tillId || "01"} · ${shift.branch?.name || "Branch"} · ${shift.cashier?.email?.split("@")[0] || "Cashier"} · Shift opened ${new Date(shift.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
      actions={
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
              online
                ? "border-success/20 bg-success/12 text-success"
                : "border-warning/30 bg-warning/15 text-warning-foreground"
            }`}
          >
            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {online ? "Synced" : `Offline · ${buffered} buffered`}
          </span>
          <div className="flex items-center gap-2">
            <Label htmlFor="net" className="text-xs text-muted-foreground">
              Connection
            </Label>
            <Switch
              id="net"
              checked={online}
              onCheckedChange={(v) => {
                setOnline(v);
                if (v && buffered > 0) {
                  toast.success(`${buffered} buffered transactions synced`, {
                    description: "Conflicts auto-resolved · inventory re-synced",
                  });
                  setBuffered(0);
                }
              }}
            />
          </div>
        </div>
      }
    >
      <Tabs defaultValue="checkout">
        <TabsList className="rounded-xl">
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
          <TabsTrigger value="shift">Shift & reports</TabsTrigger>
        </TabsList>

        <TabsContent value="checkout" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-56 flex-1">
                  <ScanBarcode className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Scan barcode or search item…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => toast.success("Scale reading: 1.240 kg · Bananas added")}
                >
                  <Scale className="mr-1.5 h-4 w-4" /> Read scale
                </Button>
              </div>

              <p className="mt-5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Quick keys
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => add(p)}
                    className="group rounded-2xl border border-border bg-surface-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                  >
                    {p.image ? (
                      <div className="mb-3 h-12 w-12 overflow-hidden rounded-xl bg-surface transition-transform group-hover:scale-105">
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="mb-3 h-10 w-10 rounded-xl bg-primary/12 transition-colors group-hover:bg-primary/20" />
                    )}
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {aed(getPrice(p))} / {p.unit}
                    </p>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                    No item matches "{search}".
                  </p>
                )}
              </div>
            </div>

            <div className="panel flex h-fit flex-col p-5 lg:sticky lg:top-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">Cart · {cart.length} lines</h2>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>

                        <div className="panel flex h-fit flex-col p-5 lg:sticky lg:top-6 gap-6">
                            {/* Customer Section */}
                            <div className="rounded-xl border border-border p-4 bg-surface-2/50">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                                        <User className="h-4 w-4" /> Customer
                                    </h2>
                                    {!customer ? (
                                        <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg">
                                                    Attach
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Attach Customer</DialogTitle>
                                                    <DialogDescription>Search by name, email, or phone number.</DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4 space-y-4">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Search customers..."
                                                            className="pl-9"
                                                            value={customerSearchTerm}
                                                            onChange={(e) => handleSearchCustomer(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                        {isSearchingCustomer ? (
                                                            <p className="text-center text-sm text-muted-foreground py-4">Searching...</p>
                                                        ) : customerResults.length > 0 ? (
                                                            customerResults.map((c) => (
                                                                <div
                                                                    key={c.id}
                                                                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors"
                                                                    onClick={() => {
                                                                        setCustomer(c);
                                                                        setCustomerModalOpen(false);
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-ink">{c.name}</p>
                                                                        <p className="text-xs text-muted-foreground">{c.phone || c.email}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                                            {c.tier}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : customerSearchTerm.length >= 2 ? (
                                                            <p className="text-center text-sm text-muted-foreground py-4">No customers found.</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <button
                                            onClick={() => setCustomer(null)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <UserMinus className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                {customer ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold">{customer.name}</span>
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                {customer.tier}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="bg-surface rounded-lg p-2 border border-border">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Points</p>
                                                <p className="text-xs font-bold text-ink">{customer.points}</p>
                                            </div>
                                            <div className="bg-surface rounded-lg p-2 border border-border">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Credit</p>
                                                <p className="text-xs font-bold text-ink">{aed(customer.storeCredit)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">No customer attached to order.</p>
                                )}
                            </div>

                            <div className="flex flex-col flex-1">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-ink">Cart · {cart.length} lines</h2>
                                {cart.length > 0 && (
                                    <button
                                        onClick={() => setCart([])}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-destructive"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Clear
                                    </button>
                                )}
                            </div>

                            <div className="mt-4 space-y-2">
                                {cart.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-border py-10 text-center">
                                        <ScanBarcode className="mx-auto h-6 w-6 text-muted-foreground" />
                                        <p className="mt-2 text-xs text-muted-foreground">Scan or tap an item to begin</p>
                                    </div>
                                )}
                                {cart.map((l) => (
                                    <div key={l.id} className="flex items-center gap-2 rounded-xl bg-surface-2 p-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-ink">{l.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {aed(getPrice(l))} · VAT 5%
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => step(l.id, -1)}
                                                className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface"
                                                aria-label="Decrease"
                                            >
                                                <Minus className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="w-6 text-center text-sm font-bold tabular-nums text-ink">{l.qty}</span>
                                            <button
                                                onClick={() => step(l.id, 1)}
                                                className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface"
                                                aria-label="Increase"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <span className="w-16 text-right text-sm font-bold tabular-nums text-ink">
                                            {(getPrice(l) * l.qty).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Net</span>
                                    <span className="tabular-nums">{aed(net)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>VAT 5%</span>
                                    <span className="tabular-nums">{vat.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-2 text-xl font-extrabold text-ink">
                                    <span>Total</span>
                                    <span className="tabular-nums">{aed(total)}</span>
                                </div>
                            </div>

                            </div>

                            <Button
                                size="lg"
                                className="mt-5 rounded-xl text-base font-bold"
                                disabled={cart.length === 0}
                                onClick={() => {
                                    setSplit({ cash: Number(total.toFixed(2)), card: 0, points: 0, credit: 0 });
                                    setPayOpen(true);
                                }}
                            >
                                Pay {cart.length > 0 ? aed(total) : ""}
                            </Button>
                        </div>

                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => step(l.id, -1)}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums text-ink">
                        {l.qty}
                      </span>
                      <button
                        onClick={() => step(l.id, 1)}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface"
                        aria-label="Increase"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm font-bold tabular-nums text-ink">
                      {(getPrice(l, l.qty) * l.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Net</span>
                  <span className="tabular-nums">{aed(net)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT 5%</span>
                  <span className="tabular-nums">{vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 text-xl font-extrabold text-ink">
                  <span>Total</span>
                  <span className="tabular-nums">{aed(total)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="mt-5 rounded-xl text-base font-bold"
                disabled={cart.length === 0}
                onClick={() => {
                  setSplit({ cash: Number(total.toFixed(2)), card: 0, points: 0, credit: 0 });
                  setPayOpen(true);
                }}
              >
                Pay {cart.length > 0 ? aed(total) : ""}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shift" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">Shift control</h2>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["Opening float", aed(Number(shift.openingFloat))],
                  [
                    "Cash drops (Total)",
                    aed(
                      JSON.parse(shift.cashDrops || "[]").reduce(
                        (s: number, d: any) => s + d.amount,
                        0,
                      ),
                    ),
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded-xl bg-surface-2 px-4 py-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold text-ink">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Dialog open={dropOpen} onOpenChange={setDropOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl">
                      Record cash drop
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Cash Drop</DialogTitle>
                      <DialogDescription>
                        Move excess cash from the till to the safe.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Amount (AED)</Label>
                        <Input
                          type="number"
                          value={cashDropAmount}
                          onChange={(e) => setCashDropAmount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDropOpen(false)}>
                        Cancel
                      </Button>
                      <Button disabled={isSubmitting} onClick={handleRecordDrop}>
                        {isSubmitting ? "Saving..." : "Save Drop"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">X report (mid-shift)</h2>
              <p className="mt-1 text-xs text-muted-foreground">Non-resetting snapshot · 12:41</p>
              <ul className="mt-4 space-y-2 font-mono text-xs text-ink">
                <li className="flex justify-between">
                  <span>Transactions</span>
                  <span>{shift.stats?.transactions || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Items sold</span>
                  <span>{shift.stats?.itemsSold || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Avg basket</span>
                  <span>{aed(shift.stats?.avgBasket || 0)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Voids</span>
                  <span>{shift.stats?.voids || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Refunds</span>
                  <span>{shift.stats?.refunds || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>VAT collected</span>
                  <span>{aed(shift.stats?.vatCollected || 0)}</span>
                </li>
              </ul>
              <Button
                className="mt-5 w-full rounded-xl"
                variant="outline"
                onClick={() => setXReportConfirmOpen(true)}
                disabled={isSubmitting}
              >
                <Printer className="mr-1.5 h-4 w-4" /> Print X report
              </Button>
            </div>

            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">Z report (end of day)</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Closes the shift, seals the ledger and posts to head office.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>· Drawer reconciliation with variance capture</li>
                <li>· Immutable audit entry for voids and overrides</li>
                <li>· Automatic sync of offline-buffered transactions</li>
              </ul>
              <Button
                className="mt-5 w-full rounded-xl font-semibold"
                disabled={isSubmitting}
                onClick={() => setZReportConfirmOpen(true)}
              >
                {isSubmitting ? "Closing..." : "Close shift & print Z"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Split payment</DialogTitle>
            <DialogDescription>
              Allocate {aed(total)} across tender types. Allocated: {aed(allocatedTotal)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(
              [
                ["cash", "Cash", Banknote],
                ["card", "Card", CreditCard],
                ["points", "Loyalty points", Wallet],
                ["credit", "Store credit", Wallet],
              ] as const
            ).map(([key, label, Icon]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    checked={!!selectedTenders[key]}
                    onChange={(e) => {
                      setSelectedTenders({ ...selectedTenders, [key]: e.target.checked });
                      if (!e.target.checked) {
                        setSplit({ ...split, [key]: 0 });
                      }
                    }}
                  />
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-sm font-medium text-ink">{label}</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="w-32"
                    disabled={!selectedTenders[key]}
                    value={selectedTenders[key] ? split[key] : ""}
                    onChange={(e) => setSplit({ ...split, [key]: Number(e.target.value) })}
                  />
                </div>
                {key === "cash" && selectedTenders["cash"] && (
                  <div className="ml-7 grid grid-cols-2 gap-3 rounded-xl border border-dashed border-border p-3 bg-surface-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Cash Received</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 50"
                        value={cashReceivedInput}
                        onChange={(e) => setCashReceivedInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Change Given</span>
                      <span className="text-sm font-bold text-success py-2">
                        {aed(Math.max((Number(cashReceivedInput) || 0) - split.cash, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <p
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                isAllocationExact && hasSelectedTender
                  ? "bg-success/12 text-success"
                  : "bg-warning/15 text-warning-foreground"
              }`}
            >
              {!hasSelectedTender || allocatedTotal === 0
                ? "Select a payment method."
                : !isAllocationExact
                ? "Allocate the full amount before completing payment."
                : `Balance remaining: ${aed(Math.max(total - allocatedTotal, 0))}`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl font-semibold" disabled={!isSettleEnabled} onClick={settle}>
              {isSubmitting ? "Processing..." : "Settle & print"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={xReportConfirmOpen} onOpenChange={setXReportConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print X Report?</DialogTitle>
            <DialogDescription>
              This will print the current mid-shift report. The shift will remain open.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setXReportConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl font-semibold"
              disabled={isSubmitting}
              onClick={async () => {
                setXReportConfirmOpen(false);
                await handlePrintXReport();
              }}
            >
              Print X Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={zReportConfirmOpen} onOpenChange={setZReportConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close Shift & Print</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this shift? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setZReportConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isSubmitting}
              onClick={async () => {
                setZReportConfirmOpen(false);
                await handleCloseShift();
              }}
            >
              Close Shift & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {printData && (
        <div id="print-area" className="hidden print:block">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #print-area, #print-area * {
                visibility: visible;
              }
              #print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                color: black;
                background: white;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                line-height: 1.4;
              }
            }
          `}} />
          
          {printData.type === "receipt" ? (
            <div className="space-y-4">
              <div className="text-center border-b border-dashed pb-4 border-black">
                <h2 className="text-lg font-bold uppercase">{printData.branchName}</h2>
                <p>Till: {printData.tillName}</p>
                <p>Cashier: {printData.cashierEmail}</p>
                <p>{printData.date}</p>
                <p className="mt-2 font-bold">Transaction: #{printData.receiptNumber.slice(0, 8).toUpperCase()}</p>
              </div>

              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-dashed border-black">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-1">{item.name}</td>
                      <td className="py-1 text-center">{item.qty}</td>
                      <td className="py-1 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="py-1 text-right">{Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed pt-2 border-black space-y-1 font-bold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{Number(printData.subtotal).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between text-xs font-normal">
                  <span>VAT (5%):</span>
                  <span>{Number(printData.vat).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between text-base border-t border-double pt-1 border-black">
                  <span>TOTAL:</span>
                  <span>{Number(printData.total).toFixed(2)} AED</span>
                </div>
              </div>

              <div className="border-t border-dashed pt-2 border-black">
                <p className="font-bold">Payment Allocation:</p>
                {printData.payments.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{p.method}</span>
                    <span>{Number(p.amount).toFixed(2)} AED</span>
                  </div>
                ))}
              </div>

              {printData.cashReceived !== undefined && printData.cashReceived !== null && (
                <div className="border-t border-dashed pt-2 border-black space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Cash Received:</span>
                    <span>{Number(printData.cashReceived).toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm">
                    <span>Change Given:</span>
                    <span>{Number(printData.changeGiven).toFixed(2)} AED</span>
                  </div>
                </div>
              )}

              <div className="text-center pt-6 font-bold border-t border-dashed border-black">
                <p>THANK YOU FOR YOUR VISIT!</p>
                <p className="text-xs font-normal mt-1">cloudynationpos superstore</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center border-b border-dashed pb-4 border-black">
                <h2 className="text-lg font-bold uppercase">{printData.reportTitle}</h2>
                <p>Branch: {printData.branchName}</p>
                <p>Till: {printData.tillName}</p>
                <p>Cashier: {printData.cashierName}</p>
                <p>Opened: {new Date(printData.openedAt).toLocaleString()}</p>
                {printData.closedAt && (
                  <p>Closed: {new Date(printData.closedAt).toLocaleString()}</p>
                )}
                <p className="mt-1">Shift ID: #{printData.shiftId.slice(0, 8).toUpperCase()}</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold border-b border-black">SUMMARY METRICS</p>
                <div className="flex justify-between">
                  <span>Shift Status:</span>
                  <span className="font-bold uppercase">{printData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transactions count:</span>
                  <span>{printData.transactionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items sold:</span>
                  <span>{printData.itemsSold}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average basket:</span>
                  <span>{Number(printData.avgBasket).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT collected:</span>
                  <span>{Number(printData.vatCollected).toFixed(2)} AED</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold border-b border-black">SALES & DRAWER BREAKDOWN</p>
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>{Number(printData.openingFloat).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales:</span>
                  <span>{Number(printData.cashTotal).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Sales:</span>
                  <span>{Number(printData.cardTotal).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between">
                  <span>Loyalty Point Sales:</span>
                  <span>{Number(printData.pointsTotal).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between">
                  <span>Store Credit Sales:</span>
                  <span>{Number(printData.creditTotal).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-black pt-1">
                  <span>Total Sales:</span>
                  <span className="font-bold">{Number(printData.salesTotal).toFixed(2)} AED</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold border-b border-black">LEDGER RECONCILIATION</p>
                <div className="flex justify-between">
                  <span>Total Drops (Mid-shift):</span>
                  <span>-{Number(printData.totalDrops).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Cash in Drawer:</span>
                  <span className="font-bold">{Number(printData.expectedCash).toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between">
                  <span>Voids:</span>
                  <span>{printData.voids}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refunds:</span>
                  <span>{printData.refunds}</span>
                </div>
              </div>

              <div className="text-center pt-6 font-bold border-t border-dashed border-black">
                <p>END OF REPORT</p>
                <p className="text-xs font-normal mt-1">Audit log printed from POS terminal</p>
              </div>
            </div>
          )}
        </div>
      )}
    </DemoShell>
  );
}
