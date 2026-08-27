import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as Button } from "./button-BlBeOJmP.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as Minus, ft as Check, xt as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as Switch } from "./switch-BbovR4Kp.mjs";
import { n as Navbar, r as Reveal, t as Footer } from "./Reveal-EeYOLuaN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pricing-B4k-13Uj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var tiers = [
	{
		name: "Starter",
		monthly: 899,
		blurb: "Single-site grocers and small independents getting off legacy tills.",
		limits: [
			"1 outlet included",
			"Up to 3 POS tills",
			"10,000 monthly orders"
		],
		features: [
			"POS till terminal + offline mode",
			"UAE VAT 5% automation & TRN receipts",
			"Central product catalog",
			"Shift & X/Z reports",
			"Email support"
		],
		missing: [
			"Aggregator sync engine",
			"Batch & expiry FEFO",
			"White-label branding"
		]
	},
	{
		name: "Growth",
		monthly: 1690,
		blurb: "Multi-branch supermarkets selling in-store and on delivery aggregators.",
		featured: true,
		limits: [
			"Up to 10 outlets",
			"Up to 10 tills per outlet",
			"150,000 monthly orders"
		],
		features: [
			"Everything in Starter",
			"Head office multi-outlet dashboard",
			"Batch & expiry with FIFO/FEFO alerts",
			"Purchasing: PO → GRN → Vendor Invoice",
			"Aggregator sync (Talabat, Careem, InstaShop, Deliveroo)",
			"Loyalty & CRM with tiers and points",
			"Priority support, 4h response"
		],
		missing: ["Dedicated infrastructure"]
	},
	{
		name: "Enterprise",
		monthly: null,
		blurb: "Regional chains and platform operators running a white-label network.",
		limits: [
			"Unlimited outlets",
			"Unlimited tills",
			"Custom order volume"
		],
		features: [
			"Everything in Growth",
			"SaaS Super-Admin portal (multi-tenant)",
			"Full white-label branding & domains",
			"Dedicated infrastructure & data residency",
			"Custom hardware & ERP integrations",
			"99.9% uptime SLA + named CSM"
		],
		missing: []
	}
];
var matrix = [
	[
		"Offline-capable tills",
		true,
		true,
		true
	],
	[
		"UAE VAT 5% + FTA summaries",
		true,
		true,
		true
	],
	[
		"Multi-outlet head office",
		false,
		true,
		true
	],
	[
		"Batch & expiry (FIFO/FEFO)",
		false,
		true,
		true
	],
	[
		"Purchasing & AP workflow",
		false,
		true,
		true
	],
	[
		"Aggregator sync engine",
		false,
		true,
		true
	],
	[
		"Loyalty & CRM",
		false,
		true,
		true
	],
	[
		"Multi-tenant super admin",
		false,
		false,
		true
	],
	[
		"White-label branding",
		false,
		false,
		true
	],
	[
		"Uptime SLA",
		false,
		false,
		true
	]
];
function PricingPage() {
	const [annual, setAnnual] = (0, import_react.useState)(true);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "bg-mesh py-16 lg:py-24",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto max-w-3xl px-5 text-center lg:px-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold tracking-[0.18em] text-[#1ea80c] uppercase",
							children: "Pricing"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-3 text-4xl font-extrabold text-ink sm:text-5xl",
							children: "Scales with your outlets, not your paperwork"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 text-lg text-muted-foreground",
							children: "Every plan includes UAE VAT compliance, offline-capable tills and unlimited staff accounts. Pay per outlet, add tills as you grow."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-2.5 shadow-[var(--shadow-soft)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: annual ? "text-sm text-muted-foreground" : "text-sm font-semibold text-ink",
									children: "Monthly"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: annual,
									onCheckedChange: setAnnual,
									"aria-label": "Toggle annual billing"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: annual ? "text-sm font-semibold text-ink" : "text-sm text-muted-foreground",
									children: "Annual"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-bold text-success",
									children: "Save 15%"
								})
							]
						})
					] })
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "pb-20 lg:pb-28",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-5 lg:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-6 lg:grid-cols-3",
							children: tiers.map((t, i) => {
								const price = t.monthly === null ? "Custom" : `AED ${Math.round(annual ? t.monthly * .85 : t.monthly).toLocaleString("en-AE")}`;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
									delay: i * 90,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `panel flex h-full flex-col p-7 ${t.featured ? "ring-2 ring-primary shadow-[var(--shadow-lift)]" : ""}`,
										children: [
											t.featured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mb-3 self-start rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground",
												children: "Most popular"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-xl font-extrabold text-ink",
												children: t.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-sm leading-relaxed text-muted-foreground",
												children: t.blurb
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-6",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-4xl font-extrabold text-ink",
													children: price
												}), t.monthly !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-1 text-sm text-muted-foreground",
													children: "/ outlet / month"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
												className: "mt-5 space-y-1.5 rounded-xl bg-surface-2 p-4 text-xs font-medium text-ink",
												children: t.limits.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: l }, l))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "mt-6 flex-1 space-y-2.5",
												children: [t.features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "flex gap-2.5 text-sm text-ink",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-success" }), f]
												}, f)), t.missing.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "flex gap-2.5 text-sm text-muted-foreground",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "mt-0.5 h-4 w-4 shrink-0" }), f]
												}, f))]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												asChild: true,
												className: "mt-7 rounded-xl font-semibold",
												variant: t.featured ? "default" : "outline",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "/#contact",
													children: t.monthly === null ? "Talk to sales" : "Book a demo"
												})
											})
										]
									})
								}, t.name);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "panel mt-16 overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full min-w-[640px] text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border text-left",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-4 font-bold text-ink",
										children: "Capability"
									}), [
										"Starter",
										"Growth",
										"Enterprise"
									].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-4 text-center font-bold text-ink",
										children: h
									}, h))]
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: matrix.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border last:border-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-4 text-ink",
										children: row[0]
									}), [
										row[1],
										row[2],
										row[3]
									].map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-4 text-center",
										children: v ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mx-auto h-4 w-4 text-success" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "mx-auto h-4 w-4 text-muted-foreground/60" })
									}, i))]
								}, row[0])) })]
							})
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel mt-10 flex flex-col items-center gap-4 p-10 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-2xl font-extrabold text-ink",
									children: "Not sure which tier fits your network?"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "max-w-xl text-sm text-muted-foreground",
									children: "Walk through the platform with sample data first, then let our team size a plan around your outlets, tills and aggregator volume."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap justify-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										className: "rounded-xl font-semibold",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/login",
											children: ["Open live demo ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-1.5 h-4 w-4" })]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: "outline",
										className: "rounded-xl font-semibold",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											href: "/#contact",
											children: "Book a demo"
										})
									})]
								})
							]
						}) })
					]
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { PricingPage as component };
