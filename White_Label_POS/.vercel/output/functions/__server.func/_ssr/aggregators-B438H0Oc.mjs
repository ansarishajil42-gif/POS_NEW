import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as Button } from "./button-BlBeOJmP.mjs";
import { D as RefreshCw, E as Rocket, K as KeyRound, W as Link2, X as Eye, Z as EyeOff, m as Timer } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, n as StatCard, o as TabsTrigger, r as Tabs, t as DemoShell } from "./tabs-ClS19XRw.mjs";
import { t as Badge } from "./badge-BpuUFK6A.mjs";
import { t as Switch } from "./switch-BbovR4Kp.mjs";
import { a as outlets, i as aggregators, r as aggOrders, t as aed } from "./demo-data-C-13_S7Y.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/aggregators-B438H0Oc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var statusTone = {
	New: "bg-primary/10 text-primary border-primary/20",
	Picking: "bg-warning/15 text-warning-foreground border-warning/30",
	Ready: "bg-success/12 text-success border-success/20",
	Dispatched: "bg-surface-2 text-muted-foreground border-border"
};
function Aggregators() {
	const [tab, setTab] = (0, import_react.useState)("All");
	const [sync, setSync] = (0, import_react.useState)(Object.fromEntries(outlets.map((o) => [o.id, true])));
	const [revealed, setRevealed] = (0, import_react.useState)(null);
	const [publishing, setPublishing] = (0, import_react.useState)(false);
	const visible = tab === "All" ? aggOrders : aggOrders.filter((o) => o.channel === tab);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DemoShell, {
		title: "Aggregator Sync Engine",
		subtitle: "Unified ingestion and live stock sync across Talabat, Careem, InstaShop and Deliveroo.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "rounded-xl font-semibold",
			disabled: publishing,
			onClick: () => {
				setPublishing(true);
				setTimeout(() => {
					setPublishing(false);
					toast.success("Published to all aggregators", { description: "Catalog, promo pricing and stock status updated on 4 channels." });
				}, 1200);
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rocket, { className: "mr-1.5 h-4 w-4" }), publishing ? "Publishing…" : "Publish to all aggregators"]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Live orders in queue",
					value: String(aggOrders.length),
					delta: "+18% vs last hour",
					icon: RefreshCw
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Channels connected",
					value: "4 / 4",
					delta: "All healthy",
					icon: Link2,
					tone: "success"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Avg ingestion latency",
					value: "820 ms",
					icon: Timer
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Stock sync events today",
					value: "12,486",
					icon: RefreshCw,
					tone: "accent"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "queue",
			className: "mt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "rounded-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "queue",
							children: "Order queue"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "stock",
							children: "Stock sync"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "vault",
							children: "API credentials"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "queue",
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 flex flex-wrap gap-2",
						children: ["All", ...aggregators].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setTab(c),
							className: `rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${tab === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:text-ink"}`,
							children: [c, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2 text-xs opacity-80",
								children: c === "All" ? aggOrders.length : aggOrders.filter((o) => o.channel === c).length
							})]
						}, c))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
						children: visible.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-xs text-muted-foreground",
										children: o.id
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm font-bold text-ink",
										children: o.customer
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "rounded-full font-semibold",
										children: o.channel
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground",
										children: [
											o.items,
											" items · ",
											o.branch
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-extrabold text-ink",
										children: aed(o.total)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[o.status]}`,
										children: o.status
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground",
										children: [o.minutesAgo, " min ago"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									className: "mt-4 w-full rounded-lg",
									onClick: () => toast.success(`${o.id} injected into ${o.branch} POS queue · picking slip printed`),
									children: "Send to POS & print slip"
								})
							]
						}, o.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "stock",
					className: "mt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-5 lg:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-bold text-ink",
									children: "Stock auto-sync per branch"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: "When enabled, every till sale instantly deducts availability across all connected aggregator menus."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-5 space-y-3",
									children: outlets.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold text-ink",
											children: o.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [o.emirate, " · 4 channels linked"]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: sync[o.id] ?? false,
											onCheckedChange: (v) => {
												setSync((s) => ({
													...s,
													[o.id]: v
												}));
												toast.success(`${o.name}: auto-sync ${v ? "enabled" : "paused"}`);
											}
										})]
									}, o.id))
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-bold text-ink",
									children: "Price & menu publisher"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: "Last published 14 minutes ago · 1,284 SKUs · 36 promotions"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-5 space-y-3",
									children: aggregators.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between rounded-xl border border-border px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-semibold text-ink",
											children: a
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1.5 text-xs font-semibold text-success",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-success" }), " In sync"]
										})]
									}, a))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "mt-5 w-full rounded-xl font-semibold",
									onClick: () => toast.success("Catalog, promos and stock status published to 4 channels"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rocket, { className: "mr-1.5 h-4 w-4" }), " Publish now"]
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "vault",
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-5 sm:grid-cols-2",
						children: outlets.slice(0, 2).map((o) => aggregators.map((a) => {
							const key = `${o.id}-${a}`;
							const shown = revealed === key;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-bold text-ink",
											children: a
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: o.name
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-4 w-4 text-primary" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 font-mono text-xs text-ink",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex-1 truncate",
											children: shown ? `sk_live_${a.toLowerCase()}_${o.id}_9f42ab77c1` : "•••• •••• •••• ••••"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setRevealed(shown ? null : key),
											"aria-label": "Toggle key visibility",
											className: "text-muted-foreground hover:text-ink",
											children: shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											className: "flex-1 rounded-lg",
											onClick: () => toast.success(`${a} reconnected for ${o.name}`),
											children: "Connect"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											className: "rounded-lg",
											onClick: () => toast.success("Sandbox credentials rotated"),
											children: "Rotate"
										})]
									})
								]
							}, key);
						}))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 text-xs text-muted-foreground",
						children: "OAuth tokens and API keys are stored per branch, encrypted at rest with AES-256 and never exposed to the till."
					})]
				})
			]
		})]
	});
}
//#endregion
export { Aggregators as component };
