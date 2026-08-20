import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
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
  Ban,
  Tag,
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
  Cell,
} from "recharts";
import { getStoreManagerDataFn, requestPriceOverrideFn } from "@/lib/store-manager-server";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/store-manager")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (role !== "Branch Manager") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  loader: async () => {
    return await getStoreManagerDataFn();
  },
  component: StoreManager,
});

function StoreManager() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const permissions = (data as any).permissions || [];
  const isPermEnabled = (key: string) => {
    const record = permissions.find((p: any) => p.permission === key);
    return record ? record.enabled : true;
  };

  if ((data as any).error) {
    return (
      <div className="p-8">
        <h1 className="text-red-500 font-bold text-xl">Backend API Error</h1>
        <pre className="mt-4 p-4 bg-red-50 text-red-900 rounded whitespace-pre-wrap">
          {(data as any).error}
        </pre>
      </div>
    );
  }

  try {
    // Local derived state
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = data.orders.filter(
      (o: any) => new Date(o.createdAt).toISOString().split("T")[0] === today,
    );
    const salesToday =
      todayOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0;
    const transactions = todayOrders.length;
    const avgBasket = transactions > 0 ? (salesToday / transactions).toFixed(2) : "0.00";

    const itemCounts: Record<string, any> = {};
    todayOrders.forEach((o: any) => {
      (o.items || []).forEach((i: any) => {
        if (!itemCounts[i.productId])
          itemCounts[i.productId] = { name: i.product?.name || "Unknown", qty: 0, value: 0 };
        itemCounts[i.productId].qty += Number(i.qty) || 0;
        itemCounts[i.productId].value += (Number(i.unitPrice) || 0) * (Number(i.qty) || 0);
      });
    });
    const topItems = Object.values(itemCounts)
      .sort((a: any, b: any) => b.qty - a.qty)
      .slice(0, 4);
    const lowStock = data.stock.filter((s: any) => s.stock < 20).length;

    const activeTills = data.shifts.filter((s: any) => s.status === "Active").length;
    const totalTills = data.branch?.tillCount || 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayOrders = data.orders.filter(
      (o: any) => new Date(o.createdAt).toDateString() === yesterday.toDateString(),
    );
    const salesYesterday = yesterdayOrders.reduce(
      (sum: number, o: any) => sum + (Number(o.total) || 0),
      0,
    );
    const salesGrowth =
      salesYesterday > 0 ? (((salesToday - salesYesterday) / salesYesterday) * 100).toFixed(1) : 0;
    const growthText =
      salesYesterday > 0
        ? `${Number(salesGrowth) >= 0 ? "+" : ""}${salesGrowth}% vs yesterday`
        : undefined;

    // Generate dynamic 7-day trend
    const localTrend: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dayOrders = data.orders.filter(
        (o: any) => new Date(o.createdAt).toDateString() === date.toDateString(),
      );
      const daySales = dayOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
      localTrend.push({ d: dayName, Sales: daySales });
    }

    return (
      <DemoShell
        title="Store Dashboard"
        subtitle={`${data.branch?.name || "Branch"} · Manager View`}
        actions={
          <Button
            className="rounded-xl font-semibold"
            onClick={() => toast.success("Daily Z-report exported")}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export Z-Report
          </Button>
        }
      >
        <Tabs defaultValue="dashboard" className="mt-6 flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-56 shrink-0">
            <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
              <TabsTrigger
                value="dashboard"
                className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Dashboard
              </TabsTrigger>
              {isPermEnabled("local_stock") && (
                <TabsTrigger
                  value="stock"
                  className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Local Stock
                </TabsTrigger>
              )}
              {isPermEnabled("pricing_adjustments") && (
                <TabsTrigger
                  value="pricing"
                  className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Pricing Adjustments
                </TabsTrigger>
              )}
              {isPermEnabled("shift_staff") && (
                <TabsTrigger
                  value="staff"
                  className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Shift & Staff
                </TabsTrigger>
              )}
            </TabsList>
          </aside>

          <main className="min-w-0 flex-1">
            <TabsContent value="dashboard" className="mt-0 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Sales today"
                  value={aedShort(salesToday)}
                  delta={growthText}
                  icon={TrendingUp}
                  tone="success"
                />
                <StatCard
                  label="Transactions"
                  value={transactions.toLocaleString()}
                  delta={`Avg basket: ${avgBasket}`}
                  icon={Receipt}
                />
                <StatCard
                  label="Low stock items"
                  value={lowStock}
                  icon={AlertTriangle}
                  tone="accent"
                />
                <StatCard
                  label="Active tills"
                  value={`${activeTills} / ${totalTills}`}
                  icon={Monitor}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="panel p-6">
                  <h2 className="text-sm font-bold text-ink">
                    Branch Performance (Last 7 Days) · AED 000s
                  </h2>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={localTrend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                        />
                        <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                        <Tooltip cursor={{ fill: "var(--surface-2)" }} />
                        <Bar dataKey="Sales" fill="#39ff14" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel p-6">
                  <h2 className="text-sm font-bold text-ink">Top Selling Items Today</h2>
                  <div className="mt-4 space-y-4">
                    {topItems.length === 0 && (
                      <p className="text-sm text-muted-foreground">No sales yet today.</p>
                    )}
                    {topItems.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                      >
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
              {!isPermEnabled("local_stock") ? (
                <div className="panel p-8 text-center">
                  <h3 className="text-lg font-bold text-red-500">Access Denied</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You do not have permission to view local stock.
                  </p>
                </div>
              ) : (
                <div className="panel overflow-hidden p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative w-72">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Scan barcode or search SKU..."
                        className="pl-9 h-10 rounded-xl text-sm bg-surface-2 border-transparent focus:border-primary"
                      />
                    </div>
                    <Button variant="outline" className="h-10 rounded-xl">
                      Filter by Category
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3 mt-4 overflow-x-auto pb-2">
                    {data.stock.map((p: any, i: number) => {
                      const localQty = p.stock;
                      const isLow = localQty < 20;
                      return (
                        <div
                          key={p.id}
                          className="group flex min-w-[600px] items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationFillMode: "both", animationDelay: `${i * 50}ms` }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${isLow ? "bg-accent/10 text-accent group-hover:bg-accent/20" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}
                            >
                              <Package className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-ink transition-colors group-hover:text-primary">
                                {p.productName}
                              </h4>
                              <div className="mt-1 flex items-center gap-3 text-xs font-medium text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" /> {p.category}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-border"></span>
                                <span>SKU: {p.sku}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-8 text-right">
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                In Stock
                              </p>
                              <p
                                className={`text-lg font-extrabold ${isLow ? "text-accent" : "text-ink"}`}
                              >
                                {localQty}{" "}
                                <span className="text-sm font-semibold text-muted-foreground">
                                  {p.unit}
                                </span>
                              </p>
                            </div>
                            <div className="w-28 flex justify-end">
                              {isLow ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent shadow-sm ring-1 ring-inset ring-accent/20">
                                  <AlertTriangle className="h-3.5 w-3.5" /> Low
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-bold text-success shadow-sm ring-1 ring-inset ring-success/20">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="mt-0 space-y-5">
              {!isPermEnabled("pricing_adjustments") ? (
                <div className="panel p-8 text-center">
                  <h3 className="text-lg font-bold text-red-500">Access Denied</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You do not have permission to view pricing adjustments.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-ink">Local Pricing Adjustments</h3>
                      <p className="text-sm text-muted-foreground">
                        Request branch-specific price overrides for clearance or local competition.
                      </p>
                    </div>
                    {isPermEnabled("branch_override") ? (
                      <Button
                        onClick={() => toast.success("Price override request flow triggered")}
                      >
                        Request Override
                      </Button>
                    ) : (
                      <Button disabled className="opacity-50 cursor-not-allowed">
                        Override Disabled
                      </Button>
                    )}
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
                        {data.stock.filter((s: any) => s.priceOverride).length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                              No active price overrides.
                            </td>
                          </tr>
                        )}
                        {data.stock
                          .filter((s: any) => s.priceOverride)
                          .map((s: any) => (
                            <tr key={s.id} className="hover:bg-surface-2/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-ink">{s.productName}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {aed(Number(s.basePrice))}
                              </td>
                              <td className="px-4 py-3 font-bold text-ink">
                                {aed(Number(s.priceOverride))}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="staff" className="mt-0">
              {!isPermEnabled("shift_staff") ? (
                <div className="panel p-8 text-center">
                  <h3 className="text-lg font-bold text-red-500">Access Denied</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You do not have permission to view shift and staff roster.
                  </p>
                </div>
              ) : (
                <div className="panel overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <h3 className="font-bold text-ink">Today's Shifts</h3>
                    <Button variant="outline" size="sm">
                      Manage Roster
                    </Button>
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
                      {data.shifts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                            No shifts found for today.
                          </td>
                        </tr>
                      )}
                      {data.shifts.map((shift: any) => {
                        const staffName = shift.cashier?.email?.split("@")[0] || "Unknown";
                        const isCompleted = !!shift.closedAt;
                        return (
                          <tr key={shift.id} className="hover:bg-surface-2/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-ink flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center text-xs font-bold text-primary uppercase">
                                {staffName.slice(0, 2)}
                              </div>
                              {staffName}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {shift.tillId || "-"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(shift.openedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {isCompleted
                                ? new Date(shift.closedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Ongoing"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!isCompleted && shift.status === "Active" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                                </span>
                              )}
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-border/50 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                                  Completed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </main>
        </Tabs>
      </DemoShell>
    );
  } catch (e: any) {
    return (
      <div className="p-8">
        <h1 className="text-red-500 font-bold text-xl">Store Manager Render Crash</h1>
        <pre className="mt-4 p-4 bg-red-50 text-red-900 rounded">{e.stack}</pre>
      </div>
    );
  }
}
