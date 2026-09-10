import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import {
    Activity,
    Building2,
    Coins,
    Monitor,
    Plus,
    ShieldCheck,
    Ban,
    ArrowUpCircle,
    ArrowDownCircle,
    Trash2,
    UserCircle,
    MoreHorizontal,
    Store,
    Pencil,
    CreditCard,
    Calendar,
    AlertTriangle,
    History,
    Receipt,
    FileText,
    FileSpreadsheet,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    RotateCcw,
    Link2,
    Loader2,
    ExternalLink,
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { ReportsTab } from "@/components/reports/ReportsTab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aedShort, type Tenant } from "@/lib/demo-data";
import { toast } from "sonner";
import {
    getTenantsServerFn,
    getBranchesServerFn,
    createTenantServerFn,
    updateTenantStatusServerFn,
    upgradeTenantPlanServerFn,
    downgradeTenantPlanServerFn,
    createBranchServerFn,
    deleteBranchServerFn,
    getGlobalTaxSettingsServerFn,
    getAnalyticsServerFn,
    getPlatformSettingsServerFn,
    updatePlatformSettingsServerFn,
    getTenantAdminServerFn,
    createExistingTenantAdminServerFn,
    updateTenantAdminServerFn,
    deleteTenantAdminServerFn,
    archiveTenantServerFn,
    getBillingOverviewServerFn,
    recordTenantPaymentServerFn,
    getTenantPaymentHistoryServerFn,
    updateTenantPaymentServerFn,
    updateTenantDueDateServerFn,
    getTenantInvoicesServerFn,
    createTenantInvoicePaymentLinkServerFn
} from "@/lib/super-admin-server";

import { generateSubscriptionInvoicePdf } from "@/lib/subscription-invoice-pdf";
import { SUBSCRIPTION_PLANS, calculatePlanPricing, getPlan } from "@/lib/subscription-plans";

export const Route = createFileRoute("/super-admin")({
    beforeLoad: async () => {
        const res = await getSessionServerFn();
        if (!res.success || !res.session) throw redirect({ to: "/login" });
        const role = res.session.role as Role;
        if (role !== "Super Admin") throw redirect({ to: roleRoutes[role] });
    },
    loader: async () => {
        const [tenantsRes, branchesRes, taxRes, analyticsRes, platformRes, billingRes, invoicesRes] = await Promise.all([
            getTenantsServerFn(),
            getBranchesServerFn(),
            getGlobalTaxSettingsServerFn(),
            getAnalyticsServerFn(),
            getPlatformSettingsServerFn(),
            getBillingOverviewServerFn(),
            getTenantInvoicesServerFn()
        ]);
        return {
            initialTenants: tenantsRes.success ? tenantsRes.tenants : [],
            initialBranches: branchesRes.success ? branchesRes.branches : [],
            taxSettings: taxRes.success ? taxRes : { vatRate: "0", inclusive: false },
            analytics: analyticsRes.success ? analyticsRes : { totalGmv: 0, systemLogs: [], platformSeries: [] },
            platformSettings: platformRes.success && platformRes.data ? platformRes.data : { currency: "AED", timezone: "Asia/Dubai", dateFormat: "DD/MM/YYYY" },
            billingData: billingRes.success ? billingRes : { overview: { totalTenants: 0, totalRevenueCollected: 0, overdueCount: 0, dueSoonCount: 0, totalOverdueAmount: 0 }, tenants: [] },
            initialInvoices: invoicesRes.success && invoicesRes.invoices ? invoicesRes.invoices : []
        };
    },

    head: () => ({
        meta: [
            { title: "Super Admin Portal Demo â€” cloudynationpos" },
            {
                name: "description",
                content:
                    "Interactive cloudynationpos super-admin demo: provision tenants, enforce outlet and till limits, set VAT templates and monitor platform analytics.",
            },
            { property: "og:title", content: "cloudynationpos Super Admin Portal Demo" },
            { property: "og:description", content: "Multi-tenant provisioning, limits and platform analytics." },
        ],
    }),
    component: SuperAdmin,
});

const statusTone: Record<Tenant["status"], string> = {
    Active: "bg-success/12 text-success border-success/20",
    Trial: "bg-primary/10 text-primary border-primary/20",
    Suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

function SuperAdmin() {
    const router = useRouter();
    const loaderData = Route.useLoaderData();
    
    const [activeNavSection, setActiveNavSection] = useState<string>("tenants");
    const [selectedReportTenantId, setSelectedReportTenantId] = useState("all");
    const [tenants, setTenants] = useState<any[]>(loaderData.initialTenants);
    const [invoices, setInvoices] = useState<any[]>(loaderData.initialInvoices || []);
    const [billingSubTab, setBillingSubTab] = useState<"subscriptions" | "invoices">("subscriptions");
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
    const [invoicePlanFilter, setInvoicePlanFilter] = useState("all");
    const [invoicePage, setInvoicePage] = useState(1);
    const [generatingLinkInvoiceId, setGeneratingLinkInvoiceId] = useState<string | null>(null);
    const invoicePageSize = 10;


    const filteredInvoices = useMemo(() => {
        return invoices.filter((inv: any) => {
            if (invoiceSearch.trim()) {
                const q = invoiceSearch.toLowerCase().trim();
                const numMatch = inv.invoiceNumber?.toLowerCase().includes(q);
                const tenantMatch = inv.tenantName?.toLowerCase().includes(q);
                const subMatch = inv.tenantSubdomain?.toLowerCase().includes(q);
                if (!numMatch && !tenantMatch && !subMatch) return false;
            }
            if (invoiceStatusFilter !== "all") {
                if (invoiceStatusFilter === "paid") {
                    if (inv.paymentStatus !== "paid" && inv.paymentStatus !== "manual_paid") return false;
                } else if (invoiceStatusFilter === "pending") {
                    if (inv.paymentStatus !== "pending_gateway_integration") return false;
                } else if (invoiceStatusFilter === "overdue") {
                    if (inv.paymentStatus !== "overdue") return false;
                }
            }
            if (invoicePlanFilter !== "all") {
                if (inv.planName?.toLowerCase() !== invoicePlanFilter.toLowerCase()) return false;
            }
            return true;
        });
    }, [invoices, invoiceSearch, invoiceStatusFilter, invoicePlanFilter]);

    const totalInvoicePages = Math.max(1, Math.ceil(filteredInvoices.length / invoicePageSize));
    const currentInvoicePage = Math.min(invoicePage, totalInvoicePages);
    const invoiceStartIndex = (currentInvoicePage - 1) * invoicePageSize;
    const paginatedInvoices = filteredInvoices.slice(invoiceStartIndex, invoiceStartIndex + invoicePageSize);

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ 
        name: "", subdomain: "", plan: "Starter", billingCycle: "monthly", customDays: 30, trn: "", outlets: 1, tills: 3,
        adminName: "", adminEmail: "", adminPhone: "", adminAddress: "", adminPassword: ""
    });
    const [vatRate, setVatRate] = useState(loaderData.taxSettings.vatRate);
    const [inclusive, setInclusive] = useState(loaderData.taxSettings.inclusive);
    const [currency, setCurrency] = useState(loaderData.platformSettings.currency);
    const [timezone, setTimezone] = useState(loaderData.platformSettings.timezone);
    const [dateFormat, setDateFormat] = useState(loaderData.platformSettings.dateFormat);
    
    const { platformSeries, systemLogs, totalGmv } = loaderData.analytics;

    type Branch = { id: string; tenantId: string; name: string; address: string | null; tillCount: number | null; status: string; createdAt: string | Date };
    
    const [branches, setBranches] = useState<Branch[]>(loaderData.initialBranches);

    // Sync state if loader data changes (after router.invalidate)
    useEffect(() => {
        setTenants(loaderData.initialTenants);
        setBranches(loaderData.initialBranches);
        setInvoices(loaderData.initialInvoices || []);
    }, [loaderData]);

    
    // Manage Branches dialog state
    const [manageTenant, setManageTenant] = useState<any | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [newBranchForm, setNewBranchForm] = useState({ name: "", address: "" });
    const [branchToDelete, setBranchToDelete] = useState<string | null>(null);

    const [globalAddBranchOpen, setGlobalAddBranchOpen] = useState(false);
    const [globalNewBranchForm, setGlobalNewBranchForm] = useState({ tenantId: "", name: "", address: "", status: "Active" });

    // Admin Profile Dialog State
    const [adminProfileTenant, setAdminProfileTenant] = useState<any | null>(null);
    const [adminData, setAdminData] = useState<any | null>(null);
    const [existingAdminForm, setExistingAdminForm] = useState({ name: "", email: "", phone: "", address: "", password: "" });
    const [isEditingAdmin, setIsEditingAdmin] = useState(false);
    const [updateAdminForm, setUpdateAdminForm] = useState({ name: "", email: "", phone: "", address: "", password: "" });

    // Archive Tenant State
    const [archiveTenantOpen, setArchiveTenantOpen] = useState(false);
    const [tenantToArchive, setTenantToArchive] = useState<any | null>(null);
    const [archiveConfirmation, setArchiveConfirmation] = useState("");
    const [isArchiving, setIsArchiving] = useState(false);

    // Billing & Revenue Dialog States & Handlers
    const [recordPaymentTenant, setRecordPaymentTenant] = useState<any | null>(null);
    const [recordForm, setRecordForm] = useState({
        amount: "",
        paymentDate: getNowISOString(),
        billingCycle: "monthly",
        customDays: "30",
        notes: ""
    });
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    const [historyTenant, setHistoryTenant] = useState<any | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const handleOpenRecordPayment = (tenant: any) => {
        setRecordPaymentTenant(tenant);
        setRecordForm({
            amount: "",
            paymentDate: getNowISOString(),
            billingCycle: tenant.billingCycle || "monthly",
            customDays: tenant.customDays ? String(tenant.customDays) : "30",
            notes: ""
        });
    };

    const handleRecordPaymentSubmit = async () => {
        if (!recordPaymentTenant) return;
        const amt = parseFloat(recordForm.amount);
        if (isNaN(amt) || amt <= 0) {
            toast.error("Please enter a valid payment amount");
            return;
        }
        if (!recordForm.paymentDate) {
            toast.error("Please select a payment date");
            return;
        }

        setIsSubmittingPayment(true);
        try {
            const res = await recordTenantPaymentServerFn({
                data: {
                    tenantId: recordPaymentTenant.tenantId,
                    amount: amt,
                    paymentDate: recordForm.paymentDate,
                    billingCycle: recordForm.billingCycle,
                    customDays: Number(recordForm.customDays || 30),
                    notes: recordForm.notes || ""
                }
            });

            if (res.success) {
                toast.success("Payment recorded successfully!");
                setRecordPaymentTenant(null);
                router.invalidate();
            } else {
                toast.error(res.error || "Failed to record payment");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleOpenHistory = async (tenant: any) => {
        setHistoryTenant(tenant);
        setIsLoadingHistory(true);
        try {
            const res = await getTenantPaymentHistoryServerFn({ data: { tenantId: tenant.tenantId } });
            if (res.success) {
                setPaymentHistory(res.payments || []);
            } else {
                toast.error(res.error || "Failed to load payment history");
            }
        } catch (err: any) {
            toast.error(err.message || "Error fetching history");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Edit Payment State & Handlers
    const [editingPaymentRecord, setEditingPaymentRecord] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({
        paymentId: "",
        tenantId: "",
        amount: "",
        paymentDate: "",
        billingCycle: "monthly",
        customDays: "30",
        notes: ""
    });
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    const handleOpenEditPayment = (paymentRow: any) => {
        setEditingPaymentRecord(paymentRow);
        setEditForm({
            paymentId: paymentRow.id,
            tenantId: paymentRow.tenantId,
            amount: String(paymentRow.amount || ""),
            paymentDate: toLocalISOString(paymentRow.paymentDate),
            billingCycle: historyTenant?.billingCycle || "monthly",
            customDays: historyTenant?.customDays ? String(historyTenant.customDays) : "30",
            notes: paymentRow.notes || ""
        });
    };

    const handleEditPaymentSubmit = async () => {
        if (!editingPaymentRecord) return;
        const amt = parseFloat(editForm.amount);
        if (isNaN(amt) || amt <= 0) {
            toast.error("Please enter a valid payment amount");
            return;
        }
        if (!editForm.paymentDate) {
            toast.error("Please select a payment date & time");
            return;
        }

        setIsSubmittingEdit(true);
        try {
            const res = await updateTenantPaymentServerFn({
                data: {
                    paymentId: editForm.paymentId,
                    tenantId: editForm.tenantId,
                    amount: amt,
                    paymentDate: editForm.paymentDate,
                    billingCycle: editForm.billingCycle,
                    customDays: Number(editForm.customDays || 30),
                    notes: editForm.notes || ""
                }
            });

            if (res.success) {
                toast.success("Payment record updated successfully!");
                setEditingPaymentRecord(null);
                if (historyTenant) {
                    const histRes = await getTenantPaymentHistoryServerFn({ data: { tenantId: historyTenant.tenantId } });
                    if (histRes.success) {
                        setPaymentHistory(histRes.payments || []);
                    }
                }
                router.invalidate();
            } else {
                toast.error(res.error || "Failed to update payment");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    // Direct Edit Due Date State & Handlers
    const [editDueDateTenant, setEditDueDateTenant] = useState<any | null>(null);
    const [newDueDate, setNewDueDate] = useState("");
    const [isSubmittingDueDate, setIsSubmittingDueDate] = useState(false);

    const handleOpenEditDueDate = (tenant: any) => {
        setEditDueDateTenant(tenant);
        let dStr = "";
        if (tenant.currentPeriodEndDate) {
            dStr = new Date(tenant.currentPeriodEndDate).toISOString().split("T")[0] || "";
        } else {
            dStr = new Date().toISOString().split("T")[0] || "";
        }
        setNewDueDate(dStr);
    };

    const handleEditDueDateSubmit = async () => {
        if (!editDueDateTenant || !newDueDate) {
            toast.error("Please select a valid due date");
            return;
        }

        setIsSubmittingDueDate(true);
        try {
            const res = await updateTenantDueDateServerFn({
                data: {
                    tenantId: editDueDateTenant.tenantId,
                    newDueDate
                }
            });

            if (res.success) {
                toast.success("Current period end (next due) date updated!");
                setEditDueDateTenant(null);
                router.invalidate();
            } else {
                toast.error(res.error || "Failed to update due date");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setIsSubmittingDueDate(false);
        }
    };

    const superAdminSubNav = [
        { id: "tenants", label: "Tenants", icon: Building2, active: activeNavSection === "tenants", onClick: () => setActiveNavSection("tenants") },
        { id: "billing", label: "Billing & Revenue", icon: CreditCard, active: activeNavSection === "billing", onClick: () => setActiveNavSection("billing") },
        { id: "reports", label: "Reports", icon: FileText, active: activeNavSection === "reports", onClick: () => setActiveNavSection("reports") },
        { id: "analytics", label: "Platform Analytics", icon: Activity, active: activeNavSection === "analytics", onClick: () => setActiveNavSection("analytics") },
        { id: "settings", label: "Tax & Currency", icon: Coins, active: activeNavSection === "settings", onClick: () => setActiveNavSection("settings") },
    ];

    const handleExportBusinessReportCsv = () => {
        try {
            const overview = loaderData.billingData.overview;
            const tenantsList = loaderData.billingData.tenants || [];

            let csv = "SUPER ADMIN SUBSCRIPTION REVENUE & BUSINESS REPORT\n";
            csv += `Generated At,${new Date().toLocaleString()}\n`;
            csv += `Total Onboarded Clients,${overview.totalTenants}\n`;
            csv += `Total Revenue Collected (AED),${Number(overview.totalRevenueCollected || 0).toFixed(2)}\n`;
            csv += `Overdue Clients Count,${overview.overdueCount}\n`;
            csv += `Due Soon Clients Count,${overview.dueSoonCount || 0}\n\n`;

            csv += "Tenant Name,Subdomain,Plan,Billing Cycle,Current Status,Payment Punctuality,Current Period End (Next Due),Total Amount Paid (AED),Last Payment Date,Last Payment Amount (AED)\n";

            tenantsList.forEach((t: any) => {
                const name = `"${(t.tenantName || "").replace(/"/g, '""')}"`;
                const sub = `"${(t.subdomain || "").replace(/"/g, '""')}"`;
                const plan = `"${t.plan || ""}"`;
                const cycle = `"${t.billingCycle || "N/A"}"`;
                const status = `"${t.status || "no_record"}"`;
                const punctuality = `"${(t.punctuality || "Never Paid / No Billing Record").replace(/"/g, '""')}"`;
                const nextDue = t.currentPeriodEndDate ? new Date(t.currentPeriodEndDate).toISOString().split("T")[0] : "N/A";
                const totalPaid = Number(t.totalPaid || 0).toFixed(2);
                const lastDate = t.lastPaymentDate ? new Date(t.lastPaymentDate).toLocaleString() : "No payment yet";
                const lastAmt = t.lastPaymentAmount ? Number(t.lastPaymentAmount).toFixed(2) : "0.00";

                csv += `${name},${sub},${plan},${cycle},${status},${punctuality},${nextDue},${totalPaid},"${lastDate}",${lastAmt}\n`;
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `super_admin_subscription_business_report_${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Business subscription CSV report downloaded!");
        } catch (err: any) {
            toast.error("Failed to export business CSV report");
        }
    };

    const handleExportBusinessReportPdf = () => {
        try {
            const overview = loaderData.billingData.overview;
            const tenantsList = loaderData.billingData.tenants || [];
            const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, 210, 24, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("SUPER ADMIN SUBSCRIPTION REVENUE REPORT", 14, 15);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 15);

            let currentY = 32;

            doc.setFillColor(241, 245, 249);
            doc.rect(14, currentY, 182, 22, "F");
            
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text("PLATFORM SUBSCRIPTION SUMMARY", 18, currentY + 6);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(`Total Onboarded Clients: ${overview.totalTenants}`, 18, currentY + 13);
            doc.text(`Total Revenue Collected: AED ${Number(overview.totalRevenueCollected || 0).toFixed(2)}`, 18, currentY + 18);
            doc.text(`Overdue Accounts: ${overview.overdueCount}`, 110, currentY + 13);
            doc.text(`Accounts Due Soon: ${overview.dueSoonCount || 0}`, 110, currentY + 18);

            currentY += 28;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("CLIENT SUBSCRIPTIONS & PAYMENT LEDGER", 14, currentY);
            currentY += 6;

            doc.setFillColor(226, 232, 240);
            doc.rect(14, currentY - 4, 182, 7, "F");
            doc.setFontSize(7.5);

            doc.text("TENANT / SUBDOMAIN", 15, currentY);
            doc.text("PLAN / CYCLE", 62, currentY);
            doc.text("NEXT DUE", 98, currentY);
            doc.text("STATUS", 125, currentY);
            doc.text("PUNCTUALITY", 148, currentY);
            doc.text("TOTAL PAID", 180, currentY);

            currentY += 8;
            doc.setFont("helvetica", "normal");

            tenantsList.forEach((t: any, idx: number) => {
                if (currentY > 270) {
                    doc.addPage();
                    currentY = 20;
                }
                if (idx % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(14, currentY - 4, 182, 6, "F");
                }

                const tName = String(t.tenantName || "").substring(0, 18);
                const planCycle = `${t.plan || "Starter"} (${t.billingCycle || "N/A"})`;
                const dueStr = String(t.currentPeriodEndDate ? (new Date(t.currentPeriodEndDate).toISOString().split("T")[0] || "N/A") : "N/A");
                const statusStr = String(t.status || "no_record").toUpperCase();
                const punctStr = String(t.punctuality || "Never Paid").substring(0, 16);
                const totalPaidStr = `AED ${Number(t.totalPaid || 0).toFixed(2)}`;

                doc.text(tName, 15, currentY);
                doc.text(planCycle, 62, currentY);
                doc.text(dueStr, 98, currentY);
                doc.text(statusStr, 125, currentY);
                doc.text(punctStr, 148, currentY);
                doc.text(totalPaidStr, 180, currentY);

                currentY += 6;
            });

            doc.save(`super_admin_subscription_business_report_${new Date().toISOString().split("T")[0]}.pdf`);
            toast.success("Business subscription PDF report downloaded!");
        } catch (err: any) {
            console.error("PDF export error:", err);
            toast.error("Failed to export business PDF report");
        }
    };

    const totals = useMemo(
        () => ({
            tenants: tenants.length,
            outlets: tenants.reduce((s, t) => s + t.outlets, 0),
            tills: tenants.reduce((s, t) => s + t.tills, 0),
            orders: tenants.reduce((s, t) => s + t.monthlyOrders, 0),
        }),
        [tenants],
    );

    const toggleStatus = async (id: string) => {
        const tenant = tenants.find(t => t.id === id);
        if (!tenant) return;
        const newStatus = tenant.status === "Suspended" ? "Active" : "Suspended";
        const res = await updateTenantStatusServerFn({ data: { id, status: newStatus } });
        if (res.success) {
            router.invalidate();
            toast.success("Tenant status updated");
        } else {
            toast.error("Failed to update status");
        }
    };

    const handleArchive = async () => {
        if (!tenantToArchive || !archiveConfirmation) return;
        setIsArchiving(true);
        try {
            const res = await archiveTenantServerFn({
                data: {
                    tenantId: tenantToArchive.id,
                    confirmationValue: archiveConfirmation
                }
            });
            if (res.success) {
                toast.success(res.message || "Tenant archived successfully");
                setArchiveTenantOpen(false);
                setTenantToArchive(null);
                setArchiveConfirmation("");
                router.invalidate();
            } else {
                toast.error(res.error || "Failed to archive tenant");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setIsArchiving(false);
        }
    };

    const saveRegionalSettings = async () => {
        const res = await updatePlatformSettingsServerFn({ data: { currency, timezone, dateFormat } });
        if (res.success) {
            toast.success("Regional settings saved to database!");
            router.invalidate();
        } else {
            toast.error("Failed to save settings");
        }
    };

    const upgrade = async (id: string) => {
        const res = await upgradeTenantPlanServerFn({ data: { id } });
        if (res.success) {
            router.invalidate();
            toast.success(`Plan upgraded to ${res.newPlan}`);
        } else {
            toast.error("Failed to upgrade plan");
        }
    };

    const downgrade = async (id: string) => {
        const res = await downgradeTenantPlanServerFn({ data: { id } });
        if (res.success) {
            router.invalidate();
            toast.success(`Plan downgraded to ${res.newPlan}`);
        } else {
            toast.error("Failed to downgrade plan");
        }
    };

    const handleManageBranches = (tenant: any) => {
        setManageTenant(tenant);
        setNewBranchForm({ name: "", address: "" });
        setSelectedBranch(null);
    };

    const addBranch = async () => {
        if (!manageTenant) return;
        const currentBranches = branches.filter(b => b.tenantId === manageTenant.id);
        
        if (currentBranches.length >= (manageTenant.plan === "Enterprise" ? 999 : 10)) {
            toast.error("Outlet limit reached â€” upgrade plan to add more branches");
            return;
        }

        if (!newBranchForm.name.trim()) {
            toast.error("Please fill all required fields");
            return;
        }

        const res = await createBranchServerFn({
            data: {
                tenantId: manageTenant.id,
                name: newBranchForm.name,
                address: newBranchForm.address
            }
        });

        if (res.success) {
            router.invalidate();
            setNewBranchForm({ name: "", address: "" });
            toast.success("Branch added successfully");
        } else {
            toast.error(res.error || "Failed to add branch");
        }
    };

    const confirmRemoveBranch = async () => {
        if (!manageTenant || !branchToDelete) return;

        try {
            const res = await deleteBranchServerFn({ data: { id: branchToDelete } });
            if (res.success) {
                router.invalidate();
                toast.success("Branch removed");
                setBranchToDelete(null);
                setSelectedBranch(null);
            } else {
                toast.error(res.error || "Failed to remove branch");
            }
        } catch (e: any) {
            toast.error("Failed to remove branch: " + e.message);
        }
    };

    return (
        <DemoShell
            title="SaaS Super-Admin Portal"
            subtitle="Provision and govern every supermarket tenant on the platform — limits, tax templates and live network telemetry."
            subNav={superAdminSubNav}
            actions={
                <div className="flex items-center gap-3">
                    <Button className="rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:-translate-y-0.5 transition-all" onClick={() => setGlobalAddBranchOpen(true)}>
                        <Building2 className="mr-1.5 h-4 w-4" /> Add Branch
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl font-semibold shadow-sm hover:-translate-y-0.5 transition-all">
                                <Plus className="mr-1.5 h-4 w-4" /> Create tenant
                            </Button>
                        </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create tenant account</DialogTitle>
                            <DialogDescription>
                                Provision a new supermarket chain with enforced commercial limits.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="tname">Chain name</Label>
                                <Input
                                    id="tname"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Marina Grocers LLC"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="tplan">Subscription Plan</Label>
                                    <Select
                                        value={form.plan}
                                        onValueChange={(val) => {
                                            const pConfig = getPlan(val);
                                            setForm({
                                                ...form,
                                                plan: val,
                                                outlets: pConfig.entitlements.outletLimit,
                                                tills: pConfig.entitlements.tillLimit,
                                            });
                                        }}
                                    >
                                        <SelectTrigger id="tplan" className="w-full">
                                            <SelectValue placeholder="Select Plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Starter">Starter (AED 899/mo)</SelectItem>
                                            <SelectItem value="Growth">Growth (AED 1,690/mo)</SelectItem>
                                            <SelectItem value="Enterprise">Enterprise (Custom)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="tbilling">Billing Frequency</Label>
                                    <Select
                                        value={form.billingCycle}
                                        onValueChange={(val) => setForm({ ...form, billingCycle: val })}
                                    >
                                        <SelectTrigger id="tbilling" className="w-full">
                                            <SelectValue placeholder="Billing Frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Annual (15% Savings)</SelectItem>
                                            <SelectItem value="custom">Custom (Days)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {form.billingCycle === "custom" && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="tcustomdays">Custom Duration (Days)</Label>
                                    <Input
                                        id="tcustomdays"
                                        type="number"
                                        min={1}
                                        value={form.customDays}
                                        onChange={(e) => setForm({ ...form, customDays: Number(e.target.value) })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="touts">Outlet limit</Label>
                                    <Input
                                        id="touts"
                                        type="number"
                                        min={1}
                                        value={form.outlets}
                                        onChange={(e) => setForm({ ...form, outlets: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ttills">Till limit</Label>
                                    <Input
                                        id="ttills"
                                        type="number"
                                        min={1}
                                        value={form.tills}
                                        onChange={(e) => setForm({ ...form, tills: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ttrn">TRN</Label>
                                <Input
                                    id="ttrn"
                                    value={form.trn}
                                    onChange={(e) => setForm({ ...form, trn: e.target.value })}
                                />
                            </div>

                            {(() => {
                                const pricing = calculatePlanPricing(form.plan, form.billingCycle as any, form.customDays);
                                return (
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                                        <div className="flex justify-between font-bold text-ink">
                                            <span>{form.plan} Plan ({form.billingCycle === "yearly" ? "Annual" : form.billingCycle === "custom" ? `${form.customDays} Days` : "Monthly"})</span>
                                            <span>AED {pricing.totalAmount.toFixed(2)} (incl. 5% VAT)</span>
                                        </div>
                                        <p className="text-muted-foreground">
                                            Initial subscription invoice will be issued with status <span className="font-semibold text-amber-600 dark:text-amber-400">"Pending Gateway Integration"</span>.
                                        </p>
                                    </div>
                                );
                            })()}

                            <div className="pt-2 pb-1 border-t mt-2">
                                <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Primary Admin Setup</p>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label>Full Name</Label>
                                        <Input value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label>Email</Label>
                                            <Input type="email" value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Password</Label>
                                            <Input type="password" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label>Phone</Label>
                                            <Input value={form.adminPhone} onChange={e => setForm({...form, adminPhone: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Office Address</Label>
                                            <Input value={form.adminAddress} onChange={e => setForm({...form, adminAddress: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
                                Tax template applied on creation: UAE VAT {vatRate}% ·{" "}
                                {inclusive ? "inclusive" : "exclusive"} pricing · AED
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="rounded-xl"
                                onClick={async () => {
                                    if (!form.name.trim()) {
                                        toast.error("Chain name is required");
                                        return;
                                    }
                                    if (!form.adminEmail || !form.adminPassword || !form.adminName || !form.adminPhone || !form.adminAddress) {
                                        toast.error("All admin fields are required");
                                        return;
                                    }
                                    
                                    const res = await createTenantServerFn({
                                        data: {
                                            name: form.name,
                                            subdomain: form.subdomain || form.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                                            plan: form.plan,
                                            billingCycle: form.billingCycle,
                                            customDays: form.customDays,
                                            outlets: form.outlets,
                                            tills: form.tills,
                                            trn: form.trn,
                                            adminName: form.adminName,
                                            adminEmail: form.adminEmail,
                                            adminPhone: form.adminPhone,
                                            adminAddress: form.adminAddress,
                                            adminPassword: form.adminPassword
                                        }
                                    });

                                    if (res.success) {
                                        router.invalidate();
                                        setForm({ name: "", subdomain: "", plan: "Starter", billingCycle: "monthly", customDays: 30, outlets: 1, tills: 3, trn: "", adminName: "", adminEmail: "", adminPhone: "", adminAddress: "", adminPassword: "" });
                                        setOpen(false);
                                        toast.success("Tenant provisioned", { description: "Subscription invoice generated & trial environment is live." });
                                    } else {
                                        toast.error(res.error || "Failed to provision tenant");
                                    }
                                }}
                            >
                                Create tenant
                            </Button>
                        </DialogFooter>

                    </DialogContent>
                </Dialog>
                </div>
            }
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Active tenants" value={String(totals.tenants)} icon={Building2} />
                <StatCard label="Outlets on platform" value={String(totals.outlets)} icon={ShieldCheck} tone="success" />
                <StatCard label="Active tills" value={String(totals.tills)} icon={Monitor} />
                <StatCard label="Monthly orders" value={`${totals.orders}`} icon={Activity} tone="accent" />
            </div>

            <Tabs value={activeNavSection} onValueChange={setActiveNavSection} className="mt-8">
                <TabsContent value="tenants" className="mt-4">
                    <div className="overflow-x-auto w-full">
                    <Table className="w-full">
                        <TableHeader className="bg-surface-2/80">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="min-w-[180px] py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tenant</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Outlets</TableHead>
                                <TableHead className="py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Tills</TableHead>
                                <TableHead className="py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly orders</TableHead>
                                <TableHead className="py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.filter(t => t.status !== "Archived").map((t) => (
                                <TableRow key={t.id} className="group transition-all duration-300 hover:bg-primary/[0.03] hover:shadow-sm">
                                <TableCell className="p-5">
                                    <div className="text-[15px] font-extrabold text-ink transition-colors group-hover:text-primary">{t.name}</div>
                                    <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                        <span className="flex h-2 w-2 rounded-full bg-primary/40"></span>
                                        TRN {t.trn}
                                    </div>
                                </TableCell>
                                <TableCell className="p-5">
                                    <Badge variant="secondary" className="rounded-xl px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold bg-secondary text-secondary-foreground shadow-sm">
                                        {t.plan}
                                    </Badge>
                                </TableCell>
                                <TableCell className="p-5">
                                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold shadow-sm ${statusTone[t.status as Tenant["status"]] || "bg-surface-2 text-ink border-border"}`}>
                                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
                                        {t.status}
                                    </span>
                                </TableCell>
                                <TableCell className="p-5 text-center text-sm font-extrabold tabular-nums text-ink">{t.outlets}</TableCell>
                                <TableCell className="p-5 text-center text-sm font-extrabold tabular-nums text-ink">{t.tills}</TableCell>
                                <TableCell className="p-5 text-center">
                                    <div className="inline-block rounded-xl bg-primary/10 px-3 py-1 text-sm font-extrabold tabular-nums text-primary shadow-sm">
                                        {t.monthlyOrders.toLocaleString("en-AE")}
                                    </div>
                                </TableCell>
                                <TableCell className="p-5">
                                    <div className="flex justify-end gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 px-3 h-8 text-xs"
                                            onClick={() => upgrade(t.id)}
                                            disabled={t.plan === "Enterprise"}
                                        >
                                            <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" /> Upgrade
                                        </Button>
                                        
                                        <TooltipProvider delayDuration={200}>
                                            <UITooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary border-primary/20 transition-colors"
                                                        onClick={() => downgrade(t.id)}
                                                        disabled={t.plan === "Starter"}
                                                    >
                                                        <ArrowDownCircle className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Downgrade</TooltipContent>
                                            </UITooltip>

                                            <UITooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary border-primary/20 transition-colors"
                                                        onClick={() => handleManageBranches(t)}
                                                    >
                                                        <Store className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Branches</TooltipContent>
                                            </UITooltip>

                                            <UITooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary border-primary/20 transition-colors"
                                                        onClick={async () => {
                                                            setAdminData(null);
                                                            setIsEditingAdmin(false);
                                                            setAdminProfileTenant(t);
                                                            const res = await getTenantAdminServerFn({ data: { tenantId: t.id } });
                                                            if (res.success) {
                                                                setAdminData(res.admin);
                                                            }
                                                        }}
                                                    >
                                                        <UserCircle className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Admin Profile</TooltipContent>
                                            </UITooltip>

                                            <UITooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive border-destructive/20 transition-colors"
                                                        onClick={() => toggleStatus(t.id)}
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t.status === "Suspended" ? "Reactivate" : "Suspend"}</TooltipContent>
                                            </UITooltip>

                                            {t.status !== "Archived" && (
                                                <UITooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive border-destructive/20 transition-colors"
                                                            onClick={() => {
                                                                setTenantToArchive(t);
                                                                setArchiveTenantOpen(true);
                                                                setArchiveConfirmation("");
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Archive Tenant</TooltipContent>
                                                </UITooltip>
                                            )}
                                        </TooltipProvider>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </TabsContent>

                <TabsContent value="billing" className="mt-8">
                    {/* Billing Overview KPI Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <StatCard
                            label="Onboarded clients"
                            value={String(loaderData.billingData.overview.totalTenants)}
                            icon={Building2}
                        />
                        <StatCard
                            label="Total revenue collected"
                            value={`AED ${Number(loaderData.billingData.overview.totalRevenueCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            icon={Coins}
                            tone="success"
                        />
                        <StatCard
                            label="Overdue clients"
                            value={String(loaderData.billingData.overview.overdueCount)}
                            icon={AlertTriangle}
                        />
                        <StatCard
                            label="Due soon (within 7 days)"
                            value={String(loaderData.billingData.overview.dueSoonCount || 0)}
                            icon={Calendar}
                            tone="accent"
                        />
                    </div>

                    {/* Billing Sub-Tab Switcher */}
                    <div className="flex items-center gap-2 mb-6">
                        <Button
                            variant={billingSubTab === "subscriptions" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBillingSubTab("subscriptions")}
                            className="rounded-xl font-bold text-xs shadow-sm"
                        >
                            <Building2 className="mr-1.5 h-3.5 w-3.5" /> Client Subscriptions ({loaderData.billingData.tenants.length})
                        </Button>
                        <Button
                            variant={billingSubTab === "invoices" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBillingSubTab("invoices")}
                            className="rounded-xl font-bold text-xs shadow-sm"
                        >
                            <Receipt className="mr-1.5 h-3.5 w-3.5" /> Subscription Invoices ({invoices.length})
                        </Button>
                    </div>

                    {/* Per-Tenant Billing Table */}
                    {billingSubTab === "subscriptions" && (
                    <div className="panel p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-base font-bold text-ink">Client Subscriptions & Billing Status</h2>
                                <p className="text-xs text-muted-foreground">Track offline payments, next due dates, and client account standings.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleExportBusinessReportCsv} className="rounded-full text-xs font-semibold">
                                    <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" /> Export Business Report (CSV)
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportBusinessReportPdf} className="rounded-full text-xs font-semibold">
                                    <Download className="h-4 w-4 mr-1.5 text-rose-600" /> Export Business Report (PDF)
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto w-full">
                            <Table className="w-full">
                                <TableHeader className="bg-surface-2/80">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="min-w-[180px] py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tenant</TableHead>
                                        <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan</TableHead>
                                        <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing Cycle</TableHead>
                                        <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Period End (Next Due)</TableHead>
                                        <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                        <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Payment</TableHead>
                                        <TableHead className="py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loaderData.billingData.tenants.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No tenant billing records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        loaderData.billingData.tenants.map((t: any) => {
                                            const isOverdue = t.status === "overdue";
                                            const isDueSoon = t.status === "due_soon";
                                            const isActive = t.status === "active";

                                            return (
                                                <TableRow
                                                    key={t.tenantId}
                                                    className={
                                                        isOverdue
                                                            ? "bg-destructive/10 border-l-4 border-l-destructive hover:bg-destructive/15 transition-all"
                                                            : "group transition-all duration-300 hover:bg-primary/[0.03]"
                                                    }
                                                >
                                                    <TableCell className="p-4">
                                                        <div className="text-sm font-extrabold text-ink">{t.tenantName}</div>
                                                        <div className="text-xs text-muted-foreground">{t.subdomain}.cloudynationpos.com</div>
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        <Badge variant="secondary" className="rounded-xl px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-extrabold">
                                                            {t.plan}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-sm font-semibold capitalize">
                                                        {t.billingCycle === "custom"
                                                            ? `Custom (${t.customDays || 30} days)`
                                                            : t.billingCycle === "6_months"
                                                            ? "6 Months"
                                                            : t.billingCycle || "Not set"}
                                                    </TableCell>
                                                    <TableCell className="p-4 text-sm font-semibold">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{formatDateString(t.currentPeriodEndDate)}</span>
                                                            <TooltipProvider delayDuration={200}>
                                                                <UITooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                                            onClick={() => handleOpenEditDueDate(t)}
                                                                        >
                                                                            <Pencil className="h-3 w-3" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit Next Due Date</TooltipContent>
                                                                </UITooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        {isOverdue && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/15 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-destructive">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse"></span>
                                                                Overdue
                                                            </span>
                                                        )}
                                                        {isDueSoon && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-warning/30 bg-warning/15 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-warning-foreground">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-warning"></span>
                                                                Due Soon
                                                            </span>
                                                        )}
                                                        {isActive && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/15 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-success">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                                                                Active
                                                            </span>
                                                        )}
                                                        {t.status === "no_record" && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">
                                                                No billing record yet
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        {t.lastPaymentAmount !== null ? (
                                                            <div>
                                                                <div className="text-sm font-bold text-ink">
                                                                    AED {Number(t.lastPaymentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">{formatDateTimeString(t.lastPaymentDate)}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground font-medium">No payments</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="rounded-xl h-8 text-xs font-semibold"
                                                                onClick={() => handleOpenRecordPayment(t)}
                                                            >
                                                                <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Record Payment
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="rounded-xl h-8 text-xs font-semibold"
                                                                onClick={() => handleOpenHistory(t)}
                                                            >
                                                                <History className="mr-1.5 h-3.5 w-3.5" /> History
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    )}

                    {/* Subscription Invoices Sub-View */}
                    {billingSubTab === "invoices" && (
                        <div className="panel p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-ink">Subscription Tax Invoices</h2>
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase">
                                            Mamo Pay Integration Pending
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Official tax invoices generated for client plan subscriptions. Unpaid invoices reflect pending online gateway connection.
                                    </p>
                                </div>
                            </div>

                            {/* Search & Filter Toolbar */}
                            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-surface-2/60 p-3 rounded-2xl border border-border">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by invoice ref, tenant name, or subdomain..."
                                        value={invoiceSearch}
                                        onChange={(e) => {
                                            setInvoiceSearch(e.target.value);
                                            setInvoicePage(1);
                                        }}
                                        className="pl-9 h-9 text-xs rounded-xl bg-surface"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="w-[170px]">
                                        <Select
                                            value={invoiceStatusFilter}
                                            onValueChange={(val) => {
                                                setInvoiceStatusFilter(val);
                                                setInvoicePage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 text-xs rounded-xl bg-surface">
                                                <SelectValue placeholder="All Statuses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="paid">Paid & Settled</SelectItem>
                                                <SelectItem value="pending">Pending Gateway</SelectItem>
                                                <SelectItem value="overdue">Overdue</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-[140px]">
                                        <Select
                                            value={invoicePlanFilter}
                                            onValueChange={(val) => {
                                                setInvoicePlanFilter(val);
                                                setInvoicePage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 text-xs rounded-xl bg-surface">
                                                <SelectValue placeholder="All Plans" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Plans</SelectItem>
                                                <SelectItem value="Starter">Starter</SelectItem>
                                                <SelectItem value="Growth">Growth</SelectItem>
                                                <SelectItem value="Enterprise">Enterprise</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {(invoiceSearch || invoiceStatusFilter !== "all" || invoicePlanFilter !== "all") && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-ink rounded-xl"
                                            onClick={() => {
                                                setInvoiceSearch("");
                                                setInvoiceStatusFilter("all");
                                                setInvoicePlanFilter("all");
                                                setInvoicePage(1);
                                            }}
                                            title="Clear Filters"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Invoices Table */}
                            <div className="overflow-x-auto w-full rounded-2xl border border-border">
                                <Table className="w-full">
                                    <TableHeader className="bg-surface-2/80">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Ref</TableHead>
                                            <TableHead className="min-w-[160px] py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tenant</TableHead>
                                            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan / Cycle</TableHead>
                                            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Coverage Period</TableHead>
                                            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total (AED)</TableHead>
                                            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Status</TableHead>
                                            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Gateway</TableHead>
                                            <TableHead className="py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedInvoices.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground font-medium">
                                                    {filteredInvoices.length === 0 && (invoiceSearch || invoiceStatusFilter !== "all" || invoicePlanFilter !== "all")
                                                        ? "No subscription invoices match the selected filters."
                                                        : "No subscription invoices found. New invoices are automatically created when onboarding tenants."}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedInvoices.map((inv: any) => {
                                                const isPaid = inv.paymentStatus === "paid" || inv.paymentStatus === "manual_paid";
                                                const isPendingGateway = inv.paymentStatus === "pending_gateway_integration";
                                                const isOverdue = inv.paymentStatus === "overdue";

                                                return (
                                                    <TableRow key={inv.id} className="group hover:bg-primary/[0.03] transition-colors">
                                                        <TableCell className="p-4 font-mono text-xs font-extrabold text-ink">
                                                            {inv.invoiceNumber}
                                                        </TableCell>
                                                        <TableCell className="p-4">
                                                            <div className="text-sm font-extrabold text-ink">{inv.tenantName}</div>
                                                            <div className="text-xs text-muted-foreground">{inv.tenantSubdomain}.cloudynationpos.com</div>
                                                        </TableCell>
                                                        <TableCell className="p-4">
                                                            <Badge variant="secondary" className="rounded-xl px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-extrabold">
                                                                {inv.planName}
                                                            </Badge>
                                                            <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                                                                {inv.billingCycle.replace(/_/g, " ")} ({inv.durationMonths} mo)
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="p-4 text-xs text-muted-foreground font-medium">
                                                            {formatDateString(inv.periodStart)} to {formatDateString(inv.periodEnd)}
                                                        </TableCell>
                                                        <TableCell className="p-4">
                                                            <div className="text-sm font-extrabold text-ink">
                                                                AED {Number(inv.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                Subtotal: {inv.subtotal} + VAT: {inv.vatAmount}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="p-4">
                                                            {isPaid && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/15 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-success">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                                                                    Paid & Settled
                                                                </span>
                                                            )}
                                                            {isPendingGateway && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-amber-700 dark:text-amber-400">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                                    Pending Gateway Integration
                                                                </span>
                                                            )}
                                                            {isOverdue && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/15 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-destructive">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-destructive"></span>
                                                                    Overdue
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="p-4 text-xs font-semibold text-muted-foreground">
                                                            {inv.mamoPaymentLinkId ? (
                                                                <Badge variant="outline" className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-bold">
                                                                    Link Ready
                                                                </Badge>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-[11px]">
                                                                    Mamo Pay (Live)
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {!isPaid && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        disabled={generatingLinkInvoiceId === inv.id}
                                                                        className="rounded-xl h-8 text-xs font-bold shadow-sm bg-lime-500 hover:bg-lime-600 text-slate-950 transition-all hover:-translate-y-0.5"
                                                                        onClick={async () => {
                                                                            setGeneratingLinkInvoiceId(inv.id);
                                                                            try {
                                                                                const res = await createTenantInvoicePaymentLinkServerFn({
                                                                                    data: { invoiceId: inv.id }
                                                                                });
                                                                                if (res.success && res.paymentUrl) {
                                                                                    toast.success("Mamo Pay payment link generated successfully!");
                                                                                    router.invalidate();
                                                                                } else {
                                                                                    toast.error(res.error || "Failed to generate payment link");
                                                                                }
                                                                            } catch (e: any) {
                                                                                toast.error("Failed to generate payment link: " + e.message);
                                                                            } finally {
                                                                                setGeneratingLinkInvoiceId(null);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {generatingLinkInvoiceId === inv.id ? (
                                                                            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating...</>
                                                                        ) : (
                                                                            <><Link2 className="mr-1.5 h-3.5 w-3.5" /> Generate Link</>
                                                                        )}
                                                                    </Button>
                                                                )}

                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="rounded-xl h-8 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                                                                    onClick={() => {
                                                                        try {
                                                                            generateSubscriptionInvoicePdf(inv);
                                                                            toast.success("Subscription invoice PDF downloaded!");
                                                                        } catch (e: any) {
                                                                            toast.error("Failed to export invoice PDF: " + e.message);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Download className="mr-1.5 h-3.5 w-3.5 text-primary group-hover:text-primary-foreground" /> PDF
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Footer */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1 pt-1">
                                <div>
                                    {filteredInvoices.length > 0 ? (
                                        <>
                                            Showing{" "}
                                            <span className="font-semibold text-ink">
                                                {invoiceStartIndex + 1}
                                            </span>{" "}
                                            to{" "}
                                            <span className="font-semibold text-ink">
                                                {Math.min(invoiceStartIndex + invoicePageSize, filteredInvoices.length)}
                                            </span>{" "}
                                            of <span className="font-semibold text-ink">{filteredInvoices.length}</span> invoices
                                        </>
                                    ) : (
                                        <span>0 invoices</span>
                                    )}
                                </div>

                                {totalInvoicePages > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-2.5 text-xs font-semibold rounded-xl"
                                            disabled={currentInvoicePage <= 1}
                                            onClick={() => setInvoicePage((prev) => Math.max(prev - 1, 1))}
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                                        </Button>

                                        <span className="px-2 font-mono text-xs font-semibold text-ink">
                                            Page {currentInvoicePage} of {totalInvoicePages}
                                        </span>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-2.5 text-xs font-semibold rounded-xl"
                                            disabled={currentInvoicePage >= totalInvoicePages}
                                            onClick={() => setInvoicePage((prev) => Math.min(prev + 1, totalInvoicePages))}
                                        >
                                            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </TabsContent>

                <TabsContent value="analytics" className="mt-5">
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="panel p-6 lg:col-span-2">
                            <h2 className="text-sm font-bold text-ink">Network sales volume (AED 000s)</h2>
                            <div className="mt-4 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={platformSeries}>
                                        <defs>
                                            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                        <XAxis dataKey="t" tickLine={false} axisLine={false} fontSize={12} />
                                        <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                                        <Tooltip />
                                        <Area dataKey="sales" stroke="var(--primary)" strokeWidth={2.5} fill="url(#salesFill)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>


                        <div className="panel p-6 lg:col-span-2">
                            <h2 className="text-sm font-bold text-ink">System log</h2>
                            <ul className="mt-4 space-y-2 font-mono text-xs">
                                {systemLogs.length === 0 ? (
                                    <li className="text-muted-foreground">No recent activity</li>
                                ) : systemLogs.map(([time, lvl, msg], index) => (
                                    <li key={`${index}-${String(msg)}`} className="flex gap-3 rounded-lg bg-surface-2 px-3 py-2">
                                        <span className="text-muted-foreground">{time}</span>
                                        <span className={lvl === "WARN" ? "font-bold text-warning-foreground" : "font-bold text-primary"}>
                                            {lvl as string}
                                        </span>
                                        <span className="text-ink">{msg as string}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="reports" className="mt-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-2 border border-border">
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-ink flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" /> Tenant & Platform Reports
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Select a tenant to view their Head Office reports directly, or view combined platform-wide analytics across all clients.
                            </p>
                        </div>
                        <div className="w-full sm:w-72 space-y-1.5">
                            <Label htmlFor="tenant-report-select" className="text-xs font-semibold text-muted-foreground">Select Target Tenant</Label>
                            <Select value={selectedReportTenantId} onValueChange={setSelectedReportTenantId}>
                                <SelectTrigger id="tenant-report-select" className="bg-surface rounded-xl">
                                    <SelectValue placeholder="Select Tenant" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="font-bold text-primary">All Tenants (Platform-Wide)</SelectItem>
                                    {(loaderData.billingData?.tenants || []).map((t: any) => (
                                        <SelectItem key={t.tenantId} value={t.tenantId}>
                                            {t.tenantName} ({t.subdomain})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ReportsTab selectedTenantId={selectedReportTenantId} isSuperAdmin={true} />
                </TabsContent>

                <TabsContent value="settings" className="mt-5">
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="panel p-6">
                            <h2 className="text-sm font-bold text-ink">Global tax templates</h2>
                            <div className="mt-5 space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="vat">Standard VAT rate (%)</Label>
                                    <Input id="vat" value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="max-w-32" />
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-surface-2 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-ink">Tax-inclusive shelf pricing</p>
                                        <p className="text-xs text-muted-foreground">Default display mode for new tenants.</p>
                                    </div>
                                    <Switch checked={inclusive} onCheckedChange={setInclusive} />
                                </div>
                                <Button className="rounded-xl" onClick={() => toast.success("Tax template saved")}>
                                    Save template
                                </Button>
                            </div>
                        </div>
                        <div className="panel p-6">
                            <h2 className="text-sm font-bold text-ink">Regional & currency settings</h2>
                            <div className="mt-5 space-y-5">
                                <div className="space-y-1.5">
                                    <Label>Platform Base Currency</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                                            <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Default Timezone</Label>
                                    <Select value={timezone} onValueChange={setTimezone}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                                            <SelectItem value="Asia/Riyadh">Asia/Riyadh (AST)</SelectItem>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Date Format</Label>
                                    <Select value={dateFormat} onValueChange={setDateFormat}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Date Format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="rounded-xl w-full" onClick={saveRegionalSettings}>
                                    Save settings
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={!!manageTenant && !selectedBranch} onOpenChange={(o) => !o && setManageTenant(null)}>
                <DialogContent className="sm:max-w-lg w-[95vw] sm:w-full p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base">Manage Branches — {manageTenant?.name}</DialogTitle>
                        <DialogDescription className="text-xs">
                            View and manage branches for this specific tenant.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2 mb-4 bg-surface-2 p-3 rounded-xl border border-border/50">
                        <Input 
                            placeholder="Branch Name" 
                            value={newBranchForm.name}
                            onChange={(e) => setNewBranchForm({...newBranchForm, name: e.target.value})}
                            className="bg-surface-1 flex-1 text-sm"
                        />
                        <Input 
                            placeholder="Location" 
                            value={newBranchForm.address}
                            onChange={(e) => setNewBranchForm({...newBranchForm, address: e.target.value})}
                            className="bg-surface-1 flex-1 text-sm"
                        />
                        <Button className="shrink-0 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 text-sm" onClick={addBranch}>
                            Add Branch
                        </Button>
                    </div>
                    <div className="max-h-[300px] overflow-auto border border-border/50 rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <Table className="min-w-[400px] sm:min-w-full">
                            <TableHeader className="bg-surface-2/80 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Name</TableHead>
                                    <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branches.filter(b => b.tenantId === manageTenant?.id).map((b) => (
                                    <TableRow key={b.id} className="cursor-pointer hover:bg-primary/[0.03] transition-colors" onClick={() => setSelectedBranch(b)}>
                                        <TableCell className="p-3 font-semibold text-ink text-sm">{b.name}</TableCell>
                                        <TableCell className="p-3">
                                            <Badge variant="secondary" className="rounded-xl text-[10px] uppercase tracking-wider font-extrabold bg-success/10 text-success shadow-sm">
                                                {b.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="p-3 text-right">
                                            <Button 
                                                size="sm" 
                                                className="h-8 rounded-xl font-bold bg-surface-2 text-ink hover:bg-primary hover:text-primary-foreground border border-border/50 shadow-sm transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedBranch(b);
                                                }}
                                            >
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {branches.filter(b => b.tenantId === manageTenant?.id).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-6 text-center text-muted-foreground font-semibold">
                                            No branches found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" className="rounded-xl" onClick={() => setManageTenant(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedBranch} onOpenChange={(o) => !o && setSelectedBranch(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Branch Details</DialogTitle>
                    </DialogHeader>
                    {selectedBranch && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between items-center bg-surface-2 p-4 rounded-xl border border-border/50">
                                <div>
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Branch Name</p>
                                    <h3 className="text-lg font-extrabold text-ink">{selectedBranch.name}</h3>
                                </div>
                                <Badge variant="secondary" className="rounded-xl font-extrabold text-[11px] uppercase tracking-wider bg-success/10 text-success">
                                    {selectedBranch.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Location</p>
                                <p className="font-semibold text-ink">{selectedBranch.address}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Created At</p>
                                <p className="font-semibold text-ink">{new Date(selectedBranch.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="pt-4 border-t border-border/50 flex gap-3 justify-end">
                                <Button variant="outline" className="rounded-xl" onClick={() => setSelectedBranch(null)}>Back to List</Button>
                                <Button variant="destructive" className="rounded-xl" onClick={() => {
                                    setBranchToDelete(selectedBranch.id);
                                    setSelectedBranch(null);
                                }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Branch
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!branchToDelete} onOpenChange={(o) => !o && setBranchToDelete(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground font-medium my-4">
                        Are you sure you want to completely remove this branch? This action cannot be undone and will decrement the tenant's outlet limit.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setBranchToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" className="rounded-xl" onClick={confirmRemoveBranch}>Delete Branch</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={globalAddBranchOpen} onOpenChange={setGlobalAddBranchOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Branch</DialogTitle>
                        <DialogDescription>
                            Create a new branch and assign it to a tenant.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Tenant</Label>
                            <Select 
                                value={globalNewBranchForm.tenantId} 
                                onValueChange={(val) => setGlobalNewBranchForm({...globalNewBranchForm, tenantId: val})}
                            >
                                <SelectTrigger className="rounded-xl border-border/50 bg-surface-2">
                                    <SelectValue placeholder="Select a tenant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tenants.filter(t => t.status !== "Archived").map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Branch Name</Label>
                                <Input 
                                    placeholder="e.g. Marina Branch"
                                    value={globalNewBranchForm.name}
                                    onChange={e => setGlobalNewBranchForm({...globalNewBranchForm, name: e.target.value})}
                                    className="rounded-xl border-border/50 bg-surface-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Location (Address)</Label>
                                <Input 
                                    placeholder="e.g. Dubai"
                                    value={globalNewBranchForm.address}
                                    onChange={e => setGlobalNewBranchForm({...globalNewBranchForm, address: e.target.value})}
                                    className="rounded-xl border-border/50 bg-surface-2"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select 
                                value={globalNewBranchForm.status} 
                                onValueChange={(val) => setGlobalNewBranchForm({...globalNewBranchForm, status: val})}
                            >
                                <SelectTrigger className="rounded-xl border-border/50 bg-surface-2">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setGlobalAddBranchOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl" onClick={async () => {
                            if (!globalNewBranchForm.tenantId || !globalNewBranchForm.name) {
                                toast.error("Please fill all required fields");
                                return;
                            }
                            const t = tenants.find(t => t.id === globalNewBranchForm.tenantId);
                            if (t) {
                                const limit = t.plan === "Enterprise" ? 999 : 10;
                                const currentBranches = branches.filter(b => b.tenantId === t.id);
                                if (currentBranches.length >= limit) {
                                    toast.error("Outlet limit reached — upgrade plan to add more branches");
                                    return;
                                }

                                const res = await createBranchServerFn({
                                    data: {
                                        tenantId: t.id,
                                        name: globalNewBranchForm.name,
                                        address: globalNewBranchForm.address
                                    }
                                });

                                if (res.success) {
                                    router.invalidate();
                                    toast.success("Branch created successfully");
                                    setGlobalAddBranchOpen(false);
                                    setGlobalNewBranchForm({ tenantId: "", name: "", address: "", status: "Active" });
                                } else {
                                    toast.error(res.error || "Failed to add branch");
                                }
                            }
                        }}>Save Branch</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!adminProfileTenant} onOpenChange={(o) => !o && setAdminProfileTenant(null)}>
                <DialogContent className="sm:max-w-md w-[95vw] sm:w-full p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base">Admin Profile — {adminProfileTenant?.name}</DialogTitle>
                        <DialogDescription>
                            Primary Head Office Admin contact details.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        {!adminData ? (
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground mb-4">
                                    This tenant does not have a primary admin configured. Set one up below.
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label>Full Name</Label>
                                        <Input value={existingAdminForm.name} onChange={e => setExistingAdminForm({...existingAdminForm, name: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label>Email</Label>
                                            <Input type="email" value={existingAdminForm.email} onChange={e => setExistingAdminForm({...existingAdminForm, email: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Password</Label>
                                            <Input type="password" value={existingAdminForm.password} onChange={e => setExistingAdminForm({...existingAdminForm, password: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label>Phone</Label>
                                            <Input value={existingAdminForm.phone} onChange={e => setExistingAdminForm({...existingAdminForm, phone: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Office Address</Label>
                                            <Input value={existingAdminForm.address} onChange={e => setExistingAdminForm({...existingAdminForm, address: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <Button className="rounded-xl" onClick={async () => {
                                        if (!existingAdminForm.name || !existingAdminForm.email || !existingAdminForm.password || !existingAdminForm.phone || !existingAdminForm.address) {
                                            toast.error("All fields are required");
                                            return;
                                        }
                                        const res = await createExistingTenantAdminServerFn({
                                            data: {
                                                tenantId: adminProfileTenant.id,
                                                name: existingAdminForm.name,
                                                email: existingAdminForm.email,
                                                phone: existingAdminForm.phone,
                                                address: existingAdminForm.address,
                                                password: existingAdminForm.password
                                            }
                                        });
                                        if (res.success) {
                                            toast.success("Admin profile created successfully");
                                            setExistingAdminForm({ name: "", email: "", phone: "", address: "", password: "" });
                                            // Refresh profile
                                            const profileRes = await getTenantAdminServerFn({ data: { tenantId: adminProfileTenant.id } });
                                            if (profileRes.success) setAdminData(profileRes.admin);
                                        } else {
                                            toast.error(res.error || "Failed to create admin");
                                        }
                                    }}>Set Up Admin</Button>
                                </div>
                            </div>
                        ) : isEditingAdmin ? (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label>Full Name</Label>
                                        <Input value={updateAdminForm.name} onChange={e => setUpdateAdminForm({...updateAdminForm, name: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label>Email</Label>
                                            <Input type="email" value={updateAdminForm.email} onChange={e => setUpdateAdminForm({...updateAdminForm, email: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>New Password (Optional)</Label>
                                            <Input type="password" placeholder="Leave blank to keep current" value={updateAdminForm.password} onChange={e => setUpdateAdminForm({...updateAdminForm, password: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label>Phone</Label>
                                            <Input value={updateAdminForm.phone} onChange={e => setUpdateAdminForm({...updateAdminForm, phone: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Office Address</Label>
                                            <Input value={updateAdminForm.address} onChange={e => setUpdateAdminForm({...updateAdminForm, address: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <Button variant="outline" className="rounded-xl" onClick={() => setIsEditingAdmin(false)}>Cancel</Button>
                                    <Button className="rounded-xl" onClick={async () => {
                                        if (!updateAdminForm.name || !updateAdminForm.email || !updateAdminForm.phone || !updateAdminForm.address) {
                                            toast.error("Name, email, phone and address are required");
                                            return;
                                        }
                                        const res = await updateTenantAdminServerFn({
                                            data: {
                                                id: adminData.id,
                                                ...updateAdminForm
                                            }
                                        });
                                        if (res.success) {
                                            toast.success("Admin profile updated successfully");
                                            setIsEditingAdmin(false);
                                            // Refresh profile
                                            const profileRes = await getTenantAdminServerFn({ data: { tenantId: adminProfileTenant.id } });
                                            if (profileRes.success) setAdminData(profileRes.admin);
                                        } else {
                                            toast.error(res.error || "Failed to update admin");
                                        }
                                    }}>Save Changes</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                                    <div className="font-semibold text-muted-foreground">Name</div>
                                    <div className="col-span-2 font-medium text-ink">{adminData.name || "N/A"}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                                    <div className="font-semibold text-muted-foreground">Email</div>
                                    <div className="col-span-2 font-medium text-ink">{adminData.email}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                                    <div className="font-semibold text-muted-foreground">Phone</div>
                                    <div className="col-span-2 font-medium text-ink">{adminData.phone || "N/A"}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                                    <div className="font-semibold text-muted-foreground">Office Address</div>
                                    <div className="col-span-2 font-medium text-ink">{adminData.address || "N/A"}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                                    <div className="font-semibold text-muted-foreground">Role</div>
                                    <div className="col-span-2 font-medium text-ink">
                                        <Badge variant="outline" className="text-xs uppercase bg-primary/10 text-primary border-primary/20">
                                            {adminData.role.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                                    <div className="font-semibold text-muted-foreground">Status</div>
                                    <div className="col-span-2 font-medium text-ink">
                                        {adminData.isActive ? (
                                            <span className="text-success flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success"></span> Active</span>
                                        ) : (
                                            <span className="text-destructive flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-destructive"></span> Inactive</span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="font-semibold text-muted-foreground">Created</div>
                                    <div className="col-span-2 font-medium text-ink">{new Date(adminData.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="pt-4 flex justify-end gap-3 mt-4 border-t">
                                    <Button variant="outline" className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={async () => {
                                        if (window.confirm("Are you sure you want to completely remove this admin? This action cannot be undone.")) {
                                            const res = await deleteTenantAdminServerFn({ data: { id: adminData.id } });
                                            if (res.success) {
                                                toast.success("Admin deleted successfully");
                                                setAdminData(null);
                                                router.invalidate();
                                            } else {
                                                toast.error(res.error || "Failed to delete admin");
                                            }
                                        }
                                    }}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </Button>
                                    <Button className="rounded-xl" onClick={() => {
                                        setUpdateAdminForm({
                                            name: adminData.name || "",
                                            email: adminData.email || "",
                                            phone: adminData.phone || "",
                                            address: adminData.address || "",
                                            password: ""
                                        });
                                        setIsEditingAdmin(true);
                                    }}>
                                        <Pencil className="h-4 w-4 mr-2" /> Edit Details
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Archive Tenant Dialog */}
            <Dialog open={archiveTenantOpen} onOpenChange={setArchiveTenantOpen}>
                <DialogContent className="sm:max-w-md w-[95vw] sm:w-full p-6">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="h-5 w-5" /> Archive Tenant
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-2 font-medium">
                            This will archive the tenant, block its users from logging in, and preserve its historical data. It will not permanently delete the tenant.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-4">
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive font-semibold">
                            To confirm archiving <span className="font-extrabold">{tenantToArchive?.name?.trim()}</span>, please type its exact name or subdomain below.
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmationValue">Confirmation Value</Label>
                            <Input 
                                id="confirmationValue"
                                value={archiveConfirmation}
                                onChange={(e) => setArchiveConfirmation(e.target.value)}
                                placeholder={`e.g. ${tenantToArchive?.subdomain?.trim() || tenantToArchive?.name?.trim()}`}
                                className="font-mono text-sm"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setArchiveTenantOpen(false)}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            variant="destructive"
                            onClick={handleArchive}
                            disabled={!archiveConfirmation || isArchiving}
                            className="rounded-xl"
                        >
                            {isArchiving ? "Archiving..." : "Archive Tenant"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Record Payment Dialog */}
            <Dialog open={!!recordPaymentTenant} onOpenChange={(val) => !val && setRecordPaymentTenant(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Record Manual Payment</DialogTitle>
                        <DialogDescription>
                            Manually record payment received for <span className="font-bold text-ink">{recordPaymentTenant?.tenantName}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="pay-amount">Payment Amount (AED)</Label>
                            <Input
                                id="pay-amount"
                                type="number"
                                step="0.01"
                                placeholder="1690.00"
                                value={recordForm.amount}
                                onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pay-date">Payment Date & Time</Label>
                            <Input
                                id="pay-date"
                                type="datetime-local"
                                value={recordForm.paymentDate}
                                onChange={(e) => setRecordForm({ ...recordForm, paymentDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Billing Cycle</Label>
                            <Select
                                value={recordForm.billingCycle}
                                onValueChange={(val) => setRecordForm({ ...recordForm, billingCycle: val })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly (1 Month)</SelectItem>
                                    <SelectItem value="quarterly">Quarterly (3 Months)</SelectItem>
                                    <SelectItem value="6_months">6 Months</SelectItem>
                                    <SelectItem value="yearly">Yearly (1 Year)</SelectItem>
                                    <SelectItem value="custom">Custom (Specify Days)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {recordForm.billingCycle === "custom" && (
                            <div className="space-y-1.5">
                                <Label htmlFor="custom-days">Custom Duration (Days)</Label>
                                <Input
                                    id="custom-days"
                                    type="number"
                                    min="1"
                                    value={recordForm.customDays}
                                    onChange={(e) => setRecordForm({ ...recordForm, customDays: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="pay-notes">Notes / Reference (Optional)</Label>
                            <Input
                                id="pay-notes"
                                placeholder="e.g. Bank transfer ref #12345"
                                value={recordForm.notes}
                                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setRecordPaymentTenant(null)}>
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl font-semibold"
                            disabled={isSubmittingPayment}
                            onClick={handleRecordPaymentSubmit}
                        >
                            {isSubmittingPayment ? "Recording..." : "Save Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment History Dialog */}
            <Dialog open={!!historyTenant} onOpenChange={(val) => !val && setHistoryTenant(null)}>
                <DialogContent className="sm:max-w-3xl md:max-w-4xl w-[95vw] p-6">
                    <DialogHeader>
                        <DialogTitle>Payment History — {historyTenant?.tenantName}</DialogTitle>
                        <DialogDescription>
                            All past recorded payments for this tenant account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2 max-h-[60vh] overflow-y-auto">
                        {isLoadingHistory ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">Loading payment history...</div>
                        ) : paymentHistory.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">No payment history found for this tenant.</div>
                        ) : (
                            <Table className="w-full">
                                <TableHeader className="bg-surface-2/80">
                                    <TableRow>
                                        <TableHead className="py-3 px-3 text-xs font-bold uppercase">Payment Date</TableHead>
                                        <TableHead className="py-3 px-3 text-xs font-bold uppercase">Amount</TableHead>
                                        <TableHead className="py-3 px-3 text-xs font-bold uppercase">Period Covered</TableHead>
                                        <TableHead className="py-3 px-3 text-xs font-bold uppercase">Notes</TableHead>
                                        <TableHead className="py-3 px-3 text-xs font-bold uppercase">Recorded By</TableHead>
                                        <TableHead className="py-3 px-3 text-xs font-bold uppercase text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentHistory.map((p: any) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="py-3 px-3 text-sm font-semibold whitespace-nowrap">{formatDateTimeString(p.paymentDate)}</TableCell>
                                            <TableCell className="py-3 px-3 text-sm font-extrabold text-ink whitespace-nowrap">
                                                {p.currency || "AED"} {Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="py-3 px-3 text-xs text-muted-foreground font-medium whitespace-nowrap">
                                                {formatDateString(p.periodCoveredStart)} → {formatDateString(p.periodCoveredEnd)}
                                            </TableCell>
                                            <TableCell className="py-3 px-3 text-xs text-ink max-w-[140px] truncate">{p.notes || "-"}</TableCell>
                                            <TableCell className="py-3 px-3 text-xs text-muted-foreground max-w-[160px] truncate">{p.recordedBy || "Super Admin"}</TableCell>
                                            <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 rounded-xl text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => handleOpenEditPayment(p)}
                                                >
                                                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setHistoryTenant(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Payment Dialog */}
            <Dialog open={!!editingPaymentRecord} onOpenChange={(val) => !val && setEditingPaymentRecord(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Payment Record</DialogTitle>
                        <DialogDescription>
                            Update payment details and date/time for <span className="font-bold text-ink">{historyTenant?.tenantName}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-amount">Payment Amount (AED)</Label>
                            <Input
                                id="edit-amount"
                                type="number"
                                step="0.01"
                                placeholder="1690.00"
                                value={editForm.amount}
                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-date">Payment Date & Time</Label>
                            <Input
                                id="edit-date"
                                type="datetime-local"
                                value={editForm.paymentDate}
                                onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Billing Cycle</Label>
                            <Select
                                value={editForm.billingCycle}
                                onValueChange={(val) => setEditForm({ ...editForm, billingCycle: val })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly (1 Month)</SelectItem>
                                    <SelectItem value="quarterly">Quarterly (3 Months)</SelectItem>
                                    <SelectItem value="6_months">6 Months</SelectItem>
                                    <SelectItem value="yearly">Yearly (1 Year)</SelectItem>
                                    <SelectItem value="custom">Custom (Specify Days)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {editForm.billingCycle === "custom" && (
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-custom-days">Custom Duration (Days)</Label>
                                <Input
                                    id="edit-custom-days"
                                    type="number"
                                    min="1"
                                    value={editForm.customDays}
                                    onChange={(e) => setEditForm({ ...editForm, customDays: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-notes">Notes / Reference (Optional)</Label>
                            <Input
                                id="edit-notes"
                                placeholder="e.g. Bank transfer ref #12345"
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setEditingPaymentRecord(null)}>
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl font-semibold"
                            disabled={isSubmittingEdit}
                            onClick={handleEditPaymentSubmit}
                        >
                            {isSubmittingEdit ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Due Date Dialog */}
            <Dialog open={!!editDueDateTenant} onOpenChange={(val) => !val && setEditDueDateTenant(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Current Period End (Next Due)</DialogTitle>
                        <DialogDescription>
                            Directly adjust the due date for <span className="font-bold text-ink">{editDueDateTenant?.tenantName}</span>. This will dynamically update their subscription status without recording a payment.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="due-date-input">New Current Period End Date</Label>
                            <Input
                                id="due-date-input"
                                type="date"
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setEditDueDateTenant(null)}>
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl font-semibold"
                            disabled={isSubmittingDueDate}
                            onClick={handleEditDueDateSubmit}
                        >
                            {isSubmittingDueDate ? "Saving..." : "Save Due Date"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DemoShell>
    );
}

function formatDateString(dStr: string | Date | null) {
    if (!dStr) return "-";
    const date = new Date(dStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTimeString(dStr: string | Date | null) {
    if (!dStr) return "-";
    const date = new Date(dStr);
    if (isNaN(date.getTime())) return "-";
    const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
}

function getNowISOString() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
}

function toLocalISOString(dStr: string | Date) {
    if (!dStr) return getNowISOString();
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return getNowISOString();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

