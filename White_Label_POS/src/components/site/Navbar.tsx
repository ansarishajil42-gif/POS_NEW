import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

const links = [
    { label: "Features", href: "/#features" },
    { label: "Modules", href: "/#modules" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "/#integrations" },
    { label: "Contact", href: "/#contact" },
];

export function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
                <Link to="/" aria-label="cloudynationpos home">
                    <Logo />
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                    {links.map((l) => (
                        <a
                            key={l.label}
                            href={l.href}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 lg:flex">
                    <Button asChild variant="ghost" className="text-sm font-semibold">
                        <Link to="/login">View live demo</Link>
                    </Button>
                    <Button asChild className="rounded-xl text-sm font-semibold shadow-[var(--shadow-soft)]">
                        <a href="/#contact">Book a demo</a>
                    </Button>
                </div>

                <button
                    className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
                    onClick={() => setOpen((v) => !v)}
                    aria-label="Toggle menu"
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {open && (
                <div className="border-t border-border bg-surface px-5 py-4 lg:hidden">
                    <div className="flex flex-col gap-1">
                        {links.map((l) => (
                            <a
                                key={l.label}
                                href={l.href}
                                onClick={() => setOpen(false)}
                                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-ink"
                            >
                                {l.label}
                            </a>
                        ))}
                        <Link
                            to="/login"
                            onClick={() => setOpen(false)}
                            className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-ink"
                        >
                            View live demo
                        </Link>
                        <Button asChild className="mt-2 rounded-xl">
                            <a href="/#contact" onClick={() => setOpen(false)}>
                                Book a demo
                            </a>
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
}
