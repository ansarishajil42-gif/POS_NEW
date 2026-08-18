import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionRole, roleRoutes } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  CreditCard,
  Download,
  AlertCircle
} from "lucide-react";
import { aed } from "@/lib/demo-data";

export const Route = createFileRoute("/vendor-portal")({
  beforeLoad: () => {
    const role = getSessionRole();
    if (!role) throw redirect({ to: "/login" });
    if (role !== "Vendor") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  component: VendorPortal,
});

function VendorPortal() {
  return (
    <DemoShell
      title="Vendor Portal"
      subtitle="Al Ain Farms · Supplier to Al Barsha Hypermarket Group"
      actions={
        <Button className="rounded-xl font-semibold" onClick={() => toast.success("Statement downloaded")}>
          <Download className="mr-1.5 h-4 w-4" /> Download Statement
        </Button>
      }
    >
      <Tabs defaultValue="pos" className="mt-6 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0">
          <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
            <TabsTrigger value="pos" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Purchase Orders</TabsTrigger>
            <TabsTrigger value="invoices" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Invoices & Payments</TabsTrigger>
          </TabsList>
        </aside>

        <main className="min-w-0 flex-1">
          <TabsContent value="pos" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="New Orders (Action Req.)" value="2" icon={AlertCircle} tone="accent" />
              <StatCard label="Active Orders" value="8" icon={ShoppingCart} />
              <StatCard label="Total Ordered (YTD)" value={aed(450200)} icon={ShoppingCart} tone="success" />
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-border p-4">
                <h3 className="font-bold text-ink">Recent Purchase Orders</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">PO Number</th>
                    <th className="px-4 py-3 font-medium">Date Received</th>
                    <th className="px-4 py-3 font-medium">Required Delivery</th>
                    <th className="px-4 py-3 font-medium text-right">Value</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { id: "PO-2024-1042", date: "Today", del: "Tomorrow, 08:00 AM", value: 12400, status: "Pending Confirmation" },
                    { id: "PO-2024-1038", date: "2 days ago", del: "Today", value: 8400, status: "Confirmed" },
                    { id: "PO-2024-1020", date: "10 Aug 2024", del: "11 Aug 2024", value: 15600, status: "Fulfilled" },
                  ].map((po) => (
                    <tr key={po.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{po.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{po.date}</td>
                      <td className="px-4 py-3 text-ink">{po.del}</td>
                      <td className="px-4 py-3 text-right font-medium">{aed(po.value)}</td>
                      <td className="px-4 py-3 text-right">
                        {po.status === 'Pending Confirmation' && <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning-foreground">{po.status}</span>}
                        {po.status === 'Confirmed' && <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{po.status}</span>}
                        {po.status === 'Fulfilled' && <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{po.status}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Outstanding Balance" value={aed(20800)} icon={CreditCard} tone="accent" />
              <StatCard label="Last Payment Received" value={aed(15600)} icon={CreditCard} tone="success" />
            </div>

            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-bold text-ink">Invoices Submitted</h3>
                <Button variant="outline" size="sm" onClick={() => toast.info("Opening upload modal...")}>Upload New Invoice</Button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Invoice No.</th>
                    <th className="px-4 py-3 font-medium">PO Reference</th>
                    <th className="px-4 py-3 font-medium">Submitted Date</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink">INV-ALM-002</td>
                    <td className="px-4 py-3 text-muted-foreground">PO-2024-1038</td>
                    <td className="px-4 py-3 text-muted-foreground">Today</td>
                    <td className="px-4 py-3 text-right font-bold">{aed(8400)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center rounded bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning-foreground">Processing</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink">INV-ALM-001</td>
                    <td className="px-4 py-3 text-muted-foreground">PO-2024-1020</td>
                    <td className="px-4 py-3 text-muted-foreground">11 Aug 2024</td>
                    <td className="px-4 py-3 text-right font-bold">{aed(15600)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center rounded bg-success/10 px-2 py-0.5 text-xs font-bold text-success">Paid</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
        </main>
      </Tabs>
    </DemoShell>
  );
}
