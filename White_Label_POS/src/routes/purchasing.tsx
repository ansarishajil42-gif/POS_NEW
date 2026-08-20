import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  FileText,
  CreditCard,
  Briefcase,
  Search,
  Plus,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { aed } from "@/lib/demo-data";
import { getPurchasingDataServerFn, createPurchaseOrderServerFn, recordGRNServerFn } from "@/lib/purchasing-server";

export const Route = createFileRoute("/purchasing")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (role !== "Purchasing Officer") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  loader: async () => {
    return await getPurchasingDataServerFn();
  },
  component: PurchasingOfficer,
});

function PurchasingOfficer() {
  const data = Route.useLoaderData();
  const router = useRouter();

  if ((data as any).error) {
    return (
      <div className="p-8">
        <h1 className="text-red-500 font-bold text-xl">Backend API Error</h1>
        <pre className="mt-4 p-4 bg-red-50 text-red-900 rounded whitespace-pre-wrap">{(data as any).error}</pre>
      </div>
    );
  }

  const { vendors, products, branches, purchaseOrders: pos, grns, invoices } = data;

  // Derived AP State
  const today = new Date();
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  let totalAP = 0;
  let due7Days = 0;
  let overdue = 0;

  invoices.forEach((inv: any) => {
    if (inv.status !== "Paid") {
      const amount = Number(inv.total) || 0;
      totalAP += amount;
      const dueDate = new Date(inv.dueDate);
      if (dueDate < today) {
        overdue += amount;
      } else if (dueDate <= next7Days) {
        due7Days += amount;
      }
    }
  });

  const [poOpen, setPoOpen] = useState(false);
  const [poForm, setPoForm] = useState({ vendorId: "", branchId: "" });
  const [poLines, setPoLines] = useState([{ productId: "", qty: 1, unitPrice: 0 }]);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);
  
  const [grnOpen, setGrnOpen] = useState(false);
  const [grnForm, setGrnForm] = useState({ poId: "", grnNumber: "", receivedQty: 0 });
  const [isSubmittingGRN, setIsSubmittingGRN] = useState(false);

  const addPoLine = () => setPoLines([...poLines, { productId: "", qty: 1, unitPrice: 0 }]);
  const totalPoValue = poLines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const submitPo = async () => {
    if (!poForm.vendorId || !poForm.branchId) {
      toast.error("Please select a vendor and a branch");
      return;
    }
    const validLines = poLines.filter(l => l.productId && l.qty > 0 && l.unitPrice >= 0);
    if (validLines.length === 0) {
      toast.error("Please add at least one valid product line");
      return;
    }

    setIsSubmittingPO(true);
    try {
      await createPurchaseOrderServerFn({ data: {
        vendorId: poForm.vendorId,
        branchId: poForm.branchId,
        items: validLines
      }});
      toast.success("Purchase Order Draft Created");
      setPoOpen(false);
      setPoForm({ vendorId: "", branchId: "" });
      setPoLines([{ productId: "", qty: 1, unitPrice: 0 }]);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to create PO");
    } finally {
      setIsSubmittingPO(false);
    }
  };

  const submitGrn = async () => {
    if (!grnForm.poId || !grnForm.grnNumber) {
      toast.error("Please provide PO reference and GRN number");
      return;
    }
    const targetPo = pos.find((p: any) => p.id === grnForm.poId);
    if (!targetPo) {
      toast.error("PO not found");
      return;
    }

    setIsSubmittingGRN(true);
    try {
      await recordGRNServerFn({ data: {
        purchaseOrderId: targetPo.id,
        vendorId: targetPo.vendorId,
        branchId: targetPo.branchId,
        grnNumber: grnForm.grnNumber,
        items: targetPo.items.map((i: any) => ({
          productId: i.productId,
          orderedQty: i.qty,
          receivedQty: grnForm.receivedQty // Note: simplistic bulk receive for demo
        }))
      }});
      toast.success("Goods Received Note Recorded");
      setGrnOpen(false);
      setGrnForm({ poId: "", grnNumber: "", receivedQty: 0 });
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to record GRN");
    } finally {
      setIsSubmittingGRN(false);
    }
  };

  return (
    <DemoShell
      title="Purchasing Dashboard"
      subtitle={`${data.tenant?.name || "Company"} · Procurement`}
      actions={
        <Dialog open={poOpen} onOpenChange={setPoOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-semibold">
              <Plus className="mr-1.5 h-4 w-4" /> Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>Draft a new PO and add line items.</DialogDescription>
            </DialogHeader>            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={poForm.vendorId} 
                    onChange={e => setPoForm({...poForm, vendorId: e.target.value})}
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.filter((v: any) => v.status === "Active").map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Branch</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={poForm.branchId} 
                    onChange={e => setPoForm({...poForm, branchId: e.target.value})}
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addPoLine}>Add Item</Button>
                </div>
                <div className="space-y-3">
                  {poLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <select 
                        className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={line.productId} 
                        onChange={e => { const newL = [...poLines]; if (newL[idx]) { newL[idx]!.productId = e.target.value; setPoLines(newL); } }}
                      >
                        <option value="">Select Product...</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <Input type="number" className="w-24" placeholder="Qty" value={line.qty || ""} onChange={e => { const newL = [...poLines]; if (newL[idx]) { newL[idx]!.qty = Number(e.target.value); setPoLines(newL); } }} />
                      <Input type="number" className="w-28" placeholder="Price" value={line.unitPrice || ""} onChange={e => { const newL = [...poLines]; if (newL[idx]) { newL[idx]!.unitPrice = Number(e.target.value); setPoLines(newL); } }} />
                      <div className="w-20 text-right font-medium text-sm">{aed(line.qty * line.unitPrice)}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4 text-lg font-bold text-ink">
                  Total: {aed(totalPoValue)}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPoOpen(false)}>Cancel</Button>
              <Button disabled={isSubmittingPO} onClick={submitPo}>{isSubmittingPO ? "Submitting..." : "Submit PO"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <Tabs defaultValue="po" className="mt-6 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0">
          <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
            <TabsTrigger value="po" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Purchase Orders</TabsTrigger>
            <TabsTrigger value="grn" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Goods Received (GRN)</TabsTrigger>
            <TabsTrigger value="invoices" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Vendor Invoices</TabsTrigger>
            <TabsTrigger value="ap" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Accounts Payable</TabsTrigger>
            <TabsTrigger value="vendors" className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">Vendors</TabsTrigger>
          </TabsList>
        </aside>

        <main className="min-w-0 flex-1">
          <TabsContent value="po" className="mt-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Open POs" value={pos.length.toString()} icon={ShoppingCart} tone="accent" />
              <StatCard label="Pending Approval" value={pos.filter((p: any) => p.status === 'Draft').length.toString()} icon={AlertCircle} />
              <StatCard label="Value Ordered (MTD)" value={aed(pos.reduce((acc: number, p: any) => acc + Number(p.total), 0))} icon={FileText} tone="success" />
              <StatCard label="Vendors Active" value={vendors.length.toString()} icon={Briefcase} />
            </div>

            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="relative w-72">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search PO number or Vendor..." className="pl-9 h-9 text-sm" />
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">PO Number</th>
                    <th className="px-4 py-3 font-medium">Vendor</th>
                    <th className="px-4 py-3 font-medium">Delivery Date</th>
                    <th className="px-4 py-3 font-medium text-right">Value</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">No Purchase Orders found.</td>
                    </tr>
                  )}
                  {pos.map((po: any) => (
                    <tr key={po.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary font-mono text-xs" title={po.id}>{po.id.split('-')[0].toUpperCase()}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{po.vendor?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(po.createdAt).toISOString().split('T')[0]}</td>
                      <td className="px-4 py-3 text-right font-medium">{aed(Number(po.total))}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          po.status === 'Draft' ? 'bg-surface-2 text-muted-foreground' : 
                          po.status === 'Ordered' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="grn" className="mt-0 space-y-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-ink">Goods Received Notes (GRN)</h3>
                <p className="text-sm text-muted-foreground mt-1">Record physical receipts against open Purchase Orders.</p>
              </div>
              <Dialog open={grnOpen} onOpenChange={setGrnOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-1.5 h-4 w-4" /> Record GRN</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Goods Received</DialogTitle>
                    <DialogDescription>Select an open PO and record actual received quantities.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>PO Reference</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={grnForm.poId} 
                        onChange={e => setGrnForm({...grnForm, poId: e.target.value})}
                      >
                        <option value="">Select PO...</option>
                        {pos.filter((p: any) => p.status === "Ordered").map((p: any) => <option key={p.id} value={p.id}>{p.id.split('-')[0].toUpperCase()} - {p.vendor?.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier GRN Number</Label>
                      <Input placeholder="e.g. GRN-9912" value={grnForm.grnNumber} onChange={e => setGrnForm({...grnForm, grnNumber: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bulk Received Quantity</Label>
                      <Input type="number" placeholder="Enter bulk qty received for demo..." value={grnForm.receivedQty} onChange={e => setGrnForm({...grnForm, receivedQty: Number(e.target.value)})} />
                      <p className="text-xs text-muted-foreground">In a real scenario, this would be an item-by-item breakdown.</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setGrnOpen(false)}>Cancel</Button>
                    <Button disabled={isSubmittingGRN} onClick={submitGrn}>{isSubmittingGRN ? "Recording..." : "Record Receipt"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="panel overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">GRN Number</th>
                    <th className="px-4 py-3 font-medium">PO Reference</th>
                    <th className="px-4 py-3 font-medium">Vendor</th>
                    <th className="px-4 py-3 font-medium text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {grns.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">No GRNs recorded.</td>
                    </tr>
                  )}
                  {grns.map((g: any) => (
                    <tr key={g.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{g.grnNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs">{g.purchaseOrderId?.split('-')[0].toUpperCase()}</td>
                      <td className="px-4 py-3 text-ink">{g.vendor?.name}</td>
                      <td className="px-4 py-3 text-right">
                        {g.items?.reduce((acc: number, item: any) => acc + item.variance, 0) === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
                            Exact Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning-foreground">
                            Variance Detected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-0">
            <div className="panel overflow-hidden">
              <div className="border-b border-border p-4">
                <h3 className="font-bold text-ink">Vendor Invoices</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Invoice No.</th>
                    <th className="px-4 py-3 font-medium">Vendor</th>
                    <th className="px-4 py-3 font-medium">Due Date</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">No invoices found.</td>
                    </tr>
                  )}
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-ink">{inv.vendor?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(inv.dueDate).toISOString().split('T')[0]}</td>
                      <td className="px-4 py-3 text-right font-medium">{aed(Number(inv.total))}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          inv.status === 'Paid' ? 'bg-success/10 text-success' : 
                          inv.status === 'Pending' ? 'bg-warning/10 text-warning-foreground' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="ap" className="mt-0">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="panel p-6">
                <h3 className="text-sm font-semibold text-muted-foreground">Total AP Balance</h3>
                <p className="mt-2 text-3xl font-extrabold text-ink">{aed(totalAP)}</p>
              </div>
              <div className="panel p-6">
                <h3 className="text-sm font-semibold text-muted-foreground">Due within 7 Days</h3>
                <p className="mt-2 text-3xl font-extrabold text-warning-foreground">{aed(due7Days)}</p>
              </div>
              <div className="panel p-6">
                <h3 className="text-sm font-semibold text-muted-foreground">Overdue</h3>
                <p className="mt-2 text-3xl font-extrabold text-destructive">{aed(overdue)}</p>
              </div>
            </div>

            <div className="panel overflow-hidden mt-6">
              <div className="border-b border-border p-4">
                <h3 className="font-bold text-ink">Outstanding Vendor Invoices</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Invoice No.</th>
                    <th className="px-4 py-3 font-medium">Vendor</th>
                    <th className="px-4 py-3 font-medium">Due Date</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.filter((i: any) => i.status !== "Paid").length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No outstanding invoices.</td></tr>
                  )}
                  {invoices
                    .filter((i: any) => i.status !== "Paid")
                    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-primary font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-ink">{inv.vendor?.name}</td>
                        <td className="px-4 py-3 text-warning-foreground font-medium">{new Date(inv.dueDate).toISOString().split('T')[0]}</td>
                        <td className="px-4 py-3 text-right font-bold">{aed(Number(inv.total))}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center rounded bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning-foreground">{inv.status}</span>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="mt-0">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-bold text-ink">Vendor Directory</h3>
                <Button variant="outline" size="sm">Add Vendor</Button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vendor Name</th>
                    <th className="px-4 py-3 font-medium">Contact Person</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vendors.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No vendors found.</td></tr>
                  )}
                  {vendors.map((v: any) => (
                    <tr key={v.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink">{v.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.contact || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.email || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.status === "Active" ? "bg-success/10 text-success border border-success/20" : "bg-muted/10 text-muted-foreground border border-border"}`}>{v.status || "Active"}</span>
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
