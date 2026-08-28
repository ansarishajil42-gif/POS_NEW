import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as cn, n as Logo } from "./button-BlBeOJmP.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useAuth } from "./auth-CdZlvpyO.mjs";
import { G as Layers, I as Monitor, _t as Boxes, g as Store, gt as Briefcase, ht as Building2, u as Truck, wt as ArrowLeft, y as ShoppingCart } from "../_libs/lucide-react.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tabs-ClS19XRw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var allNav = [
	{
		to: "/super-admin",
		label: "Super Admin",
		icon: Layers
	},
	{
		to: "/head-office",
		label: "Head Office",
		icon: Building2
	},
	{
		to: "/store-manager",
		label: "Store Dashboard",
		icon: Store
	},
	{
		to: "/inventory-manager",
		label: "Inventory",
		icon: Boxes
	},
	{
		to: "/purchasing",
		label: "Purchasing",
		icon: ShoppingCart
	},
	{
		to: "/pos-till",
		label: "POS Till",
		icon: Monitor
	},
	{
		to: "/aggregators",
		label: "Aggregator Sync",
		icon: Truck
	},
	{
		to: "/vendor-portal",
		label: "Vendor Portal",
		icon: Briefcase
	}
];
function DemoShell({ title, subtitle, actions, children }) {
	const { role, isLoaded, logout } = useAuth();
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-surface-2",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-[1500px] flex-col lg:flex-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "sticky top-0 z-40 border-b border-border bg-surface px-4 py-3 flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 lg:px-5 lg:py-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-4 flex gap-1.5 overflow-x-auto lg:mt-8 lg:flex-col lg:overflow-visible",
						children: nav.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: n.to,
							activeProps: { "data-active": "true" },
							className: cn("group flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink", "data-[active=true]:bg-primary/10 data-[active=true]:text-primary"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(n.icon, { className: "h-4 w-4" }), n.label]
						}, n.to))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-auto hidden rounded-2xl border border-border bg-surface-2 p-4 lg:block",
						children: isLoaded && role && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold text-ink",
								children: "Logged in as:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs font-extrabold text-primary",
								children: role
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: logout,
								className: "inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-3.5 w-3.5" }), " Logout"]
							})]
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-extrabold tracking-tight text-ink sm:text-3xl",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 max-w-2xl text-sm text-muted-foreground",
						children: subtitle
					})] }), actions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: actions
					})]
				}), children]
			})]
		})
	});
}
function StatCard({ label, value, delta, icon: Icon, tone = "primary" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "group relative overflow-hidden rounded-2xl border border-border/50 bg-surface/50 p-6 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl transition-transform duration-500 group-hover:scale-150", {
				primary: "from-primary/10 to-transparent",
				success: "from-success/10 to-transparent",
				accent: "from-accent/10 to-transparent"
			}[tone]) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[13px] font-bold tracking-wider text-muted-foreground uppercase",
					children: label
				}), Icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("grid h-10 w-10 place-items-center rounded-xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6", {
						primary: "bg-primary text-primary-foreground shadow-primary/20",
						success: "bg-success text-success-foreground shadow-success/20",
						accent: "bg-accent text-accent-foreground shadow-accent/20"
					}[tone]),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "relative z-10 mt-5 text-3xl font-black tracking-tight text-ink",
				children: value
			}),
			delta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "relative z-10 mt-2 text-xs font-bold text-success flex items-center bg-success/10 w-max px-2 py-1 rounded-md",
				children: delta
			})
		]
	});
}
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
//#endregion
export { TabsList as a, TabsContent as i, StatCard as n, TabsTrigger as o, Tabs as r, DemoShell as t };
