import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { 
  Boxes, 
  AlertTriangle,
  ArrowRightLeft,
  CalendarDays,
  Search,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Plus,
  Building2,
  X
} from "lucide-react";
import { getInventoryDataServerFn, stockTransferServerFn } from "@/lib/inventory-manager-server";

export const Route = createFileRoute("/inventory-manager")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (role !== "Inventory Manager") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  loader: async () => {
    return await getInventoryDataServerFn();
  },
  component: InventoryManager,
});

function InventoryManager() {
  const data = Route.useLoaderData();
  const router = useRouter();
  
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferForm, setTransferForm] = useState({
    productId: "",
    sourceBranchId: "",
    targetBranchId: "",
    quantity: 1
  });
  
  if ((data as any).error) {
    return (
      <div className="p-8">
        <h1 className="text-red-500 font-bold text-xl">Backend API Error</h1>
        <pre className="mt-4 p-4 bg-red-50 text-red-900 rounded whitespace-pre-wrap">{(data as any).error}</pre>
      </div>
    );
  }

  const { branches, stockLevels, batches, transfers, stats } = data;

  return (
    <DemoShell
      title="Inventory Control Dashboard"
      subtitle={`${data.tenant?.name || "Company"} · Global View`}
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
              <StatCard label="Total SKUs" value={stats.totalSkus.toLocaleString()} icon={Boxes} />
              <StatCard label="Items Low on Stock" value={stats.lowStockCount.toLocaleString()} icon={AlertTriangle} tone={stats.lowStockCount > 0 ? "accent" : "success"} />
              <StatCard label="Total Items in Stock" value={stockLevels.reduce((acc: number, s: any) => acc + (s.stock || 0), 0).toLocaleString()} delta="Across all branches" icon={ShoppingCart} tone="success" />
              <StatCard label="Branches Monitored" value={branches.length.toString()} icon={Building2} />
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
                    {stockLevels.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No stock data available.</td>
                      </tr>
                    )}
                    {stockLevels.map((s: any) => {
                      const isLow = s.stock <= s.reorderLevel;
                      return (
                        <tr key={s.id} className="hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-ink">{s.productName}</div>
                            <div className="text-xs text-muted-foreground">SKU: {s.sku || s.barcode} · {s.category}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{s.branchName}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {s.stock} {s.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {s.reorderLevel} {s.unit}
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
              <Button onClick={() => setTransferModalOpen(true)}>
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
                  {transfers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No recent transfers.</td>
                    </tr>
                  )}
                  {transfers.map((t: any) => (
                    <tr key={t.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary font-mono text-xs" title={t.id}>{t.id.split('-')[0].toUpperCase()}</td>
                      <td className="px-4 py-3 text-ink">{t.sourceBranchName}</td>
                      <td className="px-4 py-3 text-ink">{t.destinationBranchName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="font-medium text-ink">{t.quantity} units</div>
                        <div className="text-xs">{t.productName}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                          <CheckCircle2 className="h-3 w-3" /> {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No batch data available.</td>
                    </tr>
                  )}
                  {batches.map((b: any) => {
                    const expiry = new Date(b.expiryDate);
                    const now = new Date();
                    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysLeft <= 14;
                    return (
                      <tr key={b.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.batchNumber}</td>
                        <td className="px-4 py-3 font-semibold text-ink">
                          {b.productName}
                          <div className="text-xs text-muted-foreground font-normal mt-0.5">{b.branchName}</div>
                        </td>
                        <td className="px-4 py-3">{b.stock}</td>
                        <td className="px-4 py-3 text-muted-foreground">{expiry.toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          {isUrgent ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                              <AlertTriangle className="h-3 w-3" /> {daysLeft} Days Left
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                              <CheckCircle2 className="h-3 w-3" /> {daysLeft} Days Left
                            </span>
                          )}
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
              {stockLevels.filter((s: any) => s.stock <= s.reorderLevel).length === 0 && (
                <div className="col-span-2 text-center text-muted-foreground p-8">No low stock alerts. Everything is healthy!</div>
              )}
              {stockLevels
                .filter((s: any) => s.stock <= s.reorderLevel)
                .map((alert: any) => (
                <div key={alert.id} className="panel p-5 border-l-4 border-l-accent flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase">Critical Stock</span>
                      <span className="text-xs text-muted-foreground">SKU: {alert.sku || alert.barcode}</span>
                    </div>
                    <h3 className="mt-2 font-bold text-ink">{alert.productName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Current Stock: <span className="font-bold text-ink">{alert.stock}</span> (Reorder at {alert.reorderLevel})
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Branch: {alert.branchName}</p>
                  </div>
                  <Button className="mt-4 w-full" variant="secondary" onClick={() => toast.info(`Drafting PO for ${alert.productName} will be available in Phase 5 (Purchasing)`)}>
                    <ShoppingCart className="mr-1.5 h-4 w-4" /> Raise PO Draft
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </main>
      </Tabs>

      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-ink">New Stock Transfer</h2>
              <button onClick={() => setTransferModalOpen(false)} className="text-muted-foreground hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-ink">Product / SKU</label>
                <select 
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({...transferForm, productId: e.target.value})}
                >
                  <option value="">Select a product...</option>
                  {Array.from(new Set(stockLevels.map((s: any) => s.productId))).map((id: any) => {
                    const s = stockLevels.find((st: any) => st.productId === id);
                    return <option key={id} value={id}>{s.productName} (SKU: {s.sku || s.barcode})</option>
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-ink">From Branch</label>
                  <select 
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={transferForm.sourceBranchId}
                    onChange={(e) => setTransferForm({...transferForm, sourceBranchId: e.target.value})}
                  >
                    <option value="">Select origin...</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-ink">To Branch</label>
                  <select 
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={transferForm.targetBranchId}
                    onChange={(e) => setTransferForm({...transferForm, targetBranchId: e.target.value})}
                  >
                    <option value="">Select destination...</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Quantity</label>
                <Input 
                  type="number" 
                  min="1" 
                  className="mt-1" 
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({...transferForm, quantity: parseInt(e.target.value) || 1})}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setTransferModalOpen(false)}>Cancel</Button>
                <Button 
                  disabled={isTransferring || !transferForm.productId || !transferForm.sourceBranchId || !transferForm.targetBranchId || transferForm.sourceBranchId === transferForm.targetBranchId}
                  onClick={async () => {
                    setIsTransferring(true);
                    try {
                      await stockTransferServerFn({ data: transferForm });
                      toast.success("Stock transferred successfully!");
                      setTransferModalOpen(false);
                      router.invalidate();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to transfer stock");
                    } finally {
                      setIsTransferring(false);
                    }
                  }}
                >
                  {isTransferring ? "Processing..." : "Transfer Stock"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DemoShell>
  );
}
