import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, User, ArrowLeft, History, Coins, CreditCard } from "lucide-react";
import { 
  searchCustomersFn, 
  createCustomerFn, 
  updateCustomerFn, 
  getCustomerDetailsFn, 
  getCustomerPurchaseHistoryFn, 
  adjustCustomerPointsFn, 
  adjustCustomerBalanceFn 
} from "@/lib/head-office-server";

export function CRMTab() {
  const [activeView, setActiveView] = useState<"list" | "details">("list");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Search State
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // Form State
  const [form, setForm] = useState({ name: "", email: "", phone: "", isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await searchCustomersFn({ data: { search, limit: 50, page: 1 } });
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "list") {
      fetchCustomers();
    }
  }, [search, activeView]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    
    try {
      setIsSubmitting(true);
      const res = await createCustomerFn({ data: { 
        name: form.name, 
        email: form.email || undefined, 
        phone: form.phone || undefined 
      }});
      if (res.success) {
        toast.success("Customer created successfully");
        setIsCreateOpen(false);
        setForm({ name: "", email: "", phone: "", isActive: true });
        fetchCustomers();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (!editingCustomer) return;

    try {
      setIsSubmitting(true);
      const res = await updateCustomerFn({ data: { 
        id: editingCustomer.id,
        name: form.name, 
        email: form.email || undefined, 
        phone: form.phone || undefined,
        isActive: form.isActive
      }});
      if (res.success) {
        toast.success("Customer updated successfully");
        setIsEditOpen(false);
        setEditingCustomer(null);
        if (activeView === "list") fetchCustomers();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeView === "details" && selectedCustomerId) {
    return <CustomerDetailsView customerId={selectedCustomerId} onBack={() => {
      setActiveView("list");
      setSelectedCustomerId(null);
    }} />;
  }

  return (
    <div className="space-y-5 mt-0">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-ink">Customer CRM</h3>
          <p className="text-sm text-muted-foreground">Manage customers, loyalty points, and store credit.</p>
        </div>
        <Button onClick={() => {
          setForm({ name: "", email: "", phone: "", isActive: true });
          setIsCreateOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Customer
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="Search name, email, or phone..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchCustomers} disabled={loading}>Refresh</Button>
      </div>

      <div className="rounded-xl border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Store Credit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading customers...</TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No customers found.</TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      {c.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{c.email || "-"}</div>
                    <div className="text-xs text-muted-foreground">{c.phone || "-"}</div>
                  </TableCell>
                  <TableCell>{c.points}</TableCell>
                  <TableCell>AED {Number(c.storeCredit || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "default" : "secondary"}>
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingCustomer(c);
                      setForm({ name: c.name, email: c.email || "", phone: c.phone || "", isActive: c.isActive });
                      setIsEditOpen(true);
                    }}>
                      Edit
                    </Button>
                    <Button variant="default" size="sm" onClick={() => {
                      setSelectedCustomerId(c.id);
                      setActiveView("details");
                    }}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+971501234567" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: c})} />
              <Label>Account is Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function CustomerDetailsView({ customerId, onBack }: { customerId: string, onBack: () => void }) {
  const [customer, setCustomer] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  
  // Adjustment Form
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustMode, setAdjustMode] = useState<"add" | "deduct">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await getCustomerDetailsFn({ data: { id: customerId } });
      if (res.success) {
        setCustomer(res.customer);
      }
      const hist = await getCustomerPurchaseHistoryFn({ data: { customerId, page: 1, limit: 10 } });
      if (hist.success) {
        setHistory(hist);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [customerId]);

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustReason.trim()) return toast.error("Reason is required");
    const delta = adjustMode === "add" ? Math.abs(Number(adjustAmount)) : -Math.abs(Number(adjustAmount));
    if (delta === 0 || isNaN(delta)) return toast.error("Valid amount required");

    try {
      setIsSubmitting(true);
      const res = await adjustCustomerPointsFn({ data: { customerId, pointsDelta: delta, reason: adjustReason } });
      if (res.success) {
        toast.success("Points adjusted successfully");
        setIsPointsOpen(false);
        fetchDetails();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust points");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustReason.trim()) return toast.error("Reason is required");
    const delta = adjustMode === "add" ? Math.abs(Number(adjustAmount)) : -Math.abs(Number(adjustAmount));
    if (delta === 0 || isNaN(delta)) return toast.error("Valid amount required");

    try {
      setIsSubmitting(true);
      const res = await adjustCustomerBalanceFn({ data: { customerId, amountDelta: delta, reason: adjustReason } });
      if (res.success) {
        toast.success("Store credit adjusted successfully");
        setIsCreditOpen(false);
        fetchDetails();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust credit");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !customer) {
    return <div className="p-8 text-center text-muted-foreground">Loading details...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-red-500">Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="mb-2" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="panel p-6 space-y-4 bg-surface md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">{customer.name}</h2>
              <Badge variant={customer.isActive ? "default" : "secondary"} className="mt-1">
                {customer.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div className="space-y-1 text-sm pt-4 border-t">
            <p><span className="text-muted-foreground">Email:</span> {customer.email || "N/A"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {customer.phone || "N/A"}</p>
            <p><span className="text-muted-foreground">Tier:</span> {customer.tier}</p>
            <p><span className="text-muted-foreground">Joined:</span> {new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="panel p-6 bg-surface flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Coins className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-ink">Loyalty Points</span>
              </div>
              <p className="text-3xl font-bold">{customer.points}</p>
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => {
              setAdjustAmount(""); setAdjustReason(""); setIsPointsOpen(true);
            }}>Manual Adjustment</Button>
          </div>
          
          <div className="panel p-6 bg-surface flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold text-ink">Store Credit</span>
              </div>
              <p className="text-3xl font-bold">AED {Number(customer.storeCredit || 0).toFixed(2)}</p>
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => {
              setAdjustAmount(""); setAdjustReason(""); setIsCreditOpen(true);
            }}>Manual Adjustment</Button>
          </div>
        </div>
      </div>

      <div className="panel p-6 bg-surface">
        <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
          <History className="h-5 w-5" /> Recent Purchase History
        </h3>
        
        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl mb-4 border border-primary/20">
          <div>
            <p className="text-sm text-muted-foreground">Total Spend (Lifetime)</p>
            <p className="text-xl font-bold text-ink">AED {history?.totalSpend?.toFixed(2) || "0.00"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-xl font-bold text-ink">{history?.orderCount || 0}</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!history?.orders || history.orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No orders found for this customer. Note: POS integration for customer attachment is pending.
                </TableCell>
              </TableRow>
            ) : (
              history.orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-xs">{o.id}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{o.source}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">AED {Number(o.total).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Adjust Points Modal */}
      <Dialog open={isPointsOpen} onOpenChange={setIsPointsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Loyalty Points</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustPoints} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>Note:</strong> This is a manual audit-logged backend adjustment.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Action</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={adjustMode} onChange={(e) => setAdjustMode(e.target.value as any)}
                >
                  <option value="add">Add Points</option>
                  <option value="deduct">Deduct Points</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Points Amount</Label>
                <Input type="number" min="1" required value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (Required for audit log)</Label>
              <Input required value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="e.g. Customer complaint resolution" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPointsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Confirm Adjustment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Credit Modal */}
      <Dialog open={isCreditOpen} onOpenChange={setIsCreditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Store Credit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustCredit} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
              <strong>Note:</strong> This is a manual audit-logged backend adjustment.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Action</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={adjustMode} onChange={(e) => setAdjustMode(e.target.value as any)}
                >
                  <option value="add">Add Credit (AED)</option>
                  <option value="deduct">Deduct Credit (AED)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Amount (AED)</Label>
                <Input type="number" step="0.01" min="0.01" required value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (Required for audit log)</Label>
              <Input required value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="e.g. Refund for returned item" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Confirm Adjustment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
