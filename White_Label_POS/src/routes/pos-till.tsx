import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getSessionRole, roleRoutes } from "@/lib/auth";
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
} from "@/components/ui/dialog";
import { aed, tillProducts, type TillProduct } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/pos-till")({
    beforeLoad: () => {
        const role = getSessionRole();
        if (!role) throw redirect({ to: "/login" });
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
    component: PosTill,
});

type Line = TillProduct & { qty: number };

function PosTill() {
    const [cart, setCart] = useState<Line[]>([]);
    const [search, setSearch] = useState("");
    const [online, setOnline] = useState(true);
    const [buffered, setBuffered] = useState(0);
    const [payOpen, setPayOpen] = useState(false);
    const [split, setSplit] = useState({ cash: 0, card: 0, points: 0, credit: 0 });

    const filtered = useMemo(
        () => tillProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
        [search],
    );

    const net = cart.reduce((s, l) => s + l.price * l.qty, 0);
    const vat = cart.reduce((s, l) => s + l.price * l.qty * l.vat, 0);
    const total = net + vat;
    const allocated = split.cash + split.card + split.points + split.credit;

    const add = (p: TillProduct) =>
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

    const settle = () => {
        if (Math.abs(allocated - total) > 0.01) {
            toast.error("Payment allocation must match the total");
            return;
        }
        setPayOpen(false);
        setCart([]);
        setSplit({ cash: 0, card: 0, points: 0, credit: 0 });
        if (!online) setBuffered((b) => b + 1);
        toast.success(online ? "Sale completed · receipt printed" : "Sale stored offline · will sync on reconnect");
    };

    return (
        <DemoShell
            title="POS Till Terminal"
            subtitle="Till 04 · Al Barsha Hypermarket · Cashier 118 · Shift opened 08:02"
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
                                            {aed(p.price)} / {p.unit}
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
                                                {aed(l.price)} · VAT {l.vat * 100}%
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
                                            {(l.price * l.qty).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Net</span>
                                    <span className="tabular-nums">{net.toFixed(2)}</span>
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
                                    ["Opening float", "AED 500.00"],
                                    ["Cash sales", "AED 8,412.25"],
                                    ["Card sales", "AED 21,904.60"],
                                    ["Cash drops", "AED 4,000.00"],
                                    ["Expected drawer", "AED 4,912.25"],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between rounded-xl bg-surface-2 px-4 py-3">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className="font-semibold text-ink">{v}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Cash drop of AED 2,000 recorded")}>
                                    Record cash drop
                                </Button>
                                <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Float adjusted")}>
                                    Adjust float
                                </Button>
                            </div>
                        </div>

                        <div className="panel p-6">
                            <h2 className="text-sm font-bold text-ink">X report (mid-shift)</h2>
                            <p className="mt-1 text-xs text-muted-foreground">Non-resetting snapshot · 12:41</p>
                            <ul className="mt-4 space-y-2 font-mono text-xs text-ink">
                                <li className="flex justify-between"><span>Transactions</span><span>184</span></li>
                                <li className="flex justify-between"><span>Items sold</span><span>1,942</span></li>
                                <li className="flex justify-between"><span>Avg basket</span><span>AED 164.76</span></li>
                                <li className="flex justify-between"><span>Voids</span><span>3</span></li>
                                <li className="flex justify-between"><span>Refunds</span><span>1</span></li>
                                <li className="flex justify-between"><span>VAT collected</span><span>AED 1,443.18</span></li>
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
                                onClick={() => toast.success("Z report generated · shift closed")}
                            >
                                Close shift & print Z
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
                        <Button className="rounded-xl font-semibold" onClick={settle}>
                            Settle & print
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DemoShell>
    );
}
