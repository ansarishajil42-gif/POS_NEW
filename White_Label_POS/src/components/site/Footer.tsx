import { Link } from "@tanstack/react-router";
import { Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { Logo } from "./Logo";

const columns = [
    {
        title: "Platform",
        links: [
            { label: "Super Admin Portal", to: "/login" },
            { label: "Head Office", to: "/login" },
            { label: "POS Till", to: "/login" },
            { label: "Aggregator Sync", to: "/login" },
        ],
    },
];

export function Footer() {
    return (
        <footer className="border-t border-border bg-surface-2">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
                <div className="space-y-4">
                    <Logo />
                    <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                        The white-label, multi-tenant POS platform built for UAE supermarket chains and retail
                        outlets.
                    </p>
                    <div className="flex gap-2">
                        <a
                            href="#contact"
                            aria-label="LinkedIn"
                            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:text-primary"
                        >
                            <Linkedin className="h-4 w-4" />
                        </a>
                        <a
                            href="#contact"
                            aria-label="X"
                            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:text-primary"
                        >
                            <Twitter className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                {columns.map((c) => (
                    <div key={c.title}>
                        <h3 className="text-sm font-bold text-ink">{c.title}</h3>
                        <ul className="mt-4 space-y-2.5">
                            {c.links.map((l) => (
                                <li key={l.label}>
                                    <Link
                                        to={l.to}
                                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <div>
                    <h3 className="text-sm font-bold text-ink">Company</h3>
                    <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                        <li>
                            <a href="/#features" className="hover:text-primary">
                                Features
                            </a>
                        </li>
                        <li>
                            <Link to="/pricing" className="hover:text-primary">
                                Pricing
                            </Link>
                        </li>
                        <li>
                            <a href="/#compliance" className="hover:text-primary">
                                UAE VAT compliance
                            </a>
                        </li>
                        <li>
                            <a href="/#security" className="hover:text-primary">
                                Security
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-ink">Contact</h3>
                    <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" /> Info@cloudynationpos.com
                        </li>
                        <li className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" /> +971552177186
                        </li>
                        <li className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> 
                            <span>
                                CWS-1V-227668<br />
                                26th Floor, Amber Gem Tower, Ajman
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-border">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
                    <p>© {new Date().getFullYear()} cloudynationpos. All rights reserved.</p>
                    <p>TRN-ready invoicing · FTA compliant reporting · Hosted in the UAE</p>
                </div>
            </div>
        </footer>
    );
}
