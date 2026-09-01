import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShoppingCart,
  CreditCard,
  Download,
  AlertCircle,
  Menu,
  CheckCircle2,
  Clock,
  PackageCheck,
  FileText,
  Truck,
  Building,
  Info,
} from "lucide-react";
import { aed } from "@/lib/demo-data";
import { getVendorPortalDataServerFn, confirmVendorDeliveryServerFn } from "@/lib/vendor-server";

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
  const router = useRouter();
  const { vendor, purchaseOrders, grns, invoices } = data;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selected PO for view modal
  const [selectedPo, setSelectedPo] = useState<any | null>(null);

  // Selected GRN for delivery confirmation modal
  const [selectedGrn, setSelectedGrn] = useState<any | null>(null);
  const [vendorNotes, setVendorNotes] = useState("");
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Calculate totals memoized for performance
  const { totalOrdered, activeOrders, pendingVendorGrns, totalInvoiced, totalPaid, outstandingBalance } = useMemo(() => {
    const totOrd = (purchaseOrders || []).reduce((sum: number, po: any) => sum + Number(po.total || 0), 0);
    const actOrd = (purchaseOrders || []).filter((po: any) => po.status !== "Fulfilled" && po.status !== "Invoiced").length;
    const pendGrns = (grns || []).filter((g: any) => !g.vendorConfirmed).length;

    const totInv = (invoices || []).reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
    const totPd = (invoices || [])
      .filter((inv: any) => inv.status === "paid")
      .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
    const outBal = Math.max(0, totInv - totPd);

    return {
      totalOrdered: totOrd,
      activeOrders: actOrd,
      pendingVendorGrns: pendGrns,
      totalInvoiced: totInv,
      totalPaid: totPd,
      outstandingBalance: outBal,
    };
  }, [purchaseOrders, grns, invoices]);

  async function handleConfirmDelivery() {
    if (!selectedGrn) return;
    setIsSubmittingConfirm(true);
    try {
      const res = await confirmVendorDeliveryServerFn({
        data: {
          grnId: selectedGrn.id,
          vendorNotes,
        },
      });
      if (res.success) {
        toast.success("Delivery Confirmation Recorded", {
          description: `Vendor dispatch timestamp logged cleanly. Store verification remains separate.`,
        });
        setSelectedGrn(null);
        setVendorNotes("");
        router.invalidate();
      }
    } catch (err: any) {
      toast.error("Failed to record delivery confirmation: " + err.message);
    } finally {
      setIsSubmittingConfirm(false);
    }
  }

  return (
    <DemoShell
      title="Vendor Portal"
      subtitle={`${vendor.name} · Supplier TRN: ${vendor.trn || "N/A"}`}
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
            <TabsTrigger
              value="pos"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Purchase Orders ({purchaseOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="grn"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Delivery & GRN ({grns?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Invoices & Payments ({invoices.length})
            </TabsTrigger>
          </TabsList>
        </aside>

        <main className="min-w-0 flex-1">
          {/* --- TAB 1: PURCHASE ORDERS (READ ONLY) --- */}
          <TabsContent value="pos" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Active Orders" value={activeOrders.toString()} icon={ShoppingCart} />
              <StatCard label="Pending Confirmations" value={pendingVendorGrns.toString()} icon={AlertCircle} tone="accent" />
              <StatCard label="Total Ordered (YTD)" value={aed(totalOrdered)} icon={ShoppingCart} tone="success" />
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-border p-4">
                <h3 className="font-bold text-ink">Issued Purchase Orders (Read-Only)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Purchase Orders created by supermarket purchasing officers. Click any order to view item breakdowns.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">PO Number</th>
                      <th className="px-4 py-3 font-medium">Branch</th>
                      <th className="px-4 py-3 font-medium">Date Issued</th>
                      <th className="px-4 py-3 font-medium text-center">Items</th>
                      <th className="px-4 py-3 font-medium text-right">Value</th>
                      <th className="px-4 py-3 font-medium text-right">Status</th>
                      <th className="px-4 py-3 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {purchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted-foreground text-xs">
                          No purchase orders issued to your account yet.
                        </td>
                      </tr>
                    ) : (
                      purchaseOrders.map((po: any) => (
                        <tr key={po.id} className="hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-primary">{po.id.slice(0, 13)}...</td>
                          <td className="px-4 py-3 text-ink font-semibold">
                            <span className="flex items-center gap-1 text-xs">
                              <Building className="h-3 w-3 text-muted-foreground" /> {po.branch?.name || "Main Branch"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(po.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center text-ink font-medium">{po.items?.length || 0}</td>
                          <td className="px-4 py-3 text-right font-bold text-ink">{aed(Number(po.total || 0))}</td>
                          <td className="px-4 py-3 text-right">
                            {po.status === "Ordered" && (
                              <Badge variant="outline" className="bg-warning/10 text-warning-foreground font-bold border-warning/30">
                                {po.status}
                              </Badge>
                            )}
                            {(po.status === "Draft" || po.status === "GRN") && (
                              <Badge variant="outline" className="bg-primary/10 text-primary font-bold border-primary/30">
                                {po.status}
                              </Badge>
                            )}
                            {po.status === "Invoiced" && (
                              <Badge variant="outline" className="bg-surface-2 text-muted-foreground font-bold">
                                {po.status}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs rounded-lg font-semibold"
                              onClick={() => setSelectedPo(po)}
                            >
                              View Items
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* --- TAB 2: DELIVERY & GRN (VIEW + VENDOR CONFIRMATION) --- */}
          <TabsContent value="grn" className="mt-0 space-y-5">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Dual Confirmation System</p>
                  <p className="mt-0.5 text-blue-800/90 dark:text-blue-300">
                    Vendor confirmation records your delivery dispatch timestamp. Store verification is recorded separately by supermarket staff upon receiving goods. Vendor confirmation does not finalize inventory levels alone.
                  </p>
                </div>
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-border p-4">
                <h3 className="font-bold text-ink">Goods Received Notes & Delivery Tracking</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">GRN Number</th>
                      <th className="px-4 py-3 font-medium">PO Reference</th>
                      <th className="px-4 py-3 font-medium">Branch</th>
                      <th className="px-4 py-3 font-medium">Received Date</th>
                      <th className="px-4 py-3 font-medium text-center">Vendor Confirmation</th>
                      <th className="px-4 py-3 font-medium text-center">Store Verification</th>
                      <th className="px-4 py-3 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(!grns || grns.length === 0) ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted-foreground text-xs">
                          No delivery records or GRNs found for your account.
                        </td>
                      </tr>
                    ) : (
                      grns.map((g: any) => (
                        <tr key={g.id} className="hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-ink">{g.grnNumber || "GRN-PENDING"}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {g.purchaseOrder ? g.purchaseOrder.id.slice(0, 12) + "..." : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-ink text-xs font-semibold">{g.branch?.name || "Main Branch"}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(g.receivedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {g.vendorConfirmed ? (
                              <Badge variant="outline" className="border-success/30 bg-success/10 text-success font-semibold text-[11px]">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Vendor Confirmed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 font-semibold text-[11px]">
                                <Clock className="mr-1 h-3 w-3" /> Pending Vendor
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {g.status === "received" ? (
                              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-semibold text-[11px]">
                                <PackageCheck className="mr-1 h-3 w-3" /> Store Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-border bg-surface-2 text-muted-foreground font-semibold text-[11px]">
                                Store Pending
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {!g.vendorConfirmed ? (
                              <Button
                                size="sm"
                                className="h-7 text-xs rounded-lg font-semibold bg-primary hover:bg-primary/90"
                                onClick={() => {
                                  setSelectedGrn(g);
                                  setVendorNotes("");
                                }}
                              >
                                <Truck className="mr-1 h-3 w-3" /> Confirm Delivery
                              </Button>
                            ) : (
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {new Date(g.vendorConfirmedAt).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* --- TAB 3: INVOICES & PAYMENTS (READ ONLY) --- */}
          <TabsContent value="invoices" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Outstanding Balance" value={aed(outstandingBalance)} icon={CreditCard} tone="accent" />
              <StatCard label="Last Payment Received" value={aed(totalPaid)} icon={CreditCard} tone="success" />
            </div>

            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h3 className="font-bold text-ink">Submitted Invoices & Payment Status</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Payment statuses are updated by the supermarket Accounts Payable department.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Invoice No.</th>
                      <th className="px-4 py-3 font-medium">PO Reference</th>
                      <th className="px-4 py-3 font-medium">Submitted Date</th>
                      <th className="px-4 py-3 font-medium">Due Date</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-right">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">
                          No invoices on record.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-ink font-mono">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                            {inv.purchaseOrder ? inv.purchaseOrder.id.slice(0, 12) + "..." : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-ink text-xs font-semibold">
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-ink">{aed(Number(inv.total || 0))}</td>
                          <td className="px-4 py-3 text-right">
                            {inv.status === "pending" && (
                              <Badge variant="outline" className="bg-warning/10 text-warning-foreground font-bold border-warning/30">
                                Pending Approval
                              </Badge>
                            )}
                            {inv.status === "paid" && (
                              <Badge variant="outline" className="bg-success/10 text-success font-bold border-success/30">
                                Paid
                              </Badge>
                            )}
                            {inv.status === "overdue" && (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive font-bold border-destructive/30">
                                Overdue
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </main>
      </Tabs>

      {/* --- PO ITEMS VIEW MODAL --- */}
      <Dialog open={!!selectedPo} onOpenChange={() => setSelectedPo(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink">
              <FileText className="h-5 w-5 text-primary" /> Purchase Order Details
            </DialogTitle>
            <DialogDescription>
              PO #{selectedPo?.id.slice(0, 13)}... · Branch: {selectedPo?.branch?.name || "Main Branch"}
            </DialogDescription>
          </DialogHeader>

          {selectedPo && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span className="font-semibold text-ink">{new Date(selectedPo.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold text-primary capitalize">{selectedPo.status}</span>
                </div>
              </div>

              <div className="max-h-[250px] overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2 font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(!selectedPo.items || selectedPo.items.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          No items listed for this order.
                        </td>
                      </tr>
                    ) : (
                      selectedPo.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-semibold text-ink">{item.product?.name || "Product Item"}</td>
                          <td className="p-2.5 text-center font-medium">{item.qty}</td>
                          <td className="p-2.5 text-right font-mono">{aed(Number(item.unitPrice || 0))}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{aed(Number(item.unitPrice || 0) * item.qty)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-bold text-ink text-sm">Total PO Value:</span>
                <span className="font-bold text-primary text-base">{aed(Number(selectedPo.total || 0))}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPo(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- VENDOR CONFIRM DELIVERY MODAL --- */}
      <Dialog open={!!selectedGrn} onOpenChange={() => setSelectedGrn(null)}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink">
              <Truck className="h-5 w-5 text-primary" /> Confirm Delivery Dispatch
            </DialogTitle>
            <DialogDescription>
              Record your vendor confirmation for GRN #{selectedGrn?.grnNumber || "GRN-PENDING"}.
            </DialogDescription>
          </DialogHeader>

          {selectedGrn && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl bg-surface-2 p-3 space-y-1.5 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Branch Destination:</span>
                  <span className="font-bold text-ink">{selectedGrn.branch?.name || "Main Branch"}</span>
                </div>
                <div className="flex justify-between">
                  <span>PO Reference:</span>
                  <span className="font-mono text-ink">{selectedGrn.purchaseOrder?.id.slice(0, 12)}...</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendorNotes" className="text-xs font-semibold">
                  Delivery Notes / Tracking Ref (Optional)
                </Label>
                <Input
                  id="vendorNotes"
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  placeholder="e.g. Dispatched via Truck #AE-4091, 50 cartons delivered."
                />
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200">
                <p className="font-semibold text-[11px]">
                  Note: Supermarket staff will perform an independent verification count upon physical receiving.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGrn(null)}>
              Cancel
            </Button>
            <Button disabled={isSubmittingConfirm} onClick={handleConfirmDelivery}>
              {isSubmittingConfirm ? "Recording..." : "Confirm Delivery Dispatch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DemoShell>
  );
}
