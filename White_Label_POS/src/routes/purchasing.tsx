import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import React, { useState, Fragment } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  AlertCircle,
  X,
  CalendarIcon,
  Menu
} from "lucide-react";
import { aed } from "@/lib/demo-data";
import { 
  getPurchasingDataServerFn, 
  createPurchaseOrderServerFn, 
  updatePurchaseOrderServerFn,
  deletePurchaseOrderServerFn,
  recordGRNServerFn, 
  getPODetailsServerFn,
  createVendorInvoiceServerFn,
  recordVendorPaymentServerFn,
  createVendorServerFn,
  updateVendorServerFn,
  deleteVendorServerFn,
  submitPurchaseOrderServerFn
} from "@/lib/purchasing-server";

export const Route = createFileRoute("/purchasing")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (role !== "Purchasing Officer" && role !== "Head Office Admin") {
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

  const [searchPo, setSearchPo] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [selectedPoDetails, setSelectedPoDetails] = useState<any>(null);

  const handleRowClick = async (poId: string) => {
    setSelectedPoId(poId);
    try {
      const details = await getPODetailsServerFn({ data: { poId } });
      setSelectedPoDetails(details);
    } catch (e) {
      toast.error("Unauthorized or missing PO");
      setSelectedPoId(null);
    }
  };

  if ((data as any).error) {
    return (
      <div className="p-8">
        <h1 className="text-red-500 font-bold text-xl">Backend API Error</h1>
        <pre className="mt-4 p-4 bg-red-50 text-red-900 rounded whitespace-pre-wrap">{(data as any).error}</pre>
      </div>
    );
  }

  const { vendors, products, branches, purchaseOrders: pos, grns, invoices, userRole } = data as any;

  const filteredPos = pos.filter((po: any) => {
    if (!searchPo) return true;
    const query = searchPo.toLowerCase();
    const poNumber = (po.id || "").toLowerCase();
    const vendorName = (po.vendor?.name || "").toLowerCase();
    return poNumber.includes(query) || vendorName.includes(query);
  });

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
      const paid = Number(inv.paidAmount) || 0;
      const remaining = amount - paid;
      totalAP += remaining;
      const dueDate = new Date(inv.dueDate);
      if (dueDate < today) {
        overdue += remaining;
      } else if (dueDate <= next7Days) {
        due7Days += remaining;
      }
    }
  });

  const [poOpen, setPoOpen] = useState(false);
  const [poForm, setPoForm] = useState<{ id?: string, vendorId: string, branchId: string, vatRate: number }>({ vendorId: "", branchId: "", vatRate: 5 });
  const [poLines, setPoLines] = useState([{ productId: "", qty: 1, unitPrice: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletePoId, setDeletePoId] = useState<string | null>(null);
  
  const [grnOpen, setGrnOpen] = useState(false);
  const [grnForm, setGrnForm] = useState<{ poId: string, grnNumber: string, items: any[] }>({ poId: "", grnNumber: "", items: [] });
  const [isSubmittingGRN, setIsSubmittingGRN] = useState(false);

  // Invoice Form State
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ poId: "", invoiceNumber: "", dueDate: "", vatRate: 5 });
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // Payment Form State
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ invoiceId: "", amount: 0, method: "Bank Transfer", referenceNo: "", notes: "", paymentDate: new Date().toISOString().split('T')[0] });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [targetInvoiceForPayment, setTargetInvoiceForPayment] = useState<any>(null);

  // Vendor Form State
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState<{ id?: string, name: string, contact: string, phone: string, email: string, trn: string, address: string, status: string }>({ name: "", contact: "", phone: "", email: "", trn: "", address: "", status: "Active" });
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(Number(val) || 0);
  };

  const addPoLine = () => setPoLines([...poLines, { productId: "", qty: 1, unitPrice: 0 }]);
  const totalPoValue = poLines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const vatAmount = totalPoValue * (poForm.vatRate / 100);
  const grandTotal = totalPoValue + vatAmount;

  const handleCreatePO = async () => {
    if (!poForm.vendorId || !poForm.branchId) {
      toast.error("Please select a vendor and a branch");
      return;
    }
    const validLines = poLines.filter(l => l.productId && l.qty > 0 && l.unitPrice >= 0);
    if (validLines.length === 0) {
      toast.error("Please add at least one valid product line");
      return;
    }

    setIsSubmitting(true);
    try {
      if (poForm.id) {
        await updatePurchaseOrderServerFn({ data: {
          id: poForm.id,
          vendorId: poForm.vendorId,
          branchId: poForm.branchId,
          vatRate: poForm.vatRate,
          items: validLines
        }});
        toast.success("Purchase Order Updated");
        // Update details view if open
        if (selectedPoId === poForm.id) {
          const details = await getPODetailsServerFn({ data: { poId: poForm.id } });
          setSelectedPoDetails(details);
        }
      } else {
        await createPurchaseOrderServerFn({ data: {
          vendorId: poForm.vendorId,
          branchId: poForm.branchId,
          vatRate: poForm.vatRate,
          items: validLines
        }});
        toast.success("Purchase Order Draft Created");
      }
      
      setPoOpen(false);
      setPoForm({ vendorId: "", branchId: "", vatRate: 5 });
      setPoLines([{ productId: "", qty: 1, unitPrice: 0 }]);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save PO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPO = async (id: string) => {
    try {
      await submitPurchaseOrderServerFn({ data: { id } });
      toast.success("Purchase Order Submitted");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit PO");
    }
  };

  const handleCancelPO = async () => {
    if (!deletePoId) return;
    const id = deletePoId;
    try {
      await deletePurchaseOrderServerFn({ data: { id } });
      toast.success("Purchase Order Deleted");
      if (selectedPoId === id) {
        setSelectedPoId(null);
        setSelectedPoDetails(null);
      }
      setDeletePoId(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete PO");
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

    // Validate quantities and batch info
    for (const item of grnForm.items) {
      if (item.receivedQty < 0) {
        toast.error(`Invalid quantity for ${item.productName}`);
        return;
      }
      if (item.receivedQty > 0) {
        if (!item.batchNumber) {
          toast.error(`Batch number required for ${item.productName}`);
          return;
        }
        if (!item.expiryDate) {
          toast.error(`Expiry date required for ${item.productName}`);
          return;
        }
        if (item.manufacturingDate && new Date(item.expiryDate) <= new Date(item.manufacturingDate)) {
          toast.error(`Expiry date must be after manufacturing date for ${item.productName}`);
          return;
        }
        const expDate = new Date(item.expiryDate);
        if (expDate <= new Date()) {
          toast.error(`Expiry date must be in the future for ${item.productName}`);
          return;
        }
      }
    }

    setIsSubmittingGRN(true);
    try {
      await recordGRNServerFn({ data: {
        purchaseOrderId: targetPo.id,
        vendorId: targetPo.vendorId,
        branchId: targetPo.branchId,
        grnNumber: grnForm.grnNumber,
        items: grnForm.items.map((i: any) => ({
          productId: i.productId,
          orderedQty: i.orderedQty,
          receivedQty: i.receivedQty,
          batchNumber: i.batchNumber || null,
          manufacturingDate: i.manufacturingDate || null,
          expiryDate: i.expiryDate || null
        }))
      }});
      toast.success("Goods Received Note Recorded");
      setGrnOpen(false);
      setGrnForm({ poId: "", grnNumber: "", items: [] });
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to record GRN");
    } finally {
      setIsSubmittingGRN(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceForm.poId || !invoiceForm.invoiceNumber || !invoiceForm.dueDate) {
      toast.error("Please fill in all invoice details");
      return;
    }
    const targetPo = pos.find((p: any) => p.id === invoiceForm.poId);
    if (!targetPo) return;
    
    // Calculate invoice totals based on the PO subtotal instead of double charging VAT on the total
    const subtotal = Number(targetPo.subtotal);
    const vatRate = invoiceForm.vatRate;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    setIsSubmittingInvoice(true);
    try {
      await createVendorInvoiceServerFn({ data: {
        purchaseOrderId: targetPo.id,
        invoiceNumber: invoiceForm.invoiceNumber,
        dueDate: invoiceForm.dueDate,
        subtotal,
        vatRate,
        vatAmount,
        total
      }});
      toast.success("Vendor Invoice Created & Posted to AP");
      setInvoiceOpen(false);
      setInvoiceForm({ poId: "", invoiceNumber: "", dueDate: "", vatRate: 5 });
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleRecordPayment = async () => {
    if (paymentForm.amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    setIsSubmittingPayment(true);
    try {
      await recordVendorPaymentServerFn({ data: {
        invoiceId: paymentForm.invoiceId,
        amount: paymentForm.amount,
        method: paymentForm.method,
        referenceNo: paymentForm.referenceNo,
        notes: paymentForm.notes,
        paymentDate: paymentForm.paymentDate
      }});
      toast.success("Payment recorded successfully");
      setPaymentOpen(false);
      setPaymentForm({ invoiceId: "", amount: 0, method: "Bank Transfer", referenceNo: "", notes: "", paymentDate: new Date().toISOString().split('T')[0] });
      setTargetInvoiceForPayment(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCreateVendor = async () => {
    if (!vendorForm.name || vendorForm.name.trim() === "") {
      toast.error("Vendor Name is required");
      return;
    }
    if (vendorForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(vendorForm.email)) {
        toast.error("Invalid email format");
        return;
      }
    }
    setIsSubmittingVendor(true);
    try {
      if (vendorForm.id) {
        await updateVendorServerFn({ data: { id: vendorForm.id, ...vendorForm } });
        toast.success("Vendor Updated Successfully");
      } else {
        await createVendorServerFn({ data: vendorForm });
        toast.success("Vendor Created Successfully");
      }
      setVendorOpen(false);
      setVendorForm({ name: "", contact: "", phone: "", email: "", trn: "", address: "", status: "Active" });
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save vendor");
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!deleteVendorId) return;
    try {
      await deleteVendorServerFn({ data: { id: deleteVendorId } });
      toast.success("Vendor Deleted Successfully");
      setDeleteVendorId(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete vendor");
    }
  };

  return (
    <DemoShell
      title="Purchasing Dashboard"
      subtitle={`${data.tenant?.name || "Company"} · Procurement`}
      actions={
        <Dialog open={poOpen} onOpenChange={setPoOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-semibold" onClick={() => {
              setPoForm({ vendorId: "", branchId: "", vatRate: 5 });
              setPoLines([{ productId: "", qty: 1, unitPrice: 0 }]);
            }}>
              <Plus className="mr-1.5 h-4 w-4" /> Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{poForm.id ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
              <DialogDescription>{poForm.id ? "Update PO details and items." : "Draft a new PO and add line items."}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                <div className="space-y-2">
                  <Label>VAT Rate (%)</Label>
                  <Input 
                    type="number" 
                    value={poForm.vatRate} 
                    onChange={e => setPoForm({...poForm, vatRate: Number(e.target.value)})}
                  />
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
                <div className="flex flex-col items-end mt-4 text-sm gap-1">
                  <div className="text-muted-foreground">Subtotal: {aed(totalPoValue)}</div>
                  <div className="text-muted-foreground">VAT ({poForm.vatRate}%): {aed(vatAmount)}</div>
                  <div className="text-lg font-bold text-ink mt-1">Total: {aed(grandTotal)}</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPoOpen(false)}>Cancel</Button>
              <Button disabled={isSubmitting || poLines.length === 0} onClick={handleCreatePO}>{isSubmitting ? "Creating..." : "Submit PO"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <Tabs defaultValue="po" onValueChange={() => setIsMobileMenuOpen(false)} className="mt-6 flex flex-col md:flex-row gap-8">
        <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
          <span className="font-semibold text-sm">Navigation Menu</span>
          <Button variant="outline" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <aside className={`w-full md:w-56 shrink-0 ${isMobileMenuOpen ? "block" : "hidden md:block"}`}>
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
                  <Input 
                    placeholder="Search PO number or Vendor..." 
                    className="pl-9 h-9 text-sm"
                    value={searchPo}
                    onChange={(e) => setSearchPo(e.target.value)}
                  />
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
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        {searchPo ? "No purchase orders found." : "No Purchase Orders found."}
                      </td>
                    </tr>
                  )}
                  {filteredPos.map((po: any) => (
                    <tr 
                      key={po.id} 
                      className="hover:bg-surface-2/50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(po.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick(po.id);
                        }
                      }}
                    >
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {po.status === 'Draft' && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitPO(po.id);
                              }}
                            >
                              Submit
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPoForm({
                                id: po.id,
                                vendorId: po.vendorId,
                                branchId: po.branchId,
                                vatRate: Number(po.vatRate) || 5
                              });
                              setPoLines(po.items.map((i: any) => ({
                                productId: i.productId,
                                qty: i.quantity || i.qty, // handle mapped qty vs db qty
                                unitPrice: Number(i.unitPrice)
                              })));
                              setPoOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletePoId(po.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
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
                        onChange={e => {
                          const pId = e.target.value;
                          const targetPo = pos.find((p: any) => p.id === pId);
                          const items = targetPo ? targetPo.items.map((i: any) => ({
                            productId: i.productId,
                            productName: i.product?.name,
                            isBatchTracked: i.product?.isBatchTracked,
                            orderedQty: i.qty,
                            receivedQty: i.qty,
                            unitPrice: Number(i.unitPrice),
                            batchNumber: "",
                            manufacturingDate: "",
                            expiryDate: ""
                          })) : [];
                          setGrnForm({...grnForm, poId: pId, items});
                        }}
                      >
                        <option value="">Select PO...</option>
                        {pos
                          .filter((p: any) => ["Draft", "Ordered", "Sent", "Approved"].includes(p.status))
                          .map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.id.split('-')[0].toUpperCase()} - {p.vendor?.name} - {p.branch?.name} - {new Date(p.createdAt).toLocaleDateString()} - {aed(Number(p.total))}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier GRN Number</Label>
                      <Input placeholder="e.g. GRN-9912" value={grnForm.grnNumber} onChange={e => setGrnForm({...grnForm, grnNumber: e.target.value})} />
                    </div>
                    
                    {grnForm.items.length > 0 && (
                      <div className="mt-4 space-y-4">
                        <Label>Received Items</Label>
                        <div className="rounded-md border border-border">
                          <table className="w-full text-sm">
                            <thead className="bg-surface-2 text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">Product</th>
                                <th className="px-3 py-2 text-right font-medium">Unit Price</th>
                                <th className="px-3 py-2 text-right font-medium">Ordered</th>
                                <th className="px-3 py-2 text-left font-medium w-32">Received</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {grnForm.items.map((item, idx) => (
                                <React.Fragment key={idx}>
                                  <tr>
                                    <td className="px-3 py-3 font-medium">{item.productName}</td>
                                    <td className="px-3 py-3 text-right">{aed(item.unitPrice)}</td>
                                    <td className="px-3 py-3 text-right">{item.orderedQty}</td>
                                    <td className="px-3 py-3">
                                      <Input 
                                        type="number" 
                                        min="0"
                                        max={item.orderedQty}
                                        className="h-8" 
                                        value={item.receivedQty} 
                                        onChange={e => {
                                          const newItems = [...grnForm.items];
                                          let val = Number(e.target.value);
                                          if (val > item.orderedQty) val = item.orderedQty;
                                          newItems[idx].receivedQty = val;
                                          setGrnForm({...grnForm, items: newItems});
                                        }} 
                                      />
                                    </td>
                                  </tr>
                                  {item.receivedQty > 0 && (
                                    <tr className="bg-accent/5">
                                      <td colSpan={3} className="px-3 py-3">
                                        <div className="grid grid-cols-3 gap-3">
                                          <div>
                                            <Label className="text-xs">Batch No. <span className="text-destructive">*</span></Label>
                                            <Input 
                                              className="h-8 text-xs mt-1" 
                                              placeholder="Required"
                                              value={item.batchNumber}
                                              onChange={e => {
                                                const newItems = [...grnForm.items];
                                                newItems[idx].batchNumber = e.target.value;
                                                setGrnForm({...grnForm, items: newItems});
                                              }}
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Mfg Date</Label>
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant={"outline"}
                                                  className={cn(
                                                    "w-full justify-start text-left font-normal mt-1 h-8 text-xs",
                                                    !item.manufacturingDate && "text-muted-foreground"
                                                  )}
                                                >
                                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                                  {item.manufacturingDate ? format(new Date(item.manufacturingDate), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                  mode="single"
                                                  selected={item.manufacturingDate ? new Date(item.manufacturingDate) : undefined}
                                                  onSelect={(d) => {
                                                    const newItems = [...grnForm.items];
                                                    newItems[idx].manufacturingDate = d ? format(d, "yyyy-MM-dd") : "";
                                                    setGrnForm({...grnForm, items: newItems});
                                                  }}
                                                  initialFocus
                                                />
                                              </PopoverContent>
                                            </Popover>
                                          </div>
                                          <div>
                                            <Label className="text-xs">Expiry Date <span className="text-destructive">*</span></Label>
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant={"outline"}
                                                  className={cn(
                                                    "w-full justify-start text-left font-normal mt-1 h-8 text-xs",
                                                    !item.expiryDate && "text-muted-foreground"
                                                  )}
                                                >
                                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                                  {item.expiryDate ? format(new Date(item.expiryDate), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                  mode="single"
                                                  selected={item.expiryDate ? new Date(item.expiryDate) : undefined}
                                                  onSelect={(d) => {
                                                    const newItems = [...grnForm.items];
                                                    newItems[idx].expiryDate = d ? format(d, "yyyy-MM-dd") : "";
                                                    setGrnForm({...grnForm, items: newItems});
                                                  }}
                                                  initialFocus
                                                />
                                              </PopoverContent>
                                            </Popover>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-bold text-ink">Vendor Invoices</h3>
                <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-xl font-semibold">
                      <Plus className="mr-1.5 h-4 w-4" /> Create Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Vendor Invoice</DialogTitle>
                      <DialogDescription>Convert a Purchase Order into a payable invoice.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Select Purchase Order</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={invoiceForm.poId} 
                          onChange={e => setInvoiceForm({...invoiceForm, poId: e.target.value})}
                        >
                          <option value="">Select PO...</option>
                          {pos.filter((p: any) => p.status === 'Ordered' || p.status === 'GRN' || p.status === 'Received').map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.id.split('-')[0].toUpperCase()} - {p.vendor?.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Supplier Invoice Number</Label>
                        <Input placeholder="INV-001" value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>VAT Rate (%)</Label>
                          <Input type="number" value={invoiceForm.vatRate} onChange={e => setInvoiceForm({...invoiceForm, vatRate: Number(e.target.value)})} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInvoiceOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateInvoice} disabled={isSubmittingInvoice}>{isSubmittingInvoice ? "Saving..." : "Create Invoice"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                    <th className="px-4 py-3 font-medium text-right">Balance</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.filter((i: any) => i.status !== "Paid").length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No outstanding invoices.</td></tr>
                  )}
                  {invoices
                    .filter((i: any) => i.status !== "Paid")
                    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((inv: any) => {
                      const total = Number(inv.total);
                      const paidAmount = Number(inv.paidAmount || 0);
                      const remaining = total - paidAmount;
                      
                      return (
                      <tr key={inv.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-primary font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-ink">{inv.vendor?.name}</td>
                        <td className="px-4 py-3 text-warning-foreground font-medium">{new Date(inv.dueDate).toISOString().split('T')[0]}</td>
                        <td className="px-4 py-3 text-right font-bold">{aed(total)}</td>
                        <td className="px-4 py-3 text-right font-bold text-destructive">{aed(remaining)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center rounded bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning-foreground">{inv.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative group inline-block">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              disabled={userRole !== "Head Office Admin"}
                              onClick={() => {
                                setTargetInvoiceForPayment(inv);
                                setPaymentForm(prev => ({ ...prev, invoiceId: inv.id, amount: remaining }));
                                setPaymentOpen(true);
                              }}
                            >
                              Record Payment
                            </Button>
                            {userRole !== "Head Office Admin" && (
                              <div className="absolute right-0 top-full mt-1 hidden w-48 z-10 p-2 text-xs text-white bg-black rounded group-hover:block">
                                Only authorized finance personnel (Head Office Admin) can record payments.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )})}
                </tbody>
              </table>
            </div>
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Vendor Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment for invoice <span className="font-mono font-bold">{targetInvoiceForPayment?.invoiceNumber}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Date</Label>
                      <Input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (AED)</Label>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        max={targetInvoiceForPayment ? (Number(targetInvoiceForPayment.total) - Number(targetInvoiceForPayment.paidAmount || 0)) : undefined}
                        value={paymentForm.amount} 
                        onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={paymentForm.method} 
                      onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Number</Label>
                    <Input placeholder="Txn ID / Cheque No" value={paymentForm.referenceNo} onChange={e => setPaymentForm({...paymentForm, referenceNo: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input placeholder="Additional details..." value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                  <Button onClick={handleRecordPayment} disabled={isSubmittingPayment}>
                    {isSubmittingPayment ? "Recording..." : "Record Payment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="vendors" className="mt-0">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-bold text-ink">Vendor Directory</h3>
                <Dialog open={vendorOpen} onOpenChange={setVendorOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => {
                      setVendorForm({ name: "", contact: "", phone: "", email: "", trn: "", address: "", status: "Active" });
                    }}>
                      <Plus className="mr-1.5 h-4 w-4" /> Add Vendor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Vendor</DialogTitle>
                      <DialogDescription>Enter the details for the new vendor.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Vendor Name <span className="text-destructive">*</span></Label>
                        <Input placeholder="Vendor Company Name" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <Input placeholder="John Doe" value={vendorForm.contact} onChange={e => setVendorForm({...vendorForm, contact: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input placeholder="+971..." value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" placeholder="vendor@example.com" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>TRN</Label>
                          <Input placeholder="Tax Registration Number" value={vendorForm.trn} onChange={e => setVendorForm({...vendorForm, trn: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={vendorForm.status} 
                            onChange={e => setVendorForm({...vendorForm, status: e.target.value})}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input placeholder="Company Address" value={vendorForm.address} onChange={e => setVendorForm({...vendorForm, address: e.target.value})} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setVendorOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateVendor} disabled={isSubmittingVendor}>
                        {isSubmittingVendor ? "Saving..." : "Save Vendor"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vendor Name</th>
                    <th className="px-4 py-3 font-medium">Contact Person</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vendors.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No vendors found.</td></tr>
                  )}
                  {vendors.map((v: any) => (
                    <tr key={v.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink">{v.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.contact || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.email || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.status === "Active" ? "bg-success/10 text-success border border-success/20" : "bg-muted/10 text-muted-foreground border border-border"}`}>{v.status || "Active"}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setVendorForm({
                                id: v.id,
                                name: v.name,
                                contact: v.contact || "",
                                phone: v.phone || "",
                                email: v.email || "",
                                trn: v.trn || "",
                                address: v.address || "",
                                status: v.status || "Active"
                              });
                              setVendorOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteVendorId(v.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

        </main>
      </Tabs>
      {selectedPoId && selectedPoDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                PO Details <span className="font-mono text-sm bg-surface-2 px-2 py-1 rounded text-muted-foreground">{selectedPoDetails.id.split('-')[0].toUpperCase()}</span>
              </h2>
              <button onClick={() => { setSelectedPoId(null); setSelectedPoDetails(null); }} className="text-muted-foreground hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface-2 rounded-xl">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Vendor</div>
                  <div className="font-bold text-ink mt-1">{selectedPoDetails.vendor?.name}</div>
                </div>
                <div className="p-3 bg-surface-2 rounded-xl">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Branch</div>
                  <div className="font-bold text-ink mt-1">
                    {selectedPoDetails.branch?.name ? selectedPoDetails.branch.name : <span className="text-destructive font-semibold">Missing/Invalid Branch</span>}
                  </div>
                </div>
                <div className="p-3 bg-surface-2 rounded-xl">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Date Created</div>
                  <div className="font-bold text-ink mt-1">{new Date(selectedPoDetails.createdAt).toLocaleString()}</div>
                </div>
                <div className="p-3 bg-surface-2 rounded-xl">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Status</div>
                  <div className="font-bold text-ink mt-1">{selectedPoDetails.status}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-ink mb-3">Items</h3>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2">Product</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedPoDetails.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 font-medium">{item.productName || item.product?.name}</td>
                          <td className="px-4 py-2 text-right">
                            {item.quantity != null && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : <span className="text-destructive font-bold text-xs">Invalid item data</span>}
                          </td>
                          <td className="px-4 py-2 text-right">{aed(Number(item.unitPrice))}</td>
                          <td className="px-4 py-2 text-right">
                            {item.total != null && !isNaN(item.total) && item.total > 0 ? aed(Number(item.total)) : <span className="text-destructive font-bold text-xs">Invalid item data</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-surface-2 font-bold">
                      {selectedPoDetails.subtotal != null && (
                        <>
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground font-medium">Subtotal before VAT:</td>
                            <td className="px-4 py-2 text-right">{aed(Number(selectedPoDetails.subtotal))}</td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground font-medium">VAT ({Number(selectedPoDetails.vatRate)}%):</td>
                            <td className="px-4 py-2 text-right">{aed(Number(selectedPoDetails.vatAmount))}</td>
                          </tr>
                        </>
                      )}
                      <tr className="border-t border-border/50">
                        <td colSpan={3} className="px-4 py-3 text-right">Total Value:</td>
                        <td className="px-4 py-3 text-right text-primary">{aed(Number(selectedPoDetails.total))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-muted-foreground">
                  <div>
                    {selectedPoDetails.vendor?.trn && <span>Vendor TRN: <span className="font-mono text-ink">{selectedPoDetails.vendor.trn}</span></span>}
                  </div>
                  <div className="text-right">
                    {selectedPoDetails.tenantTRN && <span>Company TRN: <span className="font-mono text-ink">{selectedPoDetails.tenantTRN}</span></span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between gap-3 pt-4 border-t border-border shrink-0">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setPoForm({
                    id: selectedPoDetails.id,
                    vendorId: selectedPoDetails.vendorId,
                    branchId: selectedPoDetails.branchId,
                    vatRate: Number(selectedPoDetails.vatRate) || 5
                  });
                  setPoLines(selectedPoDetails.items.map((i: any) => ({
                    productId: i.productId,
                    qty: i.quantity,
                    unitPrice: Number(i.unitPrice)
                  })));
                  setPoOpen(true);
                }}>Edit PO</Button>
                <Button variant="destructive" onClick={() => {
                  setDeletePoId(selectedPoDetails.id);
                }}>Delete PO</Button>
              </div>
              <Button variant="outline" onClick={() => { setSelectedPoId(null); setSelectedPoDetails(null); }}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePoId} onOpenChange={(open) => { if (!open) setDeletePoId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Purchase Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this purchase order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeletePoId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCancelPO}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vendor Confirmation Dialog */}
      <Dialog open={!!deleteVendorId} onOpenChange={(open) => { if (!open) setDeleteVendorId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vendor? This action cannot be undone. 
              Note: You cannot delete a vendor if they have existing purchase orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteVendorId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteVendor}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DemoShell>
  );
}
