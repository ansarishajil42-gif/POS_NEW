import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Building2, Layers, Monitor, Truck, Store, Boxes, ShoppingCart, Briefcase, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/site/Logo";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";

const allNav = [
    { to: "/super-admin", label: "Super Admin", icon: Layers },
    { to: "/head-office", label: "Head Office", icon: Building2 },
    { to: "/store-manager", label: "Store Dashboard", icon: Store },
    { to: "/inventory-manager", label: "Inventory", icon: Boxes },
    { to: "/purchasing", label: "Purchasing", icon: ShoppingCart },
    { to: "/pos-till", label: "POS Till", icon: Monitor },
    { to: "/aggregators", label: "Aggregator Sync", icon: Truck },
    { to: "/vendor-portal", label: "Vendor Portal", icon: Briefcase },
] satisfies { to: string; label: string; icon: LucideIcon }[];

export function DemoShell({
    title,
    subtitle,
    actions,
    children,
}: {
    title: string;
    subtitle: string;
    actions?: ReactNode;
    children: ReactNode;
}) {
    const { role, isLoaded, logout } = useAuth();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const nav = allNav.filter((n) => {
        if (!role) return false;
        if (role === "Super Admin") return n.to === "/super-admin";
        if (role === "Head Office Admin") return n.to === "/head-office" || n.to === "/aggregators";
        if (role === "Branch Manager") return n.to === "/store-manager";
        if (role === "Inventory Manager") return n.to === "/inventory-manager";
        if (role === "Purchasing Officer") return n.to === "/purchasing";
        if (role === "Cashier") return n.to === "/pos-till";
        if (role === "Vendor") return n.to === "/vendor-portal";
        return false;
    });

    return (
        <div className="min-h-screen bg-surface-2">
            <div className="mx-auto flex max-w-[1500px] flex-col lg:flex-row">
                <aside className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3 flex flex-col lg:h-screen lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-5 lg:py-6">
                    <div className="flex items-center justify-between w-full">
                        <Link to="/" className="inline-flex" onClick={() => setIsMobileNavOpen(false)}>
                            <Logo />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-2 text-ink lg:hidden"
                            aria-label="Toggle navigation menu"
                        >
                            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className={cn("w-full transition-all duration-200", isMobileNavOpen ? "block mt-3" : "hidden lg:block")}>
                        <nav className="flex flex-col gap-1.5 lg:mt-8">
                            {nav.map((n) => (
                                <Link
                                    key={n.to}
                                    to={n.to}
                                    onClick={() => setIsMobileNavOpen(false)}
                                    activeProps={{ "data-active": "true" }}
                                    className={cn(
                                        "group flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink",
                                        "data-[active=true]:bg-primary/10 data-[active=true]:text-primary",
                                    )}
                                >
                                    <n.icon className="h-4 w-4" />
                                    {n.label}
                                </Link>
                            ))}
                        </nav>

                        {isLoaded && role && (
                            <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4 lg:mt-auto lg:absolute lg:bottom-6 lg:left-5 lg:right-5">
                                <div className="flex flex-col gap-2.5">
                                    <div>
                                        <p className="text-xs font-semibold text-ink">Logged in as:</p>
                                        <p className="mt-0.5 text-xs font-extrabold text-primary">{role}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline cursor-pointer"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
                        </div>
                        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                    </header>
                    {children}
                </main>
            </div>
        </div>
    );
}

export function StatCard({
    label,
    value,
    delta,
    icon: Icon,
    tone = "primary",
}: {
    label: string;
    value: string;
    delta?: string;
    icon?: LucideIcon;
    tone?: "primary" | "success" | "accent";
}) {
    const toneMap = {
        primary: "bg-primary text-primary-foreground shadow-primary/20",
        success: "bg-success text-success-foreground shadow-success/20",
        accent: "bg-accent text-accent-foreground shadow-accent/20",
    } as const;

    const bgMap = {
        primary: "from-primary/10 to-transparent",
        success: "from-success/10 to-transparent",
        accent: "from-accent/10 to-transparent",
    };

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-surface/50 p-6 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className={cn("absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl transition-transform duration-500 group-hover:scale-150", bgMap[tone])} />
            <div className="relative z-10 flex items-start justify-between">
                <p className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">{label}</p>
                {Icon && (
                    <span className={cn("grid h-10 w-10 place-items-center rounded-xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6", toneMap[tone])}>
                        <Icon className="h-5 w-5" />
                    </span>
                )}
            </div>
            <p className="relative z-10 mt-5 text-3xl font-black tracking-tight text-ink">{value}</p>
            {delta && (
                <p className="relative z-10 mt-2 text-xs font-bold text-success flex items-center bg-success/10 w-max px-2 py-1 rounded-md">
                    {delta}
                </p>
            )}
        </div>
    );
}
