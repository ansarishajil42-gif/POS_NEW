import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as Button } from "./button-BlBeOJmP.mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as CreditCard, A as Plus, L as Minus, S as Search, T as Scale, a as Wallet, c as UserMinus, i as WifiOff, k as Printer, p as Trash2, r as Wifi, s as User, vt as Banknote, w as ScanBarcode } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, o as TabsTrigger, r as Tabs, t as DemoShell } from "./tabs-BkoyibIH.mjs";
import { t as Switch } from "./switch-BbovR4Kp.mjs";
import { t as aed } from "./demo-data-C-13_S7Y.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as searchPosCustomersFn, d as Route$5, f as checkoutServerFn, g as recordCashDropServerFn, h as openShiftServerFn, m as generateShiftReportFn, p as closeShiftServerFn } from "./router-C5e5vX47.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-BTVuOq31.mjs";
import { t as Input } from "./input-Cexa0DG2.mjs";
import { t as Label } from "./label-CZhEvsKN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pos-till-CHdBKTl9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PosTill() {
	const { session, catalog, promotions, shift, tills } = Route$5.useLoaderData();
	const router = useRouter();
	const [selectedTillId, setSelectedTillId] = (0, import_react.useState)(session?.tillId || "");
	const [customer, setCustomer] = (0, import_react.useState)(null);
	const [customerModalOpen, setCustomerModalOpen] = (0, import_react.useState)(false);
	const [customerSearchTerm, setCustomerSearchTerm] = (0, import_react.useState)("");
	const [customerResults, setCustomerResults] = (0, import_react.useState)([]);
	const [isSearchingCustomer, setIsSearchingCustomer] = (0, import_react.useState)(false);
	const [cart, setCart] = (0, import_react.useState)([]);
	const [search, setSearch] = (0, import_react.useState)("");
	const [online, setOnline] = (0, import_react.useState)(true);
	const [buffered, setBuffered] = (0, import_react.useState)(0);
	const [payOpen, setPayOpen] = (0, import_react.useState)(false);
	const [split, setSplit] = (0, import_react.useState)({
		cash: 0,
		card: 0,
		points: 0,
		credit: 0
	});
	const [selectedTenders, setSelectedTenders] = (0, import_react.useState)({});
	const [openingFloat, setOpeningFloat] = (0, import_react.useState)(500);
	const [cashDropAmount, setCashDropAmount] = (0, import_react.useState)(0);
	const [dropOpen, setDropOpen] = (0, import_react.useState)(false);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [printData, setPrintData] = (0, import_react.useState)(null);
	const [xReportConfirmOpen, setXReportConfirmOpen] = (0, import_react.useState)(false);
	const [zReportConfirmOpen, setZReportConfirmOpen] = (0, import_react.useState)(false);
	const [cashReceivedInput, setCashReceivedInput] = (0, import_react.useState)("");
	const [selectionProduct, setSelectionProduct] = (0, import_react.useState)(null);
	const [selectedVariant, setSelectedVariant] = (0, import_react.useState)(null);
	const [selectedConversion, setSelectedConversion] = (0, import_react.useState)(null);
	const idempotencyKey = (0, import_react.useMemo)(() => {
		return Math.random().toString(36).substring(7) + "-" + Date.now();
	}, [payOpen]);
	(0, import_react.useEffect)(() => {
		if (!printData) return () => {};
		const timer = setTimeout(() => {
			try {
				window.print();
			} catch (err) {
				console.error("Print dialog failed to open:", err);
				toast.error("Failed to open print preview.");
			} finally {
				setPrintData(null);
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [printData]);
	const filtered = (0, import_react.useMemo)(() => catalog.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || (p.alternateBarcodes || []).some((b) => b.includes(search))), [search, catalog]);
	const timeActivePromotions = (0, import_react.useMemo)(() => {
		if (!promotions || promotions.length === 0) return [];
		const now = /* @__PURE__ */ new Date();
		const currentTime = (now.toTimeString().split(" ")[0] || "00:00").slice(0, 5);
		return promotions.filter((promo) => {
			if (promo.status !== "Active") return false;
			const start = new Date(promo.startDate);
			start.setHours(0, 0, 0, 0);
			const end = new Date(promo.endDate);
			end.setHours(23, 59, 59, 999);
			if (now < start || now > end) return false;
			if (promo.startTime && currentTime < promo.startTime) return false;
			if (promo.endTime && currentTime > promo.endTime) return false;
			return true;
		});
	}, [promotions]);
	const getPrice = useCallback((p, qty = 1) => {
		const basePriceRaw = Number(p.priceOverride || p.basePrice || 0);
		const variantAdjustment = p.selectedVariant ? Number(p.selectedVariant.priceAdjustment) : 0;
		const factor = p.conversionFactor ? Number(p.conversionFactor) : 1;
		const basePrice = (basePriceRaw + variantAdjustment) * factor;
		if (timeActivePromotions.length === 0) return basePrice;
		const activePromotions = timeActivePromotions.filter((promo) => {
			if (promo.minQty && qty < promo.minQty) return false;
			if (promo.maxQty && qty > promo.maxQty) return false;
			if (promo.target === "All products") return true;
			if (promo.target.startsWith("Category:")) {
				const catName = promo.target.replace("Category: ", "").trim();
				return p.category?.toLowerCase() === catName.toLowerCase();
			}
			if (promo.target.endsWith("selected products")) return (promo.targetProductIds || "").split(",").filter(Boolean).includes(p.id);
			return false;
		});
		if (activePromotions.length === 0) return basePrice;
		let bestPrice = basePrice;
		activePromotions.forEach((promo) => {
			let finalPrice = basePrice;
			const val = Number(promo.discountValue || 0);
			if (promo.discountType === "percentage") finalPrice = basePrice - basePrice * (val / 100);
			else if (promo.discountType === "fixed") finalPrice = basePrice - val;
			else if (promo.pricingBasis === "Percentage adjustment") finalPrice = basePrice - basePrice * (val / 100);
			else if (promo.pricingBasis === "Fixed amount adjustment") finalPrice = basePrice - val;
			else if (promo.pricingBasis === "Fixed final price") finalPrice = val;
			finalPrice = Math.max(0, finalPrice);
			if (finalPrice < bestPrice) bestPrice = finalPrice;
		});
		return bestPrice;
	}, [timeActivePromotions]);
	const { net, vat, total } = (0, import_react.useMemo)(() => {
		const n = cart.reduce((s, l) => s + getPrice(l, l.qty) * l.qty, 0);
		const v = n * .05;
		return {
			net: n,
			vat: v,
			total: n + v
		};
	}, [cart, getPrice]);
	split.cash + split.card + split.points + split.credit;
	const allocatedTenders = [
		["cash", split.cash],
		["card", split.card],
		["points", split.points],
		["credit", split.credit]
	].filter(([key]) => selectedTenders[key]);
	const allocatedTotal = allocatedTenders.reduce((sum, [, val]) => sum + (val || 0), 0);
	const hasSelectedTender = Object.keys(selectedTenders).some((key) => selectedTenders[key]);
	const allSelectedTendersHavePositiveValue = allocatedTenders.every(([, val]) => val > 0);
	const isAllocationExact = Math.abs(allocatedTotal - total) <= .01;
	const isSettleEnabled = hasSelectedTender && allSelectedTendersHavePositiveValue && isAllocationExact && !isSubmitting;
	const add = (p) => {
		if (p.variants && p.variants.length > 0 || p.conversions && p.conversions.length > 0) {
			setSelectionProduct(p);
			setSelectedVariant(p.variants && p.variants[0] ? p.variants[0] : null);
			setSelectedConversion(null);
			return;
		}
		setCart((prev) => {
			return prev.find((l) => l.id === p.id && !l.selectedVariant && !l.selectedUnit) ? prev.map((l) => l.id === p.id && !l.selectedVariant && !l.selectedUnit ? {
				...l,
				qty: l.qty + 1
			} : l) : [...prev, {
				...p,
				qty: 1
			}];
		});
	};
	const addWithDetails = (p, variant, conversion) => {
		const variantKey = variant ? `${variant.variantName}-${variant.variantValue}` : null;
		const unitKey = conversion ? conversion.fromUnit : null;
		const conversionFactor = conversion ? Number(conversion.conversionFactor) : 1;
		setCart((prev) => {
			const found = prev.find((l) => l.id === p.id && (l.selectedVariant ? `${l.selectedVariant.variantName}-${l.selectedVariant.variantValue}` : null) === variantKey && (l.selectedUnit || null) === unitKey);
			const cartItem = {
				...p,
				selectedVariant: variant,
				selectedUnit: unitKey,
				conversionFactor
			};
			return found ? prev.map((l) => l.id === p.id && (l.selectedVariant ? `${l.selectedVariant.variantName}-${l.selectedVariant.variantValue}` : null) === variantKey && (l.selectedUnit || null) === unitKey ? {
				...l,
				qty: l.qty + 1
			} : l) : [...prev, {
				...cartItem,
				qty: 1
			}];
		});
		setSelectionProduct(null);
		setSelectedVariant(null);
		setSelectedConversion(null);
	};
	const step = (item, d) => {
		const variantKey = item.selectedVariant ? `${item.selectedVariant.variantName}-${item.selectedVariant.variantValue}` : null;
		const unitKey = item.selectedUnit || null;
		setCart((prev) => prev.flatMap((l) => {
			const lVariantKey = l.selectedVariant ? `${l.selectedVariant.variantName}-${l.selectedVariant.variantValue}` : null;
			const lUnitKey = l.selectedUnit || null;
			if (l.id === item.id && lVariantKey === variantKey && lUnitKey === unitKey) return l.qty + d <= 0 ? [] : [{
				...l,
				qty: l.qty + d
			}];
			return [l];
		}));
	};
	const settle = async () => {
		if (split.points > 0 && !customer) {
			toast.error("You must attach a customer to use loyalty points.");
			return;
		}
		if (split.credit > 0 && !customer) {
			toast.error("You must attach a customer to use store credit.");
			return;
		}
		const payments = [];
		if (selectedTenders["cash"] && split.cash > 0) payments.push({
			method: "Cash",
			amount: split.cash
		});
		if (selectedTenders["card"] && split.card > 0) payments.push({
			method: "Card",
			amount: split.card
		});
		if (selectedTenders["points"] && split.points > 0) payments.push({
			method: "Loyalty Points",
			amount: split.points
		});
		if (selectedTenders["credit"] && split.credit > 0) payments.push({
			method: "Store Credit",
			amount: split.credit
		});
		if (!hasSelectedTender || payments.length === 0) {
			toast.error("Select a payment method.");
			return;
		}
		if (Math.abs(allocatedTotal - total) > .01) {
			toast.error("Allocate the full amount before completing payment.");
			return;
		}
		if (isSubmitting) return;
		let cashReceived;
		let changeGiven;
		if (selectedTenders["cash"]) {
			const received = Number(cashReceivedInput) || 0;
			cashReceived = received;
			changeGiven = Math.max(received - split.cash, 0);
		}
		if (online) {
			setIsSubmitting(true);
			try {
				const receiptData = {
					type: "receipt",
					receiptNumber: (await checkoutServerFn({ data: {
						customerId: customer?.id || void 0,
						subtotal: net,
						vat,
						total,
						payments,
						items: cart.map((l) => ({
							productId: l.id,
							qty: l.qty,
							unitPrice: getPrice(l, l.qty)
						})),
						...cashReceived !== void 0 ? { cashReceived } : {},
						...changeGiven !== void 0 ? { changeGiven } : {},
						...idempotencyKey ? { idempotencyKey } : {}
					} })).orderId || "N/A",
					branchName: shift.branch?.name || "Test Branch",
					tillName: shift.till?.name || shift.tillId || "Till Terminal",
					cashierEmail: shift.cashier?.email || "cashier",
					trn: shift.trn || null,
					date: (/* @__PURE__ */ new Date()).toLocaleString(),
					items: cart.map((l) => ({
						name: l.name,
						qty: l.qty,
						unitPrice: getPrice(l, l.qty),
						total: getPrice(l, l.qty) * l.qty
					})),
					subtotal: net,
					vat,
					total,
					payments,
					cashReceived,
					changeGiven
				};
				setPrintData(receiptData);
				toast.success("Sale completed · receipt printed");
				router.invalidate();
			} catch (err) {
				toast.error(err.message || "Failed to process sale");
				setIsSubmitting(false);
				return;
			}
			setIsSubmitting(false);
		} else {
			setBuffered((b) => b + 1);
			toast.success("Sale stored offline · will sync on reconnect");
		}
		setPayOpen(false);
		setCart([]);
		setSplit({
			cash: 0,
			card: 0,
			points: 0,
			credit: 0
		});
		setCashReceivedInput("");
		setSelectedTenders({});
		setCustomer(null);
	};
	const handleSearchCustomer = async (term) => {
		setCustomerSearchTerm(term);
		if (term.length < 2) {
			setCustomerResults([]);
			return;
		}
		setIsSearchingCustomer(true);
		try {
			const res = await searchPosCustomersFn({ data: { term } });
			if (res.success) setCustomerResults(res.customers);
		} catch (e) {
			toast.error(e.message);
		}
		setIsSearchingCustomer(false);
	};
	const handleOpenShift = async () => {
		if (!selectedTillId) {
			toast.error("Please assign a till terminal before opening shift.");
			return;
		}
		setIsSubmitting(true);
		try {
			await openShiftServerFn({ data: {
				openingFloat,
				tillId: selectedTillId
			} });
			toast.success("Shift opened successfully");
			router.invalidate();
		} catch (err) {
			toast.error(err.message);
		}
		setIsSubmitting(false);
	};
	const handleRecordDrop = async () => {
		if (cashDropAmount <= 0) {
			toast.error("Enter a valid amount");
			return;
		}
		setIsSubmitting(true);
		try {
			await recordCashDropServerFn({ data: {
				shiftId: shift.id,
				amount: cashDropAmount,
				reason: "Mid-shift drop"
			} });
			toast.success(`Cash drop of ${aed(cashDropAmount)} recorded`);
			setDropOpen(false);
			setCashDropAmount(0);
			router.invalidate();
		} catch (err) {
			toast.error(err.message);
		}
		setIsSubmitting(false);
	};
	const handlePrintXReport = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			const res = await generateShiftReportFn({ data: { shiftId: shift.id } });
			if (res.success && res.report) {
				setPrintData({
					type: "report",
					reportTitle: "X REPORT (Mid-Shift)",
					...res.report
				});
				toast.success("X report generated and printed successfully.");
			}
		} catch (err) {
			toast.error(err.message || "Failed to generate X report");
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleCloseShift = async () => {
		if (isSubmitting) return;
		if (!confirm("Are you sure you want to close this shift? This cannot be undone.")) return;
		setIsSubmitting(true);
		try {
			const reportRes = await generateShiftReportFn({ data: { shiftId: shift.id } });
			const res = await closeShiftServerFn({ data: {
				shiftId: shift.id,
				actualCash: 0
			} });
			if (reportRes.success && reportRes.report) setPrintData({
				type: "report",
				reportTitle: "Z REPORT (Shift Close)",
				...reportRes.report,
				status: "Closed",
				closedAt: (/* @__PURE__ */ new Date()).toISOString()
			});
			toast.success(`Z report generated · shift closed with variance of ${aed(res.variance)}`);
			setSelectedTillId("");
			router.invalidate();
		} catch (err) {
			toast.error(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};
	if (!shift) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-[80vh] items-center justify-center p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel max-w-md w-full p-8 text-center space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-8 w-8 text-primary" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-bold text-ink",
					children: "Till Closed"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "You must open a shift and declare the opening float to start processing sales."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-left space-y-4 mt-6",
					children: [!session?.tillId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "till-selection",
							children: "Select Till Terminal"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							id: "till-selection",
							value: selectedTillId,
							onChange: (e) => setSelectedTillId(e.target.value),
							className: "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Select a till..."
							}), tills.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: t.id,
								children: [
									t.name,
									" (",
									t.status,
									")"
								]
							}, t.id))]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Opening Float Amount (AED)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							value: openingFloat,
							onChange: (e) => setOpeningFloat(Number(e.target.value))
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: isSubmitting,
					onClick: handleOpenShift,
					className: "w-full text-base py-6 font-bold rounded-xl mt-4",
					children: isSubmitting ? "Opening..." : "Open Shift"
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DemoShell, {
		title: "POS Till Terminal",
		subtitle: `Till ${shift.till?.name || shift.tillId || "01"} · ${shift.branch?.name || "Branch"} · ${shift.cashier?.email?.split("@")[0] || "Cashier"} · Shift opened ${new Date(shift.openedAt).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		})}`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${online ? "border-success/20 bg-success/12 text-success" : "border-warning/30 bg-warning/15 text-warning-foreground"}`,
				children: [online ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "h-3.5 w-3.5" }), online ? "Synced" : `Offline · ${buffered} buffered`]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "net",
					className: "text-xs text-muted-foreground",
					children: "Connection"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					id: "net",
					checked: online,
					onCheckedChange: (v) => {
						setOnline(v);
						if (v && buffered > 0) {
							toast.success(`${buffered} buffered transactions synced`, { description: "Conflicts auto-resolved · inventory re-synced" });
							setBuffered(0);
						}
					}
				})]
			})]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "checkout",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "rounded-xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "checkout",
							children: "Checkout"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "shift",
							children: "Shift & reports"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "checkout",
						className: "mt-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-5 lg:grid-cols-[1fr_360px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative min-w-56 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanBarcode, { className: "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												className: "pl-9",
												placeholder: "Scan barcode or search item…",
												value: search,
												onChange: (e) => setSearch(e.target.value),
												onKeyDown: (e) => {
													if (e.key === "Enter") {
														const match = catalog.find((p) => p.barcode === search || (p.alternateBarcodes || []).includes(search));
														if (match) {
															add(match);
															setSearch("");
															toast.success(`${match.name} added to cart`);
														}
													}
												}
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											className: "rounded-xl",
											onClick: () => toast.success("Scale reading: 1.240 kg · Bananas added"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, { className: "mr-1.5 h-4 w-4" }), " Read scale"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-5 text-xs font-bold tracking-wide text-muted-foreground uppercase",
										children: "Quick keys"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
										children: [filtered.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => add(p),
											className: "group rounded-2xl border border-border bg-surface-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5",
											children: [
												p.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mb-3 h-12 w-12 overflow-hidden rounded-xl bg-surface transition-transform group-hover:scale-105",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: p.image,
														alt: p.name,
														className: "h-full w-full object-cover"
													})
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mb-3 h-10 w-10 rounded-xl bg-primary/12 transition-colors group-hover:bg-primary/20" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-semibold text-ink",
													children: p.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground",
													children: [
														aed(getPrice(p)),
														" / ",
														p.unit
													]
												})
											]
										}, p.id)), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "col-span-full py-10 text-center text-sm text-muted-foreground",
											children: [
												"No item matches \"",
												search,
												"\"."
											]
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel flex h-fit flex-col p-5 lg:sticky lg:top-6 gap-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-border p-4 bg-surface-2/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
												className: "text-sm font-bold text-ink flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" }), " Customer"]
											}), !customer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
												open: customerModalOpen,
												onOpenChange: setCustomerModalOpen,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
													asChild: true,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "outline",
														size: "sm",
														className: "h-7 text-xs rounded-lg",
														children: "Attach"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
													className: "sm:max-w-[425px]",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Attach Customer" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Search by name, email, or phone number." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "py-4 space-y-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "relative",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																placeholder: "Search customers...",
																className: "pl-9",
																value: customerSearchTerm,
																onChange: (e) => handleSearchCustomer(e.target.value)
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "space-y-2 max-h-[300px] overflow-y-auto",
															children: isSearchingCustomer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-center text-sm text-muted-foreground py-4",
																children: "Searching..."
															}) : customerResults.length > 0 ? customerResults.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors",
																onClick: () => {
																	setCustomer(c);
																	setCustomerModalOpen(false);
																},
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "text-sm font-semibold text-ink",
																	children: c.name
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "text-xs text-muted-foreground",
																	children: c.phone || c.email
																})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "text-right",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary",
																		children: c.tier
																	})
																})]
															}, c.id)) : customerSearchTerm.length >= 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-center text-sm text-muted-foreground py-4",
																children: "No customers found."
															}) : null
														})]
													})]
												})]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setCustomer(null),
												className: "text-muted-foreground hover:text-destructive",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserMinus, { className: "h-4 w-4" })
											})]
										}), customer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-semibold",
													children: customer.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary",
													children: customer.tier
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-2 mt-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "bg-surface rounded-lg p-2 border border-border",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] text-muted-foreground uppercase tracking-wider mb-1",
														children: "Points"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs font-bold text-ink",
														children: customer.points
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "bg-surface rounded-lg p-2 border border-border",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] text-muted-foreground uppercase tracking-wider mb-1",
														children: "Credit"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs font-bold text-ink",
														children: aed(customer.storeCredit)
													})]
												})]
											})]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground italic",
											children: "No customer attached to order."
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
													className: "text-sm font-bold text-ink",
													children: [
														"Cart · ",
														cart.length,
														" lines"
													]
												}), cart.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													onClick: () => setCart([]),
													className: "inline-flex items-center gap-1 text-xs font-semibold text-destructive",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" }), " Clear"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 space-y-2",
												children: [cart.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-xl border border-dashed border-border py-10 text-center",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanBarcode, { className: "mx-auto h-6 w-6 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-2 text-xs text-muted-foreground",
														children: "Scan or tap an item to begin"
													})]
												}), cart.map((l, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 rounded-xl bg-surface-2 p-3",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0 flex-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "truncate text-sm font-semibold text-ink",
																children: [
																	l.name,
																	l.selectedVariant ? ` (${l.selectedVariant.variantValue})` : "",
																	l.selectedUnit ? ` (${l.selectedUnit})` : ""
																]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-xs text-muted-foreground",
																children: [aed(getPrice(l)), " · VAT 5%"]
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-1",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																	onClick: () => step(l, -1),
																	className: "grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface",
																	"aria-label": "Decrease",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "h-3.5 w-3.5" })
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "w-6 text-center text-sm font-bold tabular-nums text-ink",
																	children: l.qty
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																	onClick: () => step(l, 1),
																	className: "grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface",
																	"aria-label": "Increase",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3.5 w-3.5" })
																})
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "w-16 text-right text-sm font-bold tabular-nums text-ink",
															children: (getPrice(l) * l.qty).toFixed(2)
														})
													]
												}, idx))]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-5 space-y-1.5 border-t border-border pt-4 text-sm",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between text-muted-foreground",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Net" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "tabular-nums",
															children: aed(net)
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between text-muted-foreground",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VAT 5%" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "tabular-nums",
															children: vat.toFixed(2)
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between pt-2 text-xl font-extrabold text-ink",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "tabular-nums",
															children: aed(total)
														})]
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										className: "mt-5 rounded-xl text-base font-bold",
										disabled: cart.length === 0,
										onClick: () => {
											setSplit({
												cash: Number(total.toFixed(2)),
												card: 0,
												points: 0,
												credit: 0
											});
											setPayOpen(true);
										},
										children: ["Pay ", cart.length > 0 ? aed(total) : ""]
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "shift",
						className: "mt-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-5 lg:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel p-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-bold text-ink",
											children: "Shift control"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-4 space-y-3 text-sm",
											children: [["Opening float", aed(Number(shift.openingFloat))], ["Cash drops (Total)", aed(JSON.parse(shift.cashDrops || "[]").reduce((s, d) => s + d.amount, 0))]].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between rounded-xl bg-surface-2 px-4 py-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted-foreground",
													children: k
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-semibold text-ink",
													children: v
												})]
											}, k))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-5 flex flex-wrap gap-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
												open: dropOpen,
												onOpenChange: setDropOpen,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
													asChild: true,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "outline",
														className: "rounded-xl",
														children: "Record cash drop"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Record Cash Drop" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Move excess cash from the till to the safe." })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "space-y-4 py-4",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (AED)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																type: "number",
																value: cashDropAmount,
																onChange: (e) => setCashDropAmount(Number(e.target.value))
															})]
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "outline",
														onClick: () => setDropOpen(false),
														children: "Cancel"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														disabled: isSubmitting,
														onClick: handleRecordDrop,
														children: isSubmitting ? "Saving..." : "Save Drop"
													})] })
												] })]
											})
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel p-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-bold text-ink",
											children: "X report (mid-shift)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-muted-foreground",
											children: "Non-resetting snapshot · 12:41"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "mt-4 space-y-2 font-mono text-xs text-ink",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "flex justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Transactions" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: shift.stats?.transactions || 0 })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "flex justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Items sold" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: shift.stats?.itemsSold || 0 })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "flex justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Avg basket" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: aed(shift.stats?.avgBasket || 0) })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "flex justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Voids" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: shift.stats?.voids || 0 })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "flex justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Refunds" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: shift.stats?.refunds || 0 })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "flex justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VAT collected" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: aed(shift.stats?.vatCollected || 0) })]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											className: "mt-5 w-full rounded-xl",
											variant: "outline",
											onClick: () => setXReportConfirmOpen(true),
											disabled: isSubmitting,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "mr-1.5 h-4 w-4" }), " Print X report"]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel p-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-bold text-ink",
											children: "Z report (end of day)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-muted-foreground",
											children: "Closes the shift, seals the ledger and posts to head office."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "mt-4 space-y-2 text-sm text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· Drawer reconciliation with variance capture" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· Immutable audit entry for voids and overrides" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· Automatic sync of offline-buffered transactions" })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "mt-5 w-full rounded-xl font-semibold",
											disabled: isSubmitting,
											onClick: () => setZReportConfirmOpen(true),
											children: isSubmitting ? "Closing..." : "Close shift & print Z"
										})
									]
								})
							]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: payOpen,
				onOpenChange: setPayOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Split payment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
							"Allocate ",
							aed(total),
							" across tender types. Allocated: ",
							aed(allocatedTotal)
						] })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3 py-2",
							children: [[
								[
									"cash",
									"Cash",
									Banknote
								],
								[
									"card",
									"Card",
									CreditCard
								],
								[
									"points",
									"Loyalty points",
									Wallet
								],
								[
									"credit",
									"Store credit",
									Wallet
								]
							].map(([key, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 rounded-xl bg-surface-2 p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "rounded border-border text-primary focus:ring-primary h-4 w-4",
											checked: !!selectedTenders[key],
											onChange: (e) => {
												setSelectedTenders({
													...selectedTenders,
													[key]: e.target.checked
												});
												if (!e.target.checked) setSplit({
													...split,
													[key]: 0
												});
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 text-primary" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex-1 text-sm font-medium text-ink",
											children: label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											step: "0.01",
											className: "w-32",
											disabled: !selectedTenders[key],
											value: selectedTenders[key] ? split[key] : "",
											onChange: (e) => setSplit({
												...split,
												[key]: Number(e.target.value)
											})
										})
									]
								}), key === "cash" && selectedTenders["cash"] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "ml-7 grid grid-cols-2 gap-3 rounded-xl border border-dashed border-border p-3 bg-surface-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] font-bold text-muted-foreground uppercase",
											children: "Cash Received"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											step: "0.01",
											placeholder: "e.g. 50",
											value: cashReceivedInput,
											onChange: (e) => setCashReceivedInput(e.target.value)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1 flex flex-col justify-end",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold text-muted-foreground uppercase",
											children: "Change Given"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-bold text-success py-2",
											children: aed(Math.max((Number(cashReceivedInput) || 0) - split.cash, 0))
										})]
									})]
								})]
							}, key)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `rounded-lg px-3 py-2 text-xs font-semibold ${isAllocationExact && hasSelectedTender ? "bg-success/12 text-success" : "bg-warning/15 text-warning-foreground"}`,
								children: !hasSelectedTender || allocatedTotal === 0 ? "Select a payment method." : !isAllocationExact ? "Allocate the full amount before completing payment." : `Balance remaining: ${aed(Math.max(total - allocatedTotal, 0))}`
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "rounded-xl",
							onClick: () => setPayOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "rounded-xl font-semibold",
							disabled: !isSettleEnabled,
							onClick: settle,
							children: isSubmitting ? "Processing..." : "Settle & print"
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: xReportConfirmOpen,
				onOpenChange: setXReportConfirmOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Print X Report?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "This will print the current mid-shift report. The shift will remain open." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "gap-2 sm:gap-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "rounded-xl",
							onClick: () => setXReportConfirmOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "rounded-xl font-semibold",
							disabled: isSubmitting,
							onClick: async () => {
								setXReportConfirmOpen(false);
								await handlePrintXReport();
							},
							children: "Print X Report"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: zReportConfirmOpen,
				onOpenChange: setZReportConfirmOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Close Shift & Print" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Are you sure you want to close this shift? This cannot be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "gap-2 sm:gap-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "rounded-xl",
							onClick: () => setZReportConfirmOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "rounded-xl font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground",
							disabled: isSubmitting,
							onClick: async () => {
								setZReportConfirmOpen(false);
								await handleCloseShift();
							},
							children: "Close Shift & Print"
						})]
					})]
				})
			}),
			printData && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				id: "print-area",
				className: "hidden print:block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { dangerouslySetInnerHTML: { __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #print-area, #print-area * {
                visibility: visible;
              }
              #print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                color: black;
                background: white;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                line-height: 1.4;
              }
            }
          ` } }), printData.type === "receipt" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center border-b border-dashed pb-4 border-black",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-bold uppercase",
									children: printData.branchName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Till: ", printData.tillName] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Cashier: ", printData.cashierEmail] }),
								printData.trn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["TRN: ", printData.trn] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: printData.date }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 font-bold",
									children: ["Transaction: #", printData.receiptNumber.slice(0, 8).toUpperCase()]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-left font-mono",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-dashed border-black",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-1",
										children: "Item"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-1 text-center",
										children: "Qty"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-1 text-right",
										children: "Price"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-1 text-right",
										children: "Total"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: printData.items.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1",
									children: item.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1 text-center",
									children: item.qty
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1 text-right",
									children: Number(item.unitPrice).toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1 text-right",
									children: Number(item.total).toFixed(2)
								})
							] }, idx)) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-dashed pt-2 border-black space-y-1 font-bold",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Subtotal:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.subtotal).toFixed(2), " AED"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-xs font-normal",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VAT (5%):" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.vat).toFixed(2), " AED"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-base border-t border-double pt-1 border-black",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "TOTAL:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.total).toFixed(2), " AED"] })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-dashed pt-2 border-black",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold",
								children: "Payment Allocation:"
							}), printData.payments.map((p, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.method }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(p.amount).toFixed(2), " AED"] })]
							}, idx))]
						}),
						printData.cashReceived !== void 0 && printData.cashReceived !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-dashed pt-2 border-black space-y-1 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Cash Received:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.cashReceived).toFixed(2), " AED"] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between font-bold text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Change Given:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.changeGiven).toFixed(2), " AED"] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center pt-6 font-bold border-t border-dashed border-black",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "THANK YOU FOR YOUR VISIT!" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-normal mt-1",
								children: "cloudynationpos superstore"
							})]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center border-b border-dashed pb-4 border-black",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-bold uppercase",
									children: printData.reportTitle
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Branch: ", printData.branchName] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Till: ", printData.tillName] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Cashier: ", printData.cashierName] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Opened: ", new Date(printData.openedAt).toLocaleString()] }),
								printData.closedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Closed: ", new Date(printData.closedAt).toLocaleString()] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1",
									children: ["Shift ID: #", printData.shiftId.slice(0, 8).toUpperCase()]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold border-b border-black",
									children: "SUMMARY METRICS"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Shift Status:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold uppercase",
										children: printData.status
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Transactions count:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: printData.transactionCount })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Items sold:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: printData.itemsSold })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Average basket:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.avgBasket).toFixed(2), " AED"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VAT collected:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.vatCollected).toFixed(2), " AED"] })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold border-b border-black",
									children: "SALES & DRAWER BREAKDOWN"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Opening Float:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.openingFloat).toFixed(2), " AED"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Cash Sales:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.cashTotal).toFixed(2), " AED"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Card Sales:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.cardTotal).toFixed(2), " AED"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Loyalty Point Sales:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.pointsTotal).toFixed(2), " AED"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Store Credit Sales:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Number(printData.creditTotal).toFixed(2), " AED"] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between border-t border-dashed border-black pt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Sales:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-bold",
										children: [Number(printData.salesTotal).toFixed(2), " AED"]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold border-b border-black",
									children: "LEDGER RECONCILIATION"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Drops (Mid-shift):" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"-",
										Number(printData.totalDrops).toFixed(2),
										" AED"
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Expected Cash in Drawer:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-bold",
										children: [Number(printData.expectedCash).toFixed(2), " AED"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Voids:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: printData.voids })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Refunds:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: printData.refunds })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center pt-6 font-bold border-t border-dashed border-black",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "END OF REPORT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-normal mt-1",
								children: "Audit log printed from POS terminal"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!selectionProduct,
				onOpenChange: (open) => {
					if (!open) setSelectionProduct(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Configure: ", selectionProduct?.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Select product variant and unit size before adding to cart." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4 py-4",
							children: [selectionProduct?.variants && selectionProduct.variants.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-sm font-bold text-ink",
									children: "Select Variant"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 gap-2",
									children: selectionProduct.variants.map((v, idx) => {
										const isSelected = selectedVariant?.variantValue === v.variantValue && selectedVariant?.variantName === v.variantName;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: isSelected ? "default" : "outline",
											className: "rounded-xl justify-between h-auto py-2.5 px-3 flex flex-col items-start gap-1 text-left",
											onClick: () => setSelectedVariant(v),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-semibold uppercase opacity-75",
													children: v.variantName
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-bold",
													children: v.variantValue
												}),
												Number(v.priceAdjustment) !== 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[10px] font-medium mt-1",
													children: [Number(v.priceAdjustment) > 0 ? "+" : "", aed(v.priceAdjustment)]
												})
											]
										}, idx);
									})
								})]
							}), selectionProduct?.conversions && selectionProduct.conversions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2 border-t pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-sm font-bold text-ink",
									children: "Select Unit"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										variant: selectedConversion === null ? "default" : "outline",
										className: "rounded-xl justify-between h-auto py-2.5 px-3 flex flex-col items-start gap-1 text-left",
										onClick: () => setSelectedConversion(null),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] font-semibold uppercase opacity-75",
												children: "Base Unit"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-bold",
												children: selectionProduct.unit
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] font-medium mt-1",
												children: "Base Price"
											})
										]
									}), selectionProduct.conversions.map((c, idx) => {
										const isSelected = selectedConversion?.fromUnit === c.fromUnit;
										const factor = Number(c.conversionFactor || 1);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: isSelected ? "default" : "outline",
											className: "rounded-xl justify-between h-auto py-2.5 px-3 flex flex-col items-start gap-1 text-left",
											onClick: () => setSelectedConversion(c),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[10px] font-semibold uppercase opacity-75",
													children: [
														"Alt Unit (x",
														c.conversionFactor,
														")"
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-bold",
													children: c.fromUnit
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-medium mt-1",
													children: aed(Number(selectionProduct.priceOverride || selectionProduct.basePrice || 0) * factor)
												})
											]
										}, idx);
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "rounded-xl",
							onClick: () => {
								setSelectionProduct(null);
								setSelectedVariant(null);
								setSelectedConversion(null);
							},
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "rounded-xl",
							onClick: () => {
								if (selectionProduct) addWithDetails(selectionProduct, selectedVariant, selectedConversion);
							},
							children: "Add to Cart"
						})] })
					]
				})
			})
		]
	});
}
//#endregion
export { PosTill as component };
