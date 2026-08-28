import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as Button } from "./button-BlBeOJmP.mjs";
import { y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as Package, I as Monitor, O as Receipt, Q as Download, R as Menu, S as Search, at as CircleCheck, bt as Ban, d as TriangleAlert, f as TrendingUp, h as Tag, rt as Clock } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, n as StatCard, o as TabsTrigger, r as Tabs, t as DemoShell } from "./tabs-Cf1Xb3Zq.mjs";
import { n as aedShort, t as aed } from "./demo-data-C-13_S7Y.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as adjustStockFn, c as createRosterShiftFn, d as exportZReportFn, f as getStockAdjustmentHistoryFn, i as Route$2, l as createTillFn, m as resetCashierPinByManagerFn, o as closeShiftFn, p as recordCashDropFn, s as createOverrideRequestFn, u as deleteRosterShiftFn } from "./router-rvz4Z79w.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BTVuOq31.mjs";
import { t as Input } from "./input-Cexa0DG2.mjs";
import { t as Label } from "./label-CZhEvsKN.mjs";
import { c as ResponsiveContainer, i as XAxis, l as Tooltip, n as BarChart, o as CartesianGrid, r as YAxis, s as Bar } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-manager-Bl6x9wag.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StoreManager() {
	const data = Route$2.useLoaderData();
	const router = useRouter();
	const [search, setSearch] = (0, import_react.useState)("");
	const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, import_react.useState)(false);
	const [selectedCategory, setSelectedCategory] = (0, import_react.useState)("All Categories");
	const [isCategoryOpen, setIsCategoryOpen] = (0, import_react.useState)(false);
	const dropdownRef = (0, import_react.useRef)(null);
	const [overrideModalOpen, setOverrideModalOpen] = (0, import_react.useState)(false);
	const [selectedProductId, setSelectedProductId] = (0, import_react.useState)("");
	const [requestedPrice, setRequestedPrice] = (0, import_react.useState)("");
	const [overrideReason, setOverrideReason] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [validationErrors, setValidationErrors] = (0, import_react.useState)({});
	const [errorMsg, setErrorMsg] = (0, import_react.useState)("");
	const [rosterModalOpen, setRosterModalOpen] = (0, import_react.useState)(false);
	const [selectedCashierId, setSelectedCashierId] = (0, import_react.useState)("");
	const [selectedTillId, setSelectedTillId] = (0, import_react.useState)("");
	const [shiftDate, setShiftDate] = (0, import_react.useState)("2026-08-21");
	const [shiftStartTime, setShiftStartTime] = (0, import_react.useState)("09:00");
	const [shiftEndTime, setShiftEndTime] = (0, import_react.useState)("17:00");
	const [shiftNotes, setShiftNotes] = (0, import_react.useState)("");
	const [isRosterSubmitting, setIsRosterSubmitting] = (0, import_react.useState)(false);
	const [rosterValidationErrors, setRosterValidationErrors] = (0, import_react.useState)({});
	const [rosterErrorMsg, setRosterErrorMsg] = (0, import_react.useState)("");
	const [tillModalOpen, setTillModalOpen] = (0, import_react.useState)(false);
	const [tillName, setTillName] = (0, import_react.useState)("");
	const [tillDescription, setTillDescription] = (0, import_react.useState)("");
	const [tillOpeningFloat, setTillOpeningFloat] = (0, import_react.useState)("0.00");
	const [isTillSubmitting, setIsTillSubmitting] = (0, import_react.useState)(false);
	const [tillValidationErrors, setTillValidationErrors] = (0, import_react.useState)({});
	const [tillErrorMsg, setTillErrorMsg] = (0, import_react.useState)("");
	const [resetModalOpen, setResetModalOpen] = (0, import_react.useState)(false);
	const [resetTargetId, setResetTargetId] = (0, import_react.useState)("");
	const [resetTargetName, setResetTargetName] = (0, import_react.useState)("");
	const [newPin, setNewPin] = (0, import_react.useState)("");
	const [confirmPin, setConfirmPin] = (0, import_react.useState)("");
	const [isResetSubmitting, setIsResetSubmitting] = (0, import_react.useState)(false);
	const [resetErrorMsg, setResetErrorMsg] = (0, import_react.useState)("");
	const [adjustStockModalOpen, setAdjustStockModalOpen] = (0, import_react.useState)(false);
	const [adjustProductId, setAdjustProductId] = (0, import_react.useState)("");
	const [adjustQuantity, setAdjustQuantity] = (0, import_react.useState)("");
	const [adjustReason, setAdjustReason] = (0, import_react.useState)("Correction");
	const [adjustNote, setAdjustNote] = (0, import_react.useState)("");
	const [isAdjusting, setIsAdjusting] = (0, import_react.useState)(false);
	const [historyModalOpen, setHistoryModalOpen] = (0, import_react.useState)(false);
	const [historyProductId, setHistoryProductId] = (0, import_react.useState)("");
	const [historyData, setHistoryData] = (0, import_react.useState)([]);
	const [isHistoryLoading, setIsHistoryLoading] = (0, import_react.useState)(false);
	const [cashDropModalOpen, setCashDropModalOpen] = (0, import_react.useState)(false);
	const [dropShiftId, setDropShiftId] = (0, import_react.useState)("");
	const [dropAmount, setDropAmount] = (0, import_react.useState)("");
	const [dropNote, setDropNote] = (0, import_react.useState)("");
	const [isDropping, setIsDropping] = (0, import_react.useState)(false);
	const [closeShiftModalOpen, setCloseShiftModalOpen] = (0, import_react.useState)(false);
	const [closeShiftId, setCloseShiftId] = (0, import_react.useState)("");
	const [closeActualCash, setCloseActualCash] = (0, import_react.useState)("");
	const [isClosingShift, setIsClosingShift] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsCategoryOpen(false);
		};
		const handleKeyDown = (event) => {
			if (event.key === "Escape") setIsCategoryOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);
	const categoriesList = (0, import_react.useMemo)(() => {
		if (!data || !data.stock) return [];
		const cats = (data.stock || []).map((s) => s.category).filter(Boolean);
		return Array.from(new Set(cats));
	}, [data]);
	const filteredStock = (0, import_react.useMemo)(() => {
		if (!data || !data.stock) return [];
		return (data.stock || []).filter((p) => {
			if (selectedCategory !== "All Categories" && p.category !== selectedCategory) return false;
			if (search.trim() !== "") {
				const s = search.toLowerCase().trim();
				const nameMatch = p.productName?.toLowerCase().includes(s);
				const skuMatch = p.sku?.toLowerCase().includes(s);
				const barcodeMatch = p.barcode?.toLowerCase().includes(s);
				return nameMatch || skuMatch || barcodeMatch;
			}
			return true;
		});
	}, [
		data,
		selectedCategory,
		search
	]);
	const selectedProduct = (0, import_react.useMemo)(() => {
		if (!data || !data.stock || !selectedProductId) return null;
		return (data.stock || []).find((s) => s.productId === selectedProductId) || null;
	}, [data, selectedProductId]);
	const tillsList = (0, import_react.useMemo)(() => {
		if (!data || !data.tills) return [];
		return (data.tills || []).map((t) => ({
			id: t.id,
			name: t.name
		}));
	}, [data]);
	const eligibleStaff = (0, import_react.useMemo)(() => {
		if (!data || !data.staff) return [];
		return (data.staff || []).filter((st) => {
			if (st.isActive === false) return false;
			return st.role === "cashier";
		});
	}, [data]);
	const formatRoleName = (role) => {
		switch (role) {
			case "cashier": return "Cashier";
			case "branch_manager": return "Branch Manager";
			case "inventory_manager": return "Inventory Manager";
			case "purchasing_officer": return "Purchasing Officer";
			case "head_office_admin": return "Head Office Admin";
			case "super_admin": return "Super Admin";
			default: return role;
		}
	};
	const permissions = data.permissions || [];
	const isPermEnabled = (key) => {
		const record = permissions.find((p) => p.permission === key);
		return record ? record.enabled : true;
	};
	const handleRequestSubmit = async (e) => {
		e.preventDefault();
		const errors = {};
		if (!selectedProductId) errors["productId"] = "Product is required.";
		if (!requestedPrice) errors["requestedPrice"] = "Requested price is required.";
		else {
			const p = Number(requestedPrice);
			if (isNaN(p)) errors["requestedPrice"] = "Requested price must be a valid number.";
			else if (p < 0) errors["requestedPrice"] = "Requested price must not be negative.";
		}
		if (!overrideReason.trim()) errors["reason"] = "Reason for override is required.";
		if (Object.keys(errors).length > 0) {
			setValidationErrors(errors);
			return;
		}
		setValidationErrors({});
		setIsSubmitting(true);
		setErrorMsg("");
		try {
			if ((await createOverrideRequestFn({ data: {
				productId: selectedProductId,
				requestedPrice,
				reason: overrideReason
			} })).success) {
				toast.success("Price override request submitted successfully!");
				setOverrideModalOpen(false);
				setSelectedProductId("");
				setRequestedPrice("");
				setOverrideReason("");
				router.invalidate();
			}
		} catch (err) {
			setErrorMsg(err.message || "Failed to submit request.");
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleRosterSubmit = async (e) => {
		e.preventDefault();
		const errors = {};
		if (!selectedCashierId) errors["cashierId"] = "Staff/Cashier is required.";
		if (!selectedTillId) errors["tillId"] = "Till assignment is required.";
		if (!shiftDate) errors["shiftDate"] = "Shift date is required.";
		if (!shiftStartTime) errors["startTime"] = "Start time is required.";
		if (!shiftEndTime) errors["endTime"] = "End time is required.";
		else if (shiftStartTime && shiftEndTime < shiftStartTime) errors["endTime"] = "End time cannot be earlier than start time.";
		if (Object.keys(errors).length > 0) {
			setRosterValidationErrors(errors);
			return;
		}
		setRosterValidationErrors({});
		setIsRosterSubmitting(true);
		setRosterErrorMsg("");
		try {
			if ((await createRosterShiftFn({ data: {
				cashierId: selectedCashierId,
				tillId: selectedTillId,
				shiftDate,
				startTime: shiftStartTime,
				endTime: shiftEndTime,
				notes: shiftNotes
			} })).success) {
				toast.success("Roster shift scheduled successfully!");
				setRosterModalOpen(false);
				setSelectedCashierId("");
				setSelectedTillId("");
				setShiftNotes("");
				router.invalidate();
			}
		} catch (err) {
			setRosterErrorMsg(err.message || "Failed to save roster.");
		} finally {
			setIsRosterSubmitting(false);
		}
	};
	const handleDeleteRoster = async (shiftId) => {
		if (!confirm("Are you sure you want to cancel this shift?")) return;
		try {
			if ((await deleteRosterShiftFn({ data: { shiftId } })).success) {
				toast.success("Shift cancelled successfully.");
				router.invalidate();
			}
		} catch (err) {
			toast.error(err.message || "Failed to cancel shift.");
		}
	};
	const handleTillSubmit = async (e) => {
		e.preventDefault();
		const errors = {};
		if (!tillName.trim()) errors["name"] = "Till name or number is required.";
		const floatVal = Number(tillOpeningFloat || "0.00");
		if (isNaN(floatVal) || floatVal < 0) errors["openingFloat"] = "Opening float must be a non-negative number.";
		if (Object.keys(errors).length > 0) {
			setTillValidationErrors(errors);
			return;
		}
		setTillValidationErrors({});
		setIsTillSubmitting(true);
		setTillErrorMsg("");
		try {
			if ((await createTillFn({ data: {
				name: tillName,
				description: tillDescription,
				openingFloat: tillOpeningFloat
			} })).success) {
				toast.success("Till created successfully!");
				setTillModalOpen(false);
				setTillName("");
				setTillDescription("");
				setTillOpeningFloat("0.00");
				router.invalidate();
			}
		} catch (err) {
			setTillErrorMsg(err.message || "Failed to create till.");
		} finally {
			setIsTillSubmitting(false);
		}
	};
	const handleManagerResetSubmit = async (e) => {
		e.preventDefault();
		if (!newPin || !confirmPin) {
			setResetErrorMsg("Please enter new PIN and confirm it.");
			return;
		}
		if (newPin !== confirmPin) {
			setResetErrorMsg("PIN and confirmation PIN do not match.");
			return;
		}
		if (!/^\d{4}$/.test(newPin)) {
			setResetErrorMsg("PIN must be exactly 4 digits.");
			return;
		}
		setIsResetSubmitting(true);
		setResetErrorMsg("");
		try {
			if ((await resetCashierPinByManagerFn({ data: {
				cashierId: resetTargetId,
				newPin,
				confirmPin
			} })).success) {
				toast.success("Cashier PIN reset successfully!");
				setResetModalOpen(false);
				setNewPin("");
				setConfirmPin("");
				setResetTargetId("");
				setResetTargetName("");
				router.invalidate();
			}
		} catch (err) {
			setResetErrorMsg(err.message || "Failed to reset Cashier PIN.");
		} finally {
			setIsResetSubmitting(false);
		}
	};
	const handleExportZReport = async () => {
		try {
			const res = await exportZReportFn();
			if (res.success && res.csvContent) {
				const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.setAttribute("download", `Z-Report-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				toast.success("Z-Report exported successfully!");
			}
		} catch (err) {
			toast.error(err.message || "Failed to export Z-Report.");
		}
	};
	const handleAdjustStockSubmit = async (e) => {
		e.preventDefault();
		const qty = Number(adjustQuantity);
		if (!adjustQuantity || isNaN(qty)) {
			toast.error("Please enter a valid quantity change.");
			return;
		}
		setIsAdjusting(true);
		try {
			if ((await adjustStockFn({ data: {
				productId: adjustProductId,
				quantityChange: qty,
				reason: adjustReason,
				note: adjustNote
			} })).success) {
				toast.success("Stock adjusted successfully!");
				setAdjustStockModalOpen(false);
				setAdjustQuantity("");
				setAdjustNote("");
				router.invalidate();
			}
		} catch (err) {
			toast.error(err.message || "Failed to adjust stock.");
		} finally {
			setIsAdjusting(false);
		}
	};
	const handleCashDropSubmit = async (e) => {
		e.preventDefault();
		const amt = Number(dropAmount);
		if (!dropAmount || isNaN(amt) || amt <= 0) {
			toast.error("Please enter a valid drop amount.");
			return;
		}
		setIsDropping(true);
		try {
			if ((await recordCashDropFn({ data: {
				shiftId: dropShiftId,
				amount: amt,
				note: dropNote
			} })).success) {
				toast.success("Cash drop recorded successfully!");
				setCashDropModalOpen(false);
				setDropAmount("");
				setDropNote("");
				router.invalidate();
			}
		} catch (err) {
			toast.error(err.message || "Failed to record cash drop.");
		} finally {
			setIsDropping(false);
		}
	};
	const handleCloseShiftSubmit = async (e) => {
		e.preventDefault();
		const amt = Number(closeActualCash);
		if (!closeActualCash || isNaN(amt) || amt < 0) {
			toast.error("Please enter a valid actual cash amount.");
			return;
		}
		setIsClosingShift(true);
		try {
			if ((await closeShiftFn({ data: {
				shiftId: closeShiftId,
				actualCash: amt
			} })).success) {
				toast.success("Shift closed successfully!");
				setCloseShiftModalOpen(false);
				setCloseActualCash("");
				router.invalidate();
			}
		} catch (err) {
			toast.error(err.message || "Failed to close shift.");
		} finally {
			setIsClosingShift(false);
		}
	};
	if (data.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-red-500 font-bold text-xl",
			children: "Backend API Error"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "mt-4 p-4 bg-red-50 text-red-900 rounded whitespace-pre-wrap",
			children: data.error
		})]
	});
	try {
		const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
		const todayOrders = data.orders.filter((o) => new Date(o.createdAt).toISOString().split("T")[0] === today);
		const salesToday = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
		const transactions = todayOrders.length;
		const avgBasket = transactions > 0 ? (salesToday / transactions).toFixed(2) : "0.00";
		const itemCounts = {};
		todayOrders.forEach((o) => {
			(o.items || []).forEach((i) => {
				if (!itemCounts[i.productId]) itemCounts[i.productId] = {
					name: i.product?.name || "Unknown",
					qty: 0,
					value: 0
				};
				itemCounts[i.productId].qty += Number(i.qty) || 0;
				itemCounts[i.productId].value += (Number(i.unitPrice) || 0) * (Number(i.qty) || 0);
			});
		});
		const topItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 4);
		const lowStock = data.stock.filter((s) => s.stock < 20).length;
		const activeTills = data.shifts.filter((s) => s.status === "Active" || s.status === "Open").length;
		const totalTills = data.tills ? data.tills.length : data.branch?.tillCount || 1;
		const yesterday = /* @__PURE__ */ new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const salesYesterday = data.orders.filter((o) => new Date(o.createdAt).toDateString() === yesterday.toDateString()).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
		const salesGrowth = salesYesterday > 0 ? ((salesToday - salesYesterday) / salesYesterday * 100).toFixed(1) : 0;
		const growthText = salesYesterday > 0 ? `${Number(salesGrowth) >= 0 ? "+" : ""}${salesGrowth}% vs yesterday` : void 0;
		const localTrend = [];
		for (let i = 6; i >= 0; i--) {
			const date = /* @__PURE__ */ new Date();
			date.setDate(date.getDate() - i);
			const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
			const daySales = data.orders.filter((o) => new Date(o.createdAt).toDateString() === date.toDateString()).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
			localTrend.push({
				d: dayName,
				Sales: daySales
			});
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoShell, {
			title: "Store Dashboard",
			subtitle: `${data.branch?.name || "Branch"} · Manager View`,
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "rounded-xl font-semibold",
				onClick: handleExportZReport,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-4 w-4" }), " Export Z-Report"]
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "dashboard",
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
									value: "dashboard",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Dashboard"
								}),
								isPermEnabled("local_stock") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "stock",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Local Stock"
								}),
								isPermEnabled("pricing_adjustments") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "pricing",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Pricing Adjustments"
								}),
								isPermEnabled("shift_staff") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "staff",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Shift & Staff"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "dashboard",
								className: "mt-0 space-y-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Sales today",
											value: aedShort(salesToday),
											icon: TrendingUp,
											tone: "success",
											...growthText ? { delta: growthText } : {}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Transactions",
											value: transactions.toLocaleString(),
											delta: `Avg basket: ${avgBasket}`,
											icon: Receipt
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Low stock items",
											value: lowStock,
											icon: TriangleAlert,
											tone: "accent"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Active tills",
											value: `${activeTills} / ${totalTills}`,
											icon: Monitor
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 lg:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel p-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-bold text-ink",
											children: "Branch Performance (Last 7 Days) · AED 000s"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-4 h-64",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
												width: "100%",
												height: "100%",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
													data: localTrend,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
															strokeDasharray: "3 3",
															stroke: "var(--border)",
															vertical: false
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
															dataKey: "d",
															tickLine: false,
															axisLine: false,
															fontSize: 12
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
															tickLine: false,
															axisLine: false,
															fontSize: 12,
															width: 36
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { cursor: { fill: "var(--surface-2)" } }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
															dataKey: "Sales",
															fill: "#39ff14",
															radius: [
																6,
																6,
																0,
																0
															]
														})
													]
												})
											})
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel p-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-bold text-ink",
											children: "Top Selling Items Today"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 space-y-4",
											children: [topItems.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: "No sales yet today."
											}), topItems.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-semibold text-ink",
													children: item.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground",
													children: [item.qty, " units sold"]
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-right text-sm font-bold text-ink",
													children: aed(item.value)
												})]
											}, i))]
										})]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "stock",
								className: "mt-0",
								children: [
									!isPermEnabled("local_stock") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel p-8 text-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-bold text-red-500",
											children: "Access Denied"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground mt-2",
											children: "You do not have permission to view local stock."
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel overflow-hidden p-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative w-72",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "Scan barcode or search SKU...",
													className: "pl-9 h-10 rounded-xl text-sm bg-surface-2 border-transparent focus:border-primary",
													value: search,
													onChange: (e) => setSearch(e.target.value)
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												ref: dropdownRef,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													variant: "outline",
													className: "h-10 rounded-xl flex items-center gap-2",
													onClick: () => setIsCategoryOpen(!isCategoryOpen),
													"aria-haspopup": "listbox",
													"aria-expanded": isCategoryOpen,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: selectedCategory === "All Categories" ? "Filter by Category" : `Category: ${selectedCategory}` })]
												}), isCategoryOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "max-h-60 overflow-y-auto space-y-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															role: "option",
															"aria-selected": selectedCategory === "All Categories",
															className: `w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${selectedCategory === "All Categories" ? "bg-primary/10 text-primary" : "text-ink hover:bg-surface-2"}`,
															onClick: () => {
																setSelectedCategory("All Categories");
																setIsCategoryOpen(false);
															},
															children: "All Categories"
														}), categoriesList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-muted-foreground text-center py-2",
															children: "No categories available"
														}) : categoriesList.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															role: "option",
															"aria-selected": selectedCategory === cat,
															className: `w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${selectedCategory === cat ? "bg-primary/10 text-primary" : "text-ink hover:bg-surface-2"}`,
															onClick: () => {
																setSelectedCategory(cat);
																setIsCategoryOpen(false);
															},
															children: cat
														}, cat))]
													})
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex flex-col gap-3 mt-4 overflow-x-auto pb-2",
											children: filteredStock.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-center py-10 rounded-2xl border border-dashed border-border bg-surface-2/45",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mx-auto h-8 w-8 text-muted-foreground animate-bounce mb-2" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm font-semibold text-ink",
														children: "No products found"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground mt-1",
														children: "Try adjusting your filters or search query."
													})
												]
											}) : filteredStock.map((p, i) => {
												const localQty = p.stock;
												const isLow = localQty < 20;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "group flex min-w-[600px] items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 animate-in fade-in slide-in-from-bottom-4",
													style: {
														animationFillMode: "both",
														animationDelay: `${i * 50}ms`
													},
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${isLow ? "bg-accent/10 text-accent group-hover:bg-accent/20" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-6 w-6" })
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
															className: "text-base font-bold text-ink transition-colors group-hover:text-primary",
															children: p.productName
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "mt-1 flex items-center gap-3 text-xs font-medium text-muted-foreground",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "flex items-center gap-1",
																	children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-3 w-3" }),
																		" ",
																		p.category
																	]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1 w-1 rounded-full bg-border" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["SKU: ", p.sku] })
															]
														})] })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-8 text-right",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1",
															children: "In Stock"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: `text-lg font-extrabold ${isLow ? "text-accent" : "text-ink"}`,
															children: [
																localQty,
																" ",
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-sm font-semibold text-muted-foreground",
																	children: p.unit
																})
															]
														})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-3 ml-4",
															children: [
																isLow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent shadow-sm ring-1 ring-inset ring-accent/20 shrink-0",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3.5 w-3.5" }), " Low"]
																}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-bold text-success shadow-sm ring-1 ring-inset ring-success/20 shrink-0",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5" }), " Healthy"]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	variant: "ghost",
																	size: "icon",
																	className: "h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-primary",
																	onClick: async () => {
																		setHistoryProductId(p.productId);
																		setHistoryModalOpen(true);
																		setIsHistoryLoading(true);
																		try {
																			const hist = await getStockAdjustmentHistoryFn({ data: { productId: p.productId } });
																			setHistoryData(hist || []);
																		} catch (err) {
																			toast.error(err.message || "Failed to load history");
																		} finally {
																			setIsHistoryLoading(false);
																		}
																	},
																	title: "View History",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4" })
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	variant: "outline",
																	size: "sm",
																	className: "h-8 rounded-full px-4 text-xs font-semibold shrink-0 bg-surface hover:bg-surface-2 transition-colors border-border/50",
																	onClick: () => {
																		setAdjustProductId(p.productId);
																		setAdjustStockModalOpen(true);
																	},
																	children: "Adjust"
																})
															]
														})]
													})]
												}, p.id);
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
										open: historyModalOpen,
										onOpenChange: setHistoryModalOpen,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
											className: "sm:max-w-xl w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Stock Adjustment History" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Past adjustments for this product." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "py-4",
												children: isHistoryLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex justify-center p-8",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-8 animate-spin rounded-full border-b-2 border-primary" })
												}) : historyData.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-center text-sm text-muted-foreground p-8",
													children: "No adjustments found."
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "space-y-4",
													children: historyData.map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex flex-col gap-1 p-3 rounded-lg border border-border/50 bg-surface-2/50 text-sm",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex justify-between font-semibold",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(h.createdAt).toLocaleString() }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: h.quantityChange > 0 ? "text-success" : "text-accent",
																	children: [h.quantityChange > 0 ? "+" : "", h.quantityChange]
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "text-muted-foreground",
																children: ["Reason: ", h.reason]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "text-xs text-muted-foreground",
																children: ["By: ", h.adjustedByName || "Unknown"]
															})
														]
													}, i))
												})
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
										open: adjustStockModalOpen,
										onOpenChange: (open) => {
											if (!isAdjusting) {
												setAdjustStockModalOpen(open);
												if (!open) {
													setAdjustQuantity("");
													setAdjustReason("Correction");
													setAdjustNote("");
												}
											}
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
											className: "sm:max-w-md w-[95vw] sm:w-full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Adjust Stock" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Manually adjust the stock quantity for the selected product." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
												onSubmit: handleAdjustStockSubmit,
												className: "space-y-4 py-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "adj-qty",
															children: "Quantity Change (+/-)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "adj-qty",
															type: "number",
															placeholder: "e.g. -5 or 10",
															value: adjustQuantity,
															onChange: (e) => setAdjustQuantity(e.target.value),
															required: true
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "adj-reason",
															children: "Reason"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
															id: "adj-reason",
															className: "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
															value: adjustReason,
															onChange: (e) => setAdjustReason(e.target.value),
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																	value: "Correction",
																	children: "Correction"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																	value: "Wastage",
																	children: "Wastage"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																	value: "Damage",
																	children: "Damage"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																	value: "Other",
																	children: "Other"
																})
															]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "adj-note",
															children: "Note (Optional)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "adj-note",
															type: "text",
															placeholder: "e.g. Found extra items in warehouse",
															value: adjustNote,
															onChange: (e) => setAdjustNote(e.target.value)
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
														className: "flex justify-end gap-2 mt-6",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															type: "button",
															variant: "outline",
															onClick: () => setAdjustStockModalOpen(false),
															disabled: isAdjusting,
															children: "Cancel"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															type: "submit",
															disabled: isAdjusting,
															children: isAdjusting ? "Saving..." : "Save Adjustment"
														})]
													})
												]
											})]
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "pricing",
								className: "mt-0 space-y-5",
								children: !isPermEnabled("pricing_adjustments") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel p-8 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-lg font-bold text-red-500",
										children: "Access Denied"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground mt-2",
										children: "You do not have permission to view pricing adjustments."
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-bold text-ink",
											children: "Local Pricing Adjustments"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: "Request branch-specific price overrides for clearance or local competition."
										})] }), isPermEnabled("branch_override") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											onClick: () => setOverrideModalOpen(true),
											children: "Request Override"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											disabled: true,
											className: "opacity-50 cursor-not-allowed",
											children: "Override Disabled"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "panel overflow-hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
											className: "w-full text-left text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
												className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Item"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Standard Price"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Requested Price"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Reason"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Date"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium text-right",
														children: "Status"
													})
												] })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
												className: "divide-y divide-border",
												children: [(!data.requests || data.requests.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													colSpan: 6,
													className: "px-4 py-4 text-center text-muted-foreground",
													children: "No active price overrides or requests found."
												}) }), (data.requests || []).map((req) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
													className: "hover:bg-surface-2/50 transition-colors",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 font-semibold text-ink",
															children: req.product?.name || "Unknown Product"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 text-muted-foreground",
															children: aed(Number(req.standardPrice))
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 font-bold text-ink",
															children: aed(Number(req.requestedPrice))
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 text-muted-foreground truncate max-w-xs",
															children: req.reason
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 text-xs text-muted-foreground",
															children: new Date(req.createdAt).toLocaleDateString("en-US", {
																month: "short",
																day: "numeric",
																year: "numeric"
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 text-right",
															children: req.status === "Approved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success animate-in fade-in",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3" }), " Approved"]
															}) : req.status === "Rejected" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 animate-in fade-in",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "h-3 w-3" }), " Rejected"]
															}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-700 animate-in fade-in",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), " Pending"]
															})
														})
													]
												}, req.id))]
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
										open: overrideModalOpen,
										onOpenChange: (open) => {
											if (!isSubmitting) {
												setOverrideModalOpen(open);
												if (!open) {
													setSelectedProductId("");
													setRequestedPrice("");
													setOverrideReason("");
													setValidationErrors({});
													setErrorMsg("");
												}
											}
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
											className: "sm:max-w-md w-[95vw] sm:w-full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Request Price Override" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Submit a branch-specific price override request for manager review." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
												onSubmit: handleRequestSubmit,
												className: "space-y-4 py-2",
												children: [
													errorMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 animate-in fade-in",
														children: errorMsg
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																htmlFor: "product-select",
																children: "Product"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
																id: "product-select",
																value: selectedProductId,
																onChange: (e) => {
																	setSelectedProductId(e.target.value);
																	setValidationErrors((prev) => ({
																		...prev,
																		productId: ""
																	}));
																},
																className: "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																	value: "",
																	children: "Select a product..."
																}), (data.stock || []).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
																	value: s.productId,
																	children: [
																		s.productName,
																		" (SKU: ",
																		s.sku,
																		") · Stock: ",
																		s.stock
																	]
																}, s.productId))]
															}),
															validationErrors["productId"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-xs font-medium text-red-500",
																children: validationErrors["productId"]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																htmlFor: "standard-price",
																children: "Standard Price (AED)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "standard-price",
																readOnly: true,
																disabled: true,
																value: selectedProduct ? Number(selectedProduct.basePrice).toFixed(2) : "0.00",
																className: "bg-surface-2 cursor-not-allowed text-muted-foreground font-semibold"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	htmlFor: "requested-price",
																	children: "Requested Price (AED)"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	id: "requested-price",
																	type: "text",
																	placeholder: "e.g. 15.00",
																	value: requestedPrice,
																	onChange: (e) => {
																		setRequestedPrice(e.target.value);
																		setValidationErrors((prev) => ({
																			...prev,
																			requestedPrice: ""
																		}));
																	},
																	className: validationErrors["requestedPrice"] ? "border-red-500" : ""
																}),
																validationErrors["requestedPrice"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "text-xs font-medium text-red-500",
																	children: validationErrors["requestedPrice"]
																})
															]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																htmlFor: "override-reason",
																children: "Reason for Override"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "override-reason",
																type: "text",
																placeholder: "e.g. Near-expiry clearance / competitor price match",
																value: overrideReason,
																onChange: (e) => {
																	setOverrideReason(e.target.value);
																	setValidationErrors((prev) => ({
																		...prev,
																		reason: ""
																	}));
																},
																className: validationErrors["reason"] ? "border-red-500" : ""
															}),
															validationErrors["reason"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-xs font-medium text-red-500",
																children: validationErrors["reason"]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
														className: "flex justify-end gap-2 mt-6",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															type: "button",
															variant: "outline",
															onClick: () => {
																setOverrideModalOpen(false);
																setSelectedProductId("");
																setRequestedPrice("");
																setOverrideReason("");
																setValidationErrors({});
																setErrorMsg("");
															},
															disabled: isSubmitting,
															children: "Cancel"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															type: "submit",
															disabled: isSubmitting,
															children: isSubmitting ? "Submitting..." : "Submit Request"
														})]
													})
												]
											})]
										})
									})
								] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "staff",
								className: "mt-0",
								children: !isPermEnabled("shift_staff") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel p-8 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-lg font-bold text-red-500",
										children: "Access Denied"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground mt-2",
										children: "You do not have permission to view shift and staff roster."
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel overflow-hidden",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between border-b border-border p-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "font-bold text-ink",
													children: "Today's Shifts"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													size: "sm",
													onClick: () => setRosterModalOpen(true),
													children: "Manage Roster"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
												className: "w-full text-left text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
													className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium",
															children: "Cashier"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium",
															children: "Till Assignment"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium",
															children: "Shift Date/Time"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium",
															children: "Status"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium text-right",
															children: "Actions"
														})
													] })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
													className: "divide-y divide-border",
													children: [(!data.shifts || data.shifts.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														colSpan: 5,
														className: "px-4 py-4 text-center text-muted-foreground",
														children: "No shifts found for today."
													}) }), (data.shifts || []).map((shift) => {
														const staffName = shift.cashier?.name || shift.cashier?.email?.split("@")[0] || "Unknown";
														const isCompleted = !!shift.closedAt;
														return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
															className: "hover:bg-surface-2/50 transition-colors",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																	className: "px-4 py-3 font-semibold text-ink flex items-center gap-3",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: "h-8 w-8 rounded-full bg-primary/10 grid place-items-center text-xs font-bold text-primary uppercase",
																		children: staffName.slice(0, 2)
																	}), staffName]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																	className: "px-4 py-3 text-muted-foreground",
																	children: shift.till?.name || "-"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																	className: "px-4 py-3 text-muted-foreground",
																	children: shift.shiftDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "font-semibold",
																		children: [
																			shift.shiftDate,
																			" (",
																			shift.startTime,
																			" - ",
																			shift.endTime,
																			")"
																		]
																	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
																		new Date(shift.openedAt).toLocaleTimeString([], {
																			hour: "2-digit",
																			minute: "2-digit"
																		}),
																		" ",
																		"-",
																		" ",
																		isCompleted ? new Date(shift.closedAt).toLocaleTimeString([], {
																			hour: "2-digit",
																			minute: "2-digit"
																		}) : "Ongoing"
																	] })
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																	className: "px-4 py-3",
																	children: [
																		shift.status === "Scheduled" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 animate-in fade-in",
																			children: "Scheduled"
																		}),
																		!isCompleted && (shift.status === "Active" || shift.status === "Open") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success animate-pulse",
																			children: [
																				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-success" }),
																				" ",
																				"Active"
																			]
																		}),
																		isCompleted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "inline-flex items-center gap-1.5 rounded-full bg-border/50 px-2.5 py-1 text-xs font-bold text-muted-foreground",
																			children: "Completed"
																		})
																	]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																	className: "px-4 py-3 text-right",
																	children: [shift.status === "Scheduled" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																		variant: "outline",
																		size: "sm",
																		className: "h-8 rounded-lg text-xs font-bold border-red-200 text-red-600 hover:bg-red-50",
																		onClick: () => handleDeleteRoster(shift.id),
																		children: "Cancel Shift"
																	}), !isCompleted && (shift.status === "Active" || shift.status === "Open") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex gap-2 justify-end",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																			variant: "outline",
																			size: "sm",
																			className: "h-8 rounded-lg text-xs font-bold",
																			onClick: () => {
																				setDropShiftId(shift.id);
																				setCashDropModalOpen(true);
																			},
																			children: "Record Cash Drop"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																			variant: "outline",
																			size: "sm",
																			className: "h-8 rounded-lg text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50",
																			onClick: () => {
																				setCloseShiftId(shift.id);
																				setCloseShiftModalOpen(true);
																			},
																			children: "Close Shift"
																		})]
																	})]
																})
															]
														}, shift.id);
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
												open: rosterModalOpen,
												onOpenChange: (open) => {
													if (!isRosterSubmitting) {
														setRosterModalOpen(open);
														if (!open) {
															setSelectedCashierId("");
															setSelectedTillId("");
															setShiftNotes("");
															setRosterValidationErrors({});
															setRosterErrorMsg("");
														}
													}
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
													className: "sm:max-w-md w-[95vw] sm:w-full",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Manage Shift Roster" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Schedule a cashier shift and assign a till." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
														onSubmit: handleRosterSubmit,
														className: "space-y-4 py-2",
														children: [
															rosterErrorMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 animate-in fade-in",
																children: rosterErrorMsg
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		htmlFor: "cashier-select",
																		children: "Cashier / Staff"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
																		id: "cashier-select",
																		value: selectedCashierId,
																		onChange: (e) => {
																			setSelectedCashierId(e.target.value);
																			setRosterValidationErrors((prev) => ({
																				...prev,
																				cashierId: ""
																			}));
																		},
																		className: "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
																		children: eligibleStaff.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																			value: "",
																			children: "No eligible cashiers found"
																		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																			value: "",
																			children: "Select a cashier..."
																		}), eligibleStaff.map((st) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
																			value: st.id,
																			children: [
																				st.name,
																				" (",
																				st.email,
																				") · ",
																				formatRoleName(st.role)
																			]
																		}, st.id))] })
																	}),
																	rosterValidationErrors["cashierId"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																		className: "text-xs font-medium text-red-500",
																		children: rosterValidationErrors["cashierId"]
																	})
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		htmlFor: "till-select",
																		children: "Till Assignment"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
																		id: "till-select",
																		value: selectedTillId,
																		onChange: (e) => {
																			setSelectedTillId(e.target.value);
																			setRosterValidationErrors((prev) => ({
																				...prev,
																				tillId: ""
																			}));
																		},
																		className: "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																			value: "",
																			children: "Select a till..."
																		}), tillsList.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																			value: t.id,
																			children: t.name
																		}, t.id))]
																	}),
																	rosterValidationErrors["tillId"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																		className: "text-xs font-medium text-red-500",
																		children: rosterValidationErrors["tillId"]
																	})
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		htmlFor: "shift-date",
																		children: "Shift Date"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		id: "shift-date",
																		type: "date",
																		value: shiftDate,
																		onChange: (e) => {
																			setShiftDate(e.target.value);
																			setRosterValidationErrors((prev) => ({
																				...prev,
																				shiftDate: ""
																			}));
																		},
																		className: rosterValidationErrors["shiftDate"] ? "border-red-500" : ""
																	}),
																	rosterValidationErrors["shiftDate"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																		className: "text-xs font-medium text-red-500",
																		children: rosterValidationErrors["shiftDate"]
																	})
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-2 gap-4",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-1.5",
																	children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																			htmlFor: "start-time",
																			children: "Start Time"
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																			id: "start-time",
																			type: "time",
																			value: shiftStartTime,
																			onChange: (e) => {
																				setShiftStartTime(e.target.value);
																				setRosterValidationErrors((prev) => ({
																					...prev,
																					startTime: ""
																				}));
																			},
																			className: rosterValidationErrors["startTime"] ? "border-red-500" : ""
																		}),
																		rosterValidationErrors["startTime"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																			className: "text-xs font-medium text-red-500",
																			children: rosterValidationErrors["startTime"]
																		})
																	]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-1.5",
																	children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																			htmlFor: "end-time",
																			children: "End Time"
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																			id: "end-time",
																			type: "time",
																			value: shiftEndTime,
																			onChange: (e) => {
																				setShiftEndTime(e.target.value);
																				setRosterValidationErrors((prev) => ({
																					...prev,
																					endTime: ""
																				}));
																			},
																			className: rosterValidationErrors["endTime"] ? "border-red-500" : ""
																		}),
																		rosterValidationErrors["endTime"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																			className: "text-xs font-medium text-red-500",
																			children: rosterValidationErrors["endTime"]
																		})
																	]
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	htmlFor: "shift-notes",
																	children: "Notes (Optional)"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	id: "shift-notes",
																	type: "text",
																	placeholder: "e.g. Morning shift / weekend coverage",
																	value: shiftNotes,
																	onChange: (e) => setShiftNotes(e.target.value)
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
																className: "flex justify-end gap-2 mt-6",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	type: "button",
																	variant: "outline",
																	onClick: () => {
																		setRosterModalOpen(false);
																		setSelectedCashierId("");
																		setSelectedTillId("");
																		setShiftNotes("");
																		setRosterValidationErrors({});
																		setRosterErrorMsg("");
																	},
																	disabled: isRosterSubmitting,
																	children: "Cancel"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	type: "submit",
																	disabled: isRosterSubmitting,
																	children: isRosterSubmitting ? "Saving..." : "Save Shift"
																})]
															})
														]
													})]
												})
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel overflow-hidden mt-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between border-b border-border p-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "font-bold text-ink",
													children: "Till Registry"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground mt-0.5",
													children: "Manage POS terminal tills assigned to this branch."
												})] }), isPermEnabled("till_management") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													size: "sm",
													onClick: () => setTillModalOpen(true),
													children: "Add Till"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													size: "sm",
													disabled: true,
													className: "opacity-50 cursor-not-allowed",
													children: "Add Till"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
												className: "w-full text-left text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
													className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium",
															children: "Till Name / Number"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium",
															children: "Description"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium",
															children: "Opening Float"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium",
															children: "Created Date"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
															className: "px-4 py-3 font-medium text-right",
															children: "Status"
														})
													] })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
													className: "divide-y divide-border",
													children: [(!data.tills || data.tills.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														colSpan: 5,
														className: "px-4 py-4 text-center text-muted-foreground",
														children: "No tills found for this branch."
													}) }), (data.tills || []).map((till) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
														className: "hover:bg-surface-2/50 transition-colors",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 font-semibold text-ink",
																children: till.name
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-muted-foreground",
																children: till.description || "No description"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-muted-foreground",
																children: aed(Number(till.openingFloat))
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-xs text-muted-foreground",
																children: new Date(till.createdAt).toLocaleDateString("en-US", {
																	month: "short",
																	day: "numeric",
																	year: "numeric"
																})
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-right",
																children: till.status === "Open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success",
																	children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-success animate-ping" }),
																		" ",
																		"Open"
																	]
																}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "inline-flex items-center gap-1.5 rounded-full bg-border/50 px-2.5 py-1 text-xs font-bold text-muted-foreground",
																	children: "Closed"
																})
															})
														]
													}, till.id))]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
												open: tillModalOpen,
												onOpenChange: (open) => {
													if (!isTillSubmitting) {
														setTillModalOpen(open);
														if (!open) {
															setTillName("");
															setTillDescription("");
															setTillOpeningFloat("0.00");
															setTillValidationErrors({});
															setTillErrorMsg("");
														}
													}
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
													className: "sm:max-w-md w-[95vw] sm:w-full",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add POS Till" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Register a new till terminal for this branch. The till status defaults to Closed." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
														onSubmit: handleTillSubmit,
														className: "space-y-4 py-2",
														children: [
															tillErrorMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 animate-in fade-in",
																children: tillErrorMsg
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		htmlFor: "till-name-input",
																		children: "Till Name or Number"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		id: "till-name-input",
																		type: "text",
																		placeholder: "e.g. Till 2",
																		value: tillName,
																		onChange: (e) => {
																			setTillName(e.target.value);
																			setTillValidationErrors((prev) => ({
																				...prev,
																				name: ""
																			}));
																		},
																		className: tillValidationErrors["name"] ? "border-red-500" : ""
																	}),
																	tillValidationErrors["name"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																		className: "text-xs font-medium text-red-500",
																		children: tillValidationErrors["name"]
																	})
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	htmlFor: "till-desc-input",
																	children: "Description (Optional)"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	id: "till-desc-input",
																	type: "text",
																	placeholder: "e.g. Express checkout lane",
																	value: tillDescription,
																	onChange: (e) => setTillDescription(e.target.value)
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		htmlFor: "till-float-input",
																		children: "Opening Float (AED)"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		id: "till-float-input",
																		type: "text",
																		value: tillOpeningFloat,
																		onChange: (e) => {
																			setTillOpeningFloat(e.target.value);
																			setTillValidationErrors((prev) => ({
																				...prev,
																				openingFloat: ""
																			}));
																		},
																		className: tillValidationErrors["openingFloat"] ? "border-red-500" : ""
																	}),
																	tillValidationErrors["openingFloat"] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																		className: "text-xs font-medium text-red-500",
																		children: tillValidationErrors["openingFloat"]
																	})
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
																className: "flex justify-end gap-2 mt-6",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	type: "button",
																	variant: "outline",
																	onClick: () => {
																		setTillModalOpen(false);
																		setTillName("");
																		setTillDescription("");
																		setTillOpeningFloat("0.00");
																		setTillValidationErrors({});
																		setTillErrorMsg("");
																	},
																	disabled: isTillSubmitting,
																	children: "Cancel"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	type: "submit",
																	disabled: isTillSubmitting,
																	children: isTillSubmitting ? "Creating..." : "Create Till"
																})]
															})
														]
													})]
												})
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel overflow-hidden mt-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex items-center justify-between border-b border-border p-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-bold text-ink",
												children: "Cashiers Directory"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground mt-0.5",
												children: "List of active cashiers assigned to this branch terminal."
											})] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
											className: "w-full text-left text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
												className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Cashier Name"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Email"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Status"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium text-right",
														children: "Actions"
													})
												] })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
												className: "divide-y divide-border",
												children: [(!data.staff || data.staff.filter((s) => s.role === "cashier").length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													colSpan: 4,
													className: "px-4 py-4 text-center text-muted-foreground",
													children: "No cashiers found for this branch."
												}) }), (data.staff || []).filter((s) => s.role === "cashier").map((cashier) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
													className: "hover:bg-surface-2/50 transition-colors",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 font-semibold text-ink",
															children: cashier.name
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 text-muted-foreground",
															children: cashier.email
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3",
															children: cashier.isActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success",
																children: "Active"
															}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700",
																children: "Inactive"
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 text-right",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																variant: "outline",
																size: "sm",
																onClick: () => {
																	setResetTargetId(cashier.id);
																	setResetTargetName(cashier.name);
																	setResetModalOpen(true);
																},
																disabled: !isPermEnabled("shift_staff"),
																children: "Reset PIN"
															})
														})
													]
												}, cashier.id))]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
										open: resetModalOpen,
										onOpenChange: (open) => {
											if (!isResetSubmitting) {
												setResetModalOpen(open);
												if (!open) {
													setNewPin("");
													setConfirmPin("");
													setResetTargetId("");
													setResetTargetName("");
													setResetErrorMsg("");
												}
											}
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
											className: "sm:max-w-md w-[95vw] sm:w-full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Reset Cashier PIN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
												"Set a new 4-digit PIN for Cashier ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-semibold text-ink",
													children: resetTargetName
												}),
												"."
											] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
												onSubmit: handleManagerResetSubmit,
												className: "space-y-4 py-2",
												children: [
													resetErrorMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 animate-in fade-in",
														children: resetErrorMsg
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																htmlFor: "mgr-new-pin",
																children: "New 4-digit PIN"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "mgr-new-pin",
																type: "password",
																maxLength: 4,
																placeholder: "••••",
																value: newPin,
																onChange: (e) => {
																	setNewPin(e.target.value.replace(/\D/g, ""));
																	setResetErrorMsg("");
																}
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																htmlFor: "mgr-confirm-pin",
																children: "Confirm PIN"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "mgr-confirm-pin",
																type: "password",
																maxLength: 4,
																placeholder: "••••",
																value: confirmPin,
																onChange: (e) => {
																	setConfirmPin(e.target.value.replace(/\D/g, ""));
																	setResetErrorMsg("");
																}
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
														className: "flex justify-end gap-2 mt-6",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															type: "button",
															variant: "outline",
															onClick: () => {
																setResetModalOpen(false);
																setNewPin("");
																setConfirmPin("");
																setResetTargetId("");
																setResetTargetName("");
																setResetErrorMsg("");
															},
															disabled: isResetSubmitting,
															children: "Cancel"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															type: "submit",
															disabled: isResetSubmitting,
															children: isResetSubmitting ? "Resetting..." : "Reset PIN"
														})]
													})
												]
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
										open: cashDropModalOpen,
										onOpenChange: (open) => {
											if (!isDropping) {
												setCashDropModalOpen(open);
												if (!open) {
													setDropAmount("");
													setDropNote("");
												}
											}
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
											className: "sm:max-w-md w-[95vw] sm:w-full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Record Cash Drop" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Record cash taken from the till during an active shift." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
												onSubmit: handleCashDropSubmit,
												className: "space-y-4 py-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "drop-amount",
															children: "Drop Amount (AED)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "drop-amount",
															type: "number",
															step: "0.01",
															min: "0.01",
															placeholder: "e.g. 500",
															value: dropAmount,
															onChange: (e) => setDropAmount(e.target.value),
															required: true
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "drop-note",
															children: "Note (Optional)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "drop-note",
															type: "text",
															placeholder: "e.g. Safe deposit",
															value: dropNote,
															onChange: (e) => setDropNote(e.target.value)
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
														className: "flex justify-end gap-2 mt-6",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															type: "button",
															variant: "outline",
															onClick: () => setCashDropModalOpen(false),
															disabled: isDropping,
															children: "Cancel"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															type: "submit",
															disabled: isDropping,
															children: isDropping ? "Saving..." : "Record Drop"
														})]
													})
												]
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
										open: closeShiftModalOpen,
										onOpenChange: (open) => {
											if (!isClosingShift) {
												setCloseShiftModalOpen(open);
												if (!open) setCloseActualCash("");
											}
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
											className: "sm:max-w-md w-[95vw] sm:w-full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Close Shift" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Enter the actual closing cash float to officially close this shift." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
												onSubmit: handleCloseShiftSubmit,
												className: "space-y-4 py-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "close-cash",
														children: "Actual Closing Cash (AED)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "close-cash",
														type: "number",
														step: "0.01",
														min: "0",
														placeholder: "e.g. 1500",
														value: closeActualCash,
														onChange: (e) => setCloseActualCash(e.target.value),
														required: true
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
													className: "flex justify-end gap-2 mt-6",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														variant: "outline",
														onClick: () => setCloseShiftModalOpen(false),
														disabled: isClosingShift,
														children: "Cancel"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "submit",
														disabled: isClosingShift,
														children: isClosingShift ? "Closing..." : "Close Shift"
													})]
												})]
											})]
										})
									})
								] })
							})
						]
					})
				]
			})
		});
	} catch (e) {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-red-500 font-bold text-xl",
				children: "Store Manager Render Crash"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-4 p-4 bg-red-50 text-red-900 rounded",
				children: e.stack
			})]
		});
	}
}
//#endregion
export { StoreManager as component };
