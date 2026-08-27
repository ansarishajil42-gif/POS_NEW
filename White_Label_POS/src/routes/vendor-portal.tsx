import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  CreditCard,
  Download,
  AlertCircle,
  Menu
} from "lucide-react";
import { aed } from "@/lib/demo-data";
import { getVendorPortalDataServerFn } from "@/lib/vendor-server";

export const Route = createFileRoute("/vendor-portal")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (role !== "Vendor") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  loader: async () => {
    const data = await getVendorPortalDataServerFn();
    if (!data.vendor) {
      throw redirect({ to: "/login" });
    }
    return data;
  },
  component: VendorPortal,
});

function VendorPortal() {
  const data = Route.useLoaderData();
  const { vendor, purchaseOrders, invoices } = data;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Calculate totals
  const totalOrdered = purchaseOrders.reduce((sum: number, po: any) => sum + Number(po.total), 0);
  const activeOrders = purchaseOrders.filter((po: any) => po.status !== 'Fulfilled' && po.status !== 'Invoiced').length;
  const newOrders = purchaseOrders.filter((po: any) => po.status === 'Draft' || po.status === 'Ordered').length;

  const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
  const totalPaid = invoices.filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
  const outstandingBalance = totalInvoiced - totalPaid;

  return (
    <DemoShell
      title="Vendor Portal"
      subtitle={`${vendor.name} · Supplier to ${data.tenant?.name || "Company"}`}
      actions={
        <Button className="rounded-xl font-semibold" onClick={() => toast.success("Statement downloaded")}>
          <Download className="mr-1.5 h-4 w-4" /> Download Statement
        </Button>
      }
    >
      <Tabs defaultValue="pos" onValueChange={() => setIsMobileMenuOpen(false)} className="mt-6 flex flex-col md:flex-row gap-8">
        <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
          <span className="font-semibold text-sm">Navigation Menu</span>
          <Button variant="outline" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <aside className={`w-full md:w-56 shrink-0 ${isMobileMenuOpen ? "block" : "hidden md:block"}`}>
          <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
            <TabsTrigger value="pos" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Purchase Orders</TabsTrigger>
            <TabsTrigger value="invoices" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Invoices & Payments</TabsTrigger>
          </TabsList>
        </aside>

        <main className="min-w-0 flex-1">
          <TabsContent value="pos" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="New Orders (Action Req.)" value={newOrders.toString()} icon={AlertCircle} tone="accent" />
              <StatCard label="Active Orders" value={activeOrders.toString()} icon={ShoppingCart} />
              <StatCard label="Total Ordered (YTD)" value={aed(totalOrdered)} icon={ShoppingCart} tone="success" />
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
                  {purchaseOrders.map((po: any) => (
                    <tr key={po.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{po.id.slice(0, 13)}...</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(po.createdAt).toISOString().split('T')[0]}</td>
                      <td className="px-4 py-3 text-ink">N/A</td>
                      <td className="px-4 py-3 text-right font-medium">{aed(Number(po.total))}</td>
                      <td className="px-4 py-3 text-right">
                        {po.status === 'Ordered' && <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning-foreground">{po.status}</span>}
                        {(po.status === 'Draft' || po.status === 'GRN') && <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{po.status}</span>}
                        {po.status === 'Invoiced' && <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{po.status}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Outstanding Balance" value={aed(outstandingBalance)} icon={CreditCard} tone="accent" />
              <StatCard label="Last Payment Received" value={aed(totalPaid)} icon={CreditCard} tone="success" />
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
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.purchaseOrderId ? inv.purchaseOrderId.slice(0, 13) + '...' : 'N/A'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(inv.createdAt).toISOString().split('T')[0]}</td>
                      <td className="px-4 py-3 text-right font-bold">{aed(Number(inv.total))}</td>
                      <td className="px-4 py-3 text-right">
                        {inv.status === 'pending' && <span className="inline-flex items-center rounded bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning-foreground">Processing</span>}
                        {inv.status === 'paid' && <span className="inline-flex items-center rounded bg-success/10 px-2 py-0.5 text-xs font-bold text-success">Paid</span>}
                        {inv.status === 'overdue' && <span className="inline-flex items-center rounded bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">Overdue</span>}
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
