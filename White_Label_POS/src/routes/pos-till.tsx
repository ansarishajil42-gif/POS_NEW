import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
    checkoutServerFn
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
            { property: "og:description", content: "Touch-first checkout that keeps billing during outages." },
        ],
    }),
    loader: async () => {
        const [catalogRes, shiftRes] = await Promise.all([
            getPosCatalogServerFn(),
            getActiveShiftServerFn()
        ]);
        return { catalog: catalogRes, shift: shiftRes.shift };
    },
    component: PosTill,
});

type Line = any & { qty: number };

function PosTill() {
    const { catalog, shift } = Route.useLoaderData();
    const router = useRouter();

    const [cart, setCart] = useState<Line[]>([]);
    const [search, setSearch] = useState("");
    const [online, setOnline] = useState(true);
    const [buffered, setBuffered] = useState(0);
    const [payOpen, setPayOpen] = useState(false);
    const [split, setSplit] = useState({ cash: 0, card: 0, points: 0, credit: 0 });
    
    // Shift states
    const [openingFloat, setOpeningFloat] = useState(500);
    const [cashDropAmount, setCashDropAmount] = useState(0);
    const [dropOpen, setDropOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filtered = useMemo(
        () => catalog.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)),
        [search, catalog],
    );

    // If a product has a priceOverride in the branch, use it. Else use basePrice.
    const getPrice = (p: any) => Number(p.priceOverride || p.basePrice || 0);

    const net = cart.reduce((s, l) => s + getPrice(l) * l.qty, 0);
    const vat = net * 0.05; // 5% VAT assumption
    const total = net + vat;
    const allocated = split.cash + split.card + split.points + split.credit;

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
        if (Math.abs(allocated - total) > 0.01) {
            toast.error("Payment allocation must match the total");
            return;
        }

        if (online) {
            setIsSubmitting(true);
            try {
                const payments = [];
                if (split.cash > 0) payments.push({ method: "Cash", amount: split.cash });
                if (split.card > 0) payments.push({ method: "Card", amount: split.card });
                if (split.points > 0) payments.push({ method: "Loyalty Points", amount: split.points });
                if (split.credit > 0) payments.push({ method: "Store Credit", amount: split.credit });

                await checkoutServerFn({ data: {
                    subtotal: net,
                    vat: vat,
                    total: total,
                    payments,
                    items: cart.map(l => ({ productId: l.id, qty: l.qty, unitPrice: getPrice(l) }))
                }});
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
    };

    const handleOpenShift = async () => {
        setIsSubmitting(true);
        try {
            await openShiftServerFn({ data: { openingFloat }});
            toast.success("Shift opened successfully");
            router.invalidate();
        } catch (err: any) {
            toast.error(err.message);
        }
        setIsSubmitting(false);
    };

    const handleRecordDrop = async () => {
        if (cashDropAmount <= 0) return toast.error("Enter a valid amount");
        setIsSubmitting(true);
        try {
            await recordCashDropServerFn({ data: { shiftId: shift.id, amount: cashDropAmount, reason: "Mid-shift drop" }});
            toast.success(`Cash drop of ${aed(cashDropAmount)} recorded`);
            setDropOpen(false);
            setCashDropAmount(0);
            router.invalidate();
        } catch (err: any) {
            toast.error(err.message);
        }
        setIsSubmitting(false);
    };

    const handleCloseShift = async () => {
        if (!confirm("Are you sure you want to close this shift? This cannot be undone.")) return;
        setIsSubmitting(true);
        try {
            // Note: in a real app, actual cash is counted by the cashier and entered.
            // Using 0 here forces the server to calculate a variance against the expected drawer.
            const res = await closeShiftServerFn({ data: { shiftId: shift.id, actualCash: 0 }});
            toast.success(`Z report generated · shift closed with variance of ${aed(res.variance)}`);
            router.invalidate();
        } catch (err: any) {
            toast.error(err.message);
        }
        setIsSubmitting(false);
    };

    if (!shift) {
        return (
            <div className="flex h-[80vh] items-center justify-center p-4">
                <div className="panel max-w-md w-full p-8 text-center space-y-4">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
                        <Wallet className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-ink">Till Closed</h2>
                    <p className="text-sm text-muted-foreground">You must open a shift and declare the opening float to start processing sales.</p>
                    <div className="text-left space-y-2 mt-6">
                        <Label>Opening Float Amount (AED)</Label>
                        <Input type="number" value={openingFloat} onChange={e => setOpeningFloat(Number(e.target.value))} />
                    </div>
                    <Button disabled={isSubmitting} onClick={handleOpenShift} className="w-full text-base py-6 font-bold rounded-xl mt-4">
                        {isSubmitting ? "Opening..." : "Open Shift"}
                    </Button>
                </div>
            </div>
        );
    }


    return (
        <DemoShell
            title="POS Till Terminal"
            subtitle={`Till ${shift.tillId || "01"} · ${shift.branch?.name || "Branch"} · ${shift.cashier?.email?.split('@')[0] || "Cashier"} · Shift opened ${new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            actions={
                <div className="flex items-center gap-3">
                    <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${online
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
                                {filtered.map((p) => (
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
                                    ["Cash drops (Total)", aed(JSON.parse(shift.cashDrops || "[]").reduce((s: number, d: any) => s + d.amount, 0))],
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
                                        <Button variant="outline" className="rounded-xl">Record cash drop</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Record Cash Drop</DialogTitle>
                                            <DialogDescription>Move excess cash from the till to the safe.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Amount (AED)</Label>
                                                <Input type="number" value={cashDropAmount} onChange={e => setCashDropAmount(Number(e.target.value))} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setDropOpen(false)}>Cancel</Button>
                                            <Button disabled={isSubmitting} onClick={handleRecordDrop}>{isSubmitting ? "Saving..." : "Save Drop"}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <div className="panel p-6">
                            <h2 className="text-sm font-bold text-ink">X report (mid-shift)</h2>
                            <p className="mt-1 text-xs text-muted-foreground">Non-resetting snapshot · 12:41</p>
                            <ul className="mt-4 space-y-2 font-mono text-xs text-ink">
                                <li className="flex justify-between"><span>Transactions</span><span>{shift.stats?.transactions || 0}</span></li>
                                <li className="flex justify-between"><span>Items sold</span><span>{shift.stats?.itemsSold || 0}</span></li>
                                <li className="flex justify-between"><span>Avg basket</span><span>{aed(shift.stats?.avgBasket || 0)}</span></li>
                                <li className="flex justify-between"><span>Voids</span><span>{shift.stats?.voids || 0}</span></li>
                                <li className="flex justify-between"><span>Refunds</span><span>{shift.stats?.refunds || 0}</span></li>
                                <li className="flex justify-between"><span>VAT collected</span><span>{aed(shift.stats?.vatCollected || 0)}</span></li>
                            </ul>
                            <Button className="mt-5 w-full rounded-xl" variant="outline" onClick={() => toast.success("X report printed")}>
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
                                onClick={handleCloseShift}
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
                            Allocate {aed(total)} across tender types. Allocated: {aed(allocated)}
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
                            <div key={key} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                                <Icon className="h-4 w-4 text-primary" />
                                <span className="flex-1 text-sm font-medium text-ink">{label}</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="w-32"
                                    value={split[key]}
                                    onChange={(e) => setSplit({ ...split, [key]: Number(e.target.value) })}
                                />
                            </div>
                        ))}
                        <p
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${Math.abs(allocated - total) < 0.01
                                    ? "bg-success/12 text-success"
                                    : "bg-warning/15 text-warning-foreground"
                                }`}
                        >
                            Balance remaining: {aed(Math.max(total - allocated, 0))}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setPayOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="rounded-xl font-semibold" disabled={isSubmitting} onClick={settle}>
                            {isSubmitting ? "Processing..." : "Settle & print"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DemoShell>
    );
}
