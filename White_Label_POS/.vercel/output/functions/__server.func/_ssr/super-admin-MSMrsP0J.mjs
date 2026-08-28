import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as cn, t as Button } from "./button-BlBeOJmP.mjs";
import { y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Plus, Et as Activity, I as Monitor, N as Pencil, bt as Ban, g as Store, ht as Building2, it as CircleUser, ot as CircleArrowUp, p as Trash2, st as CircleArrowDown, x as ShieldCheck } from "../_libs/lucide-react.mjs";
import { a as TabsList, i as TabsContent, n as StatCard, o as TabsTrigger, r as Tabs, t as DemoShell } from "./tabs-DHhejuE7.mjs";
import { t as Badge } from "./badge-BpuUFK6A.mjs";
import { t as Switch } from "./switch-BbovR4Kp.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _t as getTenantAdminServerFn, bt as updateTenantStatusServerFn, ct as archiveTenantServerFn, dt as createTenantServerFn, ft as deleteBranchServerFn, lt as createBranchServerFn, mt as downgradeTenantPlanServerFn, pt as deleteTenantAdminServerFn, r as Route$1, ut as createExistingTenantAdminServerFn, vt as updatePlatformSettingsServerFn, xt as upgradeTenantPlanServerFn, yt as updateTenantAdminServerFn } from "./router-B7PuFS5E.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-dhJPF7rN.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-BTVuOq31.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DUEF7P_7.mjs";
import { t as Input } from "./input-Cexa0DG2.mjs";
import { t as Label } from "./label-CZhEvsKN.mjs";
import { a as Area, c as ResponsiveContainer, i as XAxis, l as Tooltip, o as CartesianGrid, r as YAxis, t as AreaChart } from "../_libs/recharts+[...].mjs";
import { a as Trigger, i as Root3, n as Portal, r as Provider, t as Content2 } from "../_libs/radix-ui__react-tooltip.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/super-admin-MSMrsP0J.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TooltipProvider = Provider;
var Tooltip$1 = Root3;
var TooltipTrigger = Trigger;
var TooltipContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)", className),
	...props
}) }));
TooltipContent.displayName = Content2.displayName;
var statusTone = {
	Active: "bg-success/12 text-success border-success/20",
	Trial: "bg-primary/10 text-primary border-primary/20",
	Suspended: "bg-destructive/10 text-destructive border-destructive/20"
};
function SuperAdmin() {
	const router = useRouter();
	const loaderData = Route$1.useLoaderData();
	const [tenants, setTenants] = (0, import_react.useState)(loaderData.initialTenants);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		subdomain: "",
		plan: "Starter",
		trn: "",
		outlets: 0,
		tills: 0,
		adminName: "",
		adminEmail: "",
		adminPhone: "",
		adminAddress: "",
		adminPassword: ""
	});
	const [vatRate, setVatRate] = (0, import_react.useState)(loaderData.taxSettings.vatRate);
	const [inclusive, setInclusive] = (0, import_react.useState)(loaderData.taxSettings.inclusive);
	const [currency, setCurrency] = (0, import_react.useState)(loaderData.platformSettings.currency);
	const [timezone, setTimezone] = (0, import_react.useState)(loaderData.platformSettings.timezone);
	const [dateFormat, setDateFormat] = (0, import_react.useState)(loaderData.platformSettings.dateFormat);
	const { platformSeries, systemLogs, totalGmv } = loaderData.analytics;
	const [branches, setBranches] = (0, import_react.useState)(loaderData.initialBranches);
	(0, import_react.useEffect)(() => {
		setTenants(loaderData.initialTenants);
		setBranches(loaderData.initialBranches);
	}, [loaderData]);
	const [manageTenant, setManageTenant] = (0, import_react.useState)(null);
	const [selectedBranch, setSelectedBranch] = (0, import_react.useState)(null);
	const [newBranchForm, setNewBranchForm] = (0, import_react.useState)({
		name: "",
		address: ""
	});
	const [branchToDelete, setBranchToDelete] = (0, import_react.useState)(null);
	const [globalAddBranchOpen, setGlobalAddBranchOpen] = (0, import_react.useState)(false);
	const [globalNewBranchForm, setGlobalNewBranchForm] = (0, import_react.useState)({
		tenantId: "",
		name: "",
		address: "",
		status: "Active"
	});
	const [adminProfileTenant, setAdminProfileTenant] = (0, import_react.useState)(null);
	const [adminData, setAdminData] = (0, import_react.useState)(null);
	const [existingAdminForm, setExistingAdminForm] = (0, import_react.useState)({
		name: "",
		email: "",
		phone: "",
		address: "",
		password: ""
	});
	const [isEditingAdmin, setIsEditingAdmin] = (0, import_react.useState)(false);
	const [updateAdminForm, setUpdateAdminForm] = (0, import_react.useState)({
		name: "",
		email: "",
		phone: "",
		address: "",
		password: ""
	});
	const [archiveTenantOpen, setArchiveTenantOpen] = (0, import_react.useState)(false);
	const [tenantToArchive, setTenantToArchive] = (0, import_react.useState)(null);
	const [archiveConfirmation, setArchiveConfirmation] = (0, import_react.useState)("");
	const [isArchiving, setIsArchiving] = (0, import_react.useState)(false);
	const totals = (0, import_react.useMemo)(() => ({
		tenants: tenants.length,
		outlets: tenants.reduce((s, t) => s + t.outlets, 0),
		tills: tenants.reduce((s, t) => s + t.tills, 0),
		orders: tenants.reduce((s, t) => s + t.monthlyOrders, 0)
	}), [tenants]);
	const toggleStatus = async (id) => {
		const tenant = tenants.find((t) => t.id === id);
		if (!tenant) return;
		const newStatus = tenant.status === "Suspended" ? "Active" : "Suspended";
		if ((await updateTenantStatusServerFn({ data: {
			id,
			status: newStatus
		} })).success) {
			router.invalidate();
			toast.success("Tenant status updated");
		} else toast.error("Failed to update status");
	};
	const handleArchive = async () => {
		if (!tenantToArchive || !archiveConfirmation) return;
		setIsArchiving(true);
		try {
			const res = await archiveTenantServerFn({ data: {
				tenantId: tenantToArchive.id,
				confirmationValue: archiveConfirmation
			} });
			if (res.success) {
				toast.success(res.message || "Tenant archived successfully");
				setArchiveTenantOpen(false);
				setTenantToArchive(null);
				setArchiveConfirmation("");
				router.invalidate();
			} else toast.error(res.error || "Failed to archive tenant");
		} catch (err) {
			toast.error(err.message || "An unexpected error occurred");
		} finally {
			setIsArchiving(false);
		}
	};
	const saveRegionalSettings = async () => {
		if ((await updatePlatformSettingsServerFn({ data: {
			currency,
			timezone,
			dateFormat
		} })).success) {
			toast.success("Regional settings saved to database!");
			router.invalidate();
		} else toast.error("Failed to save settings");
	};
	const upgrade = async (id) => {
		const res = await upgradeTenantPlanServerFn({ data: { id } });
		if (res.success) {
			router.invalidate();
			toast.success(`Plan upgraded to ${res.newPlan}`);
		} else toast.error("Failed to upgrade plan");
	};
	const downgrade = async (id) => {
		const res = await downgradeTenantPlanServerFn({ data: { id } });
		if (res.success) {
			router.invalidate();
			toast.success(`Plan downgraded to ${res.newPlan}`);
		} else toast.error("Failed to downgrade plan");
	};
	const handleManageBranches = (tenant) => {
		setManageTenant(tenant);
		setNewBranchForm({
			name: "",
			address: ""
		});
		setSelectedBranch(null);
	};
	const addBranch = async () => {
		if (!manageTenant) return;
		if (branches.filter((b) => b.tenantId === manageTenant.id).length >= (manageTenant.plan === "Enterprise" ? 999 : 10)) {
			toast.error("Outlet limit reached â€” upgrade plan to add more branches");
			return;
		}
		if (!newBranchForm.name.trim()) {
			toast.error("Please fill all required fields");
			return;
		}
		const res = await createBranchServerFn({ data: {
			tenantId: manageTenant.id,
			name: newBranchForm.name,
			address: newBranchForm.address
		} });
		if (res.success) {
			router.invalidate();
			setNewBranchForm({
				name: "",
				address: ""
			});
			toast.success("Branch added successfully");
		} else toast.error(res.error || "Failed to add branch");
	};
	const confirmRemoveBranch = async () => {
		if (!manageTenant || !branchToDelete) return;
		if ((await deleteBranchServerFn({ data: { id: branchToDelete } })).success) {
			router.invalidate();
			toast.success("Branch removed");
			setBranchToDelete(null);
			setSelectedBranch(null);
		} else toast.error("Failed to remove branch");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DemoShell, {
		title: "SaaS Super-Admin Portal",
		subtitle: "Provision and govern every supermarket tenant on the platform â€” limits, tax templates and live network telemetry.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:-translate-y-0.5 transition-all",
				onClick: () => setGlobalAddBranchOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "mr-1.5 h-4 w-4" }), " Add Branch"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "rounded-xl font-semibold shadow-sm hover:-translate-y-0.5 transition-all",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-4 w-4" }), " Create tenant"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-lg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create tenant account" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Provision a new supermarket chain with enforced commercial limits." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 py-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "tname",
										children: "Chain name"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "tname",
										value: form.name,
										onChange: (e) => setForm({
											...form,
											name: e.target.value
										}),
										placeholder: "Marina Grocers LLC"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "touts",
											children: "Outlet limit"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "touts",
											type: "number",
											min: 1,
											value: form.outlets,
											onChange: (e) => setForm({
												...form,
												outlets: Number(e.target.value)
											})
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "ttills",
											children: "Till limit"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "ttills",
											type: "number",
											min: 1,
											value: form.tills,
											onChange: (e) => setForm({
												...form,
												tills: Number(e.target.value)
											})
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "ttrn",
										children: "TRN"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "ttrn",
										value: form.trn,
										onChange: (e) => setForm({
											...form,
											trn: e.target.value
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-2 pb-1 border-t mt-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold uppercase text-muted-foreground mb-3",
										children: "Primary Admin Setup"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: form.adminName,
													onChange: (e) => setForm({
														...form,
														adminName: e.target.value
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "email",
														value: form.adminEmail,
														onChange: (e) => setForm({
															...form,
															adminEmail: e.target.value
														})
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "password",
														value: form.adminPassword,
														onChange: (e) => setForm({
															...form,
															adminPassword: e.target.value
														})
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: form.adminPhone,
														onChange: (e) => setForm({
															...form,
															adminPhone: e.target.value
														})
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Office Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: form.adminAddress,
														onChange: (e) => setForm({
															...form,
															adminAddress: e.target.value
														})
													})]
												})]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground",
									children: [
										"Tax template applied on creation: UAE VAT ",
										vatRate,
										"% Â·",
										" ",
										inclusive ? "inclusive" : "exclusive",
										" pricing Â· AED"
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "rounded-xl",
							onClick: () => setOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "rounded-xl",
							onClick: async () => {
								if (!form.name.trim()) {
									toast.error("Chain name is required");
									return;
								}
								if (!form.adminEmail || !form.adminPassword || !form.adminName || !form.adminPhone || !form.adminAddress) {
									toast.error("All admin fields are required");
									return;
								}
								const res = await createTenantServerFn({ data: {
									name: form.name,
									subdomain: form.subdomain || form.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
									plan: form.plan,
									trn: form.trn,
									adminName: form.adminName,
									adminEmail: form.adminEmail,
									adminPhone: form.adminPhone,
									adminAddress: form.adminAddress,
									adminPassword: form.adminPassword
								} });
								if (res.success) {
									router.invalidate();
									setForm({
										name: "",
										subdomain: "",
										plan: "Starter",
										outlets: 0,
										tills: 0,
										trn: "",
										adminName: "",
										adminEmail: "",
										adminPhone: "",
										adminAddress: "",
										adminPassword: ""
									});
									setOpen(false);
									toast.success("Tenant provisioned", { description: "Trial environment is live." });
								} else toast.error(res.error || "Failed to provision tenant");
							},
							children: "Create tenant"
						})] })
					]
				})]
			})]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Active tenants",
						value: String(totals.tenants),
						delta: void 0,
						icon: Building2
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Outlets on platform",
						value: String(totals.outlets),
						delta: void 0,
						icon: ShieldCheck,
						tone: "success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Active tills",
						value: String(totals.tills),
						delta: void 0,
						icon: Monitor
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Monthly orders",
						value: `${totals.orders}`,
						delta: void 0,
						icon: Activity,
						tone: "accent"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "tenants",
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "rounded-xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "tenants",
								children: "Tenants"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "analytics",
								children: "Platform analytics"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "settings",
								children: "Tax & currency"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "tenants",
						className: "mt-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, {
							className: "w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
								className: "bg-surface-2/80",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
									className: "hover:bg-transparent",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "min-w-[180px] py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground",
											children: "Tenant"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground",
											children: "Plan"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground",
											children: "Status"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground",
											children: "Outlets"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground",
											children: "Tills"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground",
											children: "Monthly orders"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground",
											children: "Actions"
										})
									]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: tenants.filter((t) => t.status !== "Archived").map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
								className: "group transition-all duration-300 hover:bg-primary/[0.03] hover:shadow-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
										className: "p-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[15px] font-extrabold text-ink transition-colors group-hover:text-primary",
											children: t.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "flex h-2 w-2 rounded-full bg-primary/40" }),
												"TRN ",
												t.trn
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "p-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "secondary",
											className: "rounded-xl px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold bg-secondary text-secondary-foreground shadow-sm",
											children: t.plan
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "p-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold shadow-sm ${statusTone[t.status]}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-current opacity-70" }), t.status]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "p-5 text-center text-sm font-extrabold tabular-nums text-ink",
										children: t.outlets
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "p-5 text-center text-sm font-extrabold tabular-nums text-ink",
										children: t.tills
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "p-5 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "inline-block rounded-xl bg-primary/10 px-3 py-1 text-sm font-extrabold tabular-nums text-primary shadow-sm",
											children: t.monthlyOrders.toLocaleString("en-AE")
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "p-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-end gap-1.5 opacity-80 transition-opacity group-hover:opacity-100",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												size: "sm",
												variant: "default",
												className: "rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 px-3 h-8 text-xs",
												onClick: () => upgrade(t.id),
												disabled: t.plan === "Enterprise",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleArrowUp, { className: "mr-1.5 h-3.5 w-3.5" }), " Upgrade"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipProvider, {
												delayDuration: 200,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
														asChild: true,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "outline",
															className: "h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary border-primary/20 transition-colors",
															onClick: () => downgrade(t.id),
															disabled: t.plan === "Starter",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleArrowDown, { className: "h-4 w-4" })
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: "Downgrade" })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
														asChild: true,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "outline",
															className: "h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary border-primary/20 transition-colors",
															onClick: () => handleManageBranches(t),
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "h-4 w-4" })
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: "Branches" })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
														asChild: true,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "outline",
															className: "h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary border-primary/20 transition-colors",
															onClick: async () => {
																setAdminData(null);
																setIsEditingAdmin(false);
																setAdminProfileTenant(t);
																const res = await getTenantAdminServerFn({ data: { tenantId: t.id } });
																if (res.success) setAdminData(res.admin);
															},
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleUser, { className: "h-4 w-4" })
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: "Admin Profile" })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
														asChild: true,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "outline",
															className: "h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive border-destructive/20 transition-colors",
															onClick: () => toggleStatus(t.id),
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "h-4 w-4" })
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: t.status === "Suspended" ? "Reactivate" : "Suspend" })] }),
													t.status !== "Archived" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
														asChild: true,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "outline",
															className: "h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive border-destructive/20 transition-colors",
															onClick: () => {
																setTenantToArchive(t);
																setArchiveTenantOpen(true);
																setArchiveConfirmation("");
															},
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: "Archive Tenant" })] })
												]
											})]
										})
									})
								]
							}, t.id)) })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "analytics",
						className: "mt-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-5 lg:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-6 lg:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-bold text-ink",
									children: "Network sales volume (AED 000s)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 h-64",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
										width: "100%",
										height: "100%",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
											data: platformSeries,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
													id: "salesFill",
													x1: "0",
													y1: "0",
													x2: "0",
													y2: "1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "0%",
														stopColor: "var(--primary)",
														stopOpacity: .35
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "100%",
														stopColor: "var(--primary)",
														stopOpacity: .02
													})]
												}) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
													strokeDasharray: "3 3",
													stroke: "var(--border)",
													vertical: false
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
													dataKey: "t",
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
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
													dataKey: "sales",
													stroke: "var(--primary)",
													strokeWidth: 2.5,
													fill: "url(#salesFill)"
												})
											]
										})
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-6 lg:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-bold text-ink",
									children: "System log"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-4 space-y-2 font-mono text-xs",
									children: systemLogs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "text-muted-foreground",
										children: "No recent activity"
									}) : systemLogs.map(([time, lvl, msg], index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex gap-3 rounded-lg bg-surface-2 px-3 py-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: time
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: lvl === "WARN" ? "font-bold text-warning-foreground" : "font-bold text-primary",
												children: lvl
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-ink",
												children: msg
											})
										]
									}, `${index}-${String(msg)}`))
								})]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "settings",
						className: "mt-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-5 lg:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-bold text-ink",
									children: "Global tax templates"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-5 space-y-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "vat",
												children: "Standard VAT rate (%)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "vat",
												value: vatRate,
												onChange: (e) => setVatRate(e.target.value),
												className: "max-w-32"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between rounded-xl bg-surface-2 p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-semibold text-ink",
												children: "Tax-inclusive shelf pricing"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Default display mode for new tenants."
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												checked: inclusive,
												onCheckedChange: setInclusive
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "rounded-xl",
											onClick: () => toast.success("Tax template saved"),
											children: "Save template"
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-bold text-ink",
									children: "Regional & currency settings"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-5 space-y-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Platform Base Currency" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: currency,
												onValueChange: setCurrency,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "w-full",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Currency" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "AED",
														children: "AED - UAE Dirham"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "SAR",
														children: "SAR - Saudi Riyal"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "USD",
														children: "USD - US Dollar"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "EUR",
														children: "EUR - Euro"
													})
												] })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Default Timezone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: timezone,
												onValueChange: setTimezone,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "w-full",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Timezone" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Asia/Dubai",
														children: "Asia/Dubai (GST)"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Asia/Riyadh",
														children: "Asia/Riyadh (AST)"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "UTC",
														children: "UTC"
													})
												] })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Date Format" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: dateFormat,
												onValueChange: setDateFormat,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "w-full",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Date Format" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "DD/MM/YYYY",
														children: "DD/MM/YYYY"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "MM/DD/YYYY",
														children: "MM/DD/YYYY"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "YYYY-MM-DD",
														children: "YYYY-MM-DD"
													})
												] })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "rounded-xl w-full",
											onClick: saveRegionalSettings,
											children: "Save settings"
										})
									]
								})]
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!manageTenant && !selectedBranch,
				onOpenChange: (o) => !o && setManageTenant(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-lg w-[95vw] sm:w-full p-4 sm:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base",
							children: ["Manage Branches — ", manageTenant?.name]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "text-xs",
							children: "View and manage branches for this specific tenant."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2 mb-4 bg-surface-2 p-3 rounded-xl border border-border/50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Branch Name",
									value: newBranchForm.name,
									onChange: (e) => setNewBranchForm({
										...newBranchForm,
										name: e.target.value
									}),
									className: "bg-surface-1 flex-1 text-sm"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Location",
									value: newBranchForm.address,
									onChange: (e) => setNewBranchForm({
										...newBranchForm,
										address: e.target.value
									}),
									className: "bg-surface-1 flex-1 text-sm"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "shrink-0 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 text-sm",
									onClick: addBranch,
									children: "Add Branch"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-[300px] overflow-auto border border-border/50 rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, {
								className: "min-w-[400px] sm:min-w-full",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
									className: "bg-surface-2/80 sticky top-0 z-10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
										className: "hover:bg-transparent",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "font-bold text-[11px] sm:text-xs uppercase tracking-wider",
												children: "Name"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "font-bold text-[11px] sm:text-xs uppercase tracking-wider",
												children: "Status"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
												className: "font-bold text-[11px] sm:text-xs uppercase tracking-wider text-right",
												children: "Actions"
											})
										]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [branches.filter((b) => b.tenantId === manageTenant?.id).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
									className: "cursor-pointer hover:bg-primary/[0.03] transition-colors",
									onClick: () => setSelectedBranch(b),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "p-3 font-semibold text-ink text-sm",
											children: b.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "p-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "secondary",
												className: "rounded-xl text-[10px] uppercase tracking-wider font-extrabold bg-success/10 text-success shadow-sm",
												children: b.status
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "p-3 text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												className: "h-8 rounded-xl font-bold bg-surface-2 text-ink hover:bg-primary hover:text-primary-foreground border border-border/50 shadow-sm transition-all",
												onClick: (e) => {
													e.stopPropagation();
													setSelectedBranch(b);
												},
												children: "View Details"
											})
										})
									]
								}, b.id)), branches.filter((b) => b.tenantId === manageTenant?.id).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									colSpan: 3,
									className: "py-6 text-center text-muted-foreground font-semibold",
									children: "No branches found."
								}) })] })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								className: "rounded-xl",
								onClick: () => setManageTenant(null),
								children: "Close"
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!selectedBranch,
				onOpenChange: (o) => !o && setSelectedBranch(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Branch Details" }) }), selectedBranch && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 py-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-center bg-surface-2 p-4 rounded-xl border border-border/50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1",
									children: "Branch Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-lg font-extrabold text-ink",
									children: selectedBranch.name
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									className: "rounded-xl font-extrabold text-[11px] uppercase tracking-wider bg-success/10 text-success",
									children: selectedBranch.status
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1",
								children: "Location"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-ink",
								children: selectedBranch.address
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1",
								children: "Created At"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-ink",
								children: new Date(selectedBranch.createdAt).toLocaleDateString()
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-4 border-t border-border/50 flex gap-3 justify-end",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "rounded-xl",
									onClick: () => setSelectedBranch(null),
									children: "Back to List"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "destructive",
									className: "rounded-xl",
									onClick: () => {
										setBranchToDelete(selectedBranch.id);
										setSelectedBranch(null);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 mr-2" }), " Delete Branch"]
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!branchToDelete,
				onOpenChange: (o) => !o && setBranchToDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-[400px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "text-destructive",
							children: "Confirm Deletion"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground font-medium my-4",
							children: "Are you sure you want to completely remove this branch? This action cannot be undone and will decrement the tenant's outlet limit."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "rounded-xl",
							onClick: () => setBranchToDelete(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							className: "rounded-xl",
							onClick: confirmRemoveBranch,
							children: "Delete Branch"
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: globalAddBranchOpen,
				onOpenChange: setGlobalAddBranchOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-[425px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add Branch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Create a new branch and assign it to a tenant." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 py-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Tenant" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: globalNewBranchForm.tenantId,
										onValueChange: (val) => setGlobalNewBranchForm({
											...globalNewBranchForm,
											tenantId: val
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "rounded-xl border-border/50 bg-surface-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a tenant" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: tenants.filter((t) => t.status !== "Archived").map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: t.id,
											children: t.name
										}, t.id)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Branch Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "e.g. Marina Branch",
											value: globalNewBranchForm.name,
											onChange: (e) => setGlobalNewBranchForm({
												...globalNewBranchForm,
												name: e.target.value
											}),
											className: "rounded-xl border-border/50 bg-surface-2"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Location (Address)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "e.g. Dubai",
											value: globalNewBranchForm.address,
											onChange: (e) => setGlobalNewBranchForm({
												...globalNewBranchForm,
												address: e.target.value
											}),
											className: "rounded-xl border-border/50 bg-surface-2"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: globalNewBranchForm.status,
										onValueChange: (val) => setGlobalNewBranchForm({
											...globalNewBranchForm,
											status: val
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "rounded-xl border-border/50 bg-surface-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select status" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "Active",
											children: "Active"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "Suspended",
											children: "Suspended"
										})] })]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "rounded-xl",
							onClick: () => setGlobalAddBranchOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "rounded-xl",
							onClick: async () => {
								if (!globalNewBranchForm.tenantId || !globalNewBranchForm.name) {
									toast.error("Please fill all required fields");
									return;
								}
								const t = tenants.find((t) => t.id === globalNewBranchForm.tenantId);
								if (t) {
									const limit = t.plan === "Enterprise" ? 999 : 10;
									if (branches.filter((b) => b.tenantId === t.id).length >= limit) {
										toast.error("Outlet limit reached — upgrade plan to add more branches");
										return;
									}
									const res = await createBranchServerFn({ data: {
										tenantId: t.id,
										name: globalNewBranchForm.name,
										address: globalNewBranchForm.address
									} });
									if (res.success) {
										router.invalidate();
										toast.success("Branch created successfully");
										setGlobalAddBranchOpen(false);
										setGlobalNewBranchForm({
											tenantId: "",
											name: "",
											address: "",
											status: "Active"
										});
									} else toast.error(res.error || "Failed to add branch");
								}
							},
							children: "Save Branch"
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!adminProfileTenant,
				onOpenChange: (o) => !o && setAdminProfileTenant(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md w-[95vw] sm:w-full p-4 sm:p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "text-base",
						children: ["Admin Profile — ", adminProfileTenant?.name]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Primary Head Office Admin contact details." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "py-4",
						children: !adminData ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm text-muted-foreground mb-4",
									children: "This tenant does not have a primary admin configured. Set one up below."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: existingAdminForm.name,
												onChange: (e) => setExistingAdminForm({
													...existingAdminForm,
													name: e.target.value
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "email",
													value: existingAdminForm.email,
													onChange: (e) => setExistingAdminForm({
														...existingAdminForm,
														email: e.target.value
													})
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "password",
													value: existingAdminForm.password,
													onChange: (e) => setExistingAdminForm({
														...existingAdminForm,
														password: e.target.value
													})
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: existingAdminForm.phone,
													onChange: (e) => setExistingAdminForm({
														...existingAdminForm,
														phone: e.target.value
													})
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Office Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: existingAdminForm.address,
													onChange: (e) => setExistingAdminForm({
														...existingAdminForm,
														address: e.target.value
													})
												})]
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "pt-2 flex justify-end",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										className: "rounded-xl",
										onClick: async () => {
											if (!existingAdminForm.name || !existingAdminForm.email || !existingAdminForm.password || !existingAdminForm.phone || !existingAdminForm.address) {
												toast.error("All fields are required");
												return;
											}
											const res = await createExistingTenantAdminServerFn({ data: {
												tenantId: adminProfileTenant.id,
												name: existingAdminForm.name,
												email: existingAdminForm.email,
												phone: existingAdminForm.phone,
												address: existingAdminForm.address,
												password: existingAdminForm.password
											} });
											if (res.success) {
												toast.success("Admin profile created successfully");
												setExistingAdminForm({
													name: "",
													email: "",
													phone: "",
													address: "",
													password: ""
												});
												const profileRes = await getTenantAdminServerFn({ data: { tenantId: adminProfileTenant.id } });
												if (profileRes.success) setAdminData(profileRes.admin);
											} else toast.error(res.error || "Failed to create admin");
										},
										children: "Set Up Admin"
									})
								})
							]
						}) : isEditingAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: updateAdminForm.name,
											onChange: (e) => setUpdateAdminForm({
												...updateAdminForm,
												name: e.target.value
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "email",
												value: updateAdminForm.email,
												onChange: (e) => setUpdateAdminForm({
													...updateAdminForm,
													email: e.target.value
												})
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "New Password (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "password",
												placeholder: "Leave blank to keep current",
												value: updateAdminForm.password,
												onChange: (e) => setUpdateAdminForm({
													...updateAdminForm,
													password: e.target.value
												})
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: updateAdminForm.phone,
												onChange: (e) => setUpdateAdminForm({
													...updateAdminForm,
													phone: e.target.value
												})
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Office Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: updateAdminForm.address,
												onChange: (e) => setUpdateAdminForm({
													...updateAdminForm,
													address: e.target.value
												})
											})]
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-2 flex justify-end gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "rounded-xl",
									onClick: () => setIsEditingAdmin(false),
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "rounded-xl",
									onClick: async () => {
										if (!updateAdminForm.name || !updateAdminForm.email || !updateAdminForm.phone || !updateAdminForm.address) {
											toast.error("Name, email, phone and address are required");
											return;
										}
										const res = await updateTenantAdminServerFn({ data: {
											id: adminData.id,
											...updateAdminForm
										} });
										if (res.success) {
											toast.success("Admin profile updated successfully");
											setIsEditingAdmin(false);
											const profileRes = await getTenantAdminServerFn({ data: { tenantId: adminProfileTenant.id } });
											if (profileRes.success) setAdminData(profileRes.admin);
										} else toast.error(res.error || "Failed to update admin");
									},
									children: "Save Changes"
								})]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2 text-sm border-b pb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-muted-foreground",
										children: "Name"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "col-span-2 font-medium text-ink",
										children: adminData.name || "N/A"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2 text-sm border-b pb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-muted-foreground",
										children: "Email"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "col-span-2 font-medium text-ink",
										children: adminData.email
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2 text-sm border-b pb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-muted-foreground",
										children: "Phone"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "col-span-2 font-medium text-ink",
										children: adminData.phone || "N/A"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2 text-sm border-b pb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-muted-foreground",
										children: "Office Address"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "col-span-2 font-medium text-ink",
										children: adminData.address || "N/A"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2 text-sm border-b pb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-muted-foreground",
										children: "Role"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "col-span-2 font-medium text-ink",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-xs uppercase bg-primary/10 text-primary border-primary/20",
											children: adminData.role.replace(/_/g, " ")
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2 text-sm border-b pb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-muted-foreground",
										children: "Status"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "col-span-2 font-medium text-ink",
										children: adminData.isActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-success flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-success" }), " Active"]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-destructive flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-destructive" }), " Inactive"]
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-muted-foreground",
										children: "Created"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "col-span-2 font-medium text-ink",
										children: new Date(adminData.createdAt).toLocaleDateString()
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-4 flex justify-end gap-3 mt-4 border-t",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										className: "rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive",
										onClick: async () => {
											if (window.confirm("Are you sure you want to completely remove this admin? This action cannot be undone.")) {
												if ((await deleteTenantAdminServerFn({ data: { id: adminData.id } })).success) {
													toast.success("Admin deleted successfully");
													setAdminData(null);
												} else toast.error("Failed to delete admin");
											}
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 mr-2" }), " Delete"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										className: "rounded-xl",
										onClick: () => {
											setUpdateAdminForm({
												name: adminData.name || "",
												email: adminData.email || "",
												phone: adminData.phone || "",
												address: adminData.address || "",
												password: ""
											});
											setIsEditingAdmin(true);
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4 mr-2" }), " Edit Details"]
									})]
								})
							]
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: archiveTenantOpen,
				onOpenChange: setArchiveTenantOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md w-[95vw] sm:w-full p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-destructive flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-5 w-5" }), " Archive Tenant"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "text-sm mt-2 font-medium",
							children: "This will archive the tenant, block its users from logging in, and preserve its historical data. It will not permanently delete the tenant."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-4 space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive font-semibold",
								children: [
									"To confirm archiving ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-extrabold",
										children: tenantToArchive?.name
									}),
									", please type its exact name or subdomain below."
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "confirmationValue",
									children: "Confirmation Value"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "confirmationValue",
									value: archiveConfirmation,
									onChange: (e) => setArchiveConfirmation(e.target.value),
									placeholder: `e.g. ${tenantToArchive?.subdomain || tenantToArchive?.name}`,
									className: "font-mono text-sm"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "gap-2 sm:gap-0 mt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setArchiveTenantOpen(false),
								className: "rounded-xl",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "destructive",
								onClick: handleArchive,
								disabled: !archiveConfirmation || isArchiving,
								className: "rounded-xl",
								children: isArchiving ? "Archiving..." : "Archive Tenant"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { SuperAdmin as component };
