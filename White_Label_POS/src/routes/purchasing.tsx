import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { getSessionRole, roleRoutes } from "@/lib/auth";
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

export const Route = createFileRoute("/purchasing")({
  beforeLoad: () => {
    const role = getSessionRole();
    if (!role) throw redirect({ to: "/login" });
    if (role !== "Purchasing Officer") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  component: PurchasingOfficer,
});

function PurchasingOfficer() {
  const [pos, setPos] = useState([
    { id: "PO-2024-1042", vendor: "Al Ain Farms", date: "Today", value: 12400, status: "Sent" },
    { id: "PO-2024-1041", vendor: "Unilever Gulf", date: "Tomorrow", value: 45000, status: "Approved" },
    { id: "PO-2024-1040", vendor: "Nestlé Middle East", date: "24 Aug 2024", value: 18200, status: "Draft" },
  ]);
  const [poOpen, setPoOpen] = useState(false);
  const [poForm, setPoForm] = useState({ vendor: "", date: "" });
  const [poLines, setPoLines] = useState([{ product: "", qty: 1, price: 0 }]);
  
  const [grns, setGrns] = useState([
    { id: "GRN-8821", po: "PO-2024-1038", vendor: "Almarai UAE", variance: "-2 Cartons" },
    { id: "GRN-8820", po: "PO-2024-1035", vendor: "Oman National Food", variance: "Exact Match" },
  ]);
  const [grnOpen, setGrnOpen] = useState(false);
  const [grnForm, setGrnForm] = useState({ po: "", orderedQty: 100, receivedQty: 100 });

  const [invoices, setInvoices] = useState([
    { id: "INV-ALM-001", vendor: "Almarai UAE", date: "Tomorrow", amount: 8400, status: "Pending" },
    { id: "INV-UNI-442", vendor: "Unilever Gulf", date: "12 Sep 2024", amount: 12500, status: "Paid" },
  ]);

  const addPoLine = () => setPoLines([...poLines, { product: "", qty: 1, price: 0 }]);
  const totalPoValue = poLines.reduce((s, l) => s + l.qty * l.price, 0);

  const submitPo = () => {
    if (!poForm.vendor || !poForm.date) return toast.error("Please fill vendor and date");
    setPos([{ id: `PO-2024-${Math.floor(Math.random()*1000)+2000}`, vendor: poForm.vendor, date: poForm.date, value: totalPoValue, status: "Draft" }, ...pos]);
    setPoOpen(false);
    setPoForm({ vendor: "", date: "" });
    setPoLines([{ product: "", qty: 1, price: 0 }]);
    toast.success("Purchase Order Draft Created");
  };

  const submitGrn = () => {
    if (!grnForm.po) return toast.error("Select a PO");
    const diff = grnForm.receivedQty - grnForm.orderedQty;
    const variance = diff === 0 ? "Exact Match" : diff > 0 ? `+${diff} Units` : `${diff} Units`;
    setGrns([{ id: `GRN-${Math.floor(Math.random()*1000)+8000}`, po: grnForm.po, vendor: "Vendor", variance }, ...grns]);
    setGrnOpen(false);
    toast.success("Goods Received Note Recorded");
  };

  return (
    <DemoShell
      title="Purchasing Dashboard"
      subtitle="Al Barsha Hypermarket Group · Procurement"
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
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input placeholder="Vendor name..." value={poForm.vendor} onChange={e => setPoForm({...poForm, vendor: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Date</Label>
                  <Input placeholder="e.g. Tomorrow" value={poForm.date} onChange={e => setPoForm({...poForm, date: e.target.value})} />
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
                      <Input className="flex-1" placeholder="Product name" value={line.product} onChange={e => { const newL = [...poLines]; newL[idx].product = e.target.value; setPoLines(newL); }} />
                      <Input type="number" className="w-24" placeholder="Qty" value={line.qty || ""} onChange={e => { const newL = [...poLines]; newL[idx].qty = Number(e.target.value); setPoLines(newL); }} />
                      <Input type="number" className="w-28" placeholder="Price" value={line.price || ""} onChange={e => { const newL = [...poLines]; newL[idx].price = Number(e.target.value); setPoLines(newL); }} />
                      <div className="w-20 text-right font-medium text-sm">{aed(line.qty * line.price)}</div>
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
              <Button onClick={submitPo}>Submit PO</Button>
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
              <StatCard label="Open POs" value="24" icon={ShoppingCart} tone="accent" />
              <StatCard label="Pending Approval" value="6" icon={AlertCircle} />
              <StatCard label="Value Ordered (MTD)" value={aed(450200)} icon={FileText} tone="success" />
              <StatCard label="Vendors Active" value="82" icon={Briefcase} />
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
                  {pos.map((po) => (
                    <tr key={po.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{po.id}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{po.vendor}</td>
                      <td className="px-4 py-3 text-muted-foreground">{po.date}</td>
                      <td className="px-4 py-3 text-right font-medium">{aed(po.value)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          po.status === 'Draft' ? 'bg-surface-2 text-muted-foreground' : 
                          po.status === 'Sent' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
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
                      <Input placeholder="e.g. PO-2024-1042" value={grnForm.po} onChange={e => setGrnForm({...grnForm, po: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ordered Qty</Label>
                        <Input type="number" value={grnForm.orderedQty} onChange={e => setGrnForm({...grnForm, orderedQty: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Received Qty</Label>
                        <Input type="number" value={grnForm.receivedQty} onChange={e => setGrnForm({...grnForm, receivedQty: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setGrnOpen(false)}>Cancel</Button>
                    <Button onClick={submitGrn}>Record Receipt</Button>
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
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {grns.map((grn) => (
                    <tr key={grn.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{grn.id}</td>
                      <td className="px-4 py-3 text-primary">{grn.po}</td>
                      <td className="px-4 py-3 text-muted-foreground">{grn.vendor}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold text-xs ${grn.variance === 'Exact Match' ? 'text-success' : 'text-destructive'}`}>
                          {grn.variance}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm">Convert to Invoice</Button>
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
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{inv.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.vendor}</td>
                      <td className={`px-4 py-3 font-medium ${inv.status === 'Pending' ? 'text-warning-foreground' : 'text-muted-foreground'}`}>{inv.date}</td>
                      <td className="px-4 py-3 text-right font-bold">{aed(inv.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${
                          inv.status === 'Pending' ? 'bg-warning/10 text-warning-foreground' : 'bg-success/10 text-success'
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
                <p className="mt-2 text-3xl font-extrabold text-ink">{aed(142000)}</p>
              </div>
              <div className="panel p-6">
                <h3 className="text-sm font-semibold text-muted-foreground">Due within 7 Days</h3>
                <p className="mt-2 text-3xl font-extrabold text-warning-foreground">{aed(48500)}</p>
              </div>
              <div className="panel p-6">
                <h3 className="text-sm font-semibold text-muted-foreground">Overdue</h3>
                <p className="mt-2 text-3xl font-extrabold text-destructive">{aed(0)}</p>
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
                  {[...invoices]
                    .filter(i => i.status !== "Paid")
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-ink">{inv.id}</td>
                        <td className="px-4 py-3 text-muted-foreground">{inv.vendor}</td>
                        <td className="px-4 py-3 text-warning-foreground font-medium">{inv.date}</td>
                        <td className="px-4 py-3 text-right font-bold">{aed(inv.amount)}</td>
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
                    <th className="px-4 py-3 font-medium">Categories</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: "Al Ain Farms", contact: "Ahmed R.", cat: "Dairy, Fresh" },
                    { name: "Unilever Gulf", contact: "Sarah L.", cat: "FMCG, Personal Care" },
                    { name: "Nestlé Middle East", contact: "John M.", cat: "Food, Beverages" },
                  ].map((v, i) => (
                    <tr key={i} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink">{v.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.contact}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.cat}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">View <ArrowRight className="ml-1 h-3 w-3" /></Button>
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
