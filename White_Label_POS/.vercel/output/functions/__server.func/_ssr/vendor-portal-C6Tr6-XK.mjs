import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as Button } from "./button-BlBeOJmP.mjs";
import { Q as Download, R as Menu, ct as CircleAlert, et as CreditCard, y as ShoppingCart } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, n as StatCard, o as TabsTrigger, r as Tabs, t as DemoShell } from "./tabs-DHhejuE7.mjs";
import { t as aed } from "./demo-data-C-13_S7Y.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Route } from "./router-B7PuFS5E.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vendor-portal-C6Tr6-XK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VendorPortal() {
	const data = Route.useLoaderData();
	const { vendor, purchaseOrders, invoices } = data;
	const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, import_react.useState)(false);
	const totalOrdered = purchaseOrders.reduce((sum, po) => sum + Number(po.total), 0);
	const activeOrders = purchaseOrders.filter((po) => po.status !== "Fulfilled" && po.status !== "Invoiced").length;
	const newOrders = purchaseOrders.filter((po) => po.status === "Draft" || po.status === "Ordered").length;
	const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
	const totalPaid = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.total), 0);
	const outstandingBalance = totalInvoiced - totalPaid;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoShell, {
		title: "Vendor Portal",
		subtitle: `${vendor.name} · Supplier to ${data.tenant?.name || "Company"}`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "rounded-xl font-semibold",
			onClick: () => toast.success("Statement downloaded"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-4 w-4" }), " Download Statement"]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "pos",
			onValueChange: () => setIsMobileMenuOpen(false),
			className: "mt-6 flex flex-col md:flex-row gap-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-sm",
						children: "Navigation Menu"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-4 w-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: `w-full md:w-56 shrink-0 ${isMobileMenuOpen ? "block" : "hidden md:block"}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "pos",
							className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
							children: "Purchase Orders"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "invoices",
							className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
							children: "Invoices & Payments"
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "pos",
						className: "mt-0 space-y-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
									label: "New Orders (Action Req.)",
									value: newOrders.toString(),
									icon: CircleAlert,
									tone: "accent"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
									label: "Active Orders",
									value: activeOrders.toString(),
									icon: ShoppingCart
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
									label: "Total Ordered (YTD)",
									value: aed(totalOrdered),
									icon: ShoppingCart,
									tone: "success"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "border-b border-border p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-bold text-ink",
									children: "Recent Purchase Orders"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full text-left text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium",
											children: "PO Number"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium",
											children: "Date Received"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium",
											children: "Required Delivery"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium text-right",
											children: "Value"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium text-right",
											children: "Status"
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
									className: "divide-y divide-border",
									children: purchaseOrders.map((po) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "hover:bg-surface-2/50 transition-colors",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-4 py-3 font-medium text-primary",
												children: [po.id.slice(0, 13), "..."]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 text-muted-foreground",
												children: new Date(po.createdAt).toISOString().split("T")[0]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 text-ink",
												children: "N/A"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 text-right font-medium",
												children: aed(Number(po.total))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-4 py-3 text-right",
												children: [
													po.status === "Ordered" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning-foreground",
														children: po.status
													}),
													(po.status === "Draft" || po.status === "GRN") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary",
														children: po.status
													}),
													po.status === "Invoiced" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-muted-foreground",
														children: po.status
													})
												]
											})
										]
									}, po.id))
								})]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "invoices",
						className: "mt-0 space-y-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
								label: "Outstanding Balance",
								value: aed(outstandingBalance),
								icon: CreditCard,
								tone: "accent"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
								label: "Last Payment Received",
								value: aed(totalPaid),
								icon: CreditCard,
								tone: "success"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-b border-border p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-bold text-ink",
									children: "Invoices Submitted"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => toast.info("Opening upload modal..."),
									children: "Upload New Invoice"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full text-left text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium",
											children: "Invoice No."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium",
											children: "PO Reference"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium",
											children: "Submitted Date"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium text-right",
											children: "Amount"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-4 py-3 font-medium text-right",
											children: "Payment Status"
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
									className: "divide-y divide-border",
									children: invoices.map((inv) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "hover:bg-surface-2/50 transition-colors",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 font-medium text-ink",
												children: inv.invoiceNumber
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 text-muted-foreground",
												children: inv.purchaseOrderId ? inv.purchaseOrderId.slice(0, 13) + "..." : "N/A"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 text-muted-foreground",
												children: new Date(inv.createdAt).toISOString().split("T")[0]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 text-right font-bold",
												children: aed(Number(inv.total))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-4 py-3 text-right",
												children: [
													inv.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center rounded bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning-foreground",
														children: "Processing"
													}),
													inv.status === "paid" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center rounded bg-success/10 px-2 py-0.5 text-xs font-bold text-success",
														children: "Paid"
													}),
													inv.status === "overdue" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center rounded bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive",
														children: "Overdue"
													})
												]
											})
										]
									}, inv.id))
								})]
							})]
						})]
					})]
				})
			]
		})
	});
}
//#endregion
export { VendorPortal as component };
