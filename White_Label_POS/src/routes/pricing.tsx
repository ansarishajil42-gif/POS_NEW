import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/pricing")({
    head: () => ({
        meta: [
            { title: "Pricing — cloudynationpos POS for UAE Supermarket Chains" },
            {
                name: "description",
                content:
                    "Transparent cloudynationpos pricing per outlet and till. Starter, Growth and Enterprise tiers — all include UAE VAT compliance, offline tills and aggregator sync.",
            },
            { property: "og:title", content: "cloudynationpos Pricing — Per Outlet, Per Till" },
            {
                property: "og:description",
                content: "Starter, Growth and Enterprise plans for supermarket chains of every size.",
            },
        ],
    }),
    component: PricingPage,
});

const tiers = [
    {
        name: "Starter",
        monthly: 899,
        blurb: "Single-site grocers and small independents getting off legacy tills.",
        limits: ["1 outlet included", "Up to 3 POS tills", "10,000 monthly orders"],
        features: [
            "POS till terminal + offline mode",
            "UAE VAT 5% automation & TRN receipts",
            "Central product catalog",
            "Shift & X/Z reports",
            "Email support",
        ],
        missing: ["Aggregator sync engine", "Batch & expiry FEFO", "White-label branding"],
    },
    {
        name: "Growth",
        monthly: 1690,
        blurb: "Multi-branch supermarkets selling in-store and on delivery aggregators.",
        featured: true,
        limits: ["Up to 10 outlets", "Up to 10 tills per outlet", "150,000 monthly orders"],
        features: [
            "Everything in Starter",
            "Head office multi-outlet dashboard",
            "Batch & expiry with FIFO/FEFO alerts",
            "Purchasing: PO → GRN → Vendor Invoice",
            "Aggregator sync (Talabat, Careem, InstaShop, Deliveroo)",
            "Loyalty & CRM with tiers and points",
            "Priority support, 4h response",
        ],
        missing: ["Dedicated infrastructure"],
    },
    {
        name: "Enterprise",
        monthly: null,
        blurb: "Regional chains and platform operators running a white-label network.",
        limits: ["Unlimited outlets", "Unlimited tills", "Custom order volume"],
        features: [
            "Everything in Growth",
            "SaaS Super-Admin portal (multi-tenant)",
            "Full white-label branding & domains",
            "Dedicated infrastructure & data residency",
            "Custom hardware & ERP integrations",
            "99.9% uptime SLA + named CSM",
        ],
        missing: [],
    },
];

const matrix = [
    ["Offline-capable tills", true, true, true],
    ["UAE VAT 5% + FTA summaries", true, true, true],
    ["Multi-outlet head office", false, true, true],
    ["Batch & expiry (FIFO/FEFO)", false, true, true],
    ["Purchasing & AP workflow", false, true, true],
    ["Aggregator sync engine", false, true, true],
    ["Loyalty & CRM", false, true, true],
    ["Multi-tenant super admin", false, false, true],
    ["White-label branding", false, false, true],
    ["Uptime SLA", false, false, true],
] as const;

function PricingPage() {
    const [annual, setAnnual] = useState(true);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main>
                <section className="bg-mesh py-16 lg:py-24">
                    <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
                        <Reveal>
                            <p className="text-xs font-bold tracking-[0.18em] text-[#1ea80c] uppercase">Pricing</p>
                            <h1 className="mt-3 text-4xl font-extrabold text-ink sm:text-5xl">
                                Scales with your outlets, not your paperwork
                            </h1>
                            <p className="mt-5 text-lg text-muted-foreground">
                                Every plan includes UAE VAT compliance, offline-capable tills and unlimited staff
                                accounts. Pay per outlet, add tills as you grow.
                            </p>
                            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-2.5 shadow-[var(--shadow-soft)]">
                                <span className={annual ? "text-sm text-muted-foreground" : "text-sm font-semibold text-ink"}>
                                    Monthly
                                </span>
                                <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Toggle annual billing" />
                                <span className={annual ? "text-sm font-semibold text-ink" : "text-sm text-muted-foreground"}>
                                    Annual
                                </span>
                                <span className="rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-bold text-success">
                                    Save 15%
                                </span>
                            </div>
                        </Reveal>
                    </div>
                </section>

                <section className="pb-20 lg:pb-28">
                    <div className="mx-auto max-w-7xl px-5 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-3">
                            {tiers.map((t, i) => {
                                const price =
                                    t.monthly === null
                                        ? "Custom"
                                        : `AED ${Math.round(annual ? t.monthly * 0.85 : t.monthly).toLocaleString("en-AE")}`;
                                return (
                                    <Reveal key={t.name} delay={i * 90}>
                                        <div
                                            className={`panel flex h-full flex-col p-7 ${t.featured ? "ring-2 ring-primary shadow-[var(--shadow-lift)]" : ""}`}
                                        >
                                            {t.featured && (
                                                <span className="mb-3 self-start rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                                                    Most popular
                                                </span>
                                            )}
                                            <h2 className="text-xl font-extrabold text-ink">{t.name}</h2>
                                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.blurb}</p>
                                            <div className="mt-6">
                                                <span className="text-4xl font-extrabold text-ink">{price}</span>
                                                {t.monthly !== null && (
                                                    <span className="ml-1 text-sm text-muted-foreground">/ outlet / month</span>
                                                )}
                                            </div>
                                            <ul className="mt-5 space-y-1.5 rounded-xl bg-surface-2 p-4 text-xs font-medium text-ink">
                                                {t.limits.map((l) => (
                                                    <li key={l}>{l}</li>
                                                ))}
                                            </ul>
                                            <ul className="mt-6 flex-1 space-y-2.5">
                                                {t.features.map((f) => (
                                                    <li key={f} className="flex gap-2.5 text-sm text-ink">
                                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                                        {f}
                                                    </li>
                                                ))}
                                                {t.missing.map((f) => (
                                                    <li key={f} className="flex gap-2.5 text-sm text-muted-foreground">
                                                        <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                            <Button
                                                asChild
                                                className="mt-7 rounded-xl font-semibold"
                                                variant={t.featured ? "default" : "outline"}
                                            >
                                                <a href="/#contact">
                                                    {t.monthly === null ? "Talk to sales" : "Book a demo"}
                                                </a>
                                            </Button>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>

                        <Reveal>
                            <div className="panel mt-16 overflow-x-auto">
                                <table className="w-full min-w-[640px] text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="p-4 font-bold text-ink">Capability</th>
                                            {["Starter", "Growth", "Enterprise"].map((h) => (
                                                <th key={h} className="p-4 text-center font-bold text-ink">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matrix.map((row) => (
                                            <tr key={row[0]} className="border-b border-border last:border-0">
                                                <td className="p-4 text-ink">{row[0]}</td>
                                                {[row[1], row[2], row[3]].map((v, i) => (
                                                    <td key={i} className="p-4 text-center">
                                                        {v ? (
                                                            <Check className="mx-auto h-4 w-4 text-success" />
                                                        ) : (
                                                            <Minus className="mx-auto h-4 w-4 text-muted-foreground/60" />
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Reveal>

                        <Reveal>
                            <div className="panel mt-10 flex flex-col items-center gap-4 p-10 text-center">
                                <h2 className="text-2xl font-extrabold text-ink">
                                    Not sure which tier fits your network?
                                </h2>
                                <p className="max-w-xl text-sm text-muted-foreground">
                                    Walk through the platform with sample data first, then let our team size a plan
                                    around your outlets, tills and aggregator volume.
                                </p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    <Button asChild className="rounded-xl font-semibold">
                                        <Link to="/login">
                                            Open live demo <ArrowRight className="ml-1.5 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="rounded-xl font-semibold">
                                        <a href="/#contact">Book a demo</a>
                                    </Button>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
