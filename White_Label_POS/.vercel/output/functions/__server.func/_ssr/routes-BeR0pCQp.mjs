import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as cn, t as Button } from "./button-BlBeOJmP.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as CreditCard, C as ScrollText, D as RefreshCw, G as Layers, I as Monitor, J as Gauge, O as Receipt, T as Scale, Tt as Activity, V as Lock, Y as FileText, _t as Barcode, b as Shield, bt as BadgeCheck, gt as Boxes, it as CircleCheck, m as Timer, mt as Building2, o as Users, t as Zap, tt as CloudOff, u as Truck, x as ShieldCheck, xt as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-Cexa0DG2.mjs";
import { t as Label } from "./label-CZhEvsKN.mjs";
import { n as Navbar, r as Reveal, t as Footer } from "./Reveal-EeYOLuaN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BeR0pCQp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var bars = [
	42,
	68,
	55,
	84,
	61,
	92,
	74,
	48,
	80,
	66,
	96,
	58
];
/** Stylised product screenshot used inside marketing sections. */
function DashboardMock({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-lift)]", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-destructive/40" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-warning/60" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-success/50" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-3 rounded-md bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground",
					children: "app.mtnexus.ae / head-office / overview"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[128px_1fr] text-[11px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "hidden space-y-1.5 border-r border-border bg-surface-2 p-3 sm:block",
				children: [
					"Overview",
					"Outlets",
					"Catalog",
					"Batches",
					"Purchasing",
					"VAT",
					"Loyalty"
				].map((i, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("rounded-lg px-2.5 py-2 font-medium", idx === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"),
					children: i
				}, i))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "col-span-2 space-y-3 p-4 sm:col-span-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-3",
						children: [
							{
								l: "Net sales today",
								v: "AED 486,210",
								d: "+12.4%"
							},
							{
								l: "Active tills",
								v: "128 / 132",
								d: "97%"
							},
							{
								l: "Aggregator orders",
								v: "1,942",
								d: "+8.1%"
							}
						].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border bg-surface p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-muted-foreground",
									children: s.l
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm font-bold text-ink",
									children: s.v
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold text-success",
									children: s.d
								})
							]
						}, s.l))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-ink",
								children: "Network sales · last 12 hours"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold text-success",
								children: "Live"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-24 items-end gap-1.5",
							children: bars.map((b, i) => {
								const prevBar = bars[i - 1];
								const isUp = i === 0 || !prevBar || b >= prevBar;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: { height: `${b}%` },
									className: cn("flex-1 rounded-t-md", isUp ? "bg-[#39ff14]" : "bg-[#ef4444]")
								}, i);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1.5 rounded-xl border border-border p-3",
						children: [
							[
								"Al Barsha Hypermarket",
								"AED 92,430",
								"18 tills"
							],
							[
								"Deira Fresh Market",
								"AED 64,120",
								"9 tills"
							],
							[
								"Abu Dhabi Corniche",
								"AED 51,880",
								"7 tills"
							]
						].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-lg px-2 py-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-ink",
									children: r[0]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: r[2]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-ink",
									children: r[1]
								})
							]
						}, r[0]))
					})
				]
			})]
		})]
	});
}
function TillMock({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-lift)]", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3 text-[11px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-bold text-ink",
				children: "Till 04 · Al Barsha"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2 py-1 font-semibold text-success",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-success" }), " Synced"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 p-4 text-[11px] sm:grid-cols-[1fr_150px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					{
						name: "Bananas 1kg",
						image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=100&q=80"
					},
					{
						name: "Laban 1L",
						image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&q=80"
					},
					{
						name: "Arabic Bread",
						image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&q=80"
					},
					{
						name: "Chicken 900g",
						image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&q=80"
					},
					{
						name: "Basmati 5kg",
						image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&q=80"
					},
					{
						name: "Dates",
						image: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=100&q=80"
					}
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-surface-2 p-2.5 text-center font-medium text-ink",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mb-2 h-8 w-8 overflow-hidden rounded-full border-border bg-surface shadow-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: i.image,
							alt: i.name,
							className: "h-full w-full object-cover"
						})
					}), i.name]
				}, i.name))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-border p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold text-ink",
						children: "Cart · 6 items"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 space-y-1.5 text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "AED 184.00" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VAT 5%" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "AED 9.20" })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "193.20" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 rounded-lg bg-primary py-2 text-center font-semibold text-primary-foreground",
						children: "Pay"
					})
				]
			})]
		})]
	});
}
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var Careem_default = "/assets/Careem-DRr3NWcy.png";
var Deliveroo_default = "/assets/Deliveroo-CqzjrsXx.jpg";
var InstaShop_default = "/assets/InstaShop-P_WDRou0.png";
var talabat_default = "/assets/talabat-D54W78fx.png";
var modules = [
	{
		icon: Layers,
		title: "SaaS Super-Admin Portal",
		copy: "Create, configure, suspend or upgrade tenant supermarket accounts in seconds — with enforced limits on outlets, tills and monthly order volume.",
		points: [
			"Tenant lifecycle control",
			"Tax & currency templates",
			"Real-time platform analytics"
		],
		to: "/login"
	},
	{
		icon: Building2,
		title: "Head Office & Multi-Outlet",
		copy: "One command centre for every branch: central catalog, branch-specific pricing, batch tracking, purchasing and staff permissions.",
		points: [
			"Central product catalog",
			"FIFO / FEFO expiry control",
			"PO → GRN → Invoice"
		],
		to: "/login"
	},
	{
		icon: Monitor,
		title: "POS Till Terminal",
		copy: "A touch-first checkout built for peak-hour queues — barcode scanning, weighing-scale reads, split payments and full offline billing.",
		points: [
			"Sub-50ms item lookup",
			"Split payment settlement",
			"Shift & X/Z reports"
		],
		to: "/login"
	},
	{
		icon: Truck,
		title: "Aggregator Sync Engine",
		copy: "Talabat, Careem, InstaShop and Deliveroo orders land directly in the branch POS queue, with stock and pricing synced both ways.",
		points: [
			"Unified order ingestion",
			"Live stock auto-sync",
			"One-click menu publishing"
		],
		to: "/login"
	}
];
var deepDives = [
	{
		tag: "Module 01 · Platform Operator",
		title: "Onboard a new supermarket chain before launch",
		copy: "The Super-Admin Portal is where you run the business of running POS. Provision tenants, enforce commercial limits and watch the whole network in real time.",
		bullets: [
			"Instantly create, configure, suspend or upgrade tenant accounts",
			"Enforce per-tenant limits: active outlets, POS tills, monthly order volume",
			"Pre-set tax rule templates (UAE VAT 5%) and regional currency settings",
			"Live analytics on network sales volume, active tills, API traffic and system logs"
		],
		to: "/login",
		icon: Layers
	},
	{
		tag: "Module 02 · Head Office",
		title: "Every branch, one catalog, zero spreadsheet chaos",
		copy: "Head office defines the truth — branches execute it. Pricing, promotions, batches and purchasing all flow from a single central catalog.",
		bullets: [
			"Multi-barcode variants and unit conversions across kg, g, pcs and packs",
			"Batch & expiry with FIFO/FEFO, near-expiry alerts and clearance workflows",
			"Purchasing pipeline: POs, GRNs with variance alerts, vendor invoices and AP",
			"Granular RBAC for Store Managers, Inventory Managers, Purchasing Officers and Cashiers"
		],
		to: "/login",
		icon: Boxes
	},
	{
		tag: "Module 03 · The Till",
		title: "Checkout that never stops — even when the internet does",
		copy: "Cashiers get a fast, touch-friendly screen. Operations get guaranteed uptime and automatic conflict resolution when connectivity returns.",
		bullets: [
			"Quick keys for non-barcoded items, barcode scanning and direct weighing-scale reads",
			"Uninterrupted offline billing with automated reconciliation on reconnect",
			"Split settlement across Cash, Card, Loyalty Points and Store Credit",
			"Cash drawer, scanner, thermal printer and card terminal integration hooks"
		],
		to: "/login",
		icon: Barcode
	},
	{
		tag: "Module 04 · Delivery Channels",
		title: "Your aggregator menus, always in sync with the shelf",
		copy: "Sell the same stock everywhere without overselling. Every till transaction instantly adjusts availability across all connected aggregator storefronts.",
		bullets: [
			"Aggregator orders auto-inject into the branch POS queue and print at the counter",
			"Stock availability auto-sync deducts inventory across every connected menu",
			"Single-click publishing of catalog, promo and stock-status updates",
			"Secure per-branch vault for OAuth tokens, API keys and sandbox credentials"
		],
		to: "/login",
		icon: RefreshCw
	}
];
var security = [
	{
		icon: Shield,
		title: "Row-Level tenant isolation",
		copy: "Every tenant's data is isolated at the database level — no shared-query leakage."
	},
	{
		icon: Lock,
		title: "TLS 1.3 + AES-256",
		copy: "Encrypted in transit and at rest across all regions and backups."
	},
	{
		icon: ScrollText,
		title: "Immutable audit logs",
		copy: "Price overrides, voided receipts, refunds and stock adjustments are permanently recorded."
	},
	{
		icon: BadgeCheck,
		title: "ACID-consistent ledger",
		copy: "Inventory, ledger and tax computations are transactional — never approximate."
	},
	{
		icon: Gauge,
		title: "Built for scale",
		copy: "Microservices supporting 500+ tenants and 5,000+ concurrent active tills."
	},
	{
		icon: Timer,
		title: "Performance SLOs",
		copy: "Barcode lookup under 50ms, receipt print under 1.5 seconds, 99.9% API uptime."
	}
];
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustBar, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modules, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeepDives, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Vat, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Integrations, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reliability, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Security, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingTeaser, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Contact, {})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function Hero() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "relative overflow-hidden bg-mesh",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-7xl items-center gap-14 px-5 pt-16 pb-20 lg:grid-cols-[1fr_1.05fr] lg:px-8 lg:pt-24 lg:pb-28",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-[#1ea80c] shadow-[var(--shadow-soft)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-primary" }), "Built for UAE supermarket chains"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-6 text-4xl leading-[1.05] font-extrabold text-ink sm:text-5xl lg:text-6xl",
					children: [
						"Run your entire ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gradient",
							children: "supermarket chain"
						}),
						" from one platform"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground",
					children: "cloudynationpos is a white-label, multi-tenant POS platform that unifies head office, every branch till and every delivery aggregator — offline-capable, VAT-compliant and ready to brand as your own."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-wrap gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						className: "rounded-xl px-6 text-base font-semibold shadow-[var(--shadow-glow)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "#contact",
							children: ["Book a demo ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-1.5 h-4 w-4" })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						variant: "outline",
						className: "rounded-xl border-border bg-surface px-6 text-base font-semibold",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: "See it in action"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
					className: "mt-10 grid max-w-lg grid-cols-3 gap-6",
					children: [
						["99.9%", "Cloud API uptime"],
						["100%", "Offline till capability"],
						["5,000+", "Concurrent tills"]
					].map(([v, l]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-2xl font-extrabold text-ink",
						children: v
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 text-xs text-muted-foreground",
						children: l
					})] }, l))
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, {
				delay: 120,
				className: "relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-10 -right-6 hidden h-40 w-40 rounded-full bg-accent/25 blur-3xl lg:block" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardMock, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-[-3rem] ml-auto hidden w-[62%] animate-[float_7s_ease-in-out_infinite] sm:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TillMock, {})
					})
				]
			})]
		})
	});
}
function TrustBar() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-y border-border bg-surface",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-5 py-8 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase",
				children: "Built for UAE retail & supermarket chains"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6",
				children: [
					"Hypermarket Group",
					"Fresh Markets",
					"Corniche Retail",
					"Value Stores",
					"Gulf Grocers",
					"Express Marts"
				].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl border border-border bg-surface-2 px-3 py-3 text-center text-xs font-bold tracking-wide text-muted-foreground",
					children: n.toUpperCase()
				}, n))
			})]
		})
	});
}
function SectionHead({ eyebrow, title, copy }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-bold tracking-[0.18em] text-[#1ea80c] uppercase",
				children: eyebrow
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 text-3xl font-extrabold text-ink sm:text-4xl",
				children: title
			}),
			copy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-base leading-relaxed text-muted-foreground",
				children: copy
			})
		]
	});
}
function Modules() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "modules",
		className: "py-20 lg:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-5 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHead, {
				eyebrow: "Core modules",
				title: "Four modules. One retail operating system.",
				copy: "From platform operator to cashier, every role works inside the same connected system — no exports, no reconciliation spreadsheets."
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-14 grid gap-6 md:grid-cols-2",
				children: modules.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
					delay: i * 90,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "group panel h-full p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.icon, { className: "h-5 w-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-5 text-lg font-bold text-ink",
								children: m.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2.5 text-sm leading-relaxed text-muted-foreground",
								children: m.copy
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-5 space-y-2",
								children: m.points.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center gap-2 text-sm text-ink",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 shrink-0 text-success" }), p]
								}, p))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: m.to,
								className: "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5",
								children: ["Open live demo ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4 transition-all" })]
							})
						]
					})
				}, m.title))
			})]
		})
	});
}
function DeepDives() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "features",
		className: "border-y border-border bg-surface py-20 lg:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-7xl space-y-24 px-5 lg:px-8",
			children: deepDives.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `grid items-center gap-12 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold tracking-[0.18em] text-[#1ea80c] uppercase",
						children: d.tag
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 text-3xl font-extrabold text-ink",
						children: d.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-base leading-relaxed text-muted-foreground",
						children: d.copy
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-6 space-y-3",
						children: d.bullets.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3 text-sm leading-relaxed text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), b]
						}, b))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						className: "mt-7 rounded-xl border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: d.to,
							children: ["Explore the module ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-1.5 h-4 w-4" })]
						})
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -inset-6 -z-10 rounded-[2rem] bg-mesh opacity-70 blur-2xl" }), i === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TillMock, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardMock, {})]
				})]
			}) }, d.title))
		})
	});
}
function Vat() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "compliance",
		className: "py-20 lg:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-7xl px-5 lg:px-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-10 p-8 lg:grid-cols-2 lg:p-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-2 rounded-full bg-success/12 px-3 py-1.5 text-xs font-semibold text-success",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-3.5 w-3.5" }), " UAE VAT & FTA ready"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-5 text-3xl font-extrabold text-ink",
							children: "Compliance handled at the till, not at year end"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-base leading-relaxed text-muted-foreground",
							children: "Every receipt printed by cloudynationpos is a valid UAE tax document. VAT is computed automatically, TRN details are embedded, and FTA-format summaries are one click away."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-6 space-y-3",
							children: [
								"Automated 5% VAT computation on every line item",
								"Inclusive or exclusive price display, per outlet",
								"TRN-formatted tax receipts and simplified tax invoices",
								"Downloadable FTA tax summary reports per period"
							].map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3 text-sm text-ink",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), b]
							}, b))
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-2xl border border-border bg-surface-2 p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-center text-sm font-extrabold text-ink",
									children: "TAX INVOICE"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-center text-[11px] text-muted-foreground",
									children: "Al Barsha Hypermarket · TRN 100234567800003"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 space-y-1.5 border-y border-dashed border-border py-3 text-[12px]",
									children: [
										["Bananas 1.24 kg", "7.13"],
										["Laban 1L × 2", "11.00"],
										["Arabic Bread (0% VAT)", "3.00"],
										["Basmati Rice 5kg", "38.50"]
									].map(([a, b]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-ink",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: a }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b })]
									}, a))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 space-y-1 text-[12px] text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Taxable amount" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "AED 56.63" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VAT @ 5%" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "AED 2.83" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Zero-rated" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "AED 3.00" })]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex justify-between border-t border-border pt-3 text-base font-extrabold text-ink",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "AED 59.63" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 text-center text-[10px] text-muted-foreground",
									children: "Generated by cloudynationpos · FTA compliant"
								})
							]
						})
					})]
				})
			}) })
		})
	});
}
var aggregatorCards = [
	{
		name: "Talabat",
		logo: talabat_default,
		copy: "Order ingestion, menu publishing and live stock sync."
	},
	{
		name: "Careem",
		logo: Careem_default,
		copy: "Quick-commerce orders routed straight to the branch queue."
	},
	{
		name: "InstaShop",
		logo: InstaShop_default,
		copy: "Full grocery catalog sync with promo pricing support."
	},
	{
		name: "Deliveroo",
		logo: Deliveroo_default,
		copy: "Fulfilment counter printing and status callbacks."
	}
];
function Integrations() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "integrations",
		className: "border-y border-border bg-surface py-20 lg:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-5 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHead, {
					eyebrow: "Integrations",
					title: "Unified order ingestion + live stock sync",
					copy: "Aggregator orders arrive as native POS transactions. Stock, pricing and availability stay identical across every storefront you sell on."
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
					children: aggregatorCards.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						delay: i * 80,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel h-full p-6 text-center transition-transform hover:-translate-y-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-surface shadow-sm border border-border p-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: a.logo,
										alt: `${a.name} logo`,
										className: "h-full w-full object-contain",
										onError: (e) => {
											e.currentTarget.style.display = "none";
											if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = "flex";
										}
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "hidden h-full w-full items-center justify-center text-sm font-extrabold text-primary",
										children: a.name.slice(0, 2).toUpperCase()
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-4 text-base font-bold text-ink",
									children: a.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm leading-relaxed text-muted-foreground",
									children: a.copy
								})
							]
						})
					}, a.name))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
					delay: 120,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-10 flex flex-wrap items-center justify-center gap-3",
						children: [
							"Auto-inject to POS queue",
							"Counter printing",
							"One-click publish",
							"Per-branch API vault"
						].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-ink",
							children: t
						}, t))
					})
				})
			]
		})
	});
}
function Reliability() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "py-20 lg:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold tracking-[0.18em] text-primary uppercase",
					children: "Offline-first reliability"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-3 text-3xl font-extrabold text-ink sm:text-4xl",
					children: "The queue keeps moving when the connection doesn't"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-base leading-relaxed text-muted-foreground",
					children: "cloudynationpos tills hold a full local catalog and transaction ledger. When connectivity drops, billing continues without a single dropped sale — and reconciles automatically on reconnect."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 grid gap-4 sm:grid-cols-2",
					children: [
						{
							icon: CloudOff,
							t: "100% offline billing",
							c: "Sales, receipts and shifts continue locally."
						},
						{
							icon: RefreshCw,
							t: "Automated conflict resolution",
							c: "Buffered transactions merge safely on reconnect."
						},
						{
							icon: Zap,
							t: "Sub-50ms lookups",
							c: "Barcode scan to cart line, instantly."
						},
						{
							icon: Activity,
							t: "99.9% cloud uptime",
							c: "Redundant, monitored, regionally hosted."
						}
					].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(f.icon, { className: "h-5 w-5 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm font-bold text-ink",
								children: f.t
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs leading-relaxed text-muted-foreground",
								children: f.c
							})
						]
					}, f.t))
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
				delay: 120,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel space-y-4 p-7",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-xl bg-success/10 px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold text-ink",
								children: "Till 04 · Al Barsha"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1.5 text-xs font-bold text-success",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-success" }), " Synced"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-xl bg-warning/12 px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold text-ink",
								children: "Till 11 · Deira"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1.5 text-xs font-bold text-warning-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-warning" }), " Offline · 42 buffered"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold text-muted-foreground",
								children: "Reconnect timeline"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "mt-3 space-y-3 text-sm",
								children: [
									"Local ledger sealed with device signature",
									"Buffered transactions replayed in order",
									"Inventory + aggregator stock re-synced",
									"Audit log entry written (immutable)"
								].map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-3 text-ink",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary",
										children: i + 1
									}), s]
								}, s))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, { className: "h-4 w-4 text-primary" }), " Weighing scale, drawer, scanner and printer hooks stay active offline."]
						})
					]
				})
			})]
		})
	});
}
function Security() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "security",
		className: "border-y border-border bg-surface py-20 lg:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-5 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHead, {
				eyebrow: "Security & architecture",
				title: "Enterprise guarantees, written into the platform",
				copy: "Retail data is financial data. cloudynationpos treats it that way at every layer."
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
				children: security.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
					delay: i * 70,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel h-full p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-10 w-10 place-items-center rounded-xl bg-success/12 text-success",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: "h-5 w-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-4 text-base font-bold text-ink",
								children: s.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-relaxed text-muted-foreground",
								children: s.copy
							})
						]
					})
				}, s.title))
			})]
		})
	});
}
function PricingTeaser() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "py-20 lg:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-5 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHead, {
					eyebrow: "Pricing",
					title: "Priced per outlet and till — not per headache",
					copy: "Transparent tiers that scale with your network. Every plan includes VAT compliance, offline tills and aggregator sync."
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
					delay: 100,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-10 flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "lg",
							className: "rounded-xl px-6 font-semibold",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/pricing",
								children: ["View full pricing ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-1.5 h-4 w-4" })]
							})
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-12 grid gap-6 lg:grid-cols-3",
					children: [
						{
							name: "Starter",
							price: "AED 899",
							unit: "/ outlet / month",
							note: "Up to 3 tills per outlet"
						},
						{
							name: "Growth",
							price: "AED 1,690",
							unit: "/ outlet / month",
							note: "Up to 10 tills + aggregator sync",
							featured: true
						},
						{
							name: "Enterprise",
							price: "Custom",
							unit: "annual contract",
							note: "Unlimited tills, white-label, SLA"
						}
					].map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						delay: i * 90,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `panel h-full p-7 ${p.featured ? "ring-2 ring-primary" : ""}`,
							children: [
								p.featured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-3 inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground",
									children: "Most popular"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-lg font-bold text-ink",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-3xl font-extrabold text-ink",
									children: p.price
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: p.unit
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 text-sm text-muted-foreground",
									children: p.note
								})
							]
						})
					}, p.name))
				})
			]
		})
	});
}
function Contact() {
	const [sent, setSent] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "contact",
		className: "border-t border-border bg-mesh py-20 lg:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold tracking-[0.18em] text-[#1ea80c] uppercase",
					children: "Book a demo"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-3 text-3xl font-extrabold text-ink sm:text-4xl",
					children: "See cloudynationpos running your store"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-lg text-base leading-relaxed text-muted-foreground",
					children: "Tell us about your network and we'll walk you through a live environment configured with your outlets, VAT settings and aggregator channels."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-7 space-y-3 text-sm text-ink",
					children: [
						{
							icon: Users,
							t: "30-minute tailored walkthrough"
						},
						{
							icon: FileText,
							t: "Migration plan for your existing catalog"
						},
						{
							icon: CreditCard,
							t: "Commercial proposal within 48 hours"
						}
					].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(x.icon, { className: "h-4 w-4 text-primary" }), x.t]
					}, x.t))
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
				delay: 120,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "panel space-y-4 p-7",
					onSubmit: (e) => {
						e.preventDefault();
						setSent(true);
						toast.success("Demo request received", { description: "Our UAE retail team will be in touch within one business day." });
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "name",
									children: "Full name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "name",
									required: true,
									placeholder: "Ahmed Al Mansoori"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "company",
									children: "Company"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "company",
									required: true,
									placeholder: "Al Barsha Hypermarket"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "email",
									children: "Work email"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "email",
									type: "email",
									required: true,
									placeholder: "you@company.ae"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "outlets",
									children: "Number of outlets"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "outlets",
									type: "number",
									min: 1,
									defaultValue: 3
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "message",
								children: "What would you like to see?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "message",
								rows: 4,
								placeholder: "We run 6 branches in Dubai and sell on Talabat and InstaShop…"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "lg",
							className: "w-full rounded-xl font-semibold",
							children: sent ? "Request sent ✓" : "Book a demo"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-xs text-muted-foreground",
							children: "This is a demo form — no data leaves your browser."
						})
					]
				})
			})]
		})
	});
}
//#endregion
export { Landing as component };
