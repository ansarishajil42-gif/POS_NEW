import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionRole, roleRoutes } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle,
  Monitor,
  Receipt,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Ban
} from "lucide-react";
import { aedShort, aed } from "@/lib/demo-data";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from "recharts";
import { branchTrend, products } from "@/lib/demo-data";

export const Route = createFileRoute("/store-manager")({
  beforeLoad: () => {
    const role = getSessionRole();
    if (!role) throw redirect({ to: "/login" });
    if (role !== "Store Manager") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  component: StoreManager,
});

function StoreManager() {
  const localTrend = branchTrend.map(t => ({ d: t.d, Sales: t["Al Barsha"] }));

  return (
    <DemoShell
      title="Store Dashboard"
      subtitle="Al Barsha Hypermarket · Branch #04 · Manager View"
      actions={
        <Button className="rounded-xl font-semibold" onClick={() => toast.success("Daily Z-report exported")}>
          <Download className="mr-1.5 h-4 w-4" /> Export Z-Report
        </Button>
      }
    >
      <Tabs defaultValue="dashboard" className="mt-6 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0">
          <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
            <TabsTrigger value="dashboard" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Dashboard</TabsTrigger>
            <TabsTrigger value="stock" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Local Stock</TabsTrigger>
            <TabsTrigger value="pricing" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Pricing Adjustments</TabsTrigger>
            <TabsTrigger value="staff" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Shift & Staff</TabsTrigger>
          </TabsList>
        </aside>

        <main className="min-w-0 flex-1">
          <TabsContent value="dashboard" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Sales today" value={aedShort(92430)} delta="+12.4% vs yesterday" icon={TrendingUp} tone="success" />
              <StatCard label="Transactions" value="1,402" delta="Avg basket: 65.90" icon={Receipt} />
              <StatCard label="Low stock items" value="28" icon={AlertTriangle} tone="accent" />
              <StatCard label="Active tills" value="16 / 18" icon={Monitor} />
            </div>
            
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="panel p-6">
                <h2 className="text-sm font-bold text-ink">Branch Performance (Last 7 Days) · AED 000s</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={localTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                      <Tooltip cursor={{fill: 'var(--surface-2)'}} />
                      <Bar dataKey="Sales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="panel p-6">
                <h2 className="text-sm font-bold text-ink">Top Selling Items Today</h2>
                <div className="mt-4 space-y-4">
                  {[
                    { name: "Almarai Fresh Milk Full Fat 2L", qty: 240, value: 4080 },
                    { name: "Local Bananas Class A (Kg)", qty: 185, value: 1295 },
                    { name: "Oman Chips 50g x 24", qty: 112, value: 1344 },
                    { name: "Aquafina Water 1.5L x 6", qty: 94, value: 752 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.qty} units sold</p>
                      </div>
                      <div className="text-right text-sm font-bold text-ink">
                        {aed(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="mt-0">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="relative w-72">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Scan barcode or search SKU..." className="pl-9 h-9 text-sm" />
                </div>
                <Button variant="outline" size="sm" className="h-9">Filter by Category</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">SKU / Item</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">In Stock</th>
                      <th className="px-4 py-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.slice(0, 5).map((p) => {
                      const localQty = Math.floor(Math.random() * 150);
                      const isLow = localQty < 20;
                      return (
                        <tr key={p.sku} className="hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-ink">{p.name}</div>
                            <div className="text-xs text-muted-foreground">SKU: {p.sku} · {p.barcode}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {localQty} {p.uom}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isLow ? (
                              <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                                Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="mt-0 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">Local Pricing Adjustments</h3>
                <p className="text-sm text-muted-foreground">Request branch-specific price overrides for clearance or local competition.</p>
              </div>
              <Button>Request Override</Button>
            </div>
            
            <div className="panel overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Standard Price</th>
                    <th className="px-4 py-3 font-medium">Requested Price</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink">Almarai Fresh Laban 1L</td>
                    <td className="px-4 py-3 text-muted-foreground">{aed(5.50)}</td>
                    <td className="px-4 py-3 font-bold text-ink">{aed(4.50)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning-foreground">
                        <Clock className="h-3 w-3" /> Pending HO Approval
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink">Lipton Yellow Label 100s</td>
                    <td className="px-4 py-3 text-muted-foreground">{aed(16.50)}</td>
                    <td className="px-4 py-3 font-bold text-ink">{aed(14.00)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink">Nutella Hazelnut Spread 400g</td>
                    <td className="px-4 py-3 text-muted-foreground">{aed(22.00)}</td>
                    <td className="px-4 py-3 font-bold text-ink">{aed(18.00)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">
                        <Ban className="h-3 w-3" /> Rejected
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="mt-0">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-bold text-ink">Today's Shifts</h3>
                <Button variant="outline" size="sm">Manage Roster</Button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cashier</th>
                    <th className="px-4 py-3 font-medium">Till Assignment</th>
                    <th className="px-4 py-3 font-medium">Shift Time</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: "Rahul S.", till: "Till 01", time: "08:00 - 16:00", status: "Active" },
                    { name: "Fatima A.", till: "Till 02", time: "08:00 - 16:00", status: "Active" },
                    { name: "Michael J.", till: "Till 04", time: "10:00 - 18:00", status: "Active" },
                    { name: "Sarah K.", till: "-", time: "16:00 - 00:00", status: "Upcoming" },
                    { name: "John D.", till: "Till 03", time: "00:00 - 08:00", status: "Completed" },
                  ].map((staff, i) => (
                    <tr key={i} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center text-xs font-bold text-primary">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        {staff.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{staff.till}</td>
                      <td className="px-4 py-3 text-muted-foreground">{staff.time}</td>
                      <td className="px-4 py-3 text-right">
                        {staff.status === "Active" && <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success"><span className="h-1.5 w-1.5 rounded-full bg-success"/> Active</span>}
                        {staff.status === "Upcoming" && <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted-foreground"><Clock className="h-3 w-3"/> Upcoming</span>}
                        {staff.status === "Completed" && <span className="inline-flex items-center gap-1.5 rounded-full bg-border/50 px-2.5 py-1 text-xs font-bold text-muted-foreground">Completed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </main>
      </Tabs>
    </DemoShell>
  );
}
