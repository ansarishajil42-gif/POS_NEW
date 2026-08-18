import { cn } from "@/lib/utils";

const bars = [42, 68, 55, 84, 61, 92, 74, 48, 80, 66, 96, 58];

/** Stylised product screenshot used inside marketing sections. */
export function DashboardMock({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-lift)]",
                className,
            )}
        >
            <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
                <span className="ml-3 rounded-md bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    app.mtnexus.ae / head-office / overview
                </span>
            </div>
            <div className="grid grid-cols-[128px_1fr] text-[11px]">
                <aside className="hidden space-y-1.5 border-r border-border bg-surface-2 p-3 sm:block">
                    {["Overview", "Outlets", "Catalog", "Batches", "Purchasing", "VAT", "Loyalty"].map(
                        (i, idx) => (
                            <div
                                key={i}
                                className={cn(
                                    "rounded-lg px-2.5 py-2 font-medium",
                                    idx === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground",
                                )}
                            >
                                {i}
                            </div>
                        ),
                    )}
                </aside>
                <div className="col-span-2 space-y-3 p-4 sm:col-span-1">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { l: "Net sales today", v: "AED 486,210", d: "+12.4%" },
                            { l: "Active tills", v: "128 / 132", d: "97%" },
                            { l: "Aggregator orders", v: "1,942", d: "+8.1%" },
                        ].map((s) => (
                            <div key={s.l} className="rounded-xl border border-border bg-surface p-3">
                                <p className="text-[10px] text-muted-foreground">{s.l}</p>
                                <p className="mt-1 text-sm font-bold text-ink">{s.v}</p>
                                <p className="text-[10px] font-semibold text-success">{s.d}</p>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl border border-border p-3">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="font-semibold text-ink">Network sales · last 12 hours</p>
                            <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold text-success">
                                Live
                            </span>
                        </div>
                        <div className="flex h-24 items-end gap-1.5">
                        {bars.map((b, i) => {
                            const isUp = i === 0 || b >= bars[i - 1];
                            return (
                                <div
                                    key={i}
                                    style={{ height: `${b}%` }}
                                    className={cn(
                                        "flex-1 rounded-t-md",
                                        isUp ? "bg-[#39ff14]" : "bg-[#ef4444]"
                                    )}
                                />
                            );
                        })}
                        </div>
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-border p-3">
                        {[
                            ["Al Barsha Hypermarket", "AED 92,430", "18 tills"],
                            ["Deira Fresh Market", "AED 64,120", "9 tills"],
                            ["Abu Dhabi Corniche", "AED 51,880", "7 tills"],
                        ].map((r) => (
                            <div key={r[0]} className="flex items-center justify-between rounded-lg px-2 py-1.5">
                                <span className="font-medium text-ink">{r[0]}</span>
                                <span className="text-muted-foreground">{r[2]}</span>
                                <span className="font-semibold text-ink">{r[1]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TillMock({ className }: { className?: string }) {
    const items = [
        { name: "Bananas 1kg", image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=100&q=80" },
        { name: "Laban 1L", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&q=80" },
        { name: "Arabic Bread", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&q=80" },
        { name: "Chicken 900g", image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&q=80" },
        { name: "Basmati 5kg", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&q=80" },
        { name: "Dates", image: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=100&q=80" },
    ];
    return (
        <div
            className={cn(
                "overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-lift)]",
                className,
            )}
        >
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3 text-[11px]">
                <span className="font-bold text-ink">Till 04 · Al Barsha</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2 py-1 font-semibold text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Synced
                </span>
            </div>
            <div className="grid gap-3 p-4 text-[11px] sm:grid-cols-[1fr_150px]">
                <div className="grid grid-cols-3 gap-2">
                    {items.map((i) => (
                        <div
                            key={i.name}
                            className="rounded-xl border border-border bg-surface-2 p-2.5 text-center font-medium text-ink"
                        >
                            <div className="mx-auto mb-2 h-8 w-8 overflow-hidden rounded-full border-border bg-surface shadow-sm">
                                <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                            </div>
                            {i.name}
                        </div>
                    ))}
                </div>
                <div className="rounded-xl border border-border p-3">
                    <p className="font-semibold text-ink">Cart · 6 items</p>
                    <div className="mt-2 space-y-1.5 text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>AED 184.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span>VAT 5%</span>
                            <span>AED 9.20</span>
                        </div>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold text-ink">
                        <span>Total</span>
                        <span>193.20</span>
                    </div>
                    <div className="mt-3 rounded-lg bg-primary py-2 text-center font-semibold text-primary-foreground">
                        Pay
                    </div>
                </div>
            </div>
        </div>
    );
}
