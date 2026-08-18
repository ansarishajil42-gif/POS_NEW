import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getSessionRole, roleRoutes } from "@/lib/auth";
import {
    Activity,
    Building2,
    Coins,
    Monitor,
    Plus,
    ShieldCheck,
    Ban,
    ArrowUpCircle,
    Trash2,
} from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initialTenants, platformSeries, aedShort, type Tenant } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin")({
    beforeLoad: () => {
        const role = getSessionRole();
        if (!role) throw redirect({ to: "/login" });
        if (role !== "Super Admin") throw redirect({ to: roleRoutes[role] });
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
    const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", outlets: 2, tills: 6, trn: "" });
    const [vatRate, setVatRate] = useState("5");
    const [inclusive, setInclusive] = useState(true);

    type Branch = { id: string; tenantId: string; name: string; location: string; status: string; createdAt: string };
    
    const [branches, setBranches] = useState<Branch[]>(() => initialTenants.flatMap(t => 
        Array.from({ length: t.outlets }).map((_, i) => ({
            id: `b-${t.id}-${i}`,
            tenantId: t.id,
            name: `${t.name} - Branch ${i + 1}`,
            location: ["Dubai", "Abu Dhabi", "Sharjah"][i % 3],
            status: i % 5 === 0 ? "Suspended" : "Active",
            createdAt: new Date().toISOString().split('T')[0]
        }))
    ));
    
    // Manage Branches dialog state
    const [manageTenant, setManageTenant] = useState<Tenant | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [newBranchForm, setNewBranchForm] = useState({ name: "", location: "" });
    const [branchToDelete, setBranchToDelete] = useState<string | null>(null);

    const [globalAddBranchOpen, setGlobalAddBranchOpen] = useState(false);
    const [globalNewBranchForm, setGlobalNewBranchForm] = useState({ tenantId: "", name: "", location: "", status: "Active" });


    const totals = useMemo(
        () => ({
            tenants: tenants.length,
            outlets: tenants.reduce((s, t) => s + t.outlets, 0),
            tills: tenants.reduce((s, t) => s + t.tills, 0),
            orders: tenants.reduce((s, t) => s + t.monthlyOrders, 0),
        }),
        [tenants],
    );

    const toggleStatus = (id: string) => {
        setTenants((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, status: t.status === "Suspended" ? "Active" : "Suspended" } : t,
            ),
        );
        toast.success("Tenant status updated");
    };

    const upgrade = (id: string) => {
        setTenants((prev) =>
            prev.map((t) =>
                t.id === id
                    ? { ...t, plan: t.plan === "Starter" ? "Growth" : "Enterprise" }
                    : t,
            ),
        );
        toast.success("Plan upgraded");
    };

    const handleManageBranches = (tenant: Tenant) => {
        setManageTenant(tenant);
        setNewBranchForm({ name: "", location: "" });
        setSelectedBranch(null);
    };

    const addBranch = () => {
        if (!manageTenant) return;
        const currentBranches = branches.filter(b => b.tenantId === manageTenant.id);
        
        if (currentBranches.length >= (manageTenant.plan === "Enterprise" ? 999 : 10)) {
            toast.error("Outlet limit reached â€” upgrade plan to add more branches");
            return;
        }

        if (!newBranchForm.name.trim() || !newBranchForm.location.trim()) {
            toast.error("Please fill all fields");
            return;
        }

        const newBranch: Branch = {
            id: `b-${Math.random().toString(36).slice(2, 6)}`,
            tenantId: manageTenant.id,
            name: newBranchForm.name,
            location: newBranchForm.location,
            status: "Active",
            createdAt: new Date().toISOString().split('T')[0]
        };

        setBranches(prev => [...prev, newBranch]);
        
        setTenants(prev => prev.map(t => 
            t.id === manageTenant.id ? { ...t, outlets: t.outlets + 1 } : t
        ));
        
        setNewBranchForm({ name: "", location: "" });
        toast.success("Branch added successfully");
    };

    const confirmRemoveBranch = () => {
        if (!manageTenant || !branchToDelete) return;

        setBranches(prev => prev.filter(b => b.id !== branchToDelete));
        
        setTenants(prev => prev.map(t => 
            t.id === manageTenant.id ? { ...t, outlets: Math.max(0, t.outlets - 1) } : t
        ));

        toast.success("Branch removed");
        setBranchToDelete(null);
        setSelectedBranch(null);
    };

    return (
        <DemoShell
            title="SaaS Super-Admin Portal"
            subtitle="Provision and govern every supermarket tenant on the platform â€” limits, tax templates and live network telemetry."
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
                                    placeholder="100000000000003"
                                />
                            </div>
                            <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
                                Tax template applied on creation: UAE VAT {vatRate}% Â·{" "}
                                {inclusive ? "inclusive" : "exclusive"} pricing Â· AED
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="rounded-xl"
                                onClick={() => {
                                    if (!form.name.trim()) {
                                        toast.error("Chain name is required");
                                        return;
                                    }
                                    setTenants((p) => [
                                        {
                                            id: `t-${Math.random().toString(36).slice(2, 6)}`,
                                            name: form.name,
                                            plan: "Starter",
                                            status: "Trial",
                                            outlets: form.outlets,
                                            tills: form.tills,
                                            monthlyOrders: 0,
                                            trn: form.trn || "100000000000003",
                                        },
                                        ...p,
                                    ]);
                                    setForm({ name: "", outlets: 2, tills: 6, trn: "" });
                                    setOpen(false);
                                    toast.success("Tenant provisioned", { description: "Trial environment is live." });
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
                <StatCard label="Active tenants" value={String(totals.tenants)} delta="+2 this month" icon={Building2} />
                <StatCard label="Outlets on platform" value={String(totals.outlets)} delta="+6 this month" icon={ShieldCheck} tone="success" />
                <StatCard label="Active tills" value={String(totals.tills)} delta="97% online" icon={Monitor} />
                <StatCard label="Monthly orders" value={`${(totals.orders / 1000).toFixed(0)}k`} delta="+11.2%" icon={Activity} tone="accent" />
            </div>

            <Tabs defaultValue="tenants" className="mt-8">
                <TabsList className="rounded-xl">
                    <TabsTrigger value="tenants">Tenants</TabsTrigger>
                    <TabsTrigger value="analytics">Platform analytics</TabsTrigger>
                    <TabsTrigger value="settings">Tax & currency</TabsTrigger>
                </TabsList>

                <TabsContent value="tenants" className="mt-8">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-surface-2/80">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[300px] py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tenant</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Outlets</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tills</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly orders</TableHead>
                                <TableHead className="py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map((t) => (
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
                                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold shadow-sm ${statusTone[t.status]}`}>
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
                                    <div className="flex justify-end gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                                            onClick={() => upgrade(t.id)}
                                            disabled={t.plan === "Enterprise"}
                                        >
                                            <ArrowUpCircle className="mr-1.5 h-4 w-4" /> Upgrade
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-xl font-bold hover:bg-primary/10 hover:text-primary border-primary/20 transition-colors"
                                            onClick={() => handleManageBranches(t)}
                                        >
                                            Branches
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-xl font-bold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                                            onClick={() => toggleStatus(t.id)}
                                        >
                                            <Ban className="mr-1.5 h-4 w-4" />
                                            {t.status === "Suspended" ? "Reactivate" : "Suspend"}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TabsContent>

                <TabsContent value="analytics" className="mt-5">
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="panel p-6">
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
                        <div className="panel p-6">
                            <h2 className="text-sm font-bold text-ink">Active tills</h2>
                            <div className="mt-4 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={platformSeries}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                        <XAxis dataKey="t" tickLine={false} axisLine={false} fontSize={12} />
                                        <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                                        <Tooltip />
                                        <Bar dataKey="tills" radius={[6, 6, 0, 0]}>
                                            {platformSeries.map((entry, index) => {
                                                const isUp = index === 0 || entry.tills >= platformSeries[index - 1].tills;
                                                return <Cell key={`cell-${index}`} fill={isUp ? "#39ff14" : "#ef4444"} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="panel p-6 lg:col-span-2">
                            <h2 className="text-sm font-bold text-ink">API traffic (requests / second)</h2>
                            <div className="mt-4 h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={platformSeries}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                        <XAxis dataKey="t" tickLine={false} axisLine={false} fontSize={12} />
                                        <YAxis tickLine={false} axisLine={false} fontSize={12} width={44} />
                                        <Tooltip />
                                        <Line dataKey="api" stroke="var(--chart-3)" strokeWidth={2.5} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="panel p-6 lg:col-span-2">
                            <h2 className="text-sm font-bold text-ink">System log</h2>
                            <ul className="mt-4 space-y-2 font-mono text-xs">
                                {[
                                    ["12:04:11", "INFO", "tenant t-005 published catalog to 4 aggregators"],
                                    ["12:03:58", "WARN", "till DEIRA-11 entered offline buffering mode"],
                                    ["12:02:40", "INFO", "VAT template UAE-5 applied to tenant t-003"],
                                    ["12:01:12", "INFO", "GRN variance alert raised Â· PO-4821"],
                                    ["11:59:03", "INFO", "nightly Z-report archived for 132 tills"],
                                ].map(([time, lvl, msg]) => (
                                    <li key={String(msg)} className="flex gap-3 rounded-lg bg-surface-2 px-3 py-2">
                                        <span className="text-muted-foreground">{time}</span>
                                        <span className={lvl === "WARN" ? "font-bold text-warning-foreground" : "font-bold text-primary"}>
                                            {lvl}
                                        </span>
                                        <span className="text-ink">{msg}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
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
                                <div className="rounded-xl border border-border p-4 text-sm">
                                    <p className="font-semibold text-ink">Templates</p>
                                    <ul className="mt-2 space-y-1.5 text-muted-foreground">
                                        <li>UAE VAT Standard â€” {vatRate}%</li>
                                        <li>UAE Zero-rated â€” 0% (basic food, exports)</li>
                                        <li>Out of scope â€” exempt supplies</li>
                                    </ul>
                                </div>
                                <Button className="rounded-xl" onClick={() => toast.success("Tax template saved")}>
                                    Save template
                                </Button>
                            </div>
                        </div>
                        <div className="panel p-6">
                            <h2 className="text-sm font-bold text-ink">Regional & currency settings</h2>
                            <div className="mt-5 space-y-3 text-sm">
                                {[
                                    ["Base currency", "AED â€” UAE Dirham"],
                                    ["Rounding", "Nearest 0.25 AED (cash)"],
                                    ["Fiscal calendar", "January â€“ December"],
                                    ["Timezone", "Asia/Dubai (GMT+4)"],
                                    ["Data residency", "UAE region"],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className="font-semibold text-ink">{v}</span>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-xs text-muted-foreground">
                                    <Coins className="h-4 w-4 text-primary" /> Platform-wide GMV this month:{" "}
                                    {aedShort(48620000)}
                                </div>
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
                            value={newBranchForm.location}
                            onChange={(e) => setNewBranchForm({...newBranchForm, location: e.target.value})}
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
                                <p className="font-semibold text-ink">{selectedBranch.location}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Created At</p>
                                <p className="font-semibold text-ink">{selectedBranch.createdAt}</p>
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
                                    {tenants.map(t => (
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
                                <Label>Location</Label>
                                <Input 
                                    placeholder="e.g. Dubai"
                                    value={globalNewBranchForm.location}
                                    onChange={e => setGlobalNewBranchForm({...globalNewBranchForm, location: e.target.value})}
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
                        <Button className="rounded-xl" onClick={() => {
                            if (!globalNewBranchForm.tenantId || !globalNewBranchForm.name || !globalNewBranchForm.location) {
                                toast.error("Please fill all fields");
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
                                const newBranch = {
                                    id: `b-${Math.random().toString(36).slice(2, 6)}`,
                                    tenantId: t.id,
                                    name: globalNewBranchForm.name,
                                    location: globalNewBranchForm.location,
                                    status: globalNewBranchForm.status,
                                    createdAt: new Date().toISOString().split('T')[0]
                                };
                                setBranches(prev => [...prev, newBranch]);
                                setTenants(prev => prev.map(x => x.id === t.id ? { ...x, outlets: x.outlets + 1 } : x));
                                toast.success("Branch created successfully");
                                setGlobalAddBranchOpen(false);
                                setGlobalNewBranchForm({ tenantId: "", name: "", location: "", status: "Active" });
                            }
                        }}>Save Branch</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DemoShell>
    );
}
