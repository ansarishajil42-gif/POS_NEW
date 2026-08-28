import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as cn, r as buttonVariants, t as Button } from "./button-BlBeOJmP.mjs";
import { y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Plus, R as Menu, S as Search, Y as FileText, ct as CircleAlert, dt as ChevronLeft, ft as ChevronDown, gt as Briefcase, mt as Calendar$1, n as X, ut as ChevronRight, y as ShoppingCart } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, n as StatCard, o as TabsTrigger, r as Tabs, t as DemoShell } from "./tabs-ClS19XRw.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/@radix-ui/react-popover+[...].mjs";
import { t as aed } from "./demo-data-C-13_S7Y.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { At as recordVendorPaymentServerFn, Ct as createVendorServerFn, Mt as updatePurchaseOrderServerFn, Nt as updateVendorServerFn, Ot as getPODetailsServerFn, St as createVendorInvoiceServerFn, Tt as deleteVendorServerFn, h as Route$3, jt as submitPurchaseOrderServerFn, kt as recordGRNServerFn, wt as deletePurchaseOrderServerFn, xt as createPurchaseOrderServerFn } from "./router-DfZaL7a3.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-BTVuOq31.mjs";
import { t as Input } from "./input-Cexa0DG2.mjs";
import { t as Label } from "./label-CZhEvsKN.mjs";
import { l as format } from "../_libs/date-fns.mjs";
import { n as getDefaultClassNames, t as DayPicker } from "../_libs/react-day-picker.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/purchasing-C5VC69z1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Calendar({ className, classNames, showOutsideDays = true, captionLayout = "label", buttonVariant = "ghost", formatters, components, ...props }) {
	const defaultClassNames = getDefaultClassNames();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayPicker, {
		showOutsideDays,
		className: cn("bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent", String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`, String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`, className),
		captionLayout,
		formatters: {
			formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
			...formatters
		},
		classNames: {
			root: cn("w-fit", defaultClassNames.root),
			months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
			month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
			nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaultClassNames.nav),
			button_previous: cn(buttonVariants({ variant: buttonVariant }), "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50", defaultClassNames.button_previous),
			button_next: cn(buttonVariants({ variant: buttonVariant }), "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50", defaultClassNames.button_next),
			month_caption: cn("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)", defaultClassNames.month_caption),
			dropdowns: cn("flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium", defaultClassNames.dropdowns),
			dropdown_root: cn("has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border", defaultClassNames.dropdown_root),
			dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
			caption_label: cn("select-none font-medium", captionLayout === "label" ? "text-sm" : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5", defaultClassNames.caption_label),
			table: "w-full border-collapse",
			weekdays: cn("flex", defaultClassNames.weekdays),
			weekday: cn("text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal", defaultClassNames.weekday),
			week: cn("mt-2 flex w-full", defaultClassNames.week),
			week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
			week_number: cn("text-muted-foreground select-none text-[0.8rem]", defaultClassNames.week_number),
			day: cn("group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md", defaultClassNames.day),
			range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
			range_middle: cn("rounded-none", defaultClassNames.range_middle),
			range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
			today: cn("bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none", defaultClassNames.today),
			outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
			disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
			hidden: cn("invisible", defaultClassNames.hidden),
			...classNames
		},
		components: {
			Root: ({ className, rootRef, ...props }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-slot": "calendar",
					ref: rootRef,
					className: cn(className),
					...props
				});
			},
			Chevron: ({ className, orientation, ...props }) => {
				if (orientation === "left") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
					className: cn("size-4", className),
					...props
				});
				if (orientation === "right") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
					className: cn("size-4", className),
					...props
				});
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
					className: cn("size-4", className),
					...props
				});
			},
			DayButton: CalendarDayButton,
			WeekNumber: ({ children, ...props }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					...props,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-(--cell-size) items-center justify-center text-center",
						children
					})
				});
			},
			...components
		},
		...props
	});
}
function CalendarDayButton({ className, day, modifiers, ...props }) {
	const defaultClassNames = getDefaultClassNames();
	const ref = import_react.useRef(null);
	import_react.useEffect(() => {
		if (modifiers["focused"]) ref.current?.focus();
	}, [modifiers]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		ref,
		variant: "ghost",
		size: "icon",
		"data-day": day.date.toLocaleDateString(),
		"data-selected-single": modifiers["selected"] && !modifiers["range_start"] && !modifiers["range_end"] && !modifiers["range_middle"],
		"data-range-start": modifiers["range_start"],
		"data-range-end": modifiers["range_end"],
		"data-range-middle": modifiers["range_middle"],
		className: cn("data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70", defaultClassNames.day, className),
		...props
	});
}
var Popover = Root2;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}) }));
PopoverContent.displayName = Content2.displayName;
function PurchasingOfficer() {
	const data = Route$3.useLoaderData();
	const router = useRouter();
	const [searchPo, setSearchPo] = (0, import_react.useState)("");
	const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, import_react.useState)(false);
	const [selectedPoId, setSelectedPoId] = (0, import_react.useState)(null);
	const [selectedPoDetails, setSelectedPoDetails] = (0, import_react.useState)(null);
	const [isDeletingGrn, setIsDeletingGrn] = (0, import_react.useState)(false);
	const [deleteGrnId, setDeleteGrnId] = (0, import_react.useState)(null);
	const [isDeletingInvoice, setIsDeletingInvoice] = (0, import_react.useState)(false);
	const [deleteInvoiceId, setDeleteInvoiceId] = (0, import_react.useState)(null);
	const [viewGrnOpen, setViewGrnOpen] = (0, import_react.useState)(false);
	const [editGrnOpen, setEditGrnOpen] = (0, import_react.useState)(false);
	const [selectedGrn, setSelectedGrn] = (0, import_react.useState)(null);
	const [editGrnForm, setEditGrnForm] = (0, import_react.useState)({
		id: "",
		items: []
	});
	const [isUpdatingGrn, setIsUpdatingGrn] = (0, import_react.useState)(false);
	const [viewInvoiceOpen, setViewInvoiceOpen] = (0, import_react.useState)(false);
	const [editInvoiceOpen, setEditInvoiceOpen] = (0, import_react.useState)(false);
	const [selectedInvoice, setSelectedInvoice] = (0, import_react.useState)(null);
	const [editInvoiceForm, setEditInvoiceForm] = (0, import_react.useState)({
		id: "",
		invoiceNumber: "",
		dueDate: ""
	});
	const [isUpdatingInvoice, setIsUpdatingInvoice] = (0, import_react.useState)(false);
	const handleRowClick = async (poId) => {
		setSelectedPoId(poId);
		try {
			const details = await getPODetailsServerFn({ data: { poId } });
			setSelectedPoDetails(details);
		} catch (e) {
			toast.error("Unauthorized or missing PO");
			setSelectedPoId(null);
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
	const { vendors, products, branches, purchaseOrders: pos, grns, invoices, userRole } = data;
	const filteredPos = pos.filter((po) => {
		if (!searchPo) return true;
		const query = searchPo.toLowerCase();
		const poNumber = (po.id || "").toLowerCase();
		const vendorName = (po.vendor?.name || "").toLowerCase();
		return poNumber.includes(query) || vendorName.includes(query);
	});
	const today = /* @__PURE__ */ new Date();
	const next7Days = new Date(today);
	next7Days.setDate(today.getDate() + 7);
	let totalAP = 0;
	let due7Days = 0;
	let overdue = 0;
	invoices.forEach((inv) => {
		if (inv.status !== "Paid") {
			const remaining = (Number(inv.total) || 0) - (Number(inv.paidAmount) || 0);
			totalAP += remaining;
			const dueDate = new Date(inv.dueDate);
			if (dueDate < today) overdue += remaining;
			else if (dueDate <= next7Days) due7Days += remaining;
		}
	});
	const [poOpen, setPoOpen] = (0, import_react.useState)(false);
	const [poForm, setPoForm] = (0, import_react.useState)({
		vendorId: "",
		branchId: "",
		vatRate: 5
	});
	const [poLines, setPoLines] = (0, import_react.useState)([{
		productId: "",
		qty: 1,
		unitPrice: 0
	}]);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [deletePoId, setDeletePoId] = (0, import_react.useState)(null);
	const [grnOpen, setGrnOpen] = (0, import_react.useState)(false);
	const [grnForm, setGrnForm] = (0, import_react.useState)({
		poId: "",
		grnNumber: "",
		items: []
	});
	const [isSubmittingGRN, setIsSubmittingGRN] = (0, import_react.useState)(false);
	const [invoiceOpen, setInvoiceOpen] = (0, import_react.useState)(false);
	const [invoiceForm, setInvoiceForm] = (0, import_react.useState)({
		poId: "",
		invoiceNumber: "",
		dueDate: "",
		vatRate: 5
	});
	const [isSubmittingInvoice, setIsSubmittingInvoice] = (0, import_react.useState)(false);
	const [paymentOpen, setPaymentOpen] = (0, import_react.useState)(false);
	const [paymentForm, setPaymentForm] = (0, import_react.useState)({
		invoiceId: "",
		amount: 0,
		method: "Bank Transfer",
		referenceNo: "",
		notes: "",
		paymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
	});
	const [isSubmittingPayment, setIsSubmittingPayment] = (0, import_react.useState)(false);
	const [targetInvoiceForPayment, setTargetInvoiceForPayment] = (0, import_react.useState)(null);
	const [vendorOpen, setVendorOpen] = (0, import_react.useState)(false);
	const [vendorForm, setVendorForm] = (0, import_react.useState)({
		name: "",
		contact: "",
		phone: "",
		email: "",
		trn: "",
		address: "",
		status: "Active"
	});
	const [isSubmittingVendor, setIsSubmittingVendor] = (0, import_react.useState)(false);
	const [deleteVendorId, setDeleteVendorId] = (0, import_react.useState)(null);
	const addPoLine = () => setPoLines([...poLines, {
		productId: "",
		qty: 1,
		unitPrice: 0
	}]);
	const totalPoValue = poLines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
	const vatAmount = totalPoValue * (poForm.vatRate / 100);
	const grandTotal = totalPoValue + vatAmount;
	const handleCreatePO = async () => {
		if (!poForm.vendorId || !poForm.branchId) {
			toast.error("Please select a vendor and a branch");
			return;
		}
		const validLines = poLines.filter((l) => l.productId && l.qty > 0 && l.unitPrice >= 0);
		if (validLines.length === 0) {
			toast.error("Please add at least one valid product line");
			return;
		}
		setIsSubmitting(true);
		try {
			if (poForm.id) {
				await updatePurchaseOrderServerFn({ data: {
					id: poForm.id,
					vendorId: poForm.vendorId,
					branchId: poForm.branchId,
					vatRate: poForm.vatRate,
					items: validLines
				} });
				toast.success("Purchase Order Updated");
				if (selectedPoId === poForm.id) {
					const details = await getPODetailsServerFn({ data: { poId: poForm.id } });
					setSelectedPoDetails(details);
				}
			} else {
				await createPurchaseOrderServerFn({ data: {
					vendorId: poForm.vendorId,
					branchId: poForm.branchId,
					vatRate: poForm.vatRate,
					items: validLines
				} });
				toast.success("Purchase Order Draft Created");
			}
			setPoOpen(false);
			setPoForm({
				vendorId: "",
				branchId: "",
				vatRate: 5
			});
			setPoLines([{
				productId: "",
				qty: 1,
				unitPrice: 0
			}]);
			router.invalidate();
		} catch (err) {
			toast.error(err.message || "Failed to save PO");
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleSubmitPO = async (id) => {
		try {
			await submitPurchaseOrderServerFn({ data: { id } });
			toast.success("Purchase Order Submitted");
			router.invalidate();
		} catch (err) {
			toast.error(err.message || "Failed to submit PO");
		}
	};
	const handleCancelPO = async () => {
		if (!deletePoId) return;
		const id = deletePoId;
		try {
			await deletePurchaseOrderServerFn({ data: { id } });
			toast.success("Purchase Order Deleted");
			if (selectedPoId === id) {
				setSelectedPoId(null);
				setSelectedPoDetails(null);
			}
			setDeletePoId(null);
			router.invalidate();
		} catch (err) {
			toast.error(err.message || "Failed to delete PO");
		}
	};
	const submitGrn = async () => {
		if (!grnForm.poId || !grnForm.grnNumber) {
			toast.error("Please provide PO reference and GRN number");
			return;
		}
		const targetPo = pos.find((p) => p.id === grnForm.poId);
		if (!targetPo) {
			toast.error("PO not found");
			return;
		}
		for (const item of editGrnForm.items) {
			if (item.receivedQty < 0) {
				toast.error(`Invalid quantity for ${item.productName}`);
				return;
			}
			if (item.receivedQty > 0) {
				if (!item.batchNumber) {
					toast.error(`Batch number required for ${item.productName}`);
					return;
				}
				if (!item.expiryDate) {
					toast.error(`Expiry date required for ${item.productName}`);
					return;
				}
				if (item.manufacturingDate && new Date(item.expiryDate) <= new Date(item.manufacturingDate)) {
					toast.error(`Expiry date must be after manufacturing date for ${item.productName}`);
					return;
				}
				if (new Date(item.expiryDate) <= /* @__PURE__ */ new Date()) {
					toast.error(`Expiry date must be in the future for ${item.productName}`);
					return;
				}
			}
		}
		setIsSubmittingGRN(true);
		try {
			await recordGRNServerFn({ data: {
				purchaseOrderId: targetPo.id,
				vendorId: targetPo.vendorId,
				branchId: targetPo.branchId,
				grnNumber: grnForm.grnNumber,
				items: editGrnForm.items.map((i) => ({
					productId: i.productId,
					orderedQty: i.orderedQty,
					receivedQty: i.receivedQty,
					batchNumber: i.batchNumber || null,
					manufacturingDate: i.manufacturingDate || null,
					expiryDate: i.expiryDate || null
				}))
			} });
			toast.success("Goods Received Note Recorded");
			setGrnOpen(false);
			setGrnForm({
				poId: "",
				grnNumber: "",
				items: []
			});
			router.invalidate();
		} catch (err) {
			toast.error(err.message || "Failed to record GRN");
		} finally {
			setIsSubmittingGRN(false);
		}
	};
	const handleCreateInvoice = async () => {
		if (!invoiceForm.poId || !editInvoiceForm.invoiceNumber || !editInvoiceForm.dueDate) {
			toast.error("Please fill in all invoice details");
			return;
		}
		const targetPo = pos.find((p) => p.id === invoiceForm.poId);
		if (!targetPo) return;
		const subtotal = Number(targetPo.subtotal);
		const vatRate = invoiceForm.vatRate;
		const vatAmount = subtotal * (vatRate / 100);
		const total = subtotal + vatAmount;
		setIsSubmittingInvoice(true);
		try {
			await createVendorInvoiceServerFn({ data: {
				purchaseOrderId: targetPo.id,
				invoiceNumber: editInvoiceForm.invoiceNumber,
				dueDate: editInvoiceForm.dueDate,
				subtotal,
				vatRate,
				vatAmount,
				total
			} });
			toast.success("Vendor Invoice Created & Posted to AP");
			setInvoiceOpen(false);
			setInvoiceForm({
				poId: "",
				invoiceNumber: "",
				dueDate: "",
				vatRate: 5
			});
			router.invalidate();
		} catch (err) {
			toast.error(err.message || "Failed to create invoice");
		} finally {
			setIsSubmittingInvoice(false);
		}
	};
	const handleRecordPayment = async () => {
		if (paymentForm.amount <= 0) {
			toast.error("Payment amount must be greater than zero");
			return;
		}
		setIsSubmittingPayment(true);
		try {
			await recordVendorPaymentServerFn({ data: {
				invoiceId: paymentForm.invoiceId,
				amount: paymentForm.amount,
				method: paymentForm.method,
				referenceNo: paymentForm.referenceNo,
				notes: paymentForm.notes,
				paymentDate: paymentForm.paymentDate
			} });
			toast.success("Payment recorded successfully");
			setPaymentOpen(false);
			setPaymentForm({
				invoiceId: "",
				amount: 0,
				method: "Bank Transfer",
				referenceNo: "",
				notes: "",
				paymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
			});
			setTargetInvoiceForPayment(null);
			router.invalidate();
		} catch (err) {
			toast.error(err.message || "Failed to record payment");
		} finally {
			setIsSubmittingPayment(false);
		}
	};
	const handleCreateVendor = async () => {
		if (!vendorForm.name || vendorForm.name.trim() === "") {
			toast.error("Vendor Name is required");
			return;
		}
		if (vendorForm.email) {
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorForm.email)) {
				toast.error("Invalid email format");
				return;
			}
		}
		setIsSubmittingVendor(true);
		try {
			if (vendorForm.id) {
				await updateVendorServerFn({ data: {
					id: vendorForm.id,
					...vendorForm
				} });
				toast.success("Vendor Updated Successfully");
			} else {
				await createVendorServerFn({ data: vendorForm });
				toast.success("Vendor Created Successfully");
			}
			setVendorOpen(false);
			setVendorForm({
				name: "",
				contact: "",
				phone: "",
				email: "",
				trn: "",
				address: "",
				status: "Active"
			});
			router.invalidate();
		} catch (err) {
			toast.error(err.message || "Failed to save vendor");
		} finally {
			setIsSubmittingVendor(false);
		}
	};
	const handleDeleteVendor = async () => {
		if (!deleteVendorId) return;
		try {
			await deleteVendorServerFn({ data: { id: deleteVendorId } });
			toast.success("Vendor Deleted Successfully");
			setDeleteVendorId(null);
			router.invalidate();
		} catch (err) {
			toast.error(err.message || "Failed to delete vendor");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DemoShell, {
		title: "Purchasing Dashboard",
		subtitle: `${data.tenant?.name || "Company"} · Procurement`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
			open: poOpen,
			onOpenChange: setPoOpen,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "rounded-xl font-semibold",
					onClick: () => {
						setPoForm({
							vendorId: "",
							branchId: "",
							vatRate: 5
						});
						setPoLines([{
							productId: "",
							qty: 1,
							unitPrice: 0
						}]);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Create PO"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-w-3xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: poForm.id ? "Edit Purchase Order" : "Create Purchase Order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: poForm.id ? "Update PO details and items." : "Draft a new PO and add line items." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Vendor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
										value: poForm.vendorId,
										onChange: (e) => setPoForm({
											...poForm,
											vendorId: e.target.value
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Select Vendor..."
										}), vendors.filter((v) => v.status === "Active").map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: v.id,
											children: v.name
										}, v.id))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Delivery Branch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
										value: poForm.branchId,
										onChange: (e) => setPoForm({
											...poForm,
											branchId: e.target.value
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Select Branch..."
										}), branches.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: b.id,
											children: b.name
										}, b.id))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "VAT Rate (%)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										value: poForm.vatRate,
										onChange: (e) => setPoForm({
											...poForm,
											vatRate: Number(e.target.value)
										})
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Line Items" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "sm",
										onClick: addPoLine,
										children: "Add Item"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-3",
									children: poLines.map((line, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												className: "flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
												value: line.productId,
												onChange: (e) => {
													const newL = [...poLines];
													if (newL[idx]) {
														newL[idx].productId = e.target.value;
														setPoLines(newL);
													}
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "Select Product..."
												}), products.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: p.id,
													children: p.name
												}, p.id))]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												className: "w-24",
												placeholder: "Qty",
												value: line.qty || "",
												onChange: (e) => {
													const newL = [...poLines];
													if (newL[idx]) {
														newL[idx].qty = Number(e.target.value);
														setPoLines(newL);
													}
												}
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												className: "w-28",
												placeholder: "Price",
												value: line.unitPrice || "",
												onChange: (e) => {
													const newL = [...poLines];
													if (newL[idx]) {
														newL[idx].unitPrice = Number(e.target.value);
														setPoLines(newL);
													}
												}
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-20 text-right font-medium text-sm",
												children: aed(line.qty * line.unitPrice)
											})
										]
									}, idx))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-end mt-4 text-sm gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-muted-foreground",
											children: ["Subtotal: ", aed(totalPoValue)]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-muted-foreground",
											children: [
												"VAT (",
												poForm.vatRate,
												"%): ",
												aed(vatAmount)
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-lg font-bold text-ink mt-1",
											children: ["Total: ", aed(grandTotal)]
										})
									]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setPoOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: isSubmitting || poLines.length === 0,
						onClick: handleCreatePO,
						children: isSubmitting ? "Creating..." : "Submit PO"
					})] })
				]
			})]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "po",
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
									value: "po",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Purchase Orders"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "grn",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Goods Received (GRN)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "invoices",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Vendor Invoices"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "ap",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Accounts Payable"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "vendors",
									className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
									children: "Vendors"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "po",
								className: "mt-0 space-y-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Open POs",
											value: pos.length.toString(),
											icon: ShoppingCart,
											tone: "accent"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Pending Approval",
											value: pos.filter((p) => p.status === "Draft").length.toString(),
											icon: CircleAlert
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Value Ordered (MTD)",
											value: aed(pos.reduce((acc, p) => acc + Number(p.total), 0)),
											icon: FileText,
											tone: "success"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
											label: "Vendors Active",
											value: vendors.length.toString(),
											icon: Briefcase
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center justify-between border-b border-border p-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative w-72",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Search PO number or Vendor...",
												className: "pl-9 h-9 text-sm",
												value: searchPo,
												onChange: (e) => setSearchPo(e.target.value)
											})]
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
													children: "Vendor"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Delivery Date"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium text-right",
													children: "Value"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium text-right",
													children: "Status"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium text-right",
													children: "Actions"
												})
											] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
											className: "divide-y divide-border",
											children: [filteredPos.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												colSpan: 6,
												className: "p-4 text-center text-muted-foreground",
												children: searchPo ? "No purchase orders found." : "No Purchase Orders found."
											}) }), filteredPos.map((po) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "hover:bg-surface-2/50 transition-colors cursor-pointer",
												onClick: () => handleRowClick(po.id),
												tabIndex: 0,
												onKeyDown: (e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														handleRowClick(po.id);
													}
												},
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 font-medium text-primary font-mono text-xs",
														title: po.id,
														children: po.id.split("-")[0].toUpperCase()
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 font-semibold text-ink",
														children: po.vendor?.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-muted-foreground",
														children: new Date(po.createdAt).toISOString().split("T")[0]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right font-medium",
														children: aed(Number(po.total))
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${po.status === "Draft" ? "bg-surface-2 text-muted-foreground" : po.status === "Ordered" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`,
															children: po.status
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex justify-end gap-2",
															children: [
																po.status === "Draft" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	variant: "default",
																	size: "sm",
																	onClick: (e) => {
																		e.stopPropagation();
																		handleSubmitPO(po.id);
																	},
																	children: "Submit"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	variant: "outline",
																	size: "sm",
																	onClick: (e) => {
																		e.stopPropagation();
																		setPoForm({
																			id: po.id,
																			vendorId: po.vendorId,
																			branchId: po.branchId,
																			vatRate: Number(po.vatRate) || 5
																		});
																		setPoLines(po.items.map((i) => ({
																			productId: i.productId,
																			qty: i.quantity || i.qty,
																			unitPrice: Number(i.unitPrice)
																		})));
																		setPoOpen(true);
																	},
																	children: "Edit"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	variant: "destructive",
																	size: "sm",
																	onClick: (e) => {
																		e.stopPropagation();
																		setDeletePoId(po.id);
																	},
																	children: "Delete"
																})
															]
														})
													})
												]
											}, po.id))]
										})]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "grn",
								className: "mt-0 space-y-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-lg font-bold text-ink",
										children: "Goods Received Notes (GRN)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground mt-1",
										children: "Record physical receipts against open Purchase Orders."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
										open: grnOpen,
										onOpenChange: setGrnOpen,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Record GRN"] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Record Goods Received" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Select an open PO and record actual received quantities." })] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-4 py-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "PO Reference" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
															className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
															value: grnForm.poId,
															onChange: (e) => {
																const pId = e.target.value;
																const targetPo = pos.find((p) => p.id === pId);
																const items = targetPo ? targetPo.items.map((i) => ({
																	productId: i.productId,
																	productName: i.product?.name,
																	isBatchTracked: i.product?.isBatchTracked,
																	orderedQty: i.qty,
																	receivedQty: i.qty,
																	unitPrice: Number(i.unitPrice),
																	batchNumber: "",
																	manufacturingDate: "",
																	expiryDate: ""
																})) : [];
																setGrnForm({
																	...grnForm,
																	poId: pId,
																	items
																});
															},
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "",
																children: "Select PO..."
															}), pos.filter((p) => [
																"Draft",
																"Ordered",
																"Sent",
																"Approved"
															].includes(p.status)).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
																value: p.id,
																children: [
																	p.id.split("-")[0].toUpperCase(),
																	" - ",
																	p.vendor?.name,
																	" - ",
																	p.branch?.name,
																	" - ",
																	new Date(p.createdAt).toLocaleDateString(),
																	" - ",
																	aed(Number(p.total))
																]
															}, p.id))]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Supplier GRN Number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															placeholder: "e.g. GRN-9912",
															value: grnForm.grnNumber,
															onChange: (e) => setGrnForm({
																...grnForm,
																grnNumber: e.target.value
															})
														})]
													}),
													editGrnForm.items.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-4 space-y-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Received Items" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "rounded-md border border-border",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
																className: "w-full text-sm",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
																	className: "bg-surface-2 text-muted-foreground",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																			className: "px-3 py-2 text-left font-medium",
																			children: "Product"
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																			className: "px-3 py-2 text-right font-medium",
																			children: "Unit Price"
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																			className: "px-3 py-2 text-right font-medium",
																			children: "Ordered"
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																			className: "px-3 py-2 text-left font-medium w-32",
																			children: "Received"
																		})
																	] })
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
																	className: "divide-y divide-border",
																	children: editGrnForm.items.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																			className: "px-3 py-3 font-medium",
																			children: item.productName
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																			className: "px-3 py-3 text-right",
																			children: aed(item.unitPrice)
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																			className: "px-3 py-3 text-right",
																			children: item.orderedQty
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																			className: "px-3 py-3",
																			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																				type: "number",
																				min: "0",
																				max: item.orderedQty,
																				className: "h-8",
																				value: item.receivedQty,
																				onChange: (e) => {
																					const newItems = [...editGrnForm.items];
																					let val = Number(e.target.value);
																					if (val > item.orderedQty) val = item.orderedQty;
																					newItems[idx].receivedQty = val;
																					setGrnForm({
																						...grnForm,
																						items: newItems
																					});
																				}
																			})
																		})
																	] }), item.receivedQty > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
																		className: "bg-accent/5",
																		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																			colSpan: 3,
																			className: "px-3 py-3",
																			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "grid grid-cols-3 gap-3",
																				children: [
																					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
																						className: "text-xs",
																						children: ["Batch No. ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																							className: "text-destructive",
																							children: "*"
																						})]
																					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																						className: "h-8 text-xs mt-1",
																						placeholder: "Required",
																						value: item.batchNumber,
																						onChange: (e) => {
																							const newItems = [...editGrnForm.items];
																							newItems[idx].batchNumber = e.target.value;
																							setGrnForm({
																								...grnForm,
																								items: newItems
																							});
																						}
																					})] }),
																					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																						className: "text-xs",
																						children: "Mfg Date"
																					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
																						asChild: true,
																						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																							variant: "outline",
																							className: cn("w-full justify-start text-left font-normal mt-1 h-8 text-xs", !item.manufacturingDate && "text-muted-foreground"),
																							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar$1, { className: "mr-2 h-3 w-3" }), item.manufacturingDate ? format(new Date(item.manufacturingDate), "PPP") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pick a date" })]
																						})
																					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
																						className: "w-auto p-0",
																						align: "start",
																						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, {
																							mode: "single",
																							selected: item.manufacturingDate ? new Date(item.manufacturingDate) : void 0,
																							onSelect: (d) => {
																								const newItems = [...editGrnForm.items];
																								newItems[idx].manufacturingDate = d ? format(d, "yyyy-MM-dd") : "";
																								setGrnForm({
																									...grnForm,
																									items: newItems
																								});
																							},
																							initialFocus: true
																						})
																					})] })] }),
																					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
																						className: "text-xs",
																						children: ["Expiry Date ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																							className: "text-destructive",
																							children: "*"
																						})]
																					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
																						asChild: true,
																						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																							variant: "outline",
																							className: cn("w-full justify-start text-left font-normal mt-1 h-8 text-xs", !item.expiryDate && "text-muted-foreground"),
																							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar$1, { className: "mr-2 h-3 w-3" }), item.expiryDate ? format(new Date(item.expiryDate), "PPP") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pick a date" })]
																						})
																					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
																						className: "w-auto p-0",
																						align: "start",
																						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, {
																							mode: "single",
																							selected: item.expiryDate ? new Date(item.expiryDate) : void 0,
																							onSelect: (d) => {
																								const newItems = [...editGrnForm.items];
																								newItems[idx].expiryDate = d ? format(d, "yyyy-MM-dd") : "";
																								setGrnForm({
																									...grnForm,
																									items: newItems
																								});
																							},
																							initialFocus: true
																						})
																					})] })] })
																				]
																			})
																		})
																	})] }, idx))
																})]
															})
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-end gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													onClick: () => setGrnOpen(false),
													children: "Cancel"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													disabled: isSubmittingGRN,
													onClick: submitGrn,
													children: isSubmittingGRN ? "Recording..." : "Record Receipt"
												})]
											})
										] })]
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
													children: "GRN Number"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "PO Reference"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Vendor"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium text-right",
													children: "Variance"
												})
											] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
											className: "divide-y divide-border",
											children: [grns.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												colSpan: 4,
												className: "p-4 text-center text-muted-foreground",
												children: "No GRNs recorded."
											}) }), grns.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "hover:bg-surface-2/50 transition-colors",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 font-semibold text-primary",
														children: g.grnNumber
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 font-mono text-xs",
														children: g.purchaseOrderId?.split("-")[0].toUpperCase()
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-ink",
														children: g.vendor?.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right",
														children: g.items?.reduce((acc, item) => acc + item.variance, 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success",
															children: "Exact Match"
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning-foreground",
															children: "Variance Detected"
														})
													})
												]
											}, g.id))]
										})]
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "invoices",
								className: "mt-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between border-b border-border p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-bold text-ink",
											children: "Vendor Invoices"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
											open: invoiceOpen,
											onOpenChange: setInvoiceOpen,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
												asChild: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													size: "sm",
													className: "rounded-xl font-semibold",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Create Invoice"]
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
												className: "max-w-md",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create Vendor Invoice" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Convert a Purchase Order into a payable invoice." })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-4 py-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Select Purchase Order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
																	className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
																	value: invoiceForm.poId,
																	onChange: (e) => setEditInvoiceForm({
																		...editInvoiceForm,
																		poId: e.target.value
																	}),
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "",
																		children: "Select PO..."
																	}), pos.filter((p) => p.status === "Ordered" || p.status === "GRN" || p.status === "Received").map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
																		value: p.id,
																		children: [
																			p.id.split("-")[0].toUpperCase(),
																			" - ",
																			p.vendor?.name
																		]
																	}, p.id))]
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Supplier Invoice Number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	placeholder: "INV-001",
																	value: editInvoiceForm.invoiceNumber,
																	onChange: (e) => setEditInvoiceForm({
																		...editInvoiceForm,
																		invoiceNumber: e.target.value
																	})
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-2 gap-4",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-2",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Due Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		type: "date",
																		value: editInvoiceForm.dueDate,
																		onChange: (e) => setEditInvoiceForm({
																			...editInvoiceForm,
																			dueDate: e.target.value
																		})
																	})]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-2",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "VAT Rate (%)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		type: "number",
																		value: invoiceForm.vatRate,
																		onChange: (e) => setEditInvoiceForm({
																			...editInvoiceForm,
																			vatRate: Number(e.target.value)
																		})
																	})]
																})]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "outline",
														onClick: () => setInvoiceOpen(false),
														children: "Cancel"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														onClick: handleCreateInvoice,
														disabled: isSubmittingInvoice,
														children: isSubmittingInvoice ? "Saving..." : "Create Invoice"
													})] })
												]
											})]
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
													children: "Vendor"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Due Date"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium text-right",
													children: "Amount"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium text-right",
													children: "Payment"
												})
											] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
											className: "divide-y divide-border",
											children: [invoices.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												colSpan: 5,
												className: "p-4 text-center text-muted-foreground",
												children: "No invoices found."
											}) }), invoices.map((inv) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "hover:bg-surface-2/50 transition-colors",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 font-semibold text-primary",
														children: inv.invoiceNumber
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-ink",
														children: inv.vendor?.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-muted-foreground",
														children: new Date(inv.dueDate).toISOString().split("T")[0]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right font-medium",
														children: aed(Number(inv.total))
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${inv.status === "Paid" ? "bg-success/10 text-success" : inv.status === "Pending" ? "bg-warning/10 text-warning-foreground" : "bg-destructive/10 text-destructive"}`,
															children: inv.status
														})
													})
												]
											}, inv.id))]
										})]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "ap",
								className: "mt-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-4 sm:grid-cols-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "panel p-6",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-sm font-semibold text-muted-foreground",
													children: "Total AP Balance"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-2 text-3xl font-extrabold text-ink",
													children: aed(totalAP)
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "panel p-6",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-sm font-semibold text-muted-foreground",
													children: "Due within 7 Days"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-2 text-3xl font-extrabold text-warning-foreground",
													children: aed(due7Days)
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "panel p-6",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-sm font-semibold text-muted-foreground",
													children: "Overdue"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-2 text-3xl font-extrabold text-destructive",
													children: aed(overdue)
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel overflow-hidden mt-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "border-b border-border p-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-bold text-ink",
												children: "Outstanding Vendor Invoices"
											})
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
														children: "Vendor"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium",
														children: "Due Date"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium text-right",
														children: "Amount"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium text-right",
														children: "Balance"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium text-right",
														children: "Status"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 font-medium text-right",
														children: "Action"
													})
												] })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
												className: "divide-y divide-border",
												children: [invoices.filter((i) => i.status !== "Paid").length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													colSpan: 7,
													className: "p-4 text-center text-muted-foreground",
													children: "No outstanding invoices."
												}) }), invoices.filter((i) => i.status !== "Paid").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((inv) => {
													const total = Number(inv.total);
													const remaining = total - Number(inv.paidAmount || 0);
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
														className: "hover:bg-surface-2/50 transition-colors",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 font-medium text-primary font-mono text-xs",
																children: inv.invoiceNumber
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-ink",
																children: inv.vendor?.name
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-warning-foreground font-medium",
																children: new Date(inv.dueDate).toISOString().split("T")[0]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-right font-bold",
																children: aed(total)
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-right font-bold text-destructive",
																children: aed(remaining)
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-right",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "inline-flex items-center rounded bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning-foreground",
																	children: inv.status
																})
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "px-4 py-3 text-right",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "relative group inline-block",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																		size: "sm",
																		variant: "outline",
																		disabled: userRole !== "Head Office Admin",
																		onClick: () => {
																			setTargetInvoiceForPayment(inv);
																			setPaymentForm((prev) => ({
																				...prev,
																				invoiceId: inv.id,
																				amount: remaining
																			}));
																			setPaymentOpen(true);
																		},
																		children: "Record Payment"
																	}), userRole !== "Head Office Admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: "absolute right-0 top-full mt-1 hidden w-48 z-10 p-2 text-xs text-white bg-black rounded group-hover:block",
																		children: "Only authorized finance personnel (Head Office Admin) can record payments."
																	})]
																})
															})
														]
													}, inv.id);
												})]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
										open: paymentOpen,
										onOpenChange: setPaymentOpen,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
											className: "max-w-md",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Record Vendor Payment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: ["Record a payment for invoice ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono font-bold",
													children: targetInvoiceForPayment?.invoiceNumber
												})] })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-4 py-4",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "grid grid-cols-2 gap-4",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Payment Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	type: "date",
																	value: paymentForm.paymentDate,
																	onChange: (e) => setPaymentForm({
																		...paymentForm,
																		paymentDate: e.target.value
																	})
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (AED)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	type: "number",
																	min: "0.01",
																	step: "0.01",
																	max: targetInvoiceForPayment ? Number(targetInvoiceForPayment.total) - Number(targetInvoiceForPayment.paidAmount || 0) : void 0,
																	value: paymentForm.amount,
																	onChange: (e) => setPaymentForm({
																		...paymentForm,
																		amount: Number(e.target.value)
																	})
																})]
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Payment Method" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
																className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
																value: paymentForm.method,
																onChange: (e) => setPaymentForm({
																	...paymentForm,
																	method: e.target.value
																}),
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "Bank Transfer",
																		children: "Bank Transfer"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "Cheque",
																		children: "Cheque"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "Cash",
																		children: "Cash"
																	})
																]
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Reference Number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																placeholder: "Txn ID / Cheque No",
																value: paymentForm.referenceNo,
																onChange: (e) => setPaymentForm({
																	...paymentForm,
																	referenceNo: e.target.value
																})
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Notes (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																placeholder: "Additional details...",
																value: paymentForm.notes,
																onChange: (e) => setPaymentForm({
																	...paymentForm,
																	notes: e.target.value
																})
															})]
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													onClick: () => setPaymentOpen(false),
													children: "Cancel"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													onClick: handleRecordPayment,
													disabled: isSubmittingPayment,
													children: isSubmittingPayment ? "Recording..." : "Record Payment"
												})] })
											]
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "vendors",
								className: "mt-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between border-b border-border p-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-bold text-ink",
											children: "Vendor Directory"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
											open: vendorOpen,
											onOpenChange: setVendorOpen,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
												asChild: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													variant: "outline",
													size: "sm",
													onClick: () => {
														setVendorForm({
															name: "",
															contact: "",
															phone: "",
															email: "",
															trn: "",
															address: "",
															status: "Active"
														});
													},
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Add Vendor"]
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
												className: "max-w-md",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add New Vendor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Enter the details for the new vendor." })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-4 py-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: ["Vendor Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-destructive",
																	children: "*"
																})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	placeholder: "Vendor Company Name",
																	value: vendorForm.name,
																	onChange: (e) => setVendorForm({
																		...vendorForm,
																		name: e.target.value
																	})
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Contact Person" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	placeholder: "John Doe",
																	value: vendorForm.contact,
																	onChange: (e) => setVendorForm({
																		...vendorForm,
																		contact: e.target.value
																	})
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-2 gap-4",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-2",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		placeholder: "+971...",
																		value: vendorForm.phone,
																		onChange: (e) => setVendorForm({
																			...vendorForm,
																			phone: e.target.value
																		})
																	})]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-2",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		type: "email",
																		placeholder: "vendor@example.com",
																		value: vendorForm.email,
																		onChange: (e) => setVendorForm({
																			...vendorForm,
																			email: e.target.value
																		})
																	})]
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-2 gap-4",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-2",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "TRN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		placeholder: "Tax Registration Number",
																		value: vendorForm.trn,
																		onChange: (e) => setVendorForm({
																			...vendorForm,
																			trn: e.target.value
																		})
																	})]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-2",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
																		className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
																		value: vendorForm.status,
																		onChange: (e) => setVendorForm({
																			...vendorForm,
																			status: e.target.value
																		}),
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																			value: "Active",
																			children: "Active"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																			value: "Inactive",
																			children: "Inactive"
																		})]
																	})]
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	placeholder: "Company Address",
																	value: vendorForm.address,
																	onChange: (e) => setVendorForm({
																		...vendorForm,
																		address: e.target.value
																	})
																})]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "outline",
														onClick: () => setVendorOpen(false),
														children: "Cancel"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														onClick: handleCreateVendor,
														disabled: isSubmittingVendor,
														children: isSubmittingVendor ? "Saving..." : "Save Vendor"
													})] })
												]
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full text-left text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
											className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Vendor Name"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-medium",
													children: "Contact Person"
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
											children: [vendors.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												colSpan: 5,
												className: "p-4 text-center text-muted-foreground",
												children: "No vendors found."
											}) }), vendors.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "hover:bg-surface-2/50 transition-colors",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 font-semibold text-ink",
														children: v.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-muted-foreground",
														children: v.contact || "-"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-muted-foreground",
														children: v.email || "-"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.status === "Active" ? "bg-success/10 text-success border border-success/20" : "bg-muted/10 text-muted-foreground border border-border"}`,
															children: v.status || "Active"
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex justify-end gap-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																variant: "outline",
																size: "sm",
																onClick: (e) => {
																	e.stopPropagation();
																	setVendorForm({
																		id: v.id,
																		name: v.name,
																		contact: v.contact || "",
																		phone: v.phone || "",
																		email: v.email || "",
																		trn: v.trn || "",
																		address: v.address || "",
																		status: v.status || "Active"
																	});
																	setVendorOpen(true);
																},
																children: "Edit"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																variant: "destructive",
																size: "sm",
																onClick: (e) => {
																	e.stopPropagation();
																	setDeleteVendorId(v.id);
																},
																children: "Delete"
															})]
														})
													})
												]
											}, v.id))]
										})]
									})]
								})
							})
						]
					})
				]
			}),
			selectedPoId && selectedPoDetails && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-4 shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-xl font-bold text-ink flex items-center gap-2",
								children: ["PO Details ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-sm bg-surface-2 px-2 py-1 rounded text-muted-foreground",
									children: selectedPoDetails.id.split("-")[0].toUpperCase()
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setSelectedPoId(null);
									setSelectedPoDetails(null);
								},
								className: "text-muted-foreground hover:text-ink",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "overflow-y-auto flex-1 pr-2 space-y-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 bg-surface-2 rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-muted-foreground uppercase font-semibold",
											children: "Vendor"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-bold text-ink mt-1",
											children: selectedPoDetails.vendor?.name
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 bg-surface-2 rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-muted-foreground uppercase font-semibold",
											children: "Branch"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-bold text-ink mt-1",
											children: selectedPoDetails.branch?.name ? selectedPoDetails.branch.name : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-destructive font-semibold",
												children: "Missing/Invalid Branch"
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 bg-surface-2 rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-muted-foreground uppercase font-semibold",
											children: "Date Created"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-bold text-ink mt-1",
											children: new Date(selectedPoDetails.createdAt).toLocaleString()
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 bg-surface-2 rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-muted-foreground uppercase font-semibold",
											children: "Status"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-bold text-ink mt-1",
											children: selectedPoDetails.status
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold text-ink mb-3",
									children: "Items"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "border border-border rounded-xl overflow-hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full text-left text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
												className: "bg-surface-2 text-xs font-semibold text-muted-foreground",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-2",
														children: "Product"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-2 text-right",
														children: "Qty"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-2 text-right",
														children: "Unit Price"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-2 text-right",
														children: "Total"
													})
												] })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
												className: "divide-y divide-border",
												children: selectedPoDetails.items?.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-2 font-medium",
														children: item.productName || item.product?.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-2 text-right",
														children: item.quantity != null && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-destructive font-bold text-xs",
															children: "Invalid item data"
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-2 text-right",
														children: aed(Number(item.unitPrice))
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-2 text-right",
														children: item.total != null && !isNaN(item.total) && item.total > 0 ? aed(Number(item.total)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-destructive font-bold text-xs",
															children: "Invalid item data"
														})
													})
												] }, item.id))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tfoot", {
												className: "bg-surface-2 font-bold",
												children: [selectedPoDetails.subtotal != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													colSpan: 3,
													className: "px-4 py-2 text-right text-muted-foreground font-medium",
													children: "Subtotal before VAT:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-4 py-2 text-right",
													children: aed(Number(selectedPoDetails.subtotal))
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													colSpan: 3,
													className: "px-4 py-2 text-right text-muted-foreground font-medium",
													children: [
														"VAT (",
														Number(selectedPoDetails.vatRate),
														"%):"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-4 py-2 text-right",
													children: aed(Number(selectedPoDetails.vatAmount))
												})] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
													className: "border-t border-border/50",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														colSpan: 3,
														className: "px-4 py-3 text-right",
														children: "Total Value:"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-3 text-right text-primary",
														children: aed(Number(selectedPoDetails.total))
													})]
												})]
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-4 mt-4 text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: selectedPoDetails.vendor?.trn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Vendor TRN: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-ink",
										children: selectedPoDetails.vendor.trn
									})] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-right",
										children: selectedPoDetails.tenantTRN && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Company TRN: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-ink",
											children: selectedPoDetails.tenantTRN
										})] })
									})]
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex justify-between gap-3 pt-4 border-t border-border shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => {
										setPoForm({
											id: selectedPoDetails.id,
											vendorId: selectedPoDetails.vendorId,
											branchId: selectedPoDetails.branchId,
											vatRate: Number(selectedPoDetails.vatRate) || 5
										});
										setPoLines(selectedPoDetails.items.map((i) => ({
											productId: i.productId,
											qty: i.quantity,
											unitPrice: Number(i.unitPrice)
										})));
										setPoOpen(true);
									},
									children: "Edit PO"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "destructive",
									onClick: () => {
										setDeletePoId(selectedPoDetails.id);
									},
									children: "Delete PO"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => {
									setSelectedPoId(null);
									setSelectedPoDetails(null);
								},
								children: "Close"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!deletePoId,
				onOpenChange: (open) => {
					if (!open) setDeletePoId(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Delete Purchase Order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Are you sure you want to delete this purchase order? This action cannot be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "mt-4 flex gap-2 justify-end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setDeletePoId(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							onClick: handleCancelPO,
							children: "Confirm Delete"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!deleteVendorId,
				onOpenChange: (open) => {
					if (!open) setDeleteVendorId(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Delete Vendor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Are you sure you want to delete this vendor? This action cannot be undone. Note: You cannot delete a vendor if they have existing purchase orders." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "mt-4 flex gap-2 justify-end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setDeleteVendorId(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							onClick: handleDeleteVendor,
							children: "Confirm Delete"
						})]
					})]
				})
			})
		]
	});
}
//#endregion
export { PurchasingOfficer as component };
