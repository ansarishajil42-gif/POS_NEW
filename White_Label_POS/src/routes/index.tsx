import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
    Activity,
    ArrowRight,
    BadgeCheck,
    Barcode,
    Boxes,
    Building2,
    CheckCircle2,
    CloudOff,
    CreditCard,
    FileText,
    Gauge,
    Layers,
    Lock,
    Monitor,
    Receipt,
    RefreshCw,
    Scale,
    ScrollText,
    Shield,
    ShieldCheck,
    Timer,
    Truck,
    Users,
    Zap,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { DashboardMock, TillMock } from "@/components/site/mockups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CareemLogo from "@/assets/Careem.png";
import DeliverooLogo from "@/assets/Deliveroo.jpg";
import InstaShopLogo from "@/assets/InstaShop.png";
import TalabatLogo from "@/assets/talabat.png";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "cloudynationpos — Run Every Supermarket Branch From One Platform" },
            {
                name: "description",
                content:
                    "White-label multi-tenant POS for UAE supermarket chains: offline-first tills, head office control, automated 5% VAT compliance and Talabat, Careem, InstaShop & Deliveroo sync.",
            },
            { property: "og:title", content: "cloudynationpos — Multi-Tenant POS for UAE Retail" },
            {
                property: "og:description",
                content:
                    "One platform for every branch, till and delivery aggregator. Offline-first, VAT compliant, enterprise secure.",
            },
        ],
    }),
    component: Landing,
});

const modules = [
    {
        icon: Layers,
        title: "SaaS Super-Admin Portal",
        copy: "Create, configure, suspend or upgrade tenant supermarket accounts in seconds — with enforced limits on outlets, tills and monthly order volume.",
        points: ["Tenant lifecycle control", "Tax & currency templates", "Real-time platform analytics"],
        to: "/login",
    },
    {
        icon: Building2,
        title: "Head Office & Multi-Outlet",
        copy: "One command centre for every branch: central catalog, branch-specific pricing, batch tracking, purchasing and staff permissions.",
        points: ["Central product catalog", "FIFO / FEFO expiry control", "PO → GRN → Invoice"],
        to: "/login",
    },
    {
        icon: Monitor,
        title: "POS Till Terminal",
        copy: "A touch-first checkout built for peak-hour queues — barcode scanning, weighing-scale reads, split payments and full offline billing.",
        points: ["Sub-50ms item lookup", "Split payment settlement", "Shift & X/Z reports"],
        to: "/login",
    },
    {
        icon: Truck,
        title: "Aggregator Sync Engine",
        copy: "Talabat, Careem, InstaShop and Deliveroo orders land directly in the branch POS queue, with stock and pricing synced both ways.",
        points: ["Unified order ingestion", "Live stock auto-sync", "One-click menu publishing"],
        to: "/login",
    },
];

const deepDives = [
    {
        tag: "Module 01 · Platform Operator",
        title: "Onboard a new supermarket chain before launch",
        copy: "The Super-Admin Portal is where you run the business of running POS. Provision tenants, enforce commercial limits and watch the whole network in real time.",
        bullets: [
            "Instantly create, configure, suspend or upgrade tenant accounts",
            "Enforce per-tenant limits: active outlets, POS tills, monthly order volume",
            "Pre-set tax rule templates (UAE VAT 5%) and regional currency settings",
            "Live analytics on network sales volume, active tills, API traffic and system logs",
        ],
        to: "/login",
        icon: Layers,
    },
    {
        tag: "Module 02 · Head Office",
        title: "Every branch, one catalog, zero spreadsheet chaos",
        copy: "Head office defines the truth — branches execute it. Pricing, promotions, batches and purchasing all flow from a single central catalog.",
        bullets: [
            "Multi-barcode variants and unit conversions across kg, g, pcs and packs",
            "Batch & expiry with FIFO/FEFO, near-expiry alerts and clearance workflows",
            "Purchasing pipeline: POs, GRNs with variance alerts, vendor invoices and AP",
            "Granular RBAC for Store Managers, Inventory Managers, Purchasing Officers and Cashiers",
        ],
        to: "/login",
        icon: Boxes,
    },
    {
        tag: "Module 03 · The Till",
        title: "Checkout that never stops — even when the internet does",
        copy: "Cashiers get a fast, touch-friendly screen. Operations get guaranteed uptime and automatic conflict resolution when connectivity returns.",
        bullets: [
            "Quick keys for non-barcoded items, barcode scanning and direct weighing-scale reads",
            "Uninterrupted offline billing with automated reconciliation on reconnect",
            "Split settlement across Cash, Card, Loyalty Points and Store Credit",
            "Cash drawer, scanner, thermal printer and card terminal integration hooks",
        ],
        to: "/login",
        icon: Barcode,
    },
    {
        tag: "Module 04 · Delivery Channels",
        title: "Your aggregator menus, always in sync with the shelf",
        copy: "Sell the same stock everywhere without overselling. Every till transaction instantly adjusts availability across all connected aggregator storefronts.",
        bullets: [
            "Aggregator orders auto-inject into the branch POS queue and print at the counter",
            "Stock availability auto-sync deducts inventory across every connected menu",
            "Single-click publishing of catalog, promo and stock-status updates",
            "Secure per-branch vault for OAuth tokens, API keys and sandbox credentials",
        ],
        to: "/login",
        icon: RefreshCw,
    },
];

const security = [
    { icon: Shield, title: "Row-Level tenant isolation", copy: "Every tenant's data is isolated at the database level — no shared-query leakage." },
    { icon: Lock, title: "TLS 1.3 + AES-256", copy: "Encrypted in transit and at rest across all regions and backups." },
    { icon: ScrollText, title: "Immutable audit logs", copy: "Price overrides, voided receipts, refunds and stock adjustments are permanently recorded." },
    { icon: BadgeCheck, title: "ACID-consistent ledger", copy: "Inventory, ledger and tax computations are transactional — never approximate." },
    { icon: Gauge, title: "Built for scale", copy: "Microservices supporting 500+ tenants and 5,000+ concurrent active tills." },
    { icon: Timer, title: "Performance SLOs", copy: "Barcode lookup under 50ms, receipt print under 1.5 seconds, 99.9% API uptime." },
];

function Landing() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main>
                <Hero />
                <TrustBar />
                <Modules />
                <DeepDives />
                <Vat />
                <Integrations />
                <Reliability />
                <Security />
                <PricingTeaser />
                <Contact />
            </main>
            <Footer />
        </div>
    );
}

function Hero() {
    return (
        <section className="relative overflow-hidden bg-mesh">
            <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pt-16 pb-20 lg:grid-cols-[1fr_1.05fr] lg:px-8 lg:pt-24 lg:pb-28">
                <Reveal>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-[#1ea80c] shadow-[var(--shadow-soft)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Built for UAE supermarket chains
                    </span>
                    <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold text-ink sm:text-5xl lg:text-6xl">
                        Run your entire <span className="text-gradient">supermarket chain</span> from one
                        platform
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                        cloudynationpos is a white-label, multi-tenant POS platform that unifies head office, every
                        branch till and every delivery aggregator — offline-capable, VAT-compliant and ready to
                        brand as your own.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button asChild size="lg" className="rounded-xl px-6 text-base font-semibold shadow-[var(--shadow-glow)]">
                            <a href="#contact">
                                Book a demo <ArrowRight className="ml-1.5 h-4 w-4" />
                            </a>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="rounded-xl border-border bg-surface px-6 text-base font-semibold"
                        >
                            <Link to="/login">See it in action</Link>
                        </Button>
                    </div>
                    <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
                        {[
                            ["99.9%", "Cloud API uptime"],
                            ["100%", "Offline till capability"],
                            ["5,000+", "Concurrent tills"],
                        ].map(([v, l]) => (
                            <div key={l}>
                                <dt className="text-2xl font-extrabold text-ink">{v}</dt>
                                <dd className="mt-1 text-xs text-muted-foreground">{l}</dd>
                            </div>
                        ))}
                    </dl>
                </Reveal>

                <Reveal delay={120} className="relative">
                    <div className="absolute -top-10 -right-6 hidden h-40 w-40 rounded-full bg-accent/25 blur-3xl lg:block" />
                    <DashboardMock />
                    <div className="mt-[-3rem] ml-auto hidden w-[62%] animate-[float_7s_ease-in-out_infinite] sm:block">
                        <TillMock />
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function TrustBar() {
    return (
        <section className="border-y border-border bg-surface">
            <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
                <p className="text-center text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    Built for UAE retail & supermarket chains
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                        "Hypermarket Group",
                        "Fresh Markets",
                        "Corniche Retail",
                        "Value Stores",
                        "Gulf Grocers",
                        "Express Marts",
                    ].map((n) => (
                        <div
                            key={n}
                            className="rounded-xl border border-border bg-surface-2 px-3 py-3 text-center text-xs font-bold tracking-wide text-muted-foreground"
                        >
                            {n.toUpperCase()}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function SectionHead({
    eyebrow,
    title,
    copy,
}: {
    eyebrow: string;
    title: string;
    copy?: string;
}) {
    return (
        <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.18em] text-[#1ea80c] uppercase">{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">{title}</h2>
            {copy && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{copy}</p>}
        </div>
    );
}

function Modules() {
    return (
        <section id="modules" className="py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
                <Reveal>
                    <SectionHead
                        eyebrow="Core modules"
                        title="Four modules. One retail operating system."
                        copy="From platform operator to cashier, every role works inside the same connected system — no exports, no reconciliation spreadsheets."
                    />
                </Reveal>
                <div className="mt-14 grid gap-6 md:grid-cols-2">
                    {modules.map((m, i) => (
                        <Reveal key={m.title} delay={i * 90}>
                            <div className="group panel h-full p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                                    <m.icon className="h-5 w-5" />
                                </span>
                                <h3 className="mt-5 text-lg font-bold text-ink">{m.title}</h3>
                                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{m.copy}</p>
                                <ul className="mt-5 space-y-2">
                                    {m.points.map((p) => (
                                        <li key={p} className="flex items-center gap-2 text-sm text-ink">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to={m.to}
                                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5"
                                >
                                    Open live demo <ArrowRight className="h-4 w-4 transition-all" />
                                </Link>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function DeepDives() {
    return (
        <section id="features" className="border-y border-border bg-surface py-20 lg:py-28">
            <div className="mx-auto max-w-7xl space-y-24 px-5 lg:px-8">
                {deepDives.map((d, i) => (
                    <Reveal key={d.title}>
                        <div
                            className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
                        >
                            <div>
                                <p className="text-xs font-bold tracking-[0.18em] text-[#1ea80c] uppercase">{d.tag}</p>
                                <h2 className="mt-3 text-3xl font-extrabold text-ink">{d.title}</h2>
                                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{d.copy}</p>
                                <ul className="mt-6 space-y-3">
                                    {d.bullets.map((b) => (
                                        <li key={b} className="flex gap-3 text-sm leading-relaxed text-ink">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild variant="outline" className="mt-7 rounded-xl border-border">
                                    <Link to={d.to}>
                                        Explore the module <ArrowRight className="ml-1.5 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-mesh opacity-70 blur-2xl" />
                                {i === 2 ? <TillMock /> : <DashboardMock />}
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

function Vat() {
    return (
        <section id="compliance" className="py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
                <Reveal>
                    <div className="panel overflow-hidden">
                        <div className="grid gap-10 p-8 lg:grid-cols-2 lg:p-12">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-success/12 px-3 py-1.5 text-xs font-semibold text-success">
                                    <ShieldCheck className="h-3.5 w-3.5" /> UAE VAT & FTA ready
                                </span>
                                <h2 className="mt-5 text-3xl font-extrabold text-ink">
                                    Compliance handled at the till, not at year end
                                </h2>
                                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                                    Every receipt printed by cloudynationpos is a valid UAE tax document. VAT is computed
                                    automatically, TRN details are embedded, and FTA-format summaries are one click
                                    away.
                                </p>
                                <ul className="mt-6 space-y-3">
                                    {[
                                        "Automated 5% VAT computation on every line item",
                                        "Inclusive or exclusive price display, per outlet",
                                        "TRN-formatted tax receipts and simplified tax invoices",
                                        "Downloadable FTA tax summary reports per period",
                                    ].map((b) => (
                                        <li key={b} className="flex gap-3 text-sm text-ink">
                                            <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="rounded-2xl border border-border bg-surface-2 p-6">
                                <div className="mx-auto max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
                                    <p className="text-center text-sm font-extrabold text-ink">TAX INVOICE</p>
                                    <p className="mt-1 text-center text-[11px] text-muted-foreground">
                                        Al Barsha Hypermarket · TRN 100234567800003
                                    </p>
                                    <div className="mt-4 space-y-1.5 border-y border-dashed border-border py-3 text-[12px]">
                                        {[
                                            ["Bananas 1.24 kg", "7.13"],
                                            ["Laban 1L × 2", "11.00"],
                                            ["Arabic Bread (0% VAT)", "3.00"],
                                            ["Basmati Rice 5kg", "38.50"],
                                        ].map(([a, b]) => (
                                            <div key={a} className="flex justify-between text-ink">
                                                <span>{a}</span>
                                                <span>{b}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 space-y-1 text-[12px] text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Taxable amount</span>
                                            <span>AED 56.63</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>VAT @ 5%</span>
                                            <span>AED 2.83</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Zero-rated</span>
                                            <span>AED 3.00</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-extrabold text-ink">
                                        <span>Total</span>
                                        <span>AED 59.63</span>
                                    </div>
                                    <p className="mt-4 text-center text-[10px] text-muted-foreground">
                                        Generated by cloudynationpos · FTA compliant
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

const aggregatorCards = [
    { name: "Talabat", logo: TalabatLogo, copy: "Order ingestion, menu publishing and live stock sync." },
    { name: "Careem", logo: CareemLogo, copy: "Quick-commerce orders routed straight to the branch queue." },
    { name: "InstaShop", logo: InstaShopLogo, copy: "Full grocery catalog sync with promo pricing support." },
    { name: "Deliveroo", logo: DeliverooLogo, copy: "Fulfilment counter printing and status callbacks." },
];

function Integrations() {
    return (
        <section id="integrations" className="border-y border-border bg-surface py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
                <Reveal>
                    <SectionHead
                        eyebrow="Integrations"
                        title="Unified order ingestion + live stock sync"
                        copy="Aggregator orders arrive as native POS transactions. Stock, pricing and availability stay identical across every storefront you sell on."
                    />
                </Reveal>
                <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {aggregatorCards.map((a, i) => (
                        <Reveal key={a.name} delay={i * 80}>
                            <div className="panel h-full p-6 text-center transition-transform hover:-translate-y-1">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-surface shadow-sm border border-border p-2">
                                    <img 
                                        src={a.logo} 
                                        alt={`${a.name} logo`} 
                                        className="h-full w-full object-contain" 
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            if (e.currentTarget.nextElementSibling) {
                                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                            }
                                        }} 
                                    />
                                    <div className="hidden h-full w-full items-center justify-center text-sm font-extrabold text-primary">
                                        {a.name.slice(0, 2).toUpperCase()}
                                    </div>
                                </div>
                                <h3 className="mt-4 text-base font-bold text-ink">{a.name}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.copy}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
                <Reveal delay={120}>
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                        {["Auto-inject to POS queue", "Counter printing", "One-click publish", "Per-branch API vault"].map(
                            (t) => (
                                <span
                                    key={t}
                                    className="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-ink"
                                >
                                    {t}
                                </span>
                            ),
                        )}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function Reliability() {
    return (
        <section className="py-20 lg:py-28">
            <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
                <Reveal>
                    <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                        Offline-first reliability
                    </p>
                    <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
                        The queue keeps moving when the connection doesn't
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        cloudynationpos tills hold a full local catalog and transaction ledger. When connectivity drops,
                        billing continues without a single dropped sale — and reconciles automatically on
                        reconnect.
                    </p>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {[
                            { icon: CloudOff, t: "100% offline billing", c: "Sales, receipts and shifts continue locally." },
                            { icon: RefreshCw, t: "Automated conflict resolution", c: "Buffered transactions merge safely on reconnect." },
                            { icon: Zap, t: "Sub-50ms lookups", c: "Barcode scan to cart line, instantly." },
                            { icon: Activity, t: "99.9% cloud uptime", c: "Redundant, monitored, regionally hosted." },
                        ].map((f) => (
                            <div key={f.t} className="panel p-5">
                                <f.icon className="h-5 w-5 text-primary" />
                                <p className="mt-3 text-sm font-bold text-ink">{f.t}</p>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.c}</p>
                            </div>
                        ))}
                    </div>
                </Reveal>
                <Reveal delay={120}>
                    <div className="panel space-y-4 p-7">
                        <div className="flex items-center justify-between rounded-xl bg-success/10 px-4 py-3">
                            <span className="text-sm font-semibold text-ink">Till 04 · Al Barsha</span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
                                <span className="h-2 w-2 rounded-full bg-success" /> Synced
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-warning/12 px-4 py-3">
                            <span className="text-sm font-semibold text-ink">Till 11 · Deira</span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-warning-foreground">
                                <span className="h-2 w-2 rounded-full bg-warning" /> Offline · 42 buffered
                            </span>
                        </div>
                        <div className="rounded-xl border border-border p-4">
                            <p className="text-xs font-semibold text-muted-foreground">Reconnect timeline</p>
                            <ol className="mt-3 space-y-3 text-sm">
                                {[
                                    "Local ledger sealed with device signature",
                                    "Buffered transactions replayed in order",
                                    "Inventory + aggregator stock re-synced",
                                    "Audit log entry written (immutable)",
                                ].map((s, i) => (
                                    <li key={s} className="flex gap-3 text-ink">
                                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                            {i + 1}
                                        </span>
                                        {s}
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3 text-xs text-muted-foreground">
                            <Scale className="h-4 w-4 text-primary" /> Weighing scale, drawer, scanner and printer
                            hooks stay active offline.
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function Security() {
    return (
        <section id="security" className="border-y border-border bg-surface py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
                <Reveal>
                    <SectionHead
                        eyebrow="Security & architecture"
                        title="Enterprise guarantees, written into the platform"
                        copy="Retail data is financial data. cloudynationpos treats it that way at every layer."
                    />
                </Reveal>
                <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {security.map((s, i) => (
                        <Reveal key={s.title} delay={i * 70}>
                            <div className="panel h-full p-6">
                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/12 text-success">
                                    <s.icon className="h-5 w-5" />
                                </span>
                                <h3 className="mt-4 text-base font-bold text-ink">{s.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.copy}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function PricingTeaser() {
    return (
        <section className="py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
                <Reveal>
                    <SectionHead
                        eyebrow="Pricing"
                        title="Priced per outlet and till — not per headache"
                        copy="Transparent tiers that scale with your network. Every plan includes VAT compliance, offline tills and aggregator sync."
                    />
                </Reveal>
                <Reveal delay={100}>
                    <div className="mt-10 flex justify-center">
                        <Button asChild size="lg" className="rounded-xl px-6 font-semibold">
                            <Link to="/pricing">
                                View full pricing <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </Reveal>
                <div className="mt-12 grid gap-6 lg:grid-cols-3">
                    {[
                        { name: "Starter", price: "AED 899", unit: "/ outlet / month", note: "Up to 3 tills per outlet" },
                        { name: "Growth", price: "AED 1,690", unit: "/ outlet / month", note: "Up to 10 tills + aggregator sync", featured: true },
                        { name: "Enterprise", price: "Custom", unit: "annual contract", note: "Unlimited tills, white-label, SLA" },
                    ].map((p, i) => (
                        <Reveal key={p.name} delay={i * 90}>
                            <div
                                className={`panel h-full p-7 ${p.featured ? "ring-2 ring-primary" : ""}`}
                            >
                                {p.featured && (
                                    <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                                        Most popular
                                    </span>
                                )}
                                <h3 className="text-lg font-bold text-ink">{p.name}</h3>
                                <p className="mt-3 text-3xl font-extrabold text-ink">{p.price}</p>
                                <p className="text-xs text-muted-foreground">{p.unit}</p>
                                <p className="mt-4 text-sm text-muted-foreground">{p.note}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Contact() {
    const [sent, setSent] = useState(false);

    return (
        <section id="contact" className="border-t border-border bg-mesh py-20 lg:py-28">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
                <Reveal>
                    <p className="text-xs font-bold tracking-[0.18em] text-[#1ea80c] uppercase">Book a demo</p>
                    <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
                        See cloudynationpos running your store
                    </h2>
                    <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                        Tell us about your network and we'll walk you through a live environment configured with
                        your outlets, VAT settings and aggregator channels.
                    </p>
                    <ul className="mt-7 space-y-3 text-sm text-ink">
                        {[
                            { icon: Users, t: "30-minute tailored walkthrough" },
                            { icon: FileText, t: "Migration plan for your existing catalog" },
                            { icon: CreditCard, t: "Commercial proposal within 48 hours" },
                        ].map((x) => (
                            <li key={x.t} className="flex items-center gap-3">
                                <x.icon className="h-4 w-4 text-primary" />
                                {x.t}
                            </li>
                        ))}
                    </ul>
                </Reveal>

                <Reveal delay={120}>
                    <form
                        className="panel space-y-4 p-7"
                        onSubmit={(e) => {
                            e.preventDefault();
                            setSent(true);
                            toast.success("Demo request received", {
                                description: "Our UAE retail team will be in touch within one business day.",
                            });
                        }}
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Full name</Label>
                                <Input id="name" required placeholder="Ahmed Al Mansoori" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="company">Company</Label>
                                <Input id="company" required placeholder="Al Barsha Hypermarket" />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Work email</Label>
                                <Input id="email" type="email" required placeholder="you@company.ae" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="outlets">Number of outlets</Label>
                                <Input id="outlets" type="number" min={1} defaultValue={3} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="message">What would you like to see?</Label>
                            <Textarea
                                id="message"
                                rows={4}
                                placeholder="We run 6 branches in Dubai and sell on Talabat and InstaShop…"
                            />
                        </div>
                        <Button type="submit" size="lg" className="w-full rounded-xl font-semibold">
                            {sent ? "Request sent ✓" : "Book a demo"}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            This is a demo form — no data leaves your browser.
                        </p>
                    </form>
                </Reveal>
            </div>
        </section>
    );
}
