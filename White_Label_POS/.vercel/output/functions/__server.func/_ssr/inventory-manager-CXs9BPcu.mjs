import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as Button } from "./button-BlBeOJmP.mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { R as Menu, S as Search, St as ArrowRightLeft, d as TriangleAlert, gt as Boxes, it as CircleCheck, n as X, nt as Clock, q as History, y as ShoppingCart } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, n as StatCard, o as TabsTrigger, r as Tabs, t as DemoShell } from "./tabs-BkoyibIH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { b as stockTransferServerFn, v as Route$7, y as draftPurchaseOrderServerFn } from "./router-C5e5vX47.mjs";
import { t as Input } from "./input-Cexa0DG2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventory-manager-CXs9BPcu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InventoryManager() {
	const data = Route$7.useLoaderData();
	const router = useRouter();
	const [transferModalOpen, setTransferModalOpen] = (0, import_react.useState)(false);
	const [isTransferring, setIsTransferring] = (0, import_react.useState)(false);
	const [transferForm, setTransferForm] = (0, import_react.useState)({
		productId: "",
		sourceBranchId: "",
		targetBranchId: "",
		quantity: 1
	});
	const [draftPoOpen, setDraftPoOpen] = (0, import_react.useState)(false);
	const [isDraftingPo, setIsDraftingPo] = (0, import_react.useState)(false);
	const [draftPoForm, setDraftPoForm] = (0, import_react.useState)({
		productId: "",
		branchId: "",
		vendorId: "",
		qty: 10
	});
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, import_react.useState)(false);
	const { tenant, role, branchScope, branches, allTenantBranches, stockLevels, batches, transfers, stats, vendors, allowPoDraft, alerts } = data;
	const subtitle = role === "Inventory Manager" ? branchScope?.length === 1 ? `${tenant?.name || "Company"} · ${branches.find((b) => b.id === branchScope[0])?.name || "Assigned Branch"}` : `${tenant?.name || "Company"} · Assigned Branches` : `${tenant?.name || "Company"} · Global View`;
	const filteredStockLevels = stockLevels.filter((s) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		const productName = (s.productName || "").toLowerCase();
		const sku = (s.sku || s.barcode || "").toLowerCase();
		return productName.includes(query) || sku.includes(query);
	});
	const handleExport = () => {
		if (filteredStockLevels.length === 0) {
			toast.error("No data to export");
			return;
		}
		try {
			const csvRows = [[
				"SKU",
				"Item",
				"Branch",
				"In Stock",
				"Reorder Level",
				"Status"
			].join(",")];
			for (const s of filteredStockLevels) {
				const sku = s.sku || s.barcode || "";
				const status = s.stock <= s.reorderLevel ? "Low Stock" : "Healthy";
				const row = [
					`"${sku}"`,
					`"${s.productName?.replace(/"/g, "\"\"") || ""}"`,
					`"${s.branchName?.replace(/"/g, "\"\"") || ""}"`,
					`"${s.stock} ${s.unit}"`,
					`"${s.reorderLevel} ${s.unit}"`,
					`"${status}"`
				];
				csvRows.push(row.join(","));
			}
			const csvData = csvRows.join("\n");
			const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `stock_levels_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success("Export successful");
		} catch (err) {
			toast.error("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
		}
	};
	const openTransferModal = () => {
		let sourceBranch = transferForm.sourceBranchId;
		if (role === "Inventory Manager" && branches.length === 1) sourceBranch = branches[0].id;
		setTransferForm((prev) => ({
			...prev,
			sourceBranchId: sourceBranch
		}));
		setTransferModalOpen(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DemoShell, {
		title: "Inventory Control Dashboard",
		subtitle,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "rounded-xl font-semibold",
			onClick: () => toast.success("Stock count initiated"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boxes, { className: "mr-1.5 h-4 w-4" }), " Start Stock Count"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "stock",
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
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "stock",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Stock Levels"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "transfers",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Stock Transfers"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "batches",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Batch & Expiry (FEFO)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "alerts",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Low-Stock Alerts"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "ledger",
									className: "w-full justify-start rounded-lg px-4 py-3 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "mr-2 h-5 w-5" }), "Ledger"]
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "stock",
								className: "mt-0 space-y-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Total SKUs",
											value: stats.totalSkus.toLocaleString(),
											icon: Boxes
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Low Stock Items",
											value: stats.lowStockCount.toLocaleString(),
											icon: TriangleAlert,
											tone: stats.lowStockCount > 0 ? "accent" : "success"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Near Expiry Batches",
											value: stats.nearExpiryCount.toLocaleString(),
											icon: Clock,
											tone: stats.nearExpiryCount > 0 ? "accent" : "success"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Expired Batches",
											value: stats.expiredCount.toLocaleString(),
											icon: TriangleAlert,
											tone: stats.expiredCount > 0 ? "accent" : "success"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between border-b border-border p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative w-72",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Search SKU or Product Name...",
												className: "pl-9 h-9 text-sm",
												value: searchQuery,
												onChange: (e) => setSearchQuery(e.target.value)
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-2",
											children: [role !== "Inventory Manager" || branchScope && branchScope.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												className: "h-9",
												children: "Filter by Branch"
											}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												className: "h-9",
												onClick: handleExport,
												children: "Export"
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "overflow-x-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
											className: "w-full text-left text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
												className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "SKU / Item"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Branch"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium text-right",
														children: "In Stock"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium text-right",
														children: "Reorder Level"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium text-right",
														children: "Status"
													})
												] })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
												className: "divide-y divide-border",
												children: [filteredStockLevels.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													colSpan: 5,
													className: "px-4 py-8 text-center text-muted-foreground",
													children: searchQuery ? "No products found." : "No stock data available."
												}) }), filteredStockLevels.map((s) => {
													const isLow = s.stock <= s.reorderLevel;
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
														className: "hover:bg-surface-2/50 transition-colors",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																className: "px-4 py-3",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "font-semibold text-ink",
																	children: s.productName
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "text-xs text-muted-foreground",
																	children: [
																		"SKU: ",
																		s.sku || s.barcode,
																		" · ",
																		s.category
																	]
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-muted-foreground",
																children: s.branchName
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																className: "px-4 py-3 text-right font-medium",
																children: [
																	s.stock,
																	" ",
																	s.unit
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																className: "px-4 py-3 text-right text-muted-foreground",
																children: [
																	s.reorderLevel,
																	" ",
																	s.unit
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-right",
																children: isLow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent",
																	children: "Low Stock"
																}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success",
																	children: "Healthy"
																})
															})
														]
													}, s.id);
												})]
											})]
										})
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "transfers",
								className: "mt-0 space-y-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-lg font-bold text-ink",
										children: "Stock Transfers"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Move inventory between branches or central warehouse."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-end gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											className: "font-semibold",
											onClick: openTransferModal,
											disabled: allTenantBranches.length < 2,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, { className: "mr-2 h-4 w-4" }), " New Transfer"]
										}), allTenantBranches.length < 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-muted-foreground text-right max-w-[250px]",
											children: "No eligible destination branch or warehouse is available for transfer."
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "panel overflow-hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full text-left text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
											className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "TRN ID"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Origin"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Destination"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Items"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium text-right",
													children: "Status"
												})
											] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
											className: "divide-y divide-border",
											children: [transfers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												colSpan: 5,
												className: "px-4 py-8 text-center text-muted-foreground",
												children: "No recent transfers."
											}) }), transfers.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "hover:bg-surface-2/50 transition-colors",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 font-semibold text-primary font-mono text-xs",
														title: t.id,
														children: t.id.split("-")[0].toUpperCase()
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-ink",
														children: t.sourceBranchName
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-ink",
														children: t.destinationBranchName
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
														className: "px-4 py-3 text-muted-foreground",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "font-medium text-ink",
															children: [t.quantity, " units"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "text-xs",
															children: t.productName
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3" }),
																" ",
																t.status
															]
														})
													})
												]
											}, t.id))]
										})]
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "batches",
								className: "mt-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between border-b border-border p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-bold text-ink",
											children: "Batch & Expiry Tracker (FEFO)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative w-64",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Search batch number...",
												className: "pl-9 h-9 text-sm"
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full text-left text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
											className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Batch No."
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Product"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Stock"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Expiry Date"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium text-right",
													children: "Health"
												})
											] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
											className: "divide-y divide-border",
											children: [batches.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												colSpan: 5,
												className: "px-4 py-8 text-center text-muted-foreground",
												children: "No batch data available."
											}) }), batches.map((b) => {
												const expiry = b.expiryDate ? new Date(b.expiryDate) : null;
												const now = /* @__PURE__ */ new Date();
												const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / 864e5) : null;
												const isExpired = daysLeft !== null && daysLeft <= 0;
												const isNearExpiry = daysLeft !== null && !isExpired && daysLeft <= 30;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
													className: "hover:bg-surface-2/50 transition-colors",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 font-mono text-xs text-muted-foreground",
															children: b.batchNumber
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "px-4 py-3 font-semibold text-ink",
															children: [b.productName, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xs text-muted-foreground font-normal mt-0.5",
																children: b.branchName
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3",
															children: b.stock
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 text-muted-foreground",
															children: expiry ? expiry.toLocaleDateString() : "N/A"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 text-right",
															children: isExpired ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3 w-3" }), " Expired"]
															}) : isNearExpiry ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3 w-3" }),
																	" Near Expiry (",
																	daysLeft,
																	" days)"
																]
															}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3" }), " Healthy"]
															})
														})
													]
												}, b.id);
											})]
										})]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "alerts",
								className: "mt-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 lg:grid-cols-2",
									children: [
										alerts.lowStock.length === 0 && alerts.nearExpiry.length === 0 && alerts.expired.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "col-span-2 text-center text-muted-foreground p-8",
											children: "No alerts. Everything is healthy!"
										}),
										alerts.expired.map((alert) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "panel p-5 border-l-4 border-l-destructive flex flex-col justify-between",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive uppercase",
														children: "Expired"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xs text-muted-foreground",
														children: ["Batch: ", alert.batchNumber]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "mt-2 font-bold text-ink",
													children: alert.productName
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-sm text-muted-foreground",
													children: [
														"Expired on:",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-bold text-ink",
															children: new Date(alert.expiryDate).toLocaleDateString()
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-xs text-muted-foreground",
													children: ["Branch: ", alert.branchName]
												})
											] })
										}, alert.id)),
										alerts.nearExpiry.map((alert) => {
											const daysLeft = Math.ceil((new Date(alert.expiryDate).getTime() - (/* @__PURE__ */ new Date()).getTime()) / 864e5);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "panel p-5 border-l-4 border-l-accent flex flex-col justify-between",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase",
															children: "Near Expiry"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-xs text-muted-foreground",
															children: ["Batch: ", alert.batchNumber]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
														className: "mt-2 font-bold text-ink",
														children: alert.productName
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "mt-1 text-sm text-muted-foreground",
														children: ["Expires in: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "font-bold text-ink",
															children: [daysLeft, " days"]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "mt-1 text-xs text-muted-foreground",
														children: ["Branch: ", alert.branchName]
													})
												] })
											}, alert.id);
										}),
										alerts.lowStock.map((alert) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "panel p-5 border-l-4 border-l-accent flex flex-col justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase",
														children: "Critical Stock"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xs text-muted-foreground",
														children: ["SKU: ", alert.sku || alert.barcode]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "mt-2 font-bold text-ink",
													children: alert.productName
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-sm text-muted-foreground",
													children: [
														"Current Stock: ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-bold text-ink",
															children: alert.stock
														}),
														" ",
														"(Reorder at ",
														alert.reorderLevel,
														")"
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-xs text-muted-foreground",
													children: ["Branch: ", alert.branchName]
												})
											] }), allowPoDraft ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												className: "mt-4 w-full",
												variant: "secondary",
												onClick: () => {
													setDraftPoForm({
														productId: alert.productId,
														branchId: alert.branchId,
														vendorId: vendors.length > 0 ? vendors[0].id : "",
														qty: Math.max(10, alert.reorderLevel - alert.stock)
													});
													setDraftPoOpen(true);
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "mr-1.5 h-4 w-4" }), " Raise PO Draft"]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative group mt-4 w-full",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													className: "w-full",
													variant: "secondary",
													disabled: true,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "mr-1.5 h-4 w-4" }), " Raise PO Draft"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "absolute right-0 bottom-full mb-1 hidden w-48 z-10 p-2 text-xs text-white bg-black rounded group-hover:block text-center",
													children: "Only Purchasing Officer can create purchase orders."
												})]
											})]
										}, alert.id))
									]
								})
							})
						]
					})
				]
			}),
			transferModalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-bold text-ink",
							children: "New Stock Transfer"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setTransferModalOpen(false),
							className: "text-muted-foreground hover:text-ink",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-semibold text-ink",
								children: "Product / SKU"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								value: transferForm.productId,
								onChange: (e) => setTransferForm({
									...transferForm,
									productId: e.target.value
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Select a product..."
								}), Array.from(new Set(stockLevels.map((s) => s.productId))).map((id) => {
									const s = stockLevels.find((st) => st.productId === id);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: id,
										children: [
											s.productName,
											" (SKU: ",
											s.sku || s.barcode,
											")"
										]
									}, id);
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-sm font-semibold text-ink",
									children: "From Branch"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50",
									value: transferForm.sourceBranchId,
									onChange: (e) => setTransferForm({
										...transferForm,
										sourceBranchId: e.target.value
									}),
									disabled: role === "Inventory Manager" && branches.length === 1,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Select origin..."
									}), branches.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: b.id,
										children: b.name
									}, b.id))]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-sm font-semibold text-ink",
									children: "To Branch"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50",
									value: transferForm.targetBranchId,
									onChange: (e) => setTransferForm({
										...transferForm,
										targetBranchId: e.target.value
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Select destination..."
									}), allTenantBranches.filter((b) => b.id !== transferForm.sourceBranchId).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: b.id,
										children: b.name
									}, b.id))]
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-semibold text-ink",
								children: "Quantity"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: "1",
								className: "mt-1",
								value: transferForm.quantity,
								onChange: (e) => setTransferForm({
									...transferForm,
									quantity: parseInt(e.target.value) || 1
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex justify-end gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setTransferModalOpen(false),
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									disabled: isTransferring || !transferForm.productId || !transferForm.sourceBranchId || !transferForm.targetBranchId || transferForm.sourceBranchId === transferForm.targetBranchId,
									onClick: async () => {
										setIsTransferring(true);
										try {
											await stockTransferServerFn({ data: transferForm });
											toast.success("Stock transferred successfully!");
											setTransferModalOpen(false);
											router.invalidate();
										} catch (err) {
											toast.error(err.message || "Failed to transfer stock");
										} finally {
											setIsTransferring(false);
										}
									},
									children: isTransferring ? "Processing..." : "Transfer Stock"
								})]
							})
						]
					})]
				})
			}),
			draftPoOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-bold text-ink",
							children: "Raise PO Draft"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDraftPoOpen(false),
							className: "text-muted-foreground hover:text-ink",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-semibold text-ink",
								children: "Product"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 p-2 bg-surface-2 rounded-md text-sm border border-border text-muted-foreground",
								children: stockLevels.find((s) => s.productId === draftPoForm.productId)?.productName || "Unknown Product"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-semibold text-ink",
								children: "Branch"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 p-2 bg-surface-2 rounded-md text-sm border border-border text-muted-foreground",
								children: branches.find((b) => b.id === draftPoForm.branchId)?.name || "Unknown Branch"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-semibold text-ink",
								children: "Vendor"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
								value: draftPoForm.vendorId,
								onChange: (e) => setDraftPoForm({
									...draftPoForm,
									vendorId: e.target.value
								}),
								children: vendors?.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: v.id,
									children: v.name
								}, v.id))
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-semibold text-ink",
								children: "Order Quantity"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: "1",
								className: "mt-1",
								value: draftPoForm.qty,
								onChange: (e) => setDraftPoForm({
									...draftPoForm,
									qty: parseInt(e.target.value) || 1
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex justify-end gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setDraftPoOpen(false),
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									disabled: isDraftingPo || !draftPoForm.vendorId || draftPoForm.qty <= 0,
									onClick: async () => {
										setIsDraftingPo(true);
										try {
											await draftPurchaseOrderServerFn({ data: draftPoForm });
											toast.success("Draft PO created successfully!");
											setDraftPoOpen(false);
											router.invalidate();
										} catch (err) {
											toast.error(err.message || "Failed to create Draft PO");
										} finally {
											setIsDraftingPo(false);
										}
									},
									children: isDraftingPo ? "Processing..." : "Create Draft"
								})]
							})
						]
					})]
				})
			})
		]
	});
}
//#endregion
export { InventoryManager as component };
