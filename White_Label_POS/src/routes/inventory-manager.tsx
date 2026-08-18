import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionRole, roleRoutes } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Boxes, 
  AlertTriangle,
  ArrowRightLeft,
  CalendarDays,
  Search,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Plus
} from "lucide-react";
import { products, batches } from "@/lib/demo-data";

export const Route = createFileRoute("/inventory-manager")({
  beforeLoad: () => {
    const role = getSessionRole();
    if (!role) throw redirect({ to: "/login" });
    if (role !== "Inventory Manager") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  component: InventoryManager,
});

function InventoryManager() {
  return (
    <DemoShell
      title="Inventory Control Dashboard"
      subtitle="Al Barsha Hypermarket Group · Global View"
      actions={
        <Button className="rounded-xl font-semibold" onClick={() => toast.success("Stock count initiated")}>
          <Boxes className="mr-1.5 h-4 w-4" /> Start Stock Count
        </Button>
      }
    >
      <Tabs defaultValue="stock" className="mt-6 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0">
          <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
            <TabsTrigger value="stock" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Stock Levels</TabsTrigger>
            <TabsTrigger value="transfers" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Stock Transfers</TabsTrigger>
            <TabsTrigger value="batches" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Batch & Expiry (FEFO)</TabsTrigger>
            <TabsTrigger value="alerts" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Low-Stock Alerts</TabsTrigger>
          </TabsList>
        </aside>

        <main className="min-w-0 flex-1">
          <TabsContent value="stock" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total SKUs" value="12,402" icon={Boxes} />
              <StatCard label="Items Low on Stock" value="142" icon={AlertTriangle} tone="accent" />
              <StatCard label="Value in Stock" value="AED 4.2M" delta="+2.1% MTD" icon={ShoppingCart} tone="success" />
              <StatCard label="Pending Transfers" value="18" icon={ArrowRightLeft} />
            </div>

            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="relative w-72">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search SKU or Product Name..." className="pl-9 h-9 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9">Filter by Branch</Button>
                  <Button variant="outline" size="sm" className="h-9">Export</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">SKU / Item</th>
                      <th className="px-4 py-3 font-medium">Branch</th>
                      <th className="px-4 py-3 font-medium text-right">In Stock</th>
                      <th className="px-4 py-3 font-medium text-right">Reorder Level</th>
                      <th className="px-4 py-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.slice(0, 6).map((p, i) => {
                      const stock = [12, 140, 8, 450, 110, 50][i];
                      const reorder = [20, 50, 10, 100, 50, 60][i];
                      const isLow = stock <= reorder;
                      return (
                        <tr key={p.sku} className="hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-ink">{p.name}</div>
                            <div className="text-xs text-muted-foreground">SKU: {p.sku} · {p.category}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">Al Barsha</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {stock} {p.uom}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {reorder} {p.uom}
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

          <TabsContent value="transfers" className="mt-0 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">Stock Transfers</h3>
                <p className="text-sm text-muted-foreground">Move inventory between branches or central warehouse.</p>
              </div>
              <Button onClick={() => toast.info("Opening transfer wizard...")}>
                <Plus className="mr-1.5 h-4 w-4" /> New Transfer
              </Button>
            </div>
            
            <div className="panel overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">TRN ID</th>
                    <th className="px-4 py-3 font-medium">Origin</th>
                    <th className="px-4 py-3 font-medium">Destination</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-primary">TRN-8802</td>
                    <td className="px-4 py-3 text-ink">Central Warehouse</td>
                    <td className="px-4 py-3 text-ink">Al Barsha</td>
                    <td className="px-4 py-3 text-muted-foreground">14 Pallets (240 SKUs)</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning-foreground">
                        <Clock className="h-3 w-3" /> In Transit
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-primary">TRN-8801</td>
                    <td className="px-4 py-3 text-ink">Deira</td>
                    <td className="px-4 py-3 text-ink">Corniche</td>
                    <td className="px-4 py-3 text-muted-foreground">2 Cartons (1 SKU)</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                        <CheckCircle2 className="h-3 w-3" /> Received
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="batches" className="mt-0">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-bold text-ink">Batch & Expiry Tracker (FEFO)</h3>
                <div className="relative w-64">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search batch number..." className="pl-9 h-9 text-sm" />
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Batch No.</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Expiry Date</th>
                    <th className="px-4 py-3 font-medium text-right">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.map((b) => {
                    const days = parseInt(b.expiresIn);
                    const isUrgent = days <= 14;
                    return (
                      <tr key={b.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.id}</td>
                        <td className="px-4 py-3 font-semibold text-ink">{b.productName}</td>
                        <td className="px-4 py-3">{b.qty}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {b.expiryDate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                            isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                          }`}>
                            {b.expiresIn}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-2">
              {[
                { name: "Almarai Fresh Milk Full Fat 2L", sku: "100244", stock: 12, reorder: 50, vendor: "Almarai UAE" },
                { name: "Oman Chips 50g x 24", sku: "100246", stock: 8, reorder: 30, vendor: "Oman National Food" },
                { name: "Lipton Yellow Label 100s", sku: "100248", stock: 5, reorder: 25, vendor: "Unilever Gulf" },
              ].map((alert, i) => (
                <div key={i} className="panel p-5 border-l-4 border-l-accent flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase">Critical Stock</span>
                      <span className="text-xs text-muted-foreground">SKU: {alert.sku}</span>
                    </div>
                    <h3 className="mt-2 font-bold text-ink">{alert.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Current Stock: <span className="font-bold text-ink">{alert.stock}</span> (Reorder at {alert.reorder})
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Preferred Vendor: {alert.vendor}</p>
                  </div>
                  <Button className="mt-4 w-full" variant="secondary" onClick={() => toast.success(`PO Draft created for ${alert.name}`)}>
                    <ShoppingCart className="mr-1.5 h-4 w-4" /> Raise PO Draft
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </main>
      </Tabs>
    </DemoShell>
  );
}
