import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as cn, t as Button } from "./button-BlBeOJmP.mjs";
import { y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./server-po8kJpue.mjs";
import { t as createSsrRpc } from "./auth-server-Cg0hQhNk.mjs";
import { n as useAuth } from "./auth-DmKKdzi8.mjs";
import { A as Plus, F as Package, H as LoaderCircle, N as Pencil, P as Pen, Q as Download, R as Menu, S as Search, Tt as Archive, Y as FileText, _ as Star, at as CircleCheck, bt as Ban, ct as CircleAlert, d as TriangleAlert, et as CreditCard, f as TrendingUp, gt as Briefcase, h as Tag, ht as Building2, j as Play, n as X, o as Users, p as Trash2, q as History, rt as Clock, s as User, tt as Coins, v as Square, wt as ArrowLeft } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, n as StatCard, o as TabsTrigger, r as Tabs, t as DemoShell } from "./tabs-Cf1Xb3Zq.mjs";
import { t as Badge } from "./badge-BpuUFK6A.mjs";
import { t as Switch } from "./switch-BbovR4Kp.mjs";
import { n as aedShort, t as aed } from "./demo-data-C-13_S7Y.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { $ as updateCustomerFn, A as adjustCustomerBalanceFn, At as recordGRNServerFn, B as createVendorFn, Ct as createVendorInvoiceServerFn, D as Route$8, Dt as getGrnDetailsServerFn, F as createBranchForTenantFn, G as deleteVendorFn, H as deactivatePromotionFn, I as createCustomerFn, J as handleOverrideRequestFn, K as getCustomerDetailsFn, L as createProductFn, M as applyClearanceFn$1, N as archivePromotionFn, Nt as updatePurchaseOrderServerFn, O as activateBranchFn, Ot as getInvoiceDetailsServerFn, P as createBatchServerFn, Q as updateBranchFn, R as createPromotionFn, St as createPurchaseOrderServerFn, Tt as deletePurchaseOrderServerFn, U as deleteProductFn, V as deactivateBranchFn, W as deleteStaffFn, X as searchCustomersFn, Y as listPromotionsFn, Z as toggleRolePermissionFn, at as updateStockFn, et as updateLoyaltySettingsFn, gt as getBranchesServerFn, ht as getAuditLogsServerFn, it as updateStaffFn, j as adjustCustomerPointsFn, k as activatePromotionFn, nt as updateProductFn, ot as updateVatSettingsFn, q as getCustomerPurchaseHistoryFn, rt as updatePromotionFn, st as updateVendorFn, tt as updatePriceOverrideFn, z as createStaffFn } from "./router-rvz4Z79w.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-dhJPF7rN.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-BTVuOq31.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DUEF7P_7.mjs";
import { t as Input } from "./input-Cexa0DG2.mjs";
import { t as Label } from "./label-CZhEvsKN.mjs";
import { t as require_jspdf_node_min } from "../_libs/jspdf.mjs";
import { c as ResponsiveContainer, i as XAxis, l as Tooltip, n as BarChart, o as CartesianGrid, r as YAxis, s as Bar, u as Legend } from "../_libs/recharts+[...].mjs";
import { n as Root, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/head-office-YqszQGt2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_jspdf_node_min = require_jspdf_node_min();
var Progress = import_react.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
		className: "h-full w-full flex-1 bg-primary transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = Root.displayName;
function CRMTab() {
	const [activeView, setActiveView] = (0, import_react.useState)("list");
	const [selectedCustomerId, setSelectedCustomerId] = (0, import_react.useState)(null);
	const [search, setSearch] = (0, import_react.useState)("");
	const [customers, setCustomers] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [isCreateOpen, setIsCreateOpen] = (0, import_react.useState)(false);
	const [isEditOpen, setIsEditOpen] = (0, import_react.useState)(false);
	const [editingCustomer, setEditingCustomer] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		email: "",
		phone: "",
		isActive: true
	});
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const fetchCustomers = async () => {
		try {
			setLoading(true);
			const res = await searchCustomersFn({ data: {
				search,
				limit: 50,
				page: 1
			} });
			if (res.success) setCustomers(res.customers);
		} catch (err) {
			toast.error(err.message || "Failed to fetch customers");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (activeView === "list") fetchCustomers();
	}, [search, activeView]);
	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		if (!form.name.trim()) return toast.error("Name is required");
		try {
			setIsSubmitting(true);
			if ((await createCustomerFn({ data: {
				name: form.name,
				email: form.email || void 0,
				phone: form.phone || void 0
			} })).success) {
				toast.success("Customer created successfully");
				setIsCreateOpen(false);
				setForm({
					name: "",
					email: "",
					phone: "",
					isActive: true
				});
				fetchCustomers();
			}
		} catch (err) {
			toast.error(err.message || "Failed to create customer");
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleEditSubmit = async (e) => {
		e.preventDefault();
		if (!form.name.trim()) return toast.error("Name is required");
		if (!editingCustomer) return;
		try {
			setIsSubmitting(true);
			if ((await updateCustomerFn({ data: {
				id: editingCustomer.id,
				name: form.name,
				email: form.email || void 0,
				phone: form.phone || void 0,
				isActive: form.isActive
			} })).success) {
				toast.success("Customer updated successfully");
				setIsEditOpen(false);
				setEditingCustomer(null);
				if (activeView === "list") fetchCustomers();
			}
		} catch (err) {
			toast.error(err.message || "Failed to update customer");
		} finally {
			setIsSubmitting(false);
		}
	};
	if (activeView === "details" && selectedCustomerId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerDetailsView, {
		customerId: selectedCustomerId,
		onBack: () => {
			setActiveView("list");
			setSelectedCustomerId(null);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 mt-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-lg font-bold text-ink",
					children: "Customer CRM"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Manage customers, loyalty points, and store credit."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => {
						setForm({
							name: "",
							email: "",
							phone: "",
							isActive: true
						});
						setIsCreateOpen(true);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " New Customer"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1 max-w-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "search",
						placeholder: "Search name, email, or phone...",
						className: "pl-9",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: fetchCustomers,
					disabled: loading,
					children: "Refresh"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Contact" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Points" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Store Credit" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-right",
						children: "Actions"
					})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: loading && customers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 6,
					className: "text-center py-8 text-muted-foreground",
					children: "Loading customers..."
				}) }) : customers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 6,
					className: "text-center py-8 text-muted-foreground",
					children: "No customers found."
				}) }) : customers.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-medium",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "bg-primary/10 p-1.5 rounded-full text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" })
							}), c.name]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm",
						children: c.email || "-"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground",
						children: c.phone || "-"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: c.points }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: ["AED ", Number(c.storeCredit || 0).toFixed(2)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: c.isActive ? "default" : "secondary",
						children: c.isActive ? "Active" : "Inactive"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right space-x-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => {
								setEditingCustomer(c);
								setForm({
									name: c.name,
									email: c.email || "",
									phone: c.phone || "",
									isActive: c.isActive
								});
								setIsEditOpen(true);
							},
							children: "Edit"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "default",
							size: "sm",
							onClick: () => {
								setSelectedCustomerId(c.id);
								setActiveView("details");
							},
							children: "View Details"
						})]
					})
				] }, c.id)) })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isCreateOpen,
				onOpenChange: setIsCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create Customer" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleCreateSubmit,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full Name *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								required: true,
								value: form.name,
								onChange: (e) => setForm({
									...form,
									name: e.target.value
								}),
								placeholder: "Jane Doe"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "email",
								value: form.email,
								onChange: (e) => setForm({
									...form,
									email: e.target.value
								}),
								placeholder: "jane@example.com"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.phone,
								onChange: (e) => setForm({
									...form,
									phone: e.target.value
								}),
								placeholder: "+971501234567"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setIsCreateOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: isSubmitting,
							children: isSubmitting ? "Saving..." : "Create"
						})] })
					]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isEditOpen,
				onOpenChange: setIsEditOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit Customer" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleEditSubmit,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full Name *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								required: true,
								value: form.name,
								onChange: (e) => setForm({
									...form,
									name: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "email",
								value: form.email,
								onChange: (e) => setForm({
									...form,
									email: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.phone,
								onChange: (e) => setForm({
									...form,
									phone: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 pt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: form.isActive,
								onCheckedChange: (c) => setForm({
									...form,
									isActive: c
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Account is Active" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setIsEditOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: isSubmitting,
							children: isSubmitting ? "Saving..." : "Save Changes"
						})] })
					]
				})] })
			})
		]
	});
}
function CustomerDetailsView({ customerId, onBack }) {
	const [customer, setCustomer] = (0, import_react.useState)(null);
	const [history, setHistory] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [isPointsOpen, setIsPointsOpen] = (0, import_react.useState)(false);
	const [isCreditOpen, setIsCreditOpen] = (0, import_react.useState)(false);
	const [adjustAmount, setAdjustAmount] = (0, import_react.useState)("");
	const [adjustReason, setAdjustReason] = (0, import_react.useState)("");
	const [adjustMode, setAdjustMode] = (0, import_react.useState)("add");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const fetchDetails = async () => {
		try {
			setLoading(true);
			const res = await getCustomerDetailsFn({ data: { id: customerId } });
			if (res.success) setCustomer(res.customer);
			const hist = await getCustomerPurchaseHistoryFn({ data: {
				customerId,
				page: 1,
				limit: 10
			} });
			if (hist.success) setHistory(hist);
		} catch (err) {
			toast.error(err.message || "Failed to load customer details");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		fetchDetails();
	}, [customerId]);
	const handleAdjustPoints = async (e) => {
		e.preventDefault();
		if (!adjustReason.trim()) return toast.error("Reason is required");
		const delta = adjustMode === "add" ? Math.abs(Number(adjustAmount)) : -Math.abs(Number(adjustAmount));
		if (delta === 0 || isNaN(delta)) return toast.error("Valid amount required");
		try {
			setIsSubmitting(true);
			if ((await adjustCustomerPointsFn({ data: {
				customerId,
				pointsDelta: delta,
				reason: adjustReason
			} })).success) {
				toast.success("Points adjusted successfully");
				setIsPointsOpen(false);
				fetchDetails();
			}
		} catch (err) {
			toast.error(err.message || "Failed to adjust points");
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleAdjustCredit = async (e) => {
		e.preventDefault();
		if (!adjustReason.trim()) return toast.error("Reason is required");
		const delta = adjustMode === "add" ? Math.abs(Number(adjustAmount)) : -Math.abs(Number(adjustAmount));
		if (delta === 0 || isNaN(delta)) return toast.error("Valid amount required");
		try {
			setIsSubmitting(true);
			if ((await adjustCustomerBalanceFn({ data: {
				customerId,
				amountDelta: delta,
				reason: adjustReason
			} })).success) {
				toast.success("Store credit adjusted successfully");
				setIsCreditOpen(false);
				fetchDetails();
			}
		} catch (err) {
			toast.error(err.message || "Failed to adjust credit");
		} finally {
			setIsSubmitting(false);
		}
	};
	if (loading && !customer) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center text-muted-foreground",
		children: "Loading details..."
	});
	if (!customer) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center text-red-500",
		children: "Customer not found"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				className: "mb-2",
				onClick: onBack,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-2 h-4 w-4" }), " Back to Customers"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel p-6 space-y-4 bg-surface md:col-span-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bg-primary/10 p-3 rounded-full text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-6 w-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-bold text-ink",
							children: customer.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: customer.isActive ? "default" : "secondary",
							className: "mt-1",
							children: customer.isActive ? "Active" : "Inactive"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1 text-sm pt-4 border-t",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Email:"
								}),
								" ",
								customer.email || "N/A"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Phone:"
								}),
								" ",
								customer.phone || "N/A"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Tier:"
								}),
								" ",
								customer.tier
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Joined:"
								}),
								" ",
								new Date(customer.createdAt).toLocaleDateString()
							] })
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel p-6 bg-surface flex flex-col justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-2 text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "h-5 w-5 text-amber-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-ink",
								children: "Loyalty Points"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-3xl font-bold",
							children: customer.points
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "mt-4 w-full",
							onClick: () => {
								setAdjustAmount("");
								setAdjustReason("");
								setIsPointsOpen(true);
							},
							children: "Manual Adjustment"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel p-6 bg-surface flex flex-col justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-2 text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-5 w-5 text-emerald-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-ink",
								children: "Store Credit"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-3xl font-bold",
							children: ["AED ", Number(customer.storeCredit || 0).toFixed(2)]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "mt-4 w-full",
							onClick: () => {
								setAdjustAmount("");
								setAdjustReason("");
								setIsCreditOpen(true);
							},
							children: "Manual Adjustment"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel p-6 bg-surface",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "text-lg font-bold text-ink mb-4 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-5 w-5" }), " Recent Purchase History"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between bg-primary/5 p-4 rounded-xl mb-4 border border-primary/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Total Spend (Lifetime)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xl font-bold text-ink",
							children: ["AED ", history?.totalSpend?.toFixed(2) || "0.00"]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Total Orders"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xl font-bold text-ink",
								children: history?.orderCount || 0
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Order ID" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Source" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Total" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: !history?.orders || history.orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 4,
						className: "text-center py-6 text-muted-foreground",
						children: "No orders found for this customer. Note: POS integration for customer attachment is pending."
					}) }) : history.orders.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "font-medium text-xs",
							children: o.id
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: new Date(o.createdAt).toLocaleString() }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: o.source }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
							className: "font-semibold text-emerald-600",
							children: ["AED ", Number(o.total).toFixed(2)]
						})
					] }, o.id)) })] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isPointsOpen,
				onOpenChange: setIsPointsOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Adjust Loyalty Points" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleAdjustPoints,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Note:" }), " This is a manual audit-logged backend adjustment."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Action" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
									value: adjustMode,
									onChange: (e) => setAdjustMode(e.target.value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "add",
										children: "Add Points"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "deduct",
										children: "Deduct Points"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Points Amount" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: "1",
									required: true,
									value: adjustAmount,
									onChange: (e) => setAdjustAmount(e.target.value)
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Reason (Required for audit log)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								required: true,
								value: adjustReason,
								onChange: (e) => setAdjustReason(e.target.value),
								placeholder: "e.g. Customer complaint resolution"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setIsPointsOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: isSubmitting,
							children: isSubmitting ? "Processing..." : "Confirm Adjustment"
						})] })
					]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isCreditOpen,
				onOpenChange: setIsCreditOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Adjust Store Credit" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleAdjustCredit,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Note:" }), " This is a manual audit-logged backend adjustment."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Action" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
									value: adjustMode,
									onChange: (e) => setAdjustMode(e.target.value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "add",
										children: "Add Credit (AED)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "deduct",
										children: "Deduct Credit (AED)"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (AED)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									step: "0.01",
									min: "0.01",
									required: true,
									value: adjustAmount,
									onChange: (e) => setAdjustAmount(e.target.value)
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Reason (Required for audit log)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								required: true,
								value: adjustReason,
								onChange: (e) => setAdjustReason(e.target.value),
								placeholder: "e.g. Refund for returned item"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setIsCreditOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: isSubmitting,
							children: isSubmitting ? "Processing..." : "Confirm Adjustment"
						})] })
					]
				})] })
			})
		]
	});
}
function PromotionsTab() {
	const [promotions, setPromotions] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [isCreateOpen, setIsCreateOpen] = (0, import_react.useState)(false);
	const [isEditOpen, setIsEditOpen] = (0, import_react.useState)(false);
	const [editingPromo, setEditingPromo] = (0, import_react.useState)(null);
	const [archiveId, setArchiveId] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		discountType: "Percentage",
		discountValue: "",
		startDate: "",
		endDate: "",
		target: "All",
		targetCategory: "",
		targetProductIds: "",
		minQty: "",
		maxQty: ""
	});
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const fetchPromotions = async () => {
		setLoading(true);
		try {
			const res = await listPromotionsFn();
			if (res.success) setPromotions(res.promotions);
		} catch (err) {
			toast.error(err.message || "Failed to load promotions");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		fetchPromotions();
	}, []);
	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		try {
			setIsSubmitting(true);
			if ((await createPromotionFn({ data: {
				name: form.name,
				discountType: form.discountType,
				discountValue: form.discountValue,
				startDate: form.startDate,
				endDate: form.endDate,
				target: form.target,
				targetCategory: form.targetCategory || void 0,
				targetProductIds: form.targetProductIds || void 0,
				minQty: form.minQty ? parseInt(form.minQty) : void 0,
				maxQty: form.maxQty ? parseInt(form.maxQty) : void 0
			} })).success) {
				toast.success("Promotion created successfully");
				setIsCreateOpen(false);
				setForm({
					name: "",
					discountType: "Percentage",
					discountValue: "",
					startDate: "",
					endDate: "",
					target: "All",
					targetCategory: "",
					targetProductIds: "",
					minQty: "",
					maxQty: ""
				});
				fetchPromotions();
			}
		} catch (err) {
			toast.error(err.message || "Failed to create promotion");
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleEditSubmit = async (e) => {
		e.preventDefault();
		if (!editingPromo) return;
		try {
			setIsSubmitting(true);
			if ((await updatePromotionFn({ data: {
				id: editingPromo.id,
				name: form.name,
				discountType: form.discountType,
				discountValue: form.discountValue,
				startDate: form.startDate,
				endDate: form.endDate,
				target: form.target,
				targetCategory: form.targetCategory || void 0,
				targetProductIds: form.targetProductIds || void 0,
				minQty: form.minQty ? parseInt(form.minQty) : void 0,
				maxQty: form.maxQty ? parseInt(form.maxQty) : void 0
			} })).success) {
				toast.success("Promotion updated successfully");
				setIsEditOpen(false);
				setEditingPromo(null);
				fetchPromotions();
			}
		} catch (err) {
			toast.error(err.message || "Failed to update promotion");
		} finally {
			setIsSubmitting(false);
		}
	};
	const openEdit = (promo) => {
		setEditingPromo(promo);
		setForm({
			name: promo.name,
			discountType: promo.discountType,
			discountValue: promo.discountValue,
			startDate: new Date(promo.startDate).toISOString().split("T")[0],
			endDate: new Date(promo.endDate).toISOString().split("T")[0],
			target: promo.target || "All",
			targetCategory: promo.targetCategory || "",
			targetProductIds: promo.targetProductIds || "",
			minQty: promo.minQty ? String(promo.minQty) : "",
			maxQty: promo.maxQty ? String(promo.maxQty) : ""
		});
		setIsEditOpen(true);
	};
	const handleAction = async (action, id) => {
		try {
			if (action === "activate") {
				await activatePromotionFn({ data: { id } });
				toast.success(`Promotion activated successfully`);
				fetchPromotions();
			} else if (action === "deactivate") {
				await deactivatePromotionFn({ data: { id } });
				toast.success(`Promotion deactivated successfully`);
				fetchPromotions();
			} else if (action === "archive") setArchiveId(id);
		} catch (err) {
			toast.error(err.message || `Failed to ${action} promotion`);
		}
	};
	const confirmArchive = async () => {
		if (!archiveId) return;
		try {
			await archivePromotionFn({ data: { id: archiveId } });
			toast.success("Promotion archived successfully");
			fetchPromotions();
		} catch (err) {
			toast.error(err.message || "Failed to archive promotion");
		} finally {
			setArchiveId(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-ink",
					children: "Dynamic pricing engine active. POS integration is pending (calculations work, but are not yet wired to checkout)."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-2xl font-extrabold text-ink tracking-tight",
					children: "Promotions & Discounts"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setIsCreateOpen(true),
					className: "rounded-full font-bold shadow-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " New Promotion"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl border border-stone-200 bg-white/50 backdrop-blur-xl shadow-sm overflow-hidden",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "p-8 text-center text-sm font-medium text-muted-foreground",
					children: "Loading promotions..."
				}) : promotions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-12 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "mx-auto h-12 w-12 text-stone-300 mb-4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-bold text-ink",
							children: "No promotions yet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground mt-1",
							children: "Create your first promotion to boost sales."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
					className: "bg-stone-50/50",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "font-semibold text-ink",
							children: "Name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "font-semibold text-ink",
							children: "Type"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "font-semibold text-ink",
							children: "Discount"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "font-semibold text-ink",
							children: "Target"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "font-semibold text-ink",
							children: "Valid Until"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "font-semibold text-ink",
							children: "Status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "font-semibold text-ink text-right",
							children: "Actions"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: promotions.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-bold text-ink",
						children: p.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "rounded-full bg-stone-50 text-xs",
						children: p.discountType
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold text-primary",
						children: p.discountType === "Percentage" ? `${p.discountValue}%` : `AED ${p.discountValue}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-medium",
						children: p.target
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-sm tabular-nums text-muted-foreground",
						children: new Date(p.endDate).toLocaleDateString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						className: `rounded-full text-xs font-semibold ${p.status === "Active" ? "bg-success/10 text-success" : "bg-stone-100 text-stone-500"}`,
						children: p.status
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right space-x-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "h-8 w-8 text-stone-500",
								onClick: () => openEdit(p),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "h-4 w-4" })
							}),
							p.status === "Active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "h-8 w-8 text-stone-500",
								onClick: () => handleAction("deactivate", p.id),
								title: "Deactivate",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "h-4 w-4" })
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "h-8 w-8 text-success",
								onClick: () => handleAction("activate", p.id),
								title: "Activate",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "h-8 w-8 text-destructive",
								onClick: () => handleAction("archive", p.id),
								title: "Archive",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "h-4 w-4" })
							})
						]
					})
				] }, p.id)) })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isCreateOpen,
				onOpenChange: setIsCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-[500px] border-stone-200/50 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "text-2xl font-extrabold text-ink flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-5 w-5 text-primary" }), " Create Promotion"]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleCreateSubmit,
						className: "space-y-4 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Promotion Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.name,
										onChange: (e) => setForm({
											...form,
											name: e.target.value
										}),
										required: true,
										placeholder: "e.g. Summer Sale"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Discount Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: form.discountType,
										onValueChange: (v) => setForm({
											...form,
											discountType: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "Percentage",
											children: "Percentage (%)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "Fixed",
											children: "Fixed Amount (AED)"
										})] })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Discount Value" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										step: "0.01",
										value: form.discountValue,
										onChange: (e) => setForm({
											...form,
											discountValue: e.target.value
										}),
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Start Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: form.startDate,
										onChange: (e) => setForm({
											...form,
											startDate: e.target.value
										}),
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "End Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: form.endDate,
										onChange: (e) => setForm({
											...form,
											endDate: e.target.value
										}),
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Target Scope" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: form.target,
										onValueChange: (v) => setForm({
											...form,
											target: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "All",
												children: "All Products"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Category",
												children: "Specific Category"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Product",
												children: "Specific Products"
											})
										] })]
									})]
								}),
								form.target === "Category" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category ID" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.targetCategory,
										onChange: (e) => setForm({
											...form,
											targetCategory: e.target.value
										}),
										placeholder: "e.g. Beverages"
									})]
								}),
								form.target === "Product" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Product IDs (comma separated)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.targetProductIds,
										onChange: (e) => setForm({
											...form,
											targetProductIds: e.target.value
										}),
										placeholder: "e.g. PROD-1, PROD-2"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Min Quantity (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										value: form.minQty,
										onChange: (e) => setForm({
											...form,
											minQty: e.target.value
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Max Quantity (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										value: form.maxQty,
										onChange: (e) => setForm({
											...form,
											maxQty: e.target.value
										})
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								onClick: () => setIsCreateOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: isSubmitting,
								className: "rounded-full font-bold",
								children: isSubmitting ? "Saving..." : "Create"
							})]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isEditOpen,
				onOpenChange: setIsEditOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-[500px] border-stone-200/50 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "text-2xl font-extrabold text-ink flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "h-5 w-5 text-primary" }), " Edit Promotion"]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleEditSubmit,
						className: "space-y-4 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Promotion Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.name,
										onChange: (e) => setForm({
											...form,
											name: e.target.value
										}),
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Discount Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: form.discountType,
										onValueChange: (v) => setForm({
											...form,
											discountType: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "Percentage",
											children: "Percentage (%)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "Fixed",
											children: "Fixed Amount (AED)"
										})] })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Discount Value" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										step: "0.01",
										value: form.discountValue,
										onChange: (e) => setForm({
											...form,
											discountValue: e.target.value
										}),
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Start Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: form.startDate,
										onChange: (e) => setForm({
											...form,
											startDate: e.target.value
										}),
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "End Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: form.endDate,
										onChange: (e) => setForm({
											...form,
											endDate: e.target.value
										}),
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Target Scope" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: form.target,
										onValueChange: (v) => setForm({
											...form,
											target: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "All",
												children: "All Products"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Category",
												children: "Specific Category"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Product",
												children: "Specific Products"
											})
										] })]
									})]
								}),
								form.target === "Category" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category ID" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.targetCategory,
										onChange: (e) => setForm({
											...form,
											targetCategory: e.target.value
										})
									})]
								}),
								form.target === "Product" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Product IDs (comma separated)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.targetProductIds,
										onChange: (e) => setForm({
											...form,
											targetProductIds: e.target.value
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Min Quantity (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										value: form.minQty,
										onChange: (e) => setForm({
											...form,
											minQty: e.target.value
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Max Quantity (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										value: form.maxQty,
										onChange: (e) => setForm({
											...form,
											maxQty: e.target.value
										})
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								onClick: () => setIsEditOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: isSubmitting,
								className: "rounded-full font-bold",
								children: isSubmitting ? "Saving..." : "Save Changes"
							})]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!archiveId,
				onOpenChange: (open) => !open && setArchiveId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-[420px] border-stone-200/50 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-xl font-extrabold text-ink flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "h-5 w-5 text-destructive" }), " Archive Promotion"]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-4 text-ink font-medium",
							children: "Are you sure you want to archive this promotion? It will be hidden from the active lists and cannot be modified later."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "gap-2 sm:gap-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								onClick: () => setArchiveId(null),
								className: "rounded-full font-bold",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "destructive",
								onClick: confirmArchive,
								className: "rounded-full font-bold",
								children: "Archive"
							})]
						})
					]
				})
			})
		]
	});
}
var getSalesSummaryReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("ed1879e870eca2e0baff3e4940ec3378c1ca34b2523408a6f44e1b8424f9adf0"));
var getBranchSalesReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("f5addc031bb269afe1ffd8c8ee7cf1273714a75bb87760cf4f6cd5d504594252"));
var getProductSalesReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("4eb07c7716f722095f34d9359f49637e406c1b68ec4fd87a180a196e62dbd533"));
var getCategorySalesReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("9d2d54b040273b21ada15e1d168a56a953f34dfd1e3a324a4a4b9e57e5e3b6d3"));
var getCashierSalesReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("0a9ed05516c2beac1016df848ec593e291a0ea14a760dfb8e35678cb8c32d353"));
var getInventoryValuationReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("3c17d20decc1659eeedaa41a740fc65c00fb550755956ce54fdf3b08cf8e8dac"));
var getLowStockReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("11863964c60ea47bdb8a72de230c68b71532b93c94cd24f0cdfdb8d9f9af7344"));
var getExpiryReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("1597975d68b12a1734ea0160162e3b540e09831d31f809625ed4e855f89445d0"));
var getPurchaseReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("dbf75f03c880457a38dd40db164c224a01fdf55726119654a9a3fa3aa7d5623c"));
var getVendorReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("d5a281885a2ebf18a8bff4e3f79303b7a0a0c35fd8a3e0c4d5fb83cc2efaa00f"));
var getVatSummaryReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("2343d3542a9aa6287410998e7c5334591d9e50a6ac5ff35a38740222cef8801b"));
function ReportsTab() {
	const [reportType, setReportType] = (0, import_react.useState)("sales-summary");
	const [startDate, setStartDate] = (0, import_react.useState)(new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() - 1)).toISOString().split("T")[0]);
	const [endDate, setEndDate] = (0, import_react.useState)(new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() + 1)).toISOString().split("T")[0]);
	const [branchId, setBranchId] = (0, import_react.useState)("all");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [reportData, setReportData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const { data: branchesRes } = useQuery({
		queryKey: ["head-office-branches"],
		queryFn: async () => await getBranchesServerFn()
	});
	const generateReport = async () => {
		setLoading(true);
		setError(null);
		setReportData(null);
		try {
			let res;
			const bId = branchId === "all" ? void 0 : branchId;
			switch (reportType) {
				case "sales-summary":
					res = await getSalesSummaryReportFn({ data: {
						startDate,
						endDate,
						branchId: bId
					} });
					break;
				case "branch-sales":
					res = await getBranchSalesReportFn({ data: {
						startDate,
						endDate
					} });
					break;
				case "product-sales":
					res = await getProductSalesReportFn({ data: {
						startDate,
						endDate,
						branchId: bId
					} });
					break;
				case "category-sales":
					res = await getCategorySalesReportFn({ data: {
						startDate,
						endDate,
						branchId: bId
					} });
					break;
				case "cashier-sales":
					res = await getCashierSalesReportFn({ data: {
						startDate,
						endDate,
						branchId: bId
					} });
					break;
				case "inventory-valuation":
					res = await getInventoryValuationReportFn({ data: { branchId: bId } });
					break;
				case "low-stock":
					res = await getLowStockReportFn({ data: { branchId: bId } });
					break;
				case "expiry":
					res = await getExpiryReportFn({ data: {
						branchId: bId,
						daysThreshold: 30
					} });
					break;
				case "purchase":
					res = await getPurchaseReportFn({ data: {
						startDate,
						endDate,
						branchId: bId
					} });
					break;
				case "vendor":
					res = await getVendorReportFn({ data: {
						startDate,
						endDate
					} });
					break;
				case "vat-summary":
					res = await getVatSummaryReportFn({ data: {
						startDate,
						endDate
					} });
					break;
				default: throw new Error("Invalid report type");
			}
			if (res && res.success) setReportData(res.data);
			else throw new Error("Failed to load report data");
		} catch (err) {
			setError(err.message || "An error occurred while generating the report.");
			toast.error(err.message || "Report generation failed");
		} finally {
			setLoading(false);
		}
	};
	const handleExportCsv = () => {
		if (!reportData) return;
		try {
			let csvContent = "data:text/csv;charset=utf-8,";
			let headers = [];
			if (Array.isArray(reportData)) {
				if (reportData.length === 0) {
					toast.info("No data to export");
					return;
				}
				headers = Object.keys(reportData[0]);
				csvContent += headers.join(",") + "\n";
				reportData.forEach((item) => {
					const row = headers.map((header) => {
						let val = item[header];
						if (val === null || val === void 0) val = "";
						val = String(val).replace(/"/g, "\"\"");
						return `"${val}"`;
					});
					csvContent += row.join(",") + "\n";
				});
			} else {
				headers = ["Metric", "Value"];
				csvContent += headers.join(",") + "\n";
				Object.entries(reportData).forEach(([key, val]) => {
					let strVal = String(val).replace(/"/g, "\"\"");
					csvContent += `"${key}","${strVal}"\n`;
				});
			}
			const encodedUri = encodeURI(csvContent);
			const link = document.createElement("a");
			link.setAttribute("href", encodedUri);
			link.setAttribute("download", `${reportType}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (err) {
			toast.error("Failed to export CSV");
		}
	};
	const needsDate = ![
		"inventory-valuation",
		"low-stock",
		"expiry"
	].includes(reportType);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-2xl shadow-sm border border-stone-200",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 w-full sm:w-1/4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Report Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: reportType,
						onValueChange: setReportType,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "sales-summary",
								children: "Sales Summary"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "branch-sales",
								children: "Branch Sales"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "product-sales",
								children: "Product Sales"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "category-sales",
								children: "Category Sales"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "cashier-sales",
								children: "Cashier Sales"
							})
						] })]
					})]
				}),
				needsDate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 w-full sm:w-1/5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Start Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: startDate,
						onChange: (e) => setStartDate(e.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 w-full sm:w-1/5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "End Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: endDate,
						onChange: (e) => setEndDate(e.target.value)
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 w-full sm:w-1/5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Branch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: branchId,
						onValueChange: setBranchId,
						disabled: reportType === "branch-sales",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All Branches"
						}), branchesRes?.success && branchesRes.branches?.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: b.id,
							children: b.name
						}, b.id))] })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: generateReport,
					disabled: loading,
					className: "w-full sm:w-auto font-bold rounded-xl",
					children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-2 h-4 w-4" }), "Generate"]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden min-h-[400px]",
			children: [
				!reportData && !loading && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center justify-center h-[400px] text-stone-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-16 w-16 mb-4 opacity-20" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium text-lg text-ink/70",
						children: "Select options and generate a report"
					})]
				}),
				loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center justify-center h-[400px] text-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-12 w-12 animate-spin mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold animate-pulse",
						children: "Crunching numbers..."
					})]
				}),
				error && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center justify-center h-[400px] text-destructive",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-12 w-12 mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold",
						children: error
					})]
				}),
				reportData && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "font-bold text-lg capitalize",
								children: [reportType.replace("-", " "), " Results"]
							}),
							needsDate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground",
								children: [
									"Period: ",
									startDate,
									" to ",
									endDate
								]
							}),
							reportType === "vat-summary" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-warning mt-1",
								children: reportData.notes
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: handleExportCsv,
							className: "rounded-full shadow-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-4 w-4 mr-2" }), " Export CSV"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: Array.isArray(reportData) ? reportData.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
							className: "bg-stone-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: Object.keys(reportData[0]).map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "capitalize",
								children: key.replace(/([A-Z])/g, " $1").trim()
							}, key)) })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: reportData.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: Object.values(row).map((val, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: val !== null && val !== void 0 ? String(val) : "-" }, j)) }, i)) })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center py-10 text-stone-500 font-medium",
							children: "No results found for this period/filter."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
							children: Object.entries(reportData).map(([key, val]) => {
								if (key === "notes") return null;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-stone-50 p-4 rounded-xl border border-stone-100",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-stone-500 capitalize",
										children: key.replace(/([A-Z])/g, " $1").trim()
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-2xl font-bold text-ink truncate mt-1",
										children: val !== null && val !== void 0 ? String(val) : "-"
									})]
								}, key);
							})
						})
					})]
				})
			]
		})]
	});
}
var tierTone = {
	Platinum: "bg-primary/10 text-primary border-primary/20",
	Gold: "bg-accent/25 text-accent-foreground border-accent/30",
	Silver: "bg-secondary text-secondary-foreground border-border",
	Bronze: "bg-surface-2 text-muted-foreground border-border"
};
function expiryTone(days) {
	if (days <= 3) return "bg-destructive/10 text-destructive border-destructive/20";
	if (days <= 14) return "bg-warning/15 text-warning-foreground border-warning/30";
	return "bg-success/12 text-success border-success/20";
}
function HeadOffice() {
	const router = useRouter();
	const data = Route$8.useLoaderData();
	const { role } = useAuth();
	const [inclusive, setInclusive] = (0, import_react.useState)(data?.settings?.vatInclusive ?? true);
	const [vatRate, setVatRate] = (0, import_react.useState)(data?.settings?.vatRate ?? "5.00");
	const [loyaltyRate, setLoyaltyRate] = (0, import_react.useState)(data?.settings?.loyaltyRedemptionRate ?? "0.01");
	const [loyaltyPointsPerAed, setLoyaltyPointsPerAed] = (0, import_react.useState)(String(data?.settings?.loyaltyPointsPerAed ?? 10));
	const [loyaltyMinPointsToRedeem, setLoyaltyMinPointsToRedeem] = (0, import_react.useState)(String(data?.settings?.loyaltyMinPointsToRedeem ?? 5e3));
	const [isSavingLoyalty, setIsSavingLoyalty] = (0, import_react.useState)(false);
	const [isCreateCampaignOpen, setIsCreateCampaignOpen] = (0, import_react.useState)(false);
	const [isSavingCampaign, setIsSavingCampaign] = (0, import_react.useState)(false);
	const [campaignForm, setCampaignForm] = (0, import_react.useState)({
		name: "",
		type: "Percentage discount",
		target: "All products",
		value: "",
		startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] || "",
		endDate: new Date(Date.now() + 2592e6).toISOString().split("T")[0] || "",
		status: "Draft"
	});
	const [selectedCategory, setSelectedCategory] = (0, import_react.useState)("");
	const [selectedProductIds, setSelectedProductIds] = (0, import_react.useState)([]);
	const [bundleItems, setBundleItems] = (0, import_react.useState)([{
		productId: "",
		qty: 1
	}, {
		productId: "",
		qty: 1
	}]);
	const [pricingBasis, setPricingBasis] = (0, import_react.useState)("Percentage adjustment");
	const [minQty, setMinQty] = (0, import_react.useState)("");
	const [maxQty, setMaxQty] = (0, import_react.useState)("");
	const [startTime, setStartTime] = (0, import_react.useState)("");
	const [endTime, setEndTime] = (0, import_react.useState)("");
	const mappedOutlets = (0, import_react.useMemo)(() => {
		return (data?.branches || []).map((b) => ({
			id: b.id,
			name: b.name,
			emirate: b.address || "Dubai",
			tills: b.tillCount || 1,
			sales: 0,
			growth: 0,
			stockHealth: 100
		}));
	}, [data?.branches]);
	const mappedProducts = (0, import_react.useMemo)(() => {
		return (data?.products || []).map((p) => {
			const totalStock = (data?.stock || []).filter((s) => s.productId === p.id).reduce((acc, s) => acc + s.stock, 0);
			return {
				id: p.id,
				sku: p.sku || p.id.slice(0, 8),
				name: p.name,
				barcode: p.barcode,
				unit: p.unit ?? "pcs",
				category: p.category || "General",
				cost: Number(p.costPrice) || 0,
				price: Number(p.salePrice) || 0,
				vat: p.vatIncluded ? "Inc" : "Exc",
				stock: totalStock,
				isBatchTracked: p.isBatchTracked === false ? false : true,
				costPriceRaw: p.costPrice,
				salePriceRaw: p.salePrice
			};
		});
	}, [data?.products, data?.stock]);
	const mappedBatches = (0, import_react.useMemo)(() => {
		return (data?.batches || []).map((b) => {
			const product = (data?.products || []).find((p) => p.id === b.productId);
			const branch = (data?.branches || []).find((br) => br.id === b.branchId);
			const expiry = new Date(b.expiryDate);
			const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 864e5);
			return {
				id: b.id,
				product: product ? product.name : "Unknown",
				productId: b.productId,
				batch: b.batchNumber,
				outlet: branch ? branch.name : "HQ",
				rule: "FEFO",
				qty: b.stockQuantity || b.stock,
				expiry: expiry.toISOString().split("T")[0],
				daysLeft
			};
		});
	}, [
		data?.batches,
		data?.products,
		data?.branches
	]);
	const mappedPurchases = (0, import_react.useMemo)(() => {
		return (data?.purchases || []).map((p) => {
			let stage = "PO";
			if (p.status === "GRN" || p.status === "Received") stage = "GRN";
			if (p.status === "Invoiced" || p.status === "Paid") stage = "Invoice";
			return {
				rawId: p.id,
				id: p.id.split("-")[0].toUpperCase(),
				stage,
				vendor: p.vendor?.name || "Unknown Vendor",
				vendorId: p.vendorId,
				branchId: p.branchId,
				value: Number(p.total) || 0,
				items: p.items || []
			};
		});
	}, [data?.purchases]);
	const mappedVendors = (0, import_react.useMemo)(() => (data?.vendors || []).map((v) => ({
		id: v.id,
		name: v.name
	})), [data?.vendors]);
	const mappedRoles = (0, import_react.useMemo)(() => {
		return [
			{
				role: "Super Admin",
				users: (data?.staff || []).filter((u) => u.role === "super_admin").length,
				perms: ["Full platform access"]
			},
			{
				role: "Head Office Admin",
				users: (data?.staff || []).filter((u) => u.role === "head_office_admin").length,
				perms: [
					"View all branches",
					"Global settings",
					"Purchasing",
					"Roles"
				]
			},
			{
				role: "Branch Manager",
				users: (data?.staff || []).filter((u) => u.role === "branch_manager").length,
				perms: [
					"Branch override",
					"Local stock",
					"Pricing adjustments",
					"Till management",
					"Shift & staff"
				]
			},
			{
				role: "Inventory Manager",
				users: (data?.staff || []).filter((u) => u.role === "inventory_manager").length,
				perms: ["Stock adjust", "Receive goods"]
			},
			{
				role: "Purchasing Officer",
				users: (data?.staff || []).filter((u) => u.role === "purchasing_officer").length,
				perms: ["Create PO", "Receive invoices"]
			},
			{
				role: "Cashier",
				users: (data?.staff || []).filter((u) => u.role === "cashier").length,
				perms: [
					"Process sales",
					"Refunds",
					"End of shift"
				]
			}
		].filter((r) => r.users > 0 || r.role === "Head Office Admin");
	}, [data?.staff]);
	const totalSales = (0, import_react.useMemo)(() => mappedOutlets.reduce((s, o) => s + o.sales, 0), [mappedOutlets]);
	const nearExpiry = (0, import_react.useMemo)(() => mappedBatches.filter((b) => b.daysLeft <= 14).length, [mappedBatches]);
	const [adjustOpen, setAdjustOpen] = (0, import_react.useState)(false);
	const [batchOpen, setBatchOpen] = (0, import_react.useState)(false);
	const [transferOpen, setTransferOpen] = (0, import_react.useState)(false);
	const [addBatchOpen, setAddBatchOpen] = (0, import_react.useState)(false);
	const [addBatchForm, setAddBatchForm] = (0, import_react.useState)({
		productId: "",
		branchId: "",
		batchNumber: "",
		expiryDate: "",
		initialStock: 0
	});
	const [isAddingBatch, setIsAddingBatch] = (0, import_react.useState)(false);
	const [invForm, setInvForm] = (0, import_react.useState)({
		branchId: "",
		productId: "",
		qty: "",
		type: "add",
		targetBranchId: "",
		batchNumber: "",
		expiryDate: ""
	});
	const [poModalOpen, setPoModalOpen] = (0, import_react.useState)(false);
	const [poForm, setPoForm] = (0, import_react.useState)({
		vendorId: "",
		branchId: ""
	});
	const [poItems, setPoItems] = (0, import_react.useState)([]);
	const [staffModalOpen, setStaffModalOpen] = (0, import_react.useState)(false);
	const [staffForm, setStaffForm] = (0, import_react.useState)({
		id: "",
		name: "",
		email: "",
		role: "cashier",
		branchId: "",
		password: "",
		pin: "",
		isActive: true
	});
	const [grnModalOpen, setGrnModalOpen] = (0, import_react.useState)(false);
	const [grnForm, setGrnForm] = (0, import_react.useState)({
		purchaseOrderId: "",
		vendorId: "",
		branchId: "",
		items: []
	});
	const [productFormOpen, setProductFormOpen] = (0, import_react.useState)(false);
	const [isEditingProduct, setIsEditingProduct] = (0, import_react.useState)(false);
	const [productForm, setProductForm] = (0, import_react.useState)({
		id: "",
		name: "",
		barcode: "",
		category: "",
		unit: "",
		costPrice: "",
		salePrice: "",
		isBatchTracked: false
	});
	const [deleteProductContext, setDeleteProductContext] = (0, import_react.useState)(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = (0, import_react.useState)(false);
	const [isDeleting, setIsDeleting] = (0, import_react.useState)(false);
	const [branchAddOpen, setBranchAddOpen] = (0, import_react.useState)(false);
	const [newBranchName, setNewBranchName] = (0, import_react.useState)("");
	const [newBranchAddress, setNewBranchAddress] = (0, import_react.useState)("");
	const [isCreatingBranch, setIsCreatingBranch] = (0, import_react.useState)(false);
	const [editingBranchId, setEditingBranchId] = (0, import_react.useState)(null);
	const [editBranchName, setEditBranchName] = (0, import_react.useState)("");
	const [editBranchAddress, setEditBranchAddress] = (0, import_react.useState)("");
	const [auditLogsData, setAuditLogsData] = (0, import_react.useState)([]);
	const [isLoadingLogs, setIsLoadingLogs] = (0, import_react.useState)(false);
	const [activeTab, setActiveTab] = (0, import_react.useState)("dashboard");
	const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, import_react.useState)(false);
	const [auditLogsPage, setAuditLogsPage] = (0, import_react.useState)(1);
	const auditLogsPerPage = 10;
	(0, import_react.useEffect)(() => {
		if (activeTab === "audit_logs") {
			setIsLoadingLogs(true);
			getAuditLogsServerFn({ data: { limit: 100 } }).then((res) => {
				if (res.success) setAuditLogsData(res.logs || []);
				else toast.error("Failed to load audit logs");
			}).catch((err) => {
				toast.error(err.message || "Failed to load audit logs");
			}).finally(() => {
				setIsLoadingLogs(false);
			});
		}
	}, [activeTab]);
	const [vendorFormOpen, setVendorFormOpen] = (0, import_react.useState)(false);
	const [isEditingVendor, setIsEditingVendor] = (0, import_react.useState)(false);
	const [vendorForm, setVendorForm] = (0, import_react.useState)({
		id: "",
		name: "",
		contact: "",
		phone: "",
		email: "",
		address: "",
		status: "Active",
		trn: ""
	});
	const [deleteVendorContext, setDeleteVendorContext] = (0, import_react.useState)(null);
	const [deleteVendorDialogOpen, setDeleteVendorDialogOpen] = (0, import_react.useState)(false);
	const [isDeletingVendor, setIsDeletingVendor] = (0, import_react.useState)(false);
	const [deletePoContext, setDeletePoContext] = (0, import_react.useState)(null);
	const [deletePoDialogOpen, setDeletePoDialogOpen] = (0, import_react.useState)(false);
	const [isDeletingPo, setIsDeletingPo] = (0, import_react.useState)(false);
	const [editPoOpen, setEditPoOpen] = (0, import_react.useState)(false);
	const [editPoForm, setEditPoForm] = (0, import_react.useState)({
		id: "",
		vendorId: "",
		branchId: "",
		items: []
	});
	const [isSavingPo, setIsSavingPo] = (0, import_react.useState)(false);
	const [isSubmittingGRN, setIsSubmittingGRN] = (0, import_react.useState)(false);
	const [invoiceModalOpen, setInvoiceModalOpen] = (0, import_react.useState)(false);
	const [invoiceForm, setInvoiceForm] = (0, import_react.useState)({
		purchaseOrderId: "",
		poNumber: "",
		grnNumber: "",
		vendorName: "",
		branchName: "",
		invoiceNumber: "",
		dueDate: "",
		items: [],
		subtotal: 0,
		vat: 0,
		total: 0,
		vatRate: 5,
		vatInclusive: true
	});
	const [isSubmittingInvoice, setIsSubmittingInvoice] = (0, import_react.useState)(false);
	const [invoiceDetailModalOpen, setInvoiceDetailModalOpen] = (0, import_react.useState)(false);
	const [invoiceDetail, setInvoiceDetail] = (0, import_react.useState)(null);
	const [isDetailLoading, setIsDetailLoading] = (0, import_react.useState)(false);
	const [isGeneratingPdf, setIsGeneratingPdf] = (0, import_react.useState)(false);
	const [isGeneratingFtaReport, setIsGeneratingFtaReport] = (0, import_react.useState)(false);
	const downloadFtaSummary = async () => {
		setIsGeneratingFtaReport(true);
		const loadToast = toast.loading("Generating FTA Tax Summary Report...");
		try {
			const doc = new import_jspdf_node_min.jsPDF();
			const primaryColor = [
				27,
				38,
				59
			];
			const accentColor = [
				65,
				90,
				119
			];
			const textColor = [
				33,
				37,
				41
			];
			const mutedTextColor = [
				108,
				117,
				125
			];
			doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
			doc.rect(0, 0, 210, 40, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(20);
			doc.setTextColor(255, 255, 255);
			doc.text("FTA VAT SUMMARY REPORT", 14, 25);
			doc.setTextColor(textColor[0], textColor[1], textColor[2]);
			doc.setFontSize(10);
			let currentY = 55;
			doc.setFont("helvetica", "bold");
			doc.text("Taxable Person Details", 14, currentY);
			doc.text("Report Parameters", 110, currentY);
			doc.setFont("helvetica", "normal");
			currentY += 6;
			doc.text(`Business Name: ${data?.tenantName || "Tenant"}`, 14, currentY);
			doc.text(`Reporting Period: ${data?.reportingPeriod || "All Time"}`, 110, currentY);
			currentY += 5;
			doc.text(`TRN: ${data?.settings?.taxRegistrationNumber || "Not Registered"}`, 14, currentY);
			doc.text(`Date Generated: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-GB")}`, 110, currentY);
			currentY += 5;
			doc.text(`Standard Tax Rate: ${data?.settings?.vatRate || "5.00"}%`, 14, currentY);
			doc.text("Currency: AED", 110, currentY);
			currentY += 10;
			doc.setDrawColor(222, 226, 230);
			doc.line(14, currentY, 200, currentY);
			currentY += 12;
			doc.setFont("helvetica", "bold");
			doc.setFontSize(12);
			doc.text("VAT Return Summary Table", 14, currentY);
			currentY += 8;
			doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
			doc.rect(14, currentY, 186, 8, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(9);
			doc.setTextColor(255, 255, 255);
			doc.text("Description (FTA Return Box Reference)", 16, currentY + 5.5);
			doc.text("Gross Amount (AED)", 115, currentY + 5.5);
			doc.text("VAT Amount (AED)", 160, currentY + 5.5);
			const drawRow = (desc, gross, vat, isTotal = false) => {
				currentY += 8;
				if (isTotal) {
					doc.setFillColor(241, 243, 245);
					doc.rect(14, currentY, 186, 8, "F");
					doc.setFont("helvetica", "bold");
					doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
				} else {
					doc.setFont("helvetica", "normal");
					doc.setTextColor(textColor[0], textColor[1], textColor[2]);
				}
				doc.text(desc, 16, currentY + 5.5);
				doc.text(gross.toLocaleString("en-US", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				}), 115, currentY + 5.5);
				doc.text(vat.toLocaleString("en-US", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				}), 160, currentY + 5.5);
				doc.setDrawColor(233, 236, 239);
				doc.line(14, currentY + 8, 200, currentY + 8);
			};
			const outVat = Number(data?.outputVat || 0);
			const inVat = Number(data?.inputVat || 0);
			const netVat = outVat - inVat;
			const salesTotal = Number(data?.salesTotal || 0);
			const purchasesTotal = Number(data?.purchasesTotal || 0);
			drawRow("Standard Rated Supplies (Box 1a - Sales)", salesTotal, outVat);
			drawRow("Standard Rated Expenses (Box 9 - Purchases)", purchasesTotal, inVat);
			drawRow(netVat >= 0 ? "Net VAT Due to FTA (Box 10 - Payable)" : "Net VAT Refundable (Box 10 - Refundable)", 0, netVat, true);
			currentY += 25;
			doc.setFont("helvetica", "italic");
			doc.setFontSize(8.5);
			doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
			doc.text("Declaration: Hereby certified that the above values are retrieved directly from standard sales data", 14, currentY);
			doc.text("and vendor purchase invoices recorded within the CloudynationPOS platform.", 14, currentY + 4);
			const sanitizedTenant = (data?.tenantName || "tenant").toLowerCase().replace(/[^a-z0-9]/g, "-");
			doc.save(`fta-vat-summary-${sanitizedTenant}.pdf`);
			toast.dismiss(loadToast);
			toast.success("FTA VAT Summary report downloaded successfully!");
		} catch (err) {
			toast.dismiss(loadToast);
			toast.error(err.message || "Failed to generate FTA tax summary.");
		} finally {
			setIsGeneratingFtaReport(false);
		}
	};
	const downloadInvoicePdf = async (invoice) => {
		if (!invoice) return;
		setIsGeneratingPdf(true);
		const loadToast = toast.loading("Generating PDF...");
		try {
			const doc = new import_jspdf_node_min.jsPDF();
			doc.setTextColor(33, 37, 41);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(22);
			doc.text(invoice.tenantName || "Tenant", 14, 20);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.setTextColor(108, 117, 125);
			if (invoice.tenantTrn) doc.text(`TRN: ${invoice.tenantTrn}`, 14, 26);
			doc.text(`Branch: ${invoice.branchName}`, 14, 31);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(14);
			doc.setTextColor(33, 37, 41);
			doc.text("VENDOR INVOICE", 200, 20, { align: "right" });
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.setTextColor(73, 80, 87);
			doc.text(`Invoice Ref: ${invoice.invoiceNumber}`, 200, 26, { align: "right" });
			doc.text(`Date: ${invoice.createdAt ? invoice.createdAt.split("T")[0] : ""}`, 200, 31, { align: "right" });
			doc.text(`Due Date: ${invoice.dueDate ? invoice.dueDate.split("T")[0] : ""}`, 200, 36, { align: "right" });
			doc.setDrawColor(222, 226, 230);
			doc.line(14, 42, 200, 42);
			doc.setFont("helvetica", "bold");
			doc.text("Supplier / Vendor:", 14, 50);
			doc.setFont("helvetica", "normal");
			doc.text(invoice.vendorName || "", 14, 55);
			if (invoice.vendorTrn) doc.text(`TRN: ${invoice.vendorTrn}`, 14, 60);
			if (invoice.vendorContact) doc.text(`Contact: ${invoice.vendorContact}`, 14, 65);
			if (invoice.vendorPhone) doc.text(`Phone: ${invoice.vendorPhone}`, 14, 70);
			if (invoice.vendorEmail) doc.text(`Email: ${invoice.vendorEmail}`, 14, 75);
			if (invoice.vendorAddress) doc.text(`Address: ${invoice.vendorAddress}`, 14, 80);
			doc.setFont("helvetica", "bold");
			doc.text("References:", 120, 50);
			doc.setFont("helvetica", "normal");
			doc.text(`PO Number: ${invoice.poNumber}`, 120, 55);
			doc.text(`GRN Number: ${invoice.grnNumber}`, 120, 60);
			doc.line(14, 90, 200, 90);
			doc.setFont("helvetica", "bold");
			doc.text("Product Details", 14, 98);
			doc.text("Received Qty", 110, 98, { align: "right" });
			doc.text("Unit Price", 150, 98, { align: "right" });
			doc.text("Subtotal", 200, 98, { align: "right" });
			doc.line(14, 102, 200, 102);
			doc.setFont("helvetica", "normal");
			let y = 110;
			(invoice.items || []).forEach((item) => {
				if (y > 270) {
					doc.addPage();
					y = 20;
					doc.setFont("helvetica", "bold");
					doc.text("Product Details", 14, y);
					doc.text("Received Qty", 110, y, { align: "right" });
					doc.text("Unit Price", 150, y, { align: "right" });
					doc.text("Subtotal", 200, y, { align: "right" });
					doc.line(14, y + 4, 200, y + 4);
					doc.setFont("helvetica", "normal");
					y += 12;
				}
				doc.text(item.name || "", 14, y);
				doc.text(`${item.receivedQty} pcs`, 110, y, { align: "right" });
				doc.text(`${Number(item.unitPrice).toFixed(2)} AED`, 150, y, { align: "right" });
				doc.text(`${Number(item.subtotal).toFixed(2)} AED`, 200, y, { align: "right" });
				y += 8;
			});
			doc.line(14, y, 200, y);
			y += 10;
			doc.setFont("helvetica", "normal");
			doc.text(`Subtotal:`, 150, y, { align: "right" });
			doc.text(`${Number(invoice.subtotal).toFixed(2)} AED`, 200, y, { align: "right" });
			y += 6;
			doc.text(`VAT (${invoice.vatRate}% ${invoice.vatInclusive ? "Included" : "Excluded"}):`, 150, y, { align: "right" });
			doc.text(`${Number(invoice.vat).toFixed(2)} AED`, 200, y, { align: "right" });
			y += 8;
			doc.setFont("helvetica", "bold");
			doc.setFontSize(12);
			doc.text(`Total:`, 150, y, { align: "right" });
			doc.text(`${Number(invoice.total).toFixed(2)} AED`, 200, y, { align: "right" });
			doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
			toast.dismiss(loadToast);
			toast.success("PDF Downloaded successfully!");
		} catch (err) {
			toast.dismiss(loadToast);
			toast.error(err.message || "Failed to generate PDF");
		} finally {
			setIsGeneratingPdf(false);
		}
	};
	const printInvoice = () => {
		window.print();
	};
	const [togglingPerms, setTogglingPerms] = (0, import_react.useState)({});
	const roleToDbMap = {
		"Super Admin": "super_admin",
		"Head Office Admin": "head_office_admin",
		"Branch Manager": "branch_manager",
		"Inventory Manager": "inventory_manager",
		"Purchasing Officer": "purchasing_officer",
		Cashier: "cashier"
	};
	const permToKeyMap = {
		"Branch override": "branch_override",
		"Local stock": "local_stock",
		"Pricing adjustments": "pricing_adjustments",
		"Till management": "till_management",
		"Shift & staff": "shift_staff",
		"Stock adjust": "stock_adjust",
		"Receive goods": "receive_goods",
		"Create PO": "create_po",
		"Receive invoices": "receive_invoices",
		"Process sales": "process_sales",
		Refunds: "refunds",
		"End of shift": "end_of_shift"
	};
	const isPermissionEnabled = (roleName, permissionName) => {
		const dbRole = roleToDbMap[roleName] || roleName.toLowerCase().replace(" ", "_");
		if (dbRole === "super_admin" || dbRole === "head_office_admin") return true;
		const dbPerm = permToKeyMap[permissionName] || permissionName;
		const record = (data?.permissions || []).find((p) => p.role === dbRole && p.permission === dbPerm);
		return record ? record.enabled : true;
	};
	const handleTogglePermission = async (roleName, permissionName, currentEnabled) => {
		const dbRole = roleToDbMap[roleName];
		if (!dbRole) return;
		if (dbRole === "super_admin" || dbRole === "head_office_admin") {
			toast.error("Permissions for administrative roles are locked and cannot be disabled.");
			return;
		}
		const dbPerm = permToKeyMap[permissionName] || permissionName;
		const key = `${dbRole}:${dbPerm}`;
		if (togglingPerms[key]) return;
		setTogglingPerms((prev) => ({
			...prev,
			[key]: true
		}));
		const targetEnabled = !currentEnabled;
		const loadToast = toast.loading(`Updating ${permissionName}...`);
		try {
			const res = await toggleRolePermissionFn({ data: {
				role: dbRole,
				permission: dbPerm,
				enabled: targetEnabled
			} });
			toast.dismiss(loadToast);
			if (res && res.success) {
				toast.success(`${permissionName} updated successfully!`);
				router.invalidate();
			} else toast.error("Failed to update permission");
		} catch (err) {
			toast.dismiss(loadToast);
			toast.error(err.message || "An error occurred");
		} finally {
			setTogglingPerms((prev) => ({
				...prev,
				[key]: false
			}));
		}
	};
	const handleDeleteStaff = async (id) => {
		try {
			const res = await deleteStaffFn({ data: { id } });
			if (res.success) {
				toast.success(res.message || "Staff member deleted successfully.");
				router.invalidate();
			}
		} catch (err) {
			toast.error(err.message || "Failed to delete staff member");
		}
	};
	const handleCreateBranch = async () => {
		if (!newBranchName) {
			toast.error("Branch name is required");
			return;
		}
		setIsCreatingBranch(true);
		try {
			const res = await createBranchForTenantFn({ data: {
				name: newBranchName,
				address: newBranchAddress
			} });
			if (res.success) {
				toast.success("Branch created successfully!");
				setBranchAddOpen(false);
				setNewBranchName("");
				setNewBranchAddress("");
				router.invalidate();
			} else toast.error(res.error || "Failed to create branch");
		} catch (e) {
			toast.error(e.message || "An error occurred");
		} finally {
			setIsCreatingBranch(false);
		}
	};
	Array.from(new Set((data?.products || []).map((p) => p.category).filter(Boolean)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoShell, {
		title: "Head Office Dashboard",
		subtitle: `${data?.tenantName || "Tenant"} · ${mappedOutlets.length} outlets · ${mappedOutlets.reduce((s, o) => s + o.tills, 0)} tills`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "rounded-xl font-semibold",
			onClick: () => toast.success("Daily brief exported"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-4 w-4" }), " Export daily brief"]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			value: activeTab,
			onValueChange: (val) => {
				setActiveTab(val);
				setIsMobileMenuOpen(false);
			},
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "branches",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Branches"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "catalog",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Catalog"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "batches",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Inventory & Batches"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "crm",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "CRM & Customers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "purchasing",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Purchasing"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "roles",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Staff & Roles"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "vat",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "VAT & Reports"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "loyalty",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Customers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "promotions",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Promotions"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "price_requests",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Price Requests"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "vendors",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Vendors"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "reports",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Reports & VAT"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "audit_logs",
								className: "justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
								children: "Audit Logs"
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
										label: "Network sales today",
										value: aedShort(totalSales),
										delta: void 0,
										icon: TrendingUp
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
										label: "Outlets reporting",
										value: `${mappedOutlets.length} / ${mappedOutlets.length}`,
										delta: "All online",
										icon: Building2,
										tone: "success"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
										label: "Near-expiry batches",
										value: String(nearExpiry),
										icon: TriangleAlert,
										tone: "accent"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
										label: "Open purchase value",
										value: aedShort(mappedPurchases.reduce((sum, p) => p.stage === "PO" ? sum + p.value : sum, 0)),
										icon: Package
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-bold text-ink",
									children: "Branch performance · AED 000s"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 h-72",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
										width: "100%",
										height: "100%",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
											data: data?.branchTrend || [],
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
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
												mappedOutlets.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
													dataKey: o.name,
													fill: "#39ff14",
													radius: [
														6,
														6,
														0,
														0
													]
												}, o.id))
											]
										})
									})
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "branches",
							className: "mt-0 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex justify-end mb-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
									open: branchAddOpen,
									onOpenChange: setBranchAddOpen,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											className: "rounded-xl",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-2" }), " Add Outlet / Branch"]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
										className: "sm:max-w-md",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add New Branch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Create a new retail outlet or branch location." })] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4 py-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Branch Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: newBranchName,
														onChange: (e) => setNewBranchName(e.target.value),
														placeholder: "e.g. Al Barsha Branch",
														className: "rounded-xl border-border/50 bg-surface-2"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Address / Location" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: newBranchAddress,
														onChange: (e) => setNewBranchAddress(e.target.value),
														placeholder: "e.g. Dubai, UAE",
														className: "rounded-xl border-border/50 bg-surface-2"
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												className: "rounded-xl",
												onClick: () => setBranchAddOpen(false),
												children: "Cancel"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												className: "rounded-xl",
												onClick: handleCreateBranch,
												disabled: isCreatingBranch,
												children: isCreatingBranch ? "Adding..." : "Add Branch"
											})] })
										]
									})]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
								children: mappedOutlets.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel p-5 cursor-pointer hover:border-primary/30 transition-colors",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-bold text-ink",
												children: o.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-muted-foreground",
												children: [
													o.emirate,
													" · ",
													o.tills,
													" tills"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-4 text-xl font-extrabold text-ink",
												children: aedShort(o.sales)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: `text-xs font-semibold ${o.growth >= 0 ? "text-success" : "text-destructive"}`,
												children: [
													o.growth >= 0 ? "+" : "",
													o.growth,
													"% week on week"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mb-1.5 flex justify-between text-xs text-muted-foreground",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Stock health" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [o.stockHealth, "%"] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
													value: o.stockHealth,
													className: "h-2"
												})]
											})
										]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
									className: "max-w-4xl max-h-[80vh] overflow-y-auto",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Manage Branch: ", o.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Adjust local stock and pricing overrides for this branch." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 space-y-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-xl border border-border p-5 bg-surface-2/50 space-y-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
														className: "text-sm font-bold text-ink",
														children: "Branch Details"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Branch Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: editingBranchId === o.id ? editBranchName : o.name,
																onFocus: () => {
																	if (editingBranchId !== o.id) {
																		setEditingBranchId(o.id);
																		setEditBranchName(o.name);
																		setEditBranchAddress(o.address || "");
																	}
																},
																onChange: (e) => setEditBranchName(e.target.value),
																className: "rounded-xl border-border/50 bg-surface"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Address / Location" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: editingBranchId === o.id ? editBranchAddress : o.address || "",
																onFocus: () => {
																	if (editingBranchId !== o.id) {
																		setEditingBranchId(o.id);
																		setEditBranchName(o.name);
																		setEditBranchAddress(o.address || "");
																	}
																},
																onChange: (e) => setEditBranchAddress(e.target.value),
																className: "rounded-xl border-border/50 bg-surface"
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-2 justify-end",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "sm",
															className: "rounded-lg",
															disabled: editingBranchId !== o.id || !editBranchName,
															onClick: async () => {
																try {
																	if ((await updateBranchFn({ data: {
																		branchId: o.id,
																		name: editBranchName,
																		address: editBranchAddress
																	} })).success) {
																		toast.success("Branch details updated!");
																		setEditingBranchId(null);
																		router.invalidate();
																	}
																} catch (e) {
																	toast.error(e.message);
																}
															},
															children: "Save Details"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "outline",
															size: "sm",
															className: "rounded-lg",
															onClick: async () => {
																try {
																	if ((o.status === "Active" ? await deactivateBranchFn({ data: { branchId: o.id } }) : await activateBranchFn({ data: { branchId: o.id } })).success) {
																		toast.success(`Branch ${o.status === "Active" ? "deactivated" : "activated"}!`);
																		router.invalidate();
																	}
																} catch (e) {
																	toast.error(e.message);
																}
															},
															children: o.status === "Active" ? "Deactivate Branch" : "Activate Branch"
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-bold text-ink mb-3",
												children: "Local Inventory"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "SKU" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Current Stock" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Adjust (+/-)" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {})
											] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: mappedProducts.map((p) => {
												const localStockItem = (data?.stock || []).find((s) => s.productId === p.id && s.branchId === o.id);
												const localStock = localStockItem ? localStockItem.stock : 0;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-xs font-mono",
														children: p.sku
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-semibold text-ink",
														children: p.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [
														localStock,
														" ",
														p.unit
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														placeholder: "0",
														className: "w-24 h-8 text-sm",
														id: `adj-${p.id}`
													}) }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-right",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "sm",
															variant: "outline",
															onClick: async () => {
																const el = document.getElementById(`adj-${p.id}`);
																const qty = Number(el.value);
																if (isNaN(qty)) return;
																if ((await updateStockFn({ data: {
																	productId: p.id,
																	branchId: o.id,
																	qty: localStock + qty
																} })).success) {
																	router.invalidate();
																	toast.success("Stock adjusted");
																	el.value = "";
																}
															},
															children: "Update"
														})
													})
												] }, p.sku);
											}) })] })] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-bold text-ink mb-3",
												children: "Pricing Overrides"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Standard Price" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Local Price" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {})
											] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: mappedProducts.map((p) => {
												const priceOverride = (data?.stock || []).find((s) => s.productId === p.id && s.branchId === o.id)?.priceOverride;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-semibold text-ink",
														children: p.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: aed(p.price) }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														defaultValue: priceOverride || p.price,
														className: "w-24 h-8 text-sm",
														id: `prc-${p.id}`
													}) }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-right",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "sm",
															variant: "outline",
															onClick: async () => {
																const val = document.getElementById(`prc-${p.id}`).value;
																if ((await updatePriceOverrideFn({ data: {
																	productId: p.id,
																	branchId: o.id,
																	priceOverride: val
																} })).success) {
																	router.invalidate();
																	toast.success("Price overridden");
																}
															},
															children: "Save"
														})
													})
												] }, p.sku);
											}) })] })] })
										]
									})]
								})] }, o.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "catalog",
							className: "mt-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex justify-end mb-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: () => {
											setProductForm({
												name: "",
												barcode: "",
												category: "",
												unit: "",
												costPrice: "",
												salePrice: "",
												isBatchTracked: false
											});
											setIsEditingProduct(false);
											setProductFormOpen(true);
										},
										className: "rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-2" }), " Add Product"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "panel overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, {
										className: "min-w-[900px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "SKU" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Barcode" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Unit" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "Cost"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "Retail"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "On hand"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "Actions"
											})
										] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: mappedProducts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-mono text-xs text-muted-foreground",
												children: p.sku
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-semibold text-ink",
												children: p.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-mono text-xs",
												children: p.barcode
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-sm",
												children: p.unit
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-sm",
												children: p.category
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right tabular-nums",
												children: p.cost.toFixed(2)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right font-semibold tabular-nums",
												children: p.price.toFixed(2)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right tabular-nums",
												children: p.stock
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-end gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "icon",
														variant: "outline",
														className: "h-8 w-8 rounded-lg",
														onClick: () => {
															setProductForm({
																id: p.id,
																name: p.name,
																barcode: p.barcode ?? "",
																category: p.category,
																unit: p.unit,
																costPrice: p.costPriceRaw,
																salePrice: p.salePriceRaw,
																isBatchTracked: p.isBatchTracked
															});
															setIsEditingProduct(true);
															setProductFormOpen(true);
														},
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "icon",
														variant: "outline",
														className: "h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10",
														onClick: () => {
															setDeleteProductContext(p);
															setDeleteDialogOpen(true);
														},
														title: "Remove product",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
													})]
												})
											})
										] }, p.id)) })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
									open: productFormOpen,
									onOpenChange: setProductFormOpen,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
										className: "sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: isEditingProduct ? "Edit Product" : "Add Product" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Create or modify product details." })] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4 py-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Product Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															value: productForm.name,
															onChange: (e) => setProductForm({
																...productForm,
																name: e.target.value
															}),
															className: "rounded-xl border-border/50 bg-surface-2"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Barcode / SKU" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: productForm.barcode,
																onChange: (e) => setProductForm({
																	...productForm,
																	barcode: e.target.value
																}),
																className: "rounded-xl border-border/50 bg-surface-2"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: productForm.category,
																onChange: (e) => setProductForm({
																	...productForm,
																	category: e.target.value
																}),
																className: "rounded-xl border-border/50 bg-surface-2"
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-3 gap-3",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Unit" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	value: productForm.unit,
																	placeholder: "e.g. kg",
																	onChange: (e) => setProductForm({
																		...productForm,
																		unit: e.target.value
																	}),
																	className: "rounded-xl border-border/50 bg-surface-2"
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cost Price" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	type: "number",
																	step: "0.01",
																	value: productForm.costPrice,
																	onChange: (e) => setProductForm({
																		...productForm,
																		costPrice: e.target.value
																	}),
																	className: "rounded-xl border-border/50 bg-surface-2"
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Retail Price" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	type: "number",
																	step: "0.01",
																	value: productForm.salePrice,
																	onChange: (e) => setProductForm({
																		...productForm,
																		salePrice: e.target.value
																	}),
																	className: "rounded-xl border-border/50 bg-surface-2"
																})]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between mt-2 p-3 border rounded-xl bg-surface-2/50",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-0.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																className: "text-base text-ink",
																children: "Batch Tracked"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-xs text-muted-foreground",
																children: "Track expiry dates and batches"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
															checked: productForm.isBatchTracked,
															onCheckedChange: (c) => setProductForm({
																...productForm,
																isBatchTracked: c
															})
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2 border-t pt-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															className: "text-sm font-bold text-ink",
															children: "Alternate Barcodes"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [(productForm.barcodes || []).map((bar, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex gap-2 items-center",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	value: bar,
																	onChange: (e) => {
																		const copy = [...productForm.barcodes];
																		copy[idx] = e.target.value;
																		setProductForm({
																			...productForm,
																			barcodes: copy
																		});
																	},
																	placeholder: "Scan or type barcode",
																	className: "rounded-xl border-border/50 bg-surface-2 flex-1"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	variant: "ghost",
																	size: "icon",
																	onClick: () => {
																		const copy = productForm.barcodes.filter((_, i) => i !== idx);
																		setProductForm({
																			...productForm,
																			barcodes: copy
																		});
																	},
																	className: "text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
																})]
															}, idx)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																type: "button",
																variant: "outline",
																size: "sm",
																onClick: () => {
																	setProductForm({
																		...productForm,
																		barcodes: [...productForm.barcodes || [], ""]
																	});
																},
																className: "rounded-xl mt-1 text-xs",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3 w-3 mr-1" }), " Add Alternate Barcode"]
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2 border-t pt-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															className: "text-sm font-bold text-ink",
															children: "Product Variants"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-3",
															children: [(productForm.variants || []).map((v, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-4 gap-2 items-end border border-dashed p-3 rounded-xl bg-surface-2/20",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "space-y-1.5 col-span-1",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																			className: "text-xs",
																			children: "Attribute"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																			value: v.variantName,
																			onChange: (e) => {
																				const copy = [...productForm.variants];
																				copy[idx] = {
																					...v,
																					variantName: e.target.value
																				};
																				setProductForm({
																					...productForm,
																					variants: copy
																				});
																			},
																			placeholder: "e.g. Size",
																			className: "rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "space-y-1.5 col-span-1",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																			className: "text-xs",
																			children: "Value"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																			value: v.variantValue,
																			onChange: (e) => {
																				const copy = [...productForm.variants];
																				copy[idx] = {
																					...v,
																					variantValue: e.target.value
																				};
																				setProductForm({
																					...productForm,
																					variants: copy
																				});
																			},
																			placeholder: "e.g. Large",
																			className: "rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "space-y-1.5 col-span-1",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																			className: "text-xs",
																			children: "Price Adj (+/-)"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																			type: "number",
																			step: "0.01",
																			value: v.priceAdjustment,
																			onChange: (e) => {
																				const copy = [...productForm.variants];
																				copy[idx] = {
																					...v,
																					priceAdjustment: e.target.value
																				};
																				setProductForm({
																					...productForm,
																					variants: copy
																				});
																			},
																			className: "rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: "flex justify-center col-span-1",
																		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																			variant: "ghost",
																			size: "icon",
																			onClick: () => {
																				const copy = productForm.variants.filter((_, i) => i !== idx);
																				setProductForm({
																					...productForm,
																					variants: copy
																				});
																			},
																			className: "text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl",
																			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
																		})
																	})
																]
															}, idx)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																type: "button",
																variant: "outline",
																size: "sm",
																onClick: () => {
																	setProductForm({
																		...productForm,
																		variants: [...productForm.variants || [], {
																			variantName: "",
																			variantValue: "",
																			sku: "",
																			priceAdjustment: "0.00"
																		}]
																	});
																},
																className: "rounded-xl mt-1 text-xs",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3 w-3 mr-1" }), " Add Variant"]
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2 border-t pt-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															className: "text-sm font-bold text-ink",
															children: "Unit Conversions"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-3",
															children: [(productForm.conversions || []).map((c, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-4 gap-2 items-end border border-dashed p-3 rounded-xl bg-surface-2/20",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "space-y-1.5 col-span-1",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																			className: "text-xs",
																			children: "From (Alt Unit)"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																			value: c.fromUnit,
																			onChange: (e) => {
																				const copy = [...productForm.conversions];
																				copy[idx] = {
																					...c,
																					fromUnit: e.target.value
																				};
																				setProductForm({
																					...productForm,
																					conversions: copy
																				});
																			},
																			placeholder: "e.g. Box",
																			className: "rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "space-y-1.5 col-span-1",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																			className: "text-xs",
																			children: "To (Base Unit)"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																			value: c.toUnit || productForm.unit,
																			onChange: (e) => {
																				const copy = [...productForm.conversions];
																				copy[idx] = {
																					...c,
																					toUnit: e.target.value
																				};
																				setProductForm({
																					...productForm,
																					conversions: copy
																				});
																			},
																			placeholder: productForm.unit || "Pcs",
																			className: "rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "space-y-1.5 col-span-1",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																			className: "text-xs",
																			children: "Factor (Alt = base * factor)"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																			type: "number",
																			step: "0.0001",
																			value: c.conversionFactor,
																			onChange: (e) => {
																				const copy = [...productForm.conversions];
																				copy[idx] = {
																					...c,
																					conversionFactor: e.target.value
																				};
																				setProductForm({
																					...productForm,
																					conversions: copy
																				});
																			},
																			placeholder: "12",
																			className: "rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: "flex justify-center col-span-1",
																		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																			variant: "ghost",
																			size: "icon",
																			onClick: () => {
																				const copy = productForm.conversions.filter((_, i) => i !== idx);
																				setProductForm({
																					...productForm,
																					conversions: copy
																				});
																			},
																			className: "text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl",
																			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
																		})
																	})
																]
															}, idx)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																type: "button",
																variant: "outline",
																size: "sm",
																onClick: () => {
																	setProductForm({
																		...productForm,
																		conversions: [...productForm.conversions || [], {
																			fromUnit: "",
																			toUnit: productForm.unit || "",
																			conversionFactor: ""
																		}]
																	});
																},
																className: "rounded-xl mt-1 text-xs",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3 w-3 mr-1" }), " Add Unit Conversion"]
															})]
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												className: "rounded-xl",
												onClick: () => setProductFormOpen(false),
												children: "Cancel"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												className: "rounded-xl",
												onClick: async () => {
													if (!productForm.name || !productForm.category || !productForm.unit || productForm.costPrice === "" || productForm.salePrice === "") {
														toast.error("All fields except Barcode are required");
														return;
													}
													const costNum = Number(productForm.costPrice);
													const saleNum = Number(productForm.salePrice);
													if (isNaN(costNum) || isNaN(saleNum)) {
														toast.error("Cost and sale prices must be valid numbers");
														return;
													}
													if (costNum < 0) {
														toast.error("Cost price cannot be negative");
														return;
													}
													if (saleNum <= 0) {
														toast.error("Sale price must be greater than zero");
														return;
													}
													const payload = {
														name: productForm.name,
														barcode: productForm.barcode || null,
														category: productForm.category,
														unit: productForm.unit,
														costPrice: productForm.costPrice,
														salePrice: productForm.salePrice,
														isBatchTracked: productForm.isBatchTracked,
														barcodes: productForm.barcodes || [],
														variants: productForm.variants || [],
														conversions: productForm.conversions || []
													};
													const res = isEditingProduct ? await updateProductFn({ data: {
														id: productForm.id,
														...payload
													} }) : await createProductFn({ data: payload });
													if (res.success) {
														toast.success(isEditingProduct ? "Product updated" : "Product created");
														setProductFormOpen(false);
														router.invalidate();
													} else toast.error(res.error || "Operation failed");
												},
												children: "Save Product"
											})] })
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
									open: deleteDialogOpen,
									onOpenChange: (open) => {
										if (!isDeleting) {
											setDeleteDialogOpen(open);
											if (!open) setDeleteProductContext(null);
										}
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
										className: "sm:max-w-md w-[95vw] sm:w-full",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Remove product?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
											"Remove ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: deleteProductContext?.name }),
											"? If it is used in sales, purchases, GRNs, batches or stock, removal will be blocked."
										] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
											className: "flex justify-end gap-2 mt-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												className: "rounded-xl",
												onClick: () => {
													setDeleteDialogOpen(false);
													setDeleteProductContext(null);
												},
												disabled: isDeleting,
												children: "Cancel"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "destructive",
												className: "rounded-xl",
												onClick: async () => {
													if (!deleteProductContext) return;
													setIsDeleting(true);
													try {
														const res = await deleteProductFn({ data: { id: deleteProductContext.id } });
														if (res && res.success) {
															toast.success("Product deleted");
															setDeleteDialogOpen(false);
															setDeleteProductContext(null);
															router.invalidate();
														} else toast.error({
															PRODUCT_USED_IN_STOCK: "Cannot delete product because it has active stock in one or more branches.",
															PRODUCT_USED_IN_STOCK_TRANSFER: "Cannot delete product because it is part of stock transfers.",
															PRODUCT_USED_IN_BATCH: "Cannot delete product because it has batch history records.",
															PRODUCT_USED_IN_SALES: "Cannot delete product because it has associated sales records.",
															PRODUCT_USED_IN_PURCHASE: "Cannot delete product because it is part of purchase orders.",
															PRODUCT_USED_IN_GRN: "Cannot delete product because it has recorded goods received notes (GRN)."
														}[res?.error || ""] || res?.error || "Failed to delete");
													} catch (err) {
														toast.error(err.message || "An error occurred during deletion");
													} finally {
														setIsDeleting(false);
													}
												},
												disabled: isDeleting,
												children: isDeleting ? "Removing..." : "Remove"
											})]
										})]
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "batches",
							className: "mt-0 space-y-5",
							children: [
								nearExpiry > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-5 w-5 text-warning-foreground" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm font-medium text-ink",
											children: [nearExpiry, " batches expire within 14 days."]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											className: "ml-auto rounded-lg",
											onClick: async () => {
												const nearExpiryBatches = mappedBatches.filter((b) => b.daysLeft <= 14);
												const uniqueProductIds = Array.from(new Set(nearExpiryBatches.map((b) => b.productId)));
												if (uniqueProductIds.length === 0) return;
												const loadToast = toast.loading("Applying clearance pricing...");
												try {
													for (const productId of uniqueProductIds) await applyClearanceFn$1({ data: {
														productId,
														discountPct: 20
													} });
													toast.dismiss(loadToast);
													toast.success("Clearance pricing applied successfully!");
													router.invalidate();
												} catch (err) {
													toast.dismiss(loadToast);
													toast.error(err.message || "Failed to apply clearance pricing");
												}
											},
											children: "Apply clearance"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-lg font-bold text-ink",
										children: "Inventory & Batches"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Manage batches and track expiry dates."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: () => setAddBatchOpen(true),
										className: "rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:-translate-y-0.5 transition-all",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Add Batch"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "panel overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, {
										className: "min-w-[820px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Batch" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Outlet" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Rotation" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "Qty"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Expiry" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "Status"
											})
										] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: mappedBatches.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-semibold text-ink",
												children: b.product
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-mono text-xs",
												children: b.batch
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: b.outlet }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "outline",
												className: "rounded-full",
												children: b.rule
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right tabular-nums",
												children: b.qty
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "tabular-nums",
												children: b.expiry
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: `rounded-full border px-2.5 py-1 text-xs font-semibold ${expiryTone(b.daysLeft)}`,
													children: [b.daysLeft, " days left"]
												})
											})
										] }, b.id)) })]
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "purchasing",
							className: "mt-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-lg font-bold text-ink",
										children: "Purchasing Pipeline"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Track Purchase Orders, Goods Received, and Invoices."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
										open: poModalOpen,
										onOpenChange: setPoModalOpen,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												onClick: () => {
													setPoForm({
														vendorId: "",
														branchId: ""
													});
													setPoItems([]);
												},
												children: "Create New PO"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
											className: "sm:max-w-2xl max-h-[90vh] overflow-y-auto",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create Purchase Order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Draft a new PO to send to a vendor." })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid grid-cols-2 gap-4 py-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Vendor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
															onValueChange: (v) => setPoForm({
																...poForm,
																vendorId: v
															}),
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select vendor" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: mappedVendors.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																value: v.id,
																children: v.name
															}, v.id)) })]
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Branch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
															onValueChange: (v) => setPoForm({
																...poForm,
																branchId: v
															}),
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select branch" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: mappedOutlets.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																value: b.id,
																children: b.name
															}, b.id)) })]
														})]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-3",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center justify-between",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Order Items" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																variant: "outline",
																size: "sm",
																onClick: () => setPoItems([...poItems, {
																	productId: "",
																	qty: 1,
																	unitPrice: 0
																}]),
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-1" }), " Add Item"]
															})]
														}),
														poItems.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex gap-2 items-end",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex-1 space-y-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		className: "text-xs",
																		children: "Product"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
																		onValueChange: (v) => {
																			const n = [...poItems];
																			n[idx].productId = v;
																			setPoItems(n);
																		},
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
																			className: "h-8",
																			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Product" })
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: mappedProducts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																			value: p.id,
																			children: p.name
																		}, p.id)) })]
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "w-20 space-y-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		className: "text-xs",
																		children: "Qty"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		type: "number",
																		min: "1",
																		className: "h-8",
																		value: item.qty,
																		onChange: (e) => {
																			const n = [...poItems];
																			n[idx].qty = Number(e.target.value);
																			setPoItems(n);
																		}
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "w-24 space-y-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		className: "text-xs",
																		children: "Unit Cost"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		type: "number",
																		min: "0",
																		className: "h-8",
																		value: item.unitPrice,
																		onChange: (e) => {
																			const n = [...poItems];
																			n[idx].unitPrice = Number(e.target.value);
																			setPoItems(n);
																		}
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	variant: "ghost",
																	size: "icon",
																	className: "h-8 w-8 text-destructive",
																	onClick: () => setPoItems(poItems.filter((_, i) => i !== idx)),
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
																})
															]
														}, idx)),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "text-right font-bold mt-2",
															children: ["Total: ", aed(poItems.reduce((acc, i) => acc + i.qty * i.unitPrice, 0))]
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													onClick: () => setPoModalOpen(false),
													children: "Cancel"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													onClick: async () => {
														if (!poForm.vendorId || !poForm.branchId || poItems.length === 0) {
															toast.error("Fill vendor, branch, and at least 1 item");
															return;
														}
														if (poItems.some((i) => !i.productId || i.qty <= 0 || i.unitPrice <= 0)) {
															toast.error("Invalid item fields or negative quantities");
															return;
														}
														try {
															if ((await createPurchaseOrderServerFn({ data: {
																vendorId: poForm.vendorId,
																branchId: poForm.branchId,
																items: poItems
															} })).success) {
																toast.success("PO Created");
																setPoModalOpen(false);
																setPoItems([]);
																router.invalidate();
															}
														} catch (err) {
															toast.error(err.message || "Failed");
														}
													},
													children: "Create PO"
												})] })
											]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-5 lg:grid-cols-3",
									children: [
										"PO",
										"GRN",
										"Invoice"
									].map((stage, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel p-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
												className: "text-sm font-bold text-ink",
												children: [
													idx + 1,
													".",
													" ",
													stage === "PO" ? "Purchase Orders" : stage === "GRN" ? "Goods Received" : "Vendor Invoices"
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "outline",
												className: "rounded-full",
												children: mappedPurchases.filter((p) => p.stage === stage).length
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-4 space-y-3",
											children: mappedPurchases.filter((p) => p.stage === stage).map((p, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-xl border border-border bg-surface-2 p-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-mono text-xs text-muted-foreground",
															children: p.id
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-sm font-bold text-ink",
															children: aedShort(p.value)
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-1 text-sm font-semibold text-ink",
														children: p.vendor
													}),
													p.variance && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "mt-2 inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3 w-3" }),
															" ",
															p.variance
														]
													}),
													stage !== "Invoice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-3 flex gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "sm",
															variant: "outline",
															className: "flex-1 rounded-lg",
															onClick: async () => {
																if (stage === "PO") {
																	setGrnForm({
																		purchaseOrderId: p.rawId,
																		vendorId: p.vendorId,
																		branchId: p.branchId,
																		items: p.items.map((i) => ({
																			productId: i.productId,
																			name: i.product?.name,
																			orderedQty: i.qty,
																			receivedQty: i.qty,
																			isBatchTracked: i.product?.isBatchTracked === false ? false : true
																		}))
																	});
																	setGrnModalOpen(true);
																} else {
																	const loadToast = toast.loading("Loading GRN details...");
																	try {
																		const res = await getGrnDetailsServerFn({ data: { purchaseOrderId: p.rawId } });
																		toast.dismiss(loadToast);
																		const thirtyDaysFromNow = /* @__PURE__ */ new Date();
																		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
																		const defaultDueDateStr = thirtyDaysFromNow.toISOString().split("T")[0];
																		setInvoiceForm({
																			purchaseOrderId: res.purchaseOrderId,
																			poNumber: res.poNumber,
																			grnNumber: res.grnNumber,
																			vendorName: res.vendorName,
																			branchName: res.branchName,
																			invoiceNumber: "",
																			dueDate: defaultDueDateStr,
																			items: res.items,
																			subtotal: res.subtotal,
																			vat: res.vat,
																			total: res.total,
																			vatRate: res.vatRate,
																			vatInclusive: res.vatInclusive
																		});
																		setInvoiceModalOpen(true);
																	} catch (err) {
																		toast.dismiss(loadToast);
																		toast.error(err.message || "Failed to load GRN details");
																	}
																}
															},
															children: stage === "PO" ? "Record GRN" : "Convert to invoice"
														}), stage === "PO" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "outline",
															className: "h-9 w-9 rounded-lg",
															onClick: () => {
																setEditPoForm({
																	id: p.rawId,
																	vendorId: p.vendorId,
																	branchId: p.branchId,
																	items: p.items.map((i) => ({
																		productId: i.productId,
																		qty: i.qty,
																		unitPrice: Number(i.unitPrice) || 0
																	}))
																});
																setEditPoOpen(true);
															},
															title: "Edit PO",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "outline",
															className: "h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10",
															onClick: () => {
																setDeletePoContext({
																	id: p.rawId,
																	shortId: p.id,
																	vendor: p.vendor
																});
																setDeletePoDialogOpen(true);
															},
															title: "Delete PO",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
														})] })]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-3",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "sm",
															variant: "outline",
															className: "w-full rounded-lg",
															onClick: async () => {
																setIsDetailLoading(true);
																const loadToast = toast.loading("Loading invoice details...");
																try {
																	const res = await getInvoiceDetailsServerFn({ data: { purchaseOrderId: p.rawId } });
																	setInvoiceDetail(res);
																	setInvoiceDetailModalOpen(true);
																	toast.dismiss(loadToast);
																} catch (err) {
																	toast.dismiss(loadToast);
																	toast.error(err.message || "Failed to load invoice details");
																} finally {
																	setIsDetailLoading(false);
																}
															},
															children: "View Details"
														})
													})
												]
											}, p.id + idx))
										})]
									}, stage))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel mt-5 flex flex-wrap items-center justify-between gap-3 p-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-bold text-ink",
										children: "Accounts payable outstanding"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [mappedPurchases.filter((p) => p.stage === "Invoice").length, " vendor invoices"]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-2xl font-extrabold text-ink",
										children: aedShort(mappedPurchases.reduce((sum, p) => p.stage === "Invoice" ? sum + p.value : sum, 0))
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "roles",
							className: "mt-0 space-y-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-lg font-bold text-ink",
										children: "Staff & Roles"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Manage user permissions and access levels."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
										open: staffModalOpen,
										onOpenChange: setStaffModalOpen,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												onClick: () => setStaffForm({
													id: "",
													name: "",
													email: "",
													role: "cashier",
													branchId: "",
													password: "",
													pin: "",
													isActive: true
												}),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Add Staff"]
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: staffForm.id ? "Edit Staff Member" : "Add Staff Member" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Assign role and branch access to staff." })] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-4 py-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															value: staffForm.name,
															onChange: (e) => setStaffForm({
																...staffForm,
																name: e.target.value
															})
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															type: "email",
															value: staffForm.email,
															onChange: (e) => setStaffForm({
																...staffForm,
																email: e.target.value
															})
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
																value: staffForm.role,
																onValueChange: (v) => setStaffForm({
																	...staffForm,
																	role: v
																}),
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																		value: "branch_manager",
																		children: "Branch Manager"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																		value: "inventory_manager",
																		children: "Inventory Manager"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																		value: "purchasing_officer",
																		children: "Purchasing Officer"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																		value: "cashier",
																		children: "Cashier"
																	})
																] })]
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Branch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
																value: staffForm.branchId,
																onValueChange: (v) => setStaffForm({
																	...staffForm,
																	branchId: v
																}),
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Branch" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: mappedOutlets.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																	value: b.id,
																	children: b.name
																}, b.id)) })]
															})]
														})]
													}),
													staffForm.role === "cashier" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: ["PIN ", staffForm.id ? "(Leave blank to keep existing)" : "*"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															type: "password",
															value: staffForm.pin,
															onChange: (e) => setStaffForm({
																...staffForm,
																pin: e.target.value
															})
														})]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: ["Password ", staffForm.id ? "(Leave blank to keep existing)" : "*"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															type: "password",
															value: staffForm.password,
															onChange: (e) => setStaffForm({
																...staffForm,
																password: e.target.value
															})
														})]
													}),
													staffForm.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between p-3 border rounded-lg bg-surface-2 mt-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-0.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Active Status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-xs text-muted-foreground",
																children: "Inactive staff cannot log in."
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
															checked: staffForm.isActive,
															onCheckedChange: (c) => setStaffForm({
																...staffForm,
																isActive: c
															})
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												onClick: () => setStaffModalOpen(false),
												children: "Cancel"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												onClick: async () => {
													if (!staffForm.branchId) {
														toast.error("Branch assignment is required");
														return;
													}
													try {
														if ((staffForm.id ? await updateStaffFn({ data: staffForm }) : await createStaffFn({ data: staffForm })).success) {
															toast.success("Staff saved successfully");
															setStaffModalOpen(false);
															router.invalidate();
														}
													} catch (err) {
														toast.error(err.message || "Failed to save staff");
													}
												},
												children: "Save Staff"
											})] })
										] })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-5 lg:grid-cols-3",
									children: mappedRoles.map((role, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel p-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-sm font-bold text-ink",
												children: role.role
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-3.5 w-3.5" }),
													" ",
													role.users
												]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "space-y-2",
											children: role.perms.map((p, pIdx) => {
												const enabled = isPermissionEnabled(role.role, p);
												const dbRole = roleToDbMap[role.role];
												const isLocked = dbRole === "super_admin" || dbRole === "head_office_admin";
												const key = `${dbRole}:${p}`;
												const isToggling = !!togglingPerms[key];
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-muted-foreground",
														children: p
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
														checked: enabled,
														onCheckedChange: () => handleTogglePermission(role.role, p, enabled),
														disabled: isLocked || isToggling
													})]
												}, pIdx);
											})
										})]
									}, idx))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel mt-8",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "border-b border-border p-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-bold text-ink",
											children: "Directory"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Role" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Branch" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Action"
										})
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: (data?.staff || []).filter((s) => s.role !== "head_office_admin" && s.role !== "super_admin").map((s) => {
										const branch = mappedOutlets.find((b) => b.id === s.branchId);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-medium text-ink",
												children: s.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: s.email }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "outline",
												className: "capitalize",
												children: s.role.replace("_", " ")
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: branch ? branch.name : "-" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: s.isActive ? "default" : "secondary",
												className: s.isActive ? "bg-emerald-100 text-emerald-800" : "",
												children: s.isActive ? "Active" : "Inactive"
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
												className: "text-right",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "sm",
													onClick: () => {
														setStaffForm({
															id: s.id,
															name: s.name,
															email: s.email,
															role: s.role,
															branchId: s.branchId || "",
															isActive: s.isActive,
															password: "",
															pin: ""
														});
														setStaffModalOpen(true);
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "sm",
													className: "text-red-500 hover:text-red-600 hover:bg-red-50",
													onClick: () => {
														if (confirm("Are you sure you want to delete this staff member?")) handleDeleteStaff(s.id);
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
												})]
											})
										] }, s.id);
									}) })] })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "vat",
							className: "mt-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-5 lg:grid-cols-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel p-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-bold text-ink",
											children: "VAT configuration"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-5 flex items-center justify-between rounded-xl bg-surface-2 p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm font-semibold text-ink",
												children: [inclusive ? "Tax-inclusive" : "Tax-exclusive", " shelf pricing"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Applies to all outlets in this tenant."
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												checked: inclusive,
												onCheckedChange: setInclusive
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 space-y-3 text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between rounded-xl border border-border px-4 py-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted-foreground",
													children: "Standard rate (%)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													className: "w-24 h-8 text-right font-semibold text-ink",
													value: vatRate,
													onChange: (e) => setVatRate(e.target.value)
												})]
											}), [["Output VAT this period", aed(data?.outputVat || 0)], ["Input VAT this period", aed(data?.inputVat || 0)]].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between rounded-xl border border-border px-4 py-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted-foreground",
													children: k
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-semibold text-ink",
													children: v
												})]
											}, k))]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-3 mt-5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												className: "rounded-xl font-semibold",
												onClick: async () => {
													if ((await updateVatSettingsFn({ data: {
														vatRate: String(vatRate),
														vatInclusive: inclusive
													} })).success) {
														router.invalidate();
														toast.success("VAT settings saved");
													}
												},
												children: "Save VAT settings"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												className: "rounded-xl font-semibold",
												onClick: downloadFtaSummary,
												disabled: isGeneratingFtaReport,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-1.5 h-4 w-4" }),
													" ",
													isGeneratingFtaReport ? "Generating..." : "Download FTA tax summary"
												]
											})]
										})
									]
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "loyalty",
							className: "mt-0 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-bold text-ink mb-4",
										children: "Point-Redemption Policies"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-6 sm:grid-cols-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Points per 1 AED spent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: loyaltyPointsPerAed,
													onChange: (e) => setLoyaltyPointsPerAed(e.target.value)
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Minimum points to redeem" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													value: loyaltyMinPointsToRedeem,
													onChange: (e) => setLoyaltyMinPointsToRedeem(e.target.value)
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Redemption Rate (e.g. 0.01 AED per point)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													step: "0.01",
													value: loyaltyRate,
													onChange: (e) => setLoyaltyRate(e.target.value)
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-5 flex justify-end",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											disabled: isSavingLoyalty,
											onClick: async () => {
												setIsSavingLoyalty(true);
												const loadToast = toast.loading("Saving loyalty settings...");
												try {
													const res = await updateLoyaltySettingsFn({ data: {
														pointsPerAed: loyaltyPointsPerAed,
														minPointsToRedeem: loyaltyMinPointsToRedeem,
														redemptionRate: loyaltyRate
													} });
													toast.dismiss(loadToast);
													if (res.success) {
														router.invalidate();
														toast.success("Policies saved");
													} else toast.error("Failed to save settings");
												} catch (err) {
													toast.dismiss(loadToast);
													toast.error(err.message || "An error occurred");
												} finally {
													setIsSavingLoyalty(false);
												}
											},
											children: isSavingLoyalty ? "Saving..." : "Save Policies"
										})
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "panel overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, {
									className: "min-w-[760px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Phone" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Tier" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Points"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Visits"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Lifetime spend"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Action"
										})
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: (data?.customers || []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
											className: "cursor-pointer hover:bg-surface-2/50 transition-colors",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "font-semibold text-ink",
													children: c.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "font-mono text-xs",
													children: c.phone
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tierTone[c.tier]}`,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3 w-3" }),
														" ",
														c.tier
													]
												}) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right tabular-nums",
													children: c.points.toLocaleString("en-AE")
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right tabular-nums",
													children: c.visits
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right font-semibold tabular-nums",
													children: aedShort(c.spend)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "outline",
														className: "rounded-lg relative z-10",
														onClick: (e) => {
															e.stopPropagation();
															toast.success(`Voucher issued to ${c.name}`);
														},
														children: "Issue voucher"
													})
												})
											]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
										className: "max-w-2xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [c.name, " - Transaction History"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Recent purchases and loyalty points activity." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Location" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
													className: "text-right",
													children: "Amount"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
													className: "text-right",
													children: "Points"
												})
											] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: (c.history || []).map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-muted-foreground",
													children: h.date
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: h.loc }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right font-medium",
													children: aed(h.amt)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right text-success font-semibold",
													children: h.pts
												})
											] }, i)) })] })
										})]
									})] }, c.id)) })]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "price_requests",
							className: "mt-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-lg font-bold text-ink mb-2",
										children: "Price Override Requests"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground mb-6",
										children: "Review and approve/reject branch-specific pricing override requests. Approved overrides update POS catalog prices immediately."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "overflow-x-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Branch" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "Standard Price"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "Requested Price"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Reason" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "Actions"
											})
										] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [(!data || !data.priceRequests || data.priceRequests.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											colSpan: 8,
											className: "h-24 text-center text-muted-foreground font-semibold",
											children: "No price override requests found."
										}) }), (data?.priceRequests || []).map((req) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
											className: "hover:bg-surface-2/40 transition-colors duration-200",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "font-semibold text-ink",
													children: req.product?.name || "Unknown Product"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-muted-foreground font-medium",
													children: req.branch?.name || "Unknown Branch"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right font-medium text-muted-foreground",
													children: aed(Number(req.standardPrice))
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right font-bold text-ink",
													children: aed(Number(req.requestedPrice))
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-muted-foreground font-medium max-w-xs truncate",
													children: req.reason
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-xs text-muted-foreground",
													children: new Date(req.createdAt).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: req.status === "Approved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success animate-in fade-in",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3" }), " Approved"]
												}) : req.status === "Rejected" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 animate-in fade-in",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "h-3 w-3" }), " Rejected"]
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 animate-in fade-in",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), " Pending"]
												}) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right",
													children: req.status === "Pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-end gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "sm",
															variant: "outline",
															className: "h-8 rounded-lg text-xs font-bold border-red-200 text-red-600 hover:bg-red-50",
															onClick: async () => {
																try {
																	if ((await handleOverrideRequestFn({ data: {
																		requestId: req.id,
																		action: "Reject"
																	} })).success) {
																		toast.success("Request rejected successfully");
																		router.invalidate();
																	}
																} catch (err) {
																	toast.error(err.message || "Failed to reject request");
																}
															},
															children: "Reject"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "sm",
															className: "h-8 rounded-lg text-xs font-bold bg-success hover:bg-success/90",
															onClick: async () => {
																try {
																	if ((await handleOverrideRequestFn({ data: {
																		requestId: req.id,
																		action: "Approve"
																	} })).success) {
																		toast.success("Request approved successfully");
																		router.invalidate();
																	}
																} catch (err) {
																	toast.error(err.message || "Failed to approve request");
																}
															},
															children: "Approve"
														})]
													})
												})
											]
										}, req.id))] })] })
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "crm",
							className: "mt-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CRMTab, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "promotions",
							className: "mt-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromotionsTab, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "vendors",
							className: "mt-0 space-y-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-xl font-bold text-ink",
										children: "Suppliers & Vendors"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Manage tenant-level suppliers and integration details."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										className: "rounded-xl font-semibold",
										onClick: () => {
											setVendorForm({
												id: "",
												name: "",
												contact: "",
												phone: "",
												email: "",
												address: "",
												status: "Active",
												trn: ""
											});
											setIsEditingVendor(false);
											setVendorFormOpen(true);
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Add Vendor"]
									})]
								}),
								!data?.vendors || data.vendors.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "panel p-12 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "mx-auto h-12 w-12 text-muted-foreground/50" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "mt-4 text-lg font-bold text-ink",
											children: "No vendors found"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm text-muted-foreground",
											children: "Get started by creating your first supplier profile."
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "panel overflow-hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, {
										className: "w-full",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Vendor Name" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Contact Person" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Phone" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Address" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "TRN" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "text-right",
												children: "Actions"
											})
										] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: data.vendors.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-semibold text-ink",
												children: v.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: v.contact || "-" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-mono text-xs",
												children: v.phone || "-"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-sm",
												children: v.email || "-"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-sm max-w-[200px] truncate",
												title: v.address,
												children: v.address || "-"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-mono text-xs",
												children: v.trn || "-"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${v.status === "Active" ? "border-success/20 bg-success/12 text-success" : "border-border bg-surface-2 text-muted-foreground"}`,
												children: v.status
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-end gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "icon",
														variant: "outline",
														className: "h-8 w-8 rounded-lg",
														onClick: () => {
															setVendorForm({
																id: v.id,
																name: v.name,
																contact: v.contact || "",
																phone: v.phone || "",
																email: v.email || "",
																address: v.address || "",
																status: v.status || "Active",
																trn: v.trn || ""
															});
															setIsEditingVendor(true);
															setVendorFormOpen(true);
														},
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "icon",
														variant: "outline",
														className: "h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10",
														onClick: () => {
															setDeleteVendorContext(v);
															setDeleteVendorDialogOpen(true);
														},
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
													})]
												})
											})
										] }, v.id)) })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
									open: vendorFormOpen,
									onOpenChange: setVendorFormOpen,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
										className: "sm:max-w-md w-[95vw] sm:w-full",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: isEditingVendor ? "Edit Vendor Profile" : "Add New Vendor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Setup vendor contact details and settings." })] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4 py-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Vendor Name *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															value: vendorForm.name,
															onChange: (e) => setVendorForm({
																...vendorForm,
																name: e.target.value
															}),
															className: "rounded-xl border-border/50 bg-surface-2",
															placeholder: "e.g. Acme Distributors"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Contact Person" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: vendorForm.contact,
																onChange: (e) => setVendorForm({
																	...vendorForm,
																	contact: e.target.value
																}),
																className: "rounded-xl border-border/50 bg-surface-2",
																placeholder: "e.g. John Doe"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "TRN (Tax Reg No)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: vendorForm.trn,
																onChange: (e) => setVendorForm({
																	...vendorForm,
																	trn: e.target.value
																}),
																className: "rounded-xl border-border/50 bg-surface-2",
																placeholder: "e.g. 100xxxxx"
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: vendorForm.phone,
																onChange: (e) => setVendorForm({
																	...vendorForm,
																	phone: e.target.value
																}),
																className: "rounded-xl border-border/50 bg-surface-2",
																placeholder: "e.g. 0501234567"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																value: vendorForm.email,
																onChange: (e) => setVendorForm({
																	...vendorForm,
																	email: e.target.value
																}),
																className: "rounded-xl border-border/50 bg-surface-2",
																placeholder: "e.g. info@acme.com"
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															value: vendorForm.address,
															onChange: (e) => setVendorForm({
																...vendorForm,
																address: e.target.value
															}),
															className: "rounded-xl border-border/50 bg-surface-2",
															placeholder: "e.g. Warehouse 4, Al Quoz, Dubai"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
															value: vendorForm.status,
															onValueChange: (v) => setVendorForm({
																...vendorForm,
																status: v
															}),
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
																className: "rounded-xl border-border/50 bg-surface-2",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select status" })
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																value: "Active",
																children: "Active"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																value: "Inactive",
																children: "Inactive"
															})] })]
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												className: "rounded-xl",
												onClick: () => setVendorFormOpen(false),
												children: "Cancel"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												className: "rounded-xl",
												onClick: async () => {
													if (!vendorForm.name) {
														toast.error("Vendor name is required");
														return;
													}
													if (vendorForm.email) {
														if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorForm.email)) {
															toast.error("Invalid email format");
															return;
														}
													}
													const payload = {
														name: vendorForm.name,
														contact: vendorForm.contact || null,
														phone: vendorForm.phone || null,
														email: vendorForm.email || null,
														address: vendorForm.address || null,
														trn: vendorForm.trn || null,
														status: vendorForm.status
													};
													const res = isEditingVendor ? await updateVendorFn({ data: {
														id: vendorForm.id,
														...payload
													} }) : await createVendorFn({ data: payload });
													if (res.success) {
														toast.success(isEditingVendor ? "Vendor updated" : "Vendor created");
														setVendorFormOpen(false);
														router.invalidate();
													} else toast.error(res.error || "Operation failed");
												},
												children: "Save Vendor"
											})] })
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
									open: deleteVendorDialogOpen,
									onOpenChange: (open) => {
										if (!isDeletingVendor) {
											setDeleteVendorDialogOpen(open);
											if (!open) setDeleteVendorContext(null);
										}
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
										className: "sm:max-w-md w-[95vw] sm:w-full",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Remove vendor profile?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
											"Remove ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: deleteVendorContext?.name }),
											"? If this supplier has associated purchase records or invoices, deletion will be blocked."
										] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
											className: "flex justify-end gap-2 mt-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												className: "rounded-xl",
												onClick: () => {
													setDeleteVendorDialogOpen(false);
													setDeleteVendorContext(null);
												},
												disabled: isDeletingVendor,
												children: "Cancel"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "destructive",
												className: "rounded-xl",
												onClick: async () => {
													if (!deleteVendorContext) return;
													setIsDeletingVendor(true);
													try {
														const res = await deleteVendorFn({ data: { id: deleteVendorContext.id } });
														if (res && res.success) {
															toast.success("Vendor deleted");
															setDeleteVendorDialogOpen(false);
															setDeleteVendorContext(null);
															router.invalidate();
														} else toast.error({
															VENDOR_USED_IN_PURCHASES: "Cannot delete vendor because it is referenced in existing purchase orders.",
															VENDOR_USED_IN_INVOICES: "Cannot delete vendor because it is referenced in vendor invoices."
														}[res?.error || ""] || res?.error || "Failed to delete");
													} catch (err) {
														toast.error(err.message || "An error occurred");
													} finally {
														setIsDeletingVendor(false);
													}
												},
												disabled: isDeletingVendor,
												children: isDeletingVendor ? "Removing..." : "Remove"
											})]
										})]
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "reports",
							className: "mt-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportsTab, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
							open: grnModalOpen,
							onOpenChange: (open) => {
								if (!isSubmittingGRN) setGrnModalOpen(open);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
								className: "max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Record Goods Received (GRN)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
										"Record actual quantities received against PO ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: grnForm?.poNumber }),
										" ",
										"from ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: grnForm?.vendorName }),
										"."
									] })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4 py-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Supplier GRN Number / Invoice Reference *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: grnForm?.grnNumber || "",
													onChange: (e) => setGrnForm({
														...grnForm,
														grnNumber: e.target.value
													}),
													className: "rounded-xl border-border/50 bg-surface-2",
													placeholder: "e.g. GRN-9912",
													disabled: isSubmittingGRN
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Delivery Branch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: grnForm?.branchName || "",
													className: "rounded-xl border-border/50 bg-surface-2 opacity-70",
													disabled: true
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "border border-border rounded-xl overflow-hidden mt-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
												className: "bg-surface-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
														className: "text-right",
														children: "Ordered Qty"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
														className: "text-right",
														children: "Received Qty"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Batch Info (Required if batch-tracked)" })
												] })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: (grnForm?.items || []).map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "font-semibold text-ink max-w-[200px] truncate",
													title: item.name,
													children: item.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right font-mono text-sm",
													children: item.orderedQty
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-right",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "0",
														max: item.orderedQty,
														value: item.receivedQty,
														onChange: (e) => {
															const updatedItems = [...grnForm.items];
															updatedItems[index].receivedQty = Number(e.target.value) || 0;
															setGrnForm({
																...grnForm,
																items: updatedItems
															});
														},
														className: "w-24 h-9 ml-auto text-right rounded-lg bg-surface-2 border-border/50 font-mono",
														disabled: isSubmittingGRN
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.isBatchTracked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5 min-w-[200px]",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														placeholder: "Batch Number",
														value: item.batchNumber || "",
														onChange: (e) => {
															const updatedItems = [...grnForm.items];
															updatedItems[index].batchNumber = e.target.value;
															setGrnForm({
																...grnForm,
																items: updatedItems
															});
														},
														className: "h-8 text-xs rounded-lg bg-surface-2 border-border/50",
														disabled: isSubmittingGRN || item.receivedQty === 0
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "date",
														value: item.expiryDate || "",
														onChange: (e) => {
															const updatedItems = [...grnForm.items];
															updatedItems[index].expiryDate = e.target.value;
															setGrnForm({
																...grnForm,
																items: updatedItems
															});
														},
														className: "h-8 text-xs rounded-lg bg-surface-2 border-border/50",
														disabled: isSubmittingGRN || item.receivedQty === 0
													})]
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs text-muted-foreground",
													children: "No tracking required"
												}) })
											] }, item.productId)) })] })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
										className: "flex justify-end gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											className: "rounded-xl",
											onClick: () => setGrnModalOpen(false),
											disabled: isSubmittingGRN,
											children: "Cancel"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "rounded-xl",
											onClick: async () => {
												console.log("Submitting GRN...");
												if (!grnForm.grnNumber) {
													toast.error("Supplier GRN Number is required");
													return;
												}
												if (grnForm.items.reduce((sum, i) => sum + i.receivedQty, 0) === 0) {
													toast.error("Cannot record a GRN with zero received quantity.");
													return;
												}
												for (const item of grnForm.items) {
													if (item.receivedQty < 0) {
														toast.error(`Received quantity for ${item.name} cannot be negative`);
														return;
													}
													if (item.receivedQty > item.orderedQty) {
														toast.error(`Received quantity for ${item.name} cannot exceed ordered quantity (${item.orderedQty})`);
														return;
													}
													if (item.isBatchTracked && item.receivedQty > 0) {
														if (!item.batchNumber || !item.expiryDate) {
															toast.error(`Batch number and expiry date are required for tracked product: ${item.name}`);
															return;
														}
													}
												}
												setIsSubmittingGRN(true);
												try {
													const payload = {
														purchaseOrderId: grnForm.purchaseOrderId,
														vendorId: grnForm.vendorId,
														branchId: grnForm.branchId,
														grnNumber: grnForm.grnNumber,
														items: grnForm.items.map((i) => ({
															productId: i.productId,
															orderedQty: i.orderedQty,
															receivedQty: i.receivedQty,
															batchNumber: i.isBatchTracked && i.receivedQty > 0 ? i.batchNumber : null,
															expiryDate: i.isBatchTracked && i.receivedQty > 0 ? i.expiryDate : null
														}))
													};
													await recordGRNServerFn({ data: payload });
													toast.success("Goods received note recorded successfully!");
													setGrnModalOpen(false);
													router.invalidate();
												} catch (err) {
													console.error("Error recording GRN:", err);
													toast.error(err.message || "An error occurred");
												} finally {
													setIsSubmittingGRN(false);
												}
											},
											disabled: isSubmittingGRN,
											children: isSubmittingGRN ? "Saving Receipt..." : "Receive & Save GRN"
										})]
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
							open: invoiceModalOpen,
							onOpenChange: (open) => {
								if (!isSubmittingInvoice) setInvoiceModalOpen(open);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
								className: "max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Convert to Invoice" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
										"Create a vendor invoice against PO/GRN reference",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: invoiceForm?.poNumber }),
										" (GRN:",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: invoiceForm?.grnNumber }),
										") from",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: invoiceForm?.vendorName }),
										"."
									] })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4 py-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Invoice Number / Reference *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: invoiceForm?.invoiceNumber || "",
														onChange: (e) => setInvoiceForm({
															...invoiceForm,
															invoiceNumber: e.target.value
														}),
														className: "rounded-xl border-border/50 bg-surface-2",
														placeholder: "e.g. INV-10294",
														disabled: isSubmittingInvoice
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Due Date *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "date",
														value: invoiceForm?.dueDate || "",
														onChange: (e) => setInvoiceForm({
															...invoiceForm,
															dueDate: e.target.value
														}),
														className: "rounded-xl border-border/50 bg-surface-2",
														disabled: isSubmittingInvoice
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Vendor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: invoiceForm?.vendorName || "",
														className: "rounded-xl border-border/50 bg-surface-2 opacity-70",
														disabled: true
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Delivery Branch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: invoiceForm?.branchName || "",
														className: "rounded-xl border-border/50 bg-surface-2 opacity-70",
														disabled: true
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "border border-border rounded-xl overflow-hidden mt-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
													className: "bg-surface-2",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-right",
															children: "Received Qty"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-right",
															children: "Unit Price"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-right",
															children: "Subtotal"
														})
													] })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: (invoiceForm?.items || []).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-semibold text-ink max-w-[200px] truncate",
														title: item.name,
														children: item.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
														className: "text-right font-mono text-sm",
														children: [item.receivedQty, " pcs"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-right font-mono text-sm",
														children: aed(item.unitPrice)
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-right font-mono text-sm font-semibold",
														children: aed(item.subtotal)
													})
												] }, item.productId)) })] })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 space-y-1.5 text-right font-semibold text-sm",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Subtotal: ", aed(invoiceForm?.subtotal || 0)] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
														"VAT (",
														invoiceForm?.vatRate,
														"%",
														" ",
														invoiceForm?.vatInclusive ? "Included" : "Excluded",
														"):",
														" ",
														aed(invoiceForm?.vat || 0)
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-lg font-bold text-ink",
														children: ["Total: ", aed(invoiceForm?.total || 0)]
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
										className: "flex justify-end gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											className: "rounded-xl",
											onClick: () => setInvoiceModalOpen(false),
											disabled: isSubmittingInvoice,
											children: "Cancel"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "rounded-xl",
											onClick: async () => {
												if (!invoiceForm.invoiceNumber) {
													toast.error("Invoice number/reference is required");
													return;
												}
												if (!invoiceForm.dueDate) {
													toast.error("Due date is required");
													return;
												}
												setIsSubmittingInvoice(true);
												try {
													const res = await createVendorInvoiceServerFn({ data: {
														purchaseOrderId: invoiceForm.purchaseOrderId,
														invoiceNumber: invoiceForm.invoiceNumber,
														dueDate: invoiceForm.dueDate,
														total: invoiceForm.total
													} });
													if (res && res.success) {
														toast.success("Vendor invoice recorded successfully!");
														setInvoiceModalOpen(false);
														router.invalidate();
													} else toast.error("Failed to create vendor invoice");
												} catch (err) {
													toast.error(err.message || "An error occurred");
												} finally {
													setIsSubmittingInvoice(false);
												}
											},
											disabled: isSubmittingInvoice,
											children: isSubmittingInvoice ? "Converting..." : "Convert to Invoice"
										})]
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
							open: deletePoDialogOpen,
							onOpenChange: (open) => {
								if (!isDeletingPo) {
									setDeletePoDialogOpen(open);
									if (!open) setDeletePoContext(null);
								}
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
								className: "max-w-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Delete Purchase Order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
									"Are you sure you want to remove Purchase Order",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: deletePoContext?.shortId }),
									" from",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: deletePoContext?.vendor }),
									"? This action cannot be undone."
								] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
									className: "flex justify-end gap-2 mt-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										className: "rounded-xl",
										onClick: () => setDeletePoDialogOpen(false),
										disabled: isDeletingPo,
										children: "Cancel"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "destructive",
										className: "rounded-xl",
										onClick: async () => {
											setIsDeletingPo(true);
											try {
												const res = await deletePurchaseOrderServerFn({ data: { id: deletePoContext.id } });
												if (res && res.success) {
													toast.success("Purchase Order deleted successfully");
													setDeletePoDialogOpen(false);
													setDeletePoContext(null);
													router.invalidate();
												} else toast.error("Failed to delete Purchase Order");
											} catch (err) {
												toast.error(err.message || "An error occurred");
											} finally {
												setIsDeletingPo(false);
											}
										},
										disabled: isDeletingPo,
										children: isDeletingPo ? "Deleting..." : "Delete PO"
									})]
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
							open: editPoOpen,
							onOpenChange: (open) => {
								if (!isSavingPo) setEditPoOpen(open);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
								className: "max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit Purchase Order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Modify details and line items for the Purchase Order." })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4 py-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Vendor *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													className: "flex h-10 w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-sm rounded-xl border-border/50",
													value: editPoForm?.vendorId || "",
													onChange: (e) => setEditPoForm({
														...editPoForm,
														vendorId: e.target.value
													}),
													disabled: isSavingPo,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "",
														children: "Select Vendor..."
													}), mappedVendors.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: v.id,
														children: v.name
													}, v.id))]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Delivery Branch *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													className: "flex h-10 w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-sm rounded-xl border-border/50",
													value: editPoForm?.branchId || "",
													onChange: (e) => setEditPoForm({
														...editPoForm,
														branchId: e.target.value
													}),
													disabled: isSavingPo,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "",
														children: "Select Branch..."
													}), mappedOutlets.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: b.id,
														children: b.name
													}, b.id))]
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between mb-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														className: "text-sm font-bold",
														children: "Line Items"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
														variant: "outline",
														size: "sm",
														onClick: () => setEditPoForm({
															...editPoForm,
															items: [...editPoForm?.items || [], {
																productId: "",
																qty: 1,
																unitPrice: 0
															}]
														}),
														disabled: isSavingPo,
														className: "rounded-lg h-8",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-1" }), " Add Item"]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "border border-border rounded-xl overflow-hidden",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
														className: "bg-surface-2",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
																className: "w-24",
																children: "Qty"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
																className: "w-32",
																children: "Unit Price (AED)"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
																className: "w-28 text-right",
																children: "Subtotal"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { className: "w-12 text-center" })
														] })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [(editPoForm?.items || []).map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "p-2",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
																className: "flex h-9 w-full rounded-md border border-input bg-surface-2 px-2 py-1 text-xs rounded-lg border-border/50",
																value: item.productId,
																onChange: (e) => {
																	const items = [...editPoForm.items];
																	const selectedProd = mappedProducts.find((p) => p.id === e.target.value);
																	items[idx].productId = e.target.value;
																	if (selectedProd && items[idx].unitPrice === 0) items[idx].unitPrice = Number(selectedProd.cost) || 0;
																	setEditPoForm({
																		...editPoForm,
																		items
																	});
																},
																disabled: isSavingPo,
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																	value: "",
																	children: "Select Product..."
																}), mappedProducts.map((prod) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																	value: prod.id,
																	children: prod.name
																}, prod.id))]
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "p-2",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																type: "number",
																min: "1",
																value: item.qty,
																onChange: (e) => {
																	const items = [...editPoForm.items];
																	items[idx].qty = Number(e.target.value) || 0;
																	setEditPoForm({
																		...editPoForm,
																		items
																	});
																},
																className: "h-9 rounded-lg bg-surface-2 border-border/50 text-xs font-mono text-right",
																disabled: isSavingPo
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "p-2",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																type: "number",
																min: "0",
																step: "0.01",
																value: item.unitPrice,
																onChange: (e) => {
																	const items = [...editPoForm.items];
																	items[idx].unitPrice = Number(e.target.value) || 0;
																	setEditPoForm({
																		...editPoForm,
																		items
																	});
																},
																className: "h-9 rounded-lg bg-surface-2 border-border/50 text-xs font-mono text-right",
																disabled: isSavingPo
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "p-2 text-right font-mono text-sm",
															children: aed(item.qty * item.unitPrice)
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "p-2 text-center",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																size: "icon",
																variant: "outline",
																className: "h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 border-border/50",
																onClick: () => {
																	const items = editPoForm.items.filter((_, i) => i !== idx);
																	setEditPoForm({
																		...editPoForm,
																		items
																	});
																},
																disabled: isSavingPo,
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
															})
														})
													] }, idx)), (!editPoForm?.items || editPoForm.items.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														colSpan: 5,
														className: "text-center text-muted-foreground p-4 text-xs",
														children: "No items added. Click \"Add Item\" to start."
													}) })] })] })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-end mt-4 text-lg font-bold text-ink",
													children: [
														"Total:",
														" ",
														aed((editPoForm?.items || []).reduce((acc, item) => acc + item.qty * item.unitPrice, 0))
													]
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
										className: "flex justify-end gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											className: "rounded-xl",
											onClick: () => setEditPoOpen(false),
											disabled: isSavingPo,
											children: "Cancel"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "rounded-xl",
											onClick: async () => {
												if (!editPoForm.vendorId || !editPoForm.branchId) {
													toast.error("Vendor and Branch are required");
													return;
												}
												if (!editPoForm.items || editPoForm.items.length === 0) {
													toast.error("Please add at least one line item");
													return;
												}
												for (const item of editPoForm.items) {
													if (!item.productId) {
														toast.error("Please select a product for all items");
														return;
													}
													if (item.qty <= 0) {
														toast.error("Quantity must be greater than zero");
														return;
													}
													if (item.unitPrice <= 0) {
														toast.error("Unit price must be positive");
														return;
													}
												}
												setIsSavingPo(true);
												try {
													const res = await updatePurchaseOrderServerFn({ data: {
														id: editPoForm.id,
														vendorId: editPoForm.vendorId,
														branchId: editPoForm.branchId,
														items: editPoForm.items
													} });
													if (res && res.success) {
														toast.success("Purchase Order updated successfully!");
														setEditPoOpen(false);
														router.invalidate();
													} else toast.error("Failed to update PO");
												} catch (err) {
													toast.error(err.message || "An error occurred");
												} finally {
													setIsSavingPo(false);
												}
											},
											disabled: isSavingPo,
											children: isSavingPo ? "Saving Changes..." : "Save Changes"
										})]
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
							open: invoiceDetailModalOpen,
							onOpenChange: setInvoiceDetailModalOpen,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
								className: "max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full no-print",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Vendor Invoice Details" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "View invoice summary, line items and billing details." })] }),
									invoiceDetail && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-6 py-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-start border-b border-border pb-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
														className: "text-lg font-bold text-ink",
														children: invoiceDetail.tenantName
													}),
													invoiceDetail.tenantTrn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: ["TRN: ", invoiceDetail.tenantTrn]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: ["Branch: ", invoiceDetail.branchName]
													})
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-right",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
															className: "text-sm font-bold text-ink",
															children: "INVOICE"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-xs text-muted-foreground",
															children: ["Reference: ", invoiceDetail.invoiceNumber]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-xs text-muted-foreground",
															children: ["Date: ", invoiceDetail.createdAt ? invoiceDetail.createdAt.split("T")[0] : ""]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-xs text-muted-foreground",
															children: ["Due Date: ", invoiceDetail.dueDate ? invoiceDetail.dueDate.split("T")[0] : ""]
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-6 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
														className: "font-bold text-ink mb-1.5",
														children: "Supplier Details:"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-semibold text-ink",
														children: invoiceDetail.vendorName
													}),
													invoiceDetail.vendorTrn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: ["TRN: ", invoiceDetail.vendorTrn]
													}),
													invoiceDetail.vendorContact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: ["Contact: ", invoiceDetail.vendorContact]
													}),
													invoiceDetail.vendorPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: ["Phone: ", invoiceDetail.vendorPhone]
													}),
													invoiceDetail.vendorEmail && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: ["Email: ", invoiceDetail.vendorEmail]
													}),
													invoiceDetail.vendorAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground mt-1 max-w-[250px]",
														children: invoiceDetail.vendorAddress
													})
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
														className: "font-bold text-ink mb-1.5",
														children: "References:"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: [
															"Purchase Order:",
															" ",
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																className: "font-mono text-ink",
																children: invoiceDetail.poNumber
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-muted-foreground",
														children: [
															"GRN:",
															" ",
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																className: "font-mono text-ink",
																children: invoiceDetail.grnNumber
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-4",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold border-success/20 bg-success/12 text-success capitalize",
															children: invoiceDetail.status
														})
													})
												] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "border border-border rounded-xl overflow-hidden mt-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
													className: "bg-surface-2",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Product" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-right",
															children: "Received Qty"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-right",
															children: "Unit Price"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-right",
															children: "Subtotal"
														})
													] })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: (invoiceDetail.items || []).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-semibold text-ink max-w-[250px] truncate",
														title: item.name,
														children: item.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
														className: "text-right font-mono text-sm",
														children: [item.receivedQty, " pcs"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-right font-mono text-sm",
														children: aed(item.unitPrice)
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-right font-mono text-sm font-semibold",
														children: aed(item.subtotal)
													})
												] }, item.productId)) })] })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5 text-right font-semibold text-sm border-t border-border pt-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Subtotal: ", aed(invoiceDetail.subtotal)] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
														"VAT (",
														invoiceDetail.vatRate,
														"%",
														" ",
														invoiceDetail.vatInclusive ? "Included" : "Excluded",
														"):",
														" ",
														aed(invoiceDetail.vat)
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-lg font-bold text-ink",
														children: ["Total: ", aed(invoiceDetail.total)]
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
										className: "flex justify-between items-center gap-2 mt-4 border-t border-border pt-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												className: "rounded-xl",
												onClick: () => downloadInvoicePdf(invoiceDetail),
												disabled: isGeneratingPdf || !invoiceDetail,
												children: isGeneratingPdf ? "Generating PDF..." : "Download PDF"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												className: "rounded-xl",
												onClick: printInvoice,
												disabled: !invoiceDetail,
												children: "Print Invoice"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "rounded-xl",
											onClick: () => setInvoiceDetailModalOpen(false),
											children: "Close"
										})]
									})
								]
							})
						}),
						invoiceDetail && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							id: "printable-invoice",
							className: "hidden print:block font-sans bg-white text-black p-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-invoice, #printable-invoice * {
                    visibility: visible !important;
                  }
                  #printable-invoice {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 30px !important;
                    background: white !important;
                    color: black !important;
                  }
                }
              ` }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-start border-b-2 border-gray-300 pb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "text-2xl font-bold",
											children: invoiceDetail.tenantName
										}),
										invoiceDetail.tenantTrn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-gray-500",
											children: ["TRN: ", invoiceDetail.tenantTrn]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-gray-500",
											children: ["Branch: ", invoiceDetail.branchName]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-right",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-xl font-bold text-gray-800",
												children: "VENDOR INVOICE"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-gray-500",
												children: ["Reference: ", invoiceDetail.invoiceNumber]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-gray-500",
												children: ["Date: ", invoiceDetail.createdAt ? invoiceDetail.createdAt.split("T")[0] : ""]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-gray-500",
												children: ["Due Date: ", invoiceDetail.dueDate ? invoiceDetail.dueDate.split("T")[0] : ""]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-8 my-8 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-bold text-gray-700 mb-2",
											children: "Supplier / Vendor:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-gray-900",
											children: invoiceDetail.vendorName
										}),
										invoiceDetail.vendorTrn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-gray-500",
											children: ["TRN: ", invoiceDetail.vendorTrn]
										}),
										invoiceDetail.vendorContact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-gray-500",
											children: ["Contact: ", invoiceDetail.vendorContact]
										}),
										invoiceDetail.vendorPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-gray-500",
											children: ["Phone: ", invoiceDetail.vendorPhone]
										}),
										invoiceDetail.vendorEmail && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-gray-500",
											children: ["Email: ", invoiceDetail.vendorEmail]
										}),
										invoiceDetail.vendorAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-gray-500 mt-1",
											children: invoiceDetail.vendorAddress
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-bold text-gray-700 mb-2",
											children: "References:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-gray-600",
											children: [
												"Purchase Order Reference:",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono font-semibold",
													children: invoiceDetail.poNumber
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-gray-600",
											children: [
												"GRN Reference:",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono font-semibold",
													children: invoiceDetail.grnNumber
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-gray-600 mt-2",
											children: ["Status: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold capitalize",
												children: invoiceDetail.status
											})]
										})
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full text-left border-collapse my-6 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b-2 border-gray-300 bg-gray-100",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-2 px-3",
												children: "Product Description"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-2 px-3 text-right",
												children: "Received Qty"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-2 px-3 text-right",
												children: "Unit Price"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-2 px-3 text-right",
												children: "Subtotal"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (invoiceDetail.items || []).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-gray-200",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-2 px-3 font-medium",
												children: item.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "py-2 px-3 text-right font-mono",
												children: [item.receivedQty, " pcs"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-2 px-3 text-right font-mono",
												children: aed(item.unitPrice)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-2 px-3 text-right font-mono font-semibold",
												children: aed(item.subtotal)
											})
										]
									}, item.productId)) })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex justify-end mt-8",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "w-64 space-y-2 text-right text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-gray-500",
													children: "Subtotal:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono font-semibold",
													children: aed(invoiceDetail.subtotal)
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-gray-500",
													children: [
														"VAT (",
														invoiceDetail.vatRate,
														"%",
														" ",
														invoiceDetail.vatInclusive ? "Included" : "Excluded",
														"):"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono font-semibold",
													children: aed(invoiceDetail.vat)
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between border-t border-gray-300 pt-2 text-base font-bold",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Outstanding:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-gray-900",
													children: aed(invoiceDetail.total)
												})]
											})
										]
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "audit_logs",
							className: "mt-0 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-lg font-bold text-ink",
									children: "System Audit Logs"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Track user operations and database state changes."
								})] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "panel p-6 space-y-4",
								children: isLoadingLogs ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "py-20 text-center text-muted-foreground",
									children: "Loading audit logs..."
								}) : auditLogsData.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "py-20 text-center text-muted-foreground",
									children: "No audit logs found."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "overflow-x-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, {
											className: "min-w-[800px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Timestamp" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "User / Actor ID" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Action" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Entity Type" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Details" })
											] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: auditLogsData.slice((auditLogsPage - 1) * auditLogsPerPage, auditLogsPage * auditLogsPerPage).map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "font-mono text-xs",
													children: new Date(log.createdAt).toLocaleString()
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "font-mono text-xs",
													children: log.userId || "System"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "capitalize font-semibold text-xs",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${log.action === "create" ? "bg-green-50 text-green-700 ring-green-600/20" : log.action === "update" ? "bg-blue-50 text-blue-700 ring-blue-600/20" : "bg-red-50 text-red-700 ring-red-600/20"}`,
														children: log.action
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "font-mono text-xs",
													children: log.entityType
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
													className: "text-xs max-w-xs truncate",
													title: typeof log.details === "string" ? log.details : log.details ? JSON.stringify(log.details) : "N/A",
													children: typeof log.details === "string" ? log.details : log.details?.summary || (log.details ? Object.entries(log.details).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" | ") : "N/A")
												})
											] }, log.id)) })]
										})
									}), auditLogsData.length > auditLogsPerPage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between border-t border-border/50 pt-4 px-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-muted-foreground",
											children: [
												"Showing ",
												(auditLogsPage - 1) * auditLogsPerPage + 1,
												" to ",
												Math.min(auditLogsPage * auditLogsPerPage, auditLogsData.length),
												" of ",
												auditLogsData.length,
												" logs"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												className: "rounded-lg",
												disabled: auditLogsPage === 1,
												onClick: () => setAuditLogsPage((p) => Math.max(1, p - 1)),
												children: "Previous"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												className: "rounded-lg",
												disabled: auditLogsPage >= Math.ceil(auditLogsData.length / auditLogsPerPage),
												onClick: () => setAuditLogsPage((p) => p + 1),
												children: "Next"
											})]
										})]
									})]
								})
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
					open: addBatchOpen,
					onOpenChange: setAddBatchOpen,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
						className: "sm:max-w-[425px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add Manual Batch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Create a new inventory batch manually (e.g. for stock correction)." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Product" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: addBatchForm.productId,
											onValueChange: (val) => setAddBatchForm({
												...addBatchForm,
												productId: val
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "rounded-xl border-border/50 bg-surface-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select product" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: mappedProducts.filter((p) => p.isBatchTracked).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: p.id,
												children: p.name
											}, p.id)) })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Outlet / Branch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: addBatchForm.branchId,
											onValueChange: (val) => setAddBatchForm({
												...addBatchForm,
												branchId: val
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "rounded-xl border-border/50 bg-surface-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select outlet" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: data?.branches?.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: b.id,
												children: b.name
											}, b.id)) })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Batch Number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "e.g. BATCH-001",
												value: addBatchForm.batchNumber,
												onChange: (e) => setAddBatchForm({
													...addBatchForm,
													batchNumber: e.target.value
												}),
												className: "rounded-xl border-border/50 bg-surface-2"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Initial Stock" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												min: "0",
												value: addBatchForm.initialStock,
												onChange: (e) => setAddBatchForm({
													...addBatchForm,
													initialStock: parseInt(e.target.value) || 0
												}),
												className: "rounded-xl border-border/50 bg-surface-2"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Expiry Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											value: addBatchForm.expiryDate,
											onChange: (e) => setAddBatchForm({
												...addBatchForm,
												expiryDate: e.target.value
											}),
											className: "rounded-xl border-border/50 bg-surface-2"
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								className: "rounded-xl",
								onClick: () => setAddBatchOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								disabled: isAddingBatch,
								className: "rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground",
								onClick: async () => {
									if (!addBatchForm.productId || !addBatchForm.branchId || !addBatchForm.batchNumber || !addBatchForm.expiryDate) {
										toast.error("Please fill all required fields");
										return;
									}
									setIsAddingBatch(true);
									try {
										const res = await createBatchServerFn({ data: addBatchForm });
										if (res.success) {
											toast.success("Batch added successfully");
											setAddBatchOpen(false);
											setAddBatchForm({
												productId: "",
												branchId: "",
												batchNumber: "",
												expiryDate: "",
												initialStock: 0
											});
											router.invalidate();
										} else toast.error(res.error || "Failed to add batch");
									} catch (e) {
										toast.error(e.message || "Failed to add batch");
									} finally {
										setIsAddingBatch(false);
									}
								},
								children: isAddingBatch ? "Adding..." : "Add Batch"
							})] })
						]
					})
				})
			]
		})
	});
}
//#endregion
export { HeadOffice as component };
