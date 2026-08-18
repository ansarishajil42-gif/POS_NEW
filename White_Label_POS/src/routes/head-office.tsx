import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth, getSessionRole, roleRoutes } from "@/lib/auth";
import {
  AlertTriangle,
  Building2,
  Download,
  FileText,
  Package,
  Receipt,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Tag,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  aed,
  aedShort,
  batches,
  branchTrend,
  customers,
  outlets,
  products,
  purchases,
  roles,
  promotions,
} from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/head-office")({
  beforeLoad: () => {
    const role = getSessionRole();
    if (!role) throw redirect({ to: "/login" });
    if (role !== "Head Office Admin") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  head: () => ({
    meta: [
      { title: "Head Office Dashboard Demo — cloudynationpos" },
      {
        name: "description",
        content:
          "Interactive head office demo: multi-outlet performance, central catalog, FIFO/FEFO expiry alerts, PO→GRN→Invoice pipeline, RBAC, VAT invoices and loyalty CRM.",
      },
      { property: "og:title", content: "cloudynationpos Head Office Dashboard Demo" },
      { property: "og:description", content: "Run every branch, catalog and purchase order from one screen." },
    ],
  }),
  component: HeadOffice,
});

const tierTone: Record<string, string> = {
  Platinum: "bg-primary/10 text-primary border-primary/20",
  Gold: "bg-accent/25 text-accent-foreground border-accent/30",
  Silver: "bg-secondary text-secondary-foreground border-border",
  Bronze: "bg-surface-2 text-muted-foreground border-border",
};

function expiryTone(days: number) {
  if (days <= 3) return "bg-destructive/10 text-destructive border-destructive/20";
  if (days <= 14) return "bg-warning/15 text-warning-foreground border-warning/30";
  return "bg-success/12 text-success border-success/20";
}

function HeadOffice() {
  const { role } = useAuth();
  const [inclusive, setInclusive] = useState(true);
  const totalSales = useMemo(() => outlets.reduce((s, o) => s + o.sales, 0), []);
  const nearExpiry = batches.filter((b) => b.daysLeft <= 14).length;

  const [localPurchases, setLocalPurchases] = useState(purchases);
  const [poForm, setPoForm] = useState({ vendor: "", value: "" });
  const [poOpen, setPoOpen] = useState(false);

  const line = [
    { d: "Bananas 1.240 kg", net: 7.13 },
    { d: "Laban 1L × 2", net: 11.0 },
    { d: "Basmati Rice 5kg", net: 38.5 },
  ];
  const net = line.reduce((s, l) => s + l.net, 0);
  const vat = net * 0.05;

  return (
    <DemoShell
      title="Head Office Dashboard"
      subtitle="Al Barsha Hypermarket Group · 14 outlets · 128 tills · TRN 100234567800003"
      actions={
        <Button className="rounded-xl font-semibold" onClick={() => toast.success("Daily brief exported")}>
          <Download className="mr-1.5 h-4 w-4" /> Export daily brief
        </Button>
      }
    >
      <Tabs defaultValue="dashboard" className="mt-6 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0">
          <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
            <TabsTrigger value="dashboard" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Dashboard</TabsTrigger>
            <TabsTrigger value="branches" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Branches</TabsTrigger>
            <TabsTrigger value="catalog" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Catalog</TabsTrigger>
            <TabsTrigger value="batches" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Inventory & Batches</TabsTrigger>
            <TabsTrigger value="purchasing" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Purchasing</TabsTrigger>
            <TabsTrigger value="roles" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Staff & Roles</TabsTrigger>
            <TabsTrigger value="vat" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">VAT & Reports</TabsTrigger>
            <TabsTrigger value="loyalty" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Customers</TabsTrigger>
            <TabsTrigger value="promotions" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Promotions</TabsTrigger>
          </TabsList>
        </aside>

        <main className="min-w-0 flex-1">
          <TabsContent value="dashboard" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Network sales today" value={aedShort(totalSales)} delta="+9.6% vs yesterday" icon={TrendingUp} />
              <StatCard label="Outlets reporting" value="14 / 14" delta="All online" icon={Building2} tone="success" />
              <StatCard label="Near-expiry batches" value={String(nearExpiry)} icon={AlertTriangle} tone="accent" />
              <StatCard label="Open purchase value" value={aedShort(116300)} icon={Package} />
            </div>
            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">Branch performance · AED 000s</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Al Barsha" fill="#39ff14" radius={[6, 6, 0, 0]}>
                    {branchTrend.map((entry, index) => {
                      const isUp = index === 0 || entry["Al Barsha"] >= branchTrend[index - 1]["Al Barsha"];
                      return <Cell key={`cell-ab-${index}`} fill={isUp ? "#39ff14" : "#ef4444"} />;
                    })}
                  </Bar>
                  <Bar dataKey="Deira" fill="#39ff14" radius={[6, 6, 0, 0]}>
                    {branchTrend.map((entry, index) => {
                      const isUp = index === 0 || entry["Deira"] >= branchTrend[index - 1]["Deira"];
                      return <Cell key={`cell-d-${index}`} fill={isUp ? "#39ff14" : "#ef4444"} />;
                    })}
                  </Bar>
                  <Bar dataKey="Corniche" fill="#39ff14" radius={[6, 6, 0, 0]}>
                    {branchTrend.map((entry, index) => {
                      const isUp = index === 0 || entry["Corniche"] >= branchTrend[index - 1]["Corniche"];
                      return <Cell key={`cell-c-${index}`} fill={isUp ? "#39ff14" : "#ef4444"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            </div>
          </TabsContent>

          <TabsContent value="branches" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {outlets.map((o) => (
                <Dialog key={o.id}>
                  <DialogTrigger asChild>
                    <div className="panel p-5 cursor-pointer hover:border-primary/30 transition-colors">
                      <p className="text-sm font-bold text-ink">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.emirate} · {o.tills} tills</p>
                      <p className="mt-4 text-xl font-extrabold text-ink">{aedShort(o.sales)}</p>
                      <p className={`text-xs font-semibold ${o.growth >= 0 ? "text-success" : "text-destructive"}`}>
                        {o.growth >= 0 ? "+" : ""}
                        {o.growth}% week on week
                      </p>
                      <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                          <span>Stock health</span>
                          <span>{o.stockHealth}%</span>
                        </div>
                        <Progress value={o.stockHealth} className="h-2" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Manage Branch: {o.name}</DialogTitle>
                      <DialogDescription>Adjust local stock and pricing overrides for this branch.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-6">
                      <div>
                        <h3 className="font-bold text-ink mb-3">Local Inventory</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Current Stock</TableHead>
                              <TableHead>Adjust (+/-)</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.slice(0, 3).map((p, i) => (
                              <TableRow key={p.sku}>
                                <TableCell className="text-xs font-mono">{p.sku}</TableCell>
                                <TableCell className="font-semibold text-ink">{p.name}</TableCell>
                                <TableCell>{[12, 45, 8][i]} {p.unit}</TableCell>
                                <TableCell>
                                  <Input type="number" placeholder="0" className="w-24 h-8 text-sm" />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline" onClick={() => toast.success("Stock adjusted")}>Update</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div>
                        <h3 className="font-bold text-ink mb-3">Pricing Overrides</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Standard Price</TableHead>
                              <TableHead>Local Price</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.slice(3, 6).map((p) => (
                              <TableRow key={p.sku}>
                                <TableCell className="font-semibold text-ink">{p.name}</TableCell>
                                <TableCell>{aed(p.price)}</TableCell>
                                <TableCell>
                                  <Input type="number" defaultValue={(p.price * 0.9).toFixed(2)} className="w-24 h-8 text-sm" />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="outline" onClick={() => toast.success("Price overridden")}>Save</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="mt-0">
          <div className="panel overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Barcode / variants</TableHead>
                  <TableHead>Unit conversion</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.sku}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                    <TableCell className="font-semibold text-ink">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.unit}</TableCell>
                    <TableCell className="text-sm">{p.category}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{p.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">{p.vat}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="batches" className="mt-0 space-y-5">
          <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
            <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            <p className="text-sm font-medium text-ink">
              {nearExpiry} batches expire within 14 days — clearance pricing is suggested for 2 SKUs.
            </p>
            <Button
              size="sm"
              className="ml-auto rounded-lg"
              onClick={() => toast.success("Clearance pricing applied to 2 SKUs")}
            >
              Apply clearance
            </Button>
          </div>
          <div className="panel overflow-x-auto">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Rotation</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-semibold text-ink">{b.product}</TableCell>
                    <TableCell className="font-mono text-xs">{b.batch}</TableCell>
                    <TableCell>{b.outlet}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">{b.rule}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{b.qty}</TableCell>
                    <TableCell className="tabular-nums">{b.expiry}</TableCell>
                    <TableCell className="text-right">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${expiryTone(b.daysLeft)}`}>
                        {b.daysLeft} days left
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="purchasing" className="mt-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-ink">Purchasing Pipeline</h3>
              <p className="text-sm text-muted-foreground">Track Purchase Orders, Goods Received, and Invoices.</p>
            </div>
            <Dialog open={poOpen} onOpenChange={setPoOpen}>
              <DialogTrigger asChild>
                <Button>Create New PO</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Purchase Order</DialogTitle>
                  <DialogDescription>Draft a new PO to send to a vendor.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Vendor Name</Label>
                    <Input placeholder="e.g. Almarai UAE" value={poForm.vendor} onChange={e => setPoForm({ ...poForm, vendor: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Value (AED)</Label>
                    <Input type="number" placeholder="0.00" value={poForm.value} onChange={e => setPoForm({ ...poForm, value: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setPoOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    if (!poForm.vendor || !poForm.value) {
                      toast.error("Please fill in all fields");
                      return;
                    }
                    const newPo = {
                      id: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
                      stage: "PO" as const,
                      vendor: poForm.vendor,
                      value: Number(poForm.value),
                    };
                    setLocalPurchases([newPo, ...localPurchases]);
                    setPoForm({ vendor: "", value: "" });
                    setPoOpen(false);
                    toast.success("Purchase Order created");
                  }}>Submit PO</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {(["PO", "GRN", "Invoice"] as const).map((stage, idx) => (
              <div key={stage} className="panel p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-ink">
                    {idx + 1}. {stage === "PO" ? "Purchase Orders" : stage === "GRN" ? "Goods Received" : "Vendor Invoices"}
                  </h2>
                  <Badge variant="outline" className="rounded-full">
                    {localPurchases.filter((p) => p.stage === stage).length}
                  </Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {localPurchases
                    .filter((p) => p.stage === stage)
                    .map((p) => (
                      <div key={p.id} className="rounded-xl border border-border bg-surface-2 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                          <span className="text-sm font-bold text-ink">{aedShort(p.value)}</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-ink">{p.vendor}</p>
                        {p.variance && (
                          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
                            <AlertTriangle className="h-3 w-3" /> {p.variance}
                          </span>
                        )}
                        {stage !== "Invoice" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 w-full rounded-lg"
                            onClick={() =>
                              toast.success(
                                stage === "PO" ? `${p.id} received — GRN created` : `${p.id} converted to vendor invoice`,
                              )
                            }
                          >
                            {stage === "PO" ? "Record GRN" : "Convert to invoice"}
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div className="panel mt-5 flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm font-bold text-ink">Accounts payable outstanding</p>
              <p className="text-xs text-muted-foreground">2 invoices due within 7 days</p>
            </div>
            <p className="text-2xl font-extrabold text-ink">{aedShort(105900)}</p>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-0">
          <div className="grid gap-5 sm:grid-cols-2">
            {roles.map((r) => (
              <div key={r.role} className="panel p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-ink">{r.role}</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Users className="h-3.5 w-3.5" /> {r.users}
                  </span>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {r.perms.map((p) => (
                    <li key={p} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                      <span className="text-ink">{p}</span>
                      <Switch defaultChecked />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" /> Every permission change is written to an
            immutable audit log.
          </p>
        </TabsContent>

        <TabsContent value="vat" className="mt-0">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">VAT configuration</h2>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-2 p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {inclusive ? "Tax-inclusive" : "Tax-exclusive"} shelf pricing
                  </p>
                  <p className="text-xs text-muted-foreground">Applies to all outlets in this tenant.</p>
                </div>
                <Switch checked={inclusive} onCheckedChange={setInclusive} />
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["Standard rate", "5%"],
                  ["Zero-rated categories", "Bakery basics, exports"],
                  ["Filing period", "Quarterly (Q3 2026)"],
                  ["Output VAT this period", aed(184920.4)],
                  ["Input VAT this period", aed(121403.15)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded-xl border border-border px-4 py-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold text-ink">{v}</span>
                  </div>
                ))}
              </div>
              <Button
                className="mt-5 rounded-xl font-semibold"
                onClick={() => toast.success("FTA VAT summary downloaded", { description: "Q3 2026 · CSV" })}
              >
                <FileText className="mr-1.5 h-4 w-4" /> Download FTA tax summary
              </Button>
            </div>

            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">Sample tax invoice</h2>
              <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-border bg-surface-2 p-5">
                <p className="text-center text-sm font-extrabold text-ink">TAX INVOICE</p>
                <p className="mt-1 text-center text-[11px] text-muted-foreground">
                  Al Barsha Hypermarket · TRN 100234567800003
                </p>
                <p className="text-center text-[11px] text-muted-foreground">
                  Invoice AB-2026-014882 · Till 04 · Cashier 118
                </p>
                <div className="mt-4 space-y-1.5 border-y border-dashed border-border py-3 text-xs">
                  {line.map((l) => (
                    <div key={l.d} className="flex justify-between text-ink">
                      <span>{l.d}</span>
                      <span className="tabular-nums">{l.net.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{inclusive ? "Net of VAT" : "Taxable amount"}</span>
                    <span className="tabular-nums">{net.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT @ 5%</span>
                    <span className="tabular-nums">{vat.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-extrabold text-ink">
                  <span>Total</span>
                  <span className="tabular-nums">{aed(net + vat)}</span>
                </div>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                  <Receipt className="h-3 w-3" /> Generated by cloudynationpos · FTA compliant
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="loyalty" className="mt-0 space-y-5">
          <div className="panel p-6">
            <h3 className="text-sm font-bold text-ink mb-4">Point-Redemption Policies</h3>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Points per 1 AED spent</Label>
                <Input type="number" defaultValue="10" />
              </div>
              <div className="space-y-1.5">
                <Label>Minimum points to redeem</Label>
                <Input type="number" defaultValue="5000" />
              </div>
              <div className="space-y-1.5">
                <Label>Redemption Value (AED per 1000 pts)</Label>
                <Input type="number" defaultValue="10" />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => toast.success("Loyalty policies updated")}>Save Policies</Button>
            </div>
          </div>
          <div className="panel overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">Lifetime spend</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <Dialog key={c.id}>
                    <DialogTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-surface-2/50 transition-colors">
                        <TableCell className="font-semibold text-ink">{c.name}</TableCell>
                        <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tierTone[c.tier]}`}>
                            <Star className="h-3 w-3" /> {c.tier}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{c.points.toLocaleString("en-AE")}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.visits}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{aedShort(c.spend)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg relative z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success(`Voucher issued to ${c.name}`);
                            }}
                          >
                            Issue voucher
                          </Button>
                        </TableCell>
                      </TableRow>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{c.name} - Transaction History</DialogTitle>
                        <DialogDescription>Recent purchases and loyalty points activity.</DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="text-right">Points</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              { date: "12 Aug 2026", loc: "Al Barsha", amt: 145.50, pts: "+1450" },
                              { date: "04 Aug 2026", loc: "Deira", amt: 320.00, pts: "+3200" },
                              { date: "28 Jul 2026", loc: "Al Barsha", amt: 85.25, pts: "+850" },
                            ].map((h, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-muted-foreground">{h.date}</TableCell>
                                <TableCell>{h.loc}</TableCell>
                                <TableCell className="text-right font-medium">{aed(h.amt)}</TableCell>
                                <TableCell className="text-right text-success font-semibold">{h.pts}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="mt-0">
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-5">
            <Tag className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-ink">
              Dynamic pricing engine active. Bundle discounts are automatically evaluated at checkout.
            </p>
            <Button
              size="sm"
              className="ml-auto rounded-lg"
              onClick={() => toast.success("New promotion campaign drafted")}
            >
              Create Campaign
            </Button>
          </div>
          <div className="panel overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-ink">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.target}</TableCell>
                    <TableCell className="font-medium text-ink">{p.value}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{p.startDate}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{p.endDate}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          p.status === "Active"
                            ? "border-success/20 bg-success/12 text-success"
                            : p.status === "Scheduled"
                              ? "border-warning/30 bg-warning/15 text-warning-foreground"
                              : "border-border bg-surface-2 text-muted-foreground"
                        }`}
                      >
                        {p.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        </main>
      </Tabs>
    </DemoShell>
  );
}
