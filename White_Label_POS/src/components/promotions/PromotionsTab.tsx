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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Plus, Check, X, Archive, Edit2, Play, Square } from "lucide-react";
import { 
  listPromotionsFn, 
  createPromotionFn, 
  updatePromotionFn, 
  activatePromotionFn, 
  deactivatePromotionFn, 
  archivePromotionFn 
} from "@/lib/head-office-server";

export function PromotionsTab() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({ 
    name: "", 
    discountType: "Percentage", 
    discountValue: "", 
    startDate: "", 
    endDate: "", 
    target: "All",
    targetCategory: "",
    targetProductIds: "",
    minQty: "",
    maxQty: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await listPromotionsFn();
      if (res.success) {
        setPromotions(res.promotions);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await createPromotionFn({ 
        data: { 
          name: form.name, 
          discountType: form.discountType, 
          discountValue: form.discountValue, 
          startDate: form.startDate, 
          endDate: form.endDate, 
          target: form.target,
          targetCategory: form.targetCategory || undefined,
          targetProductIds: form.targetProductIds || undefined,
          minQty: form.minQty ? parseInt(form.minQty) : undefined,
          maxQty: form.maxQty ? parseInt(form.maxQty) : undefined,
        }
      });
      if (res.success) {
        toast.success("Promotion created successfully");
        setIsCreateOpen(false);
        setForm({ 
          name: "", discountType: "Percentage", discountValue: "", startDate: "", endDate: "", 
          target: "All", targetCategory: "", targetProductIds: "", minQty: "", maxQty: "" 
        });
        fetchPromotions();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create promotion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    try {
      setIsSubmitting(true);
      const res = await updatePromotionFn({ 
        data: { 
          id: editingPromo.id,
          name: form.name, 
          discountType: form.discountType, 
          discountValue: form.discountValue, 
          startDate: form.startDate, 
          endDate: form.endDate, 
          target: form.target,
          targetCategory: form.targetCategory || undefined,
          targetProductIds: form.targetProductIds || undefined,
          minQty: form.minQty ? parseInt(form.minQty) : undefined,
          maxQty: form.maxQty ? parseInt(form.maxQty) : undefined,
        }
      });
      if (res.success) {
        toast.success("Promotion updated successfully");
        setIsEditOpen(false);
        setEditingPromo(null);
        fetchPromotions();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update promotion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (promo: any) => {
    setEditingPromo(promo);
    setForm({
      name: promo.name,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      startDate: new Date(promo.startDate).toISOString().split('T')[0],
      endDate: new Date(promo.endDate).toISOString().split('T')[0],
      target: promo.target || "All",
      targetCategory: promo.targetCategory || "",
      targetProductIds: promo.targetProductIds || "",
      minQty: promo.minQty ? String(promo.minQty) : "",
      maxQty: promo.maxQty ? String(promo.maxQty) : ""
    });
    setIsEditOpen(true);
  };

  const handleAction = async (action: 'activate' | 'deactivate' | 'archive', id: string) => {
    try {
      if (action === 'activate') {
        await activatePromotionFn({ data: { id } });
        toast.success(`Promotion activated successfully`);
        fetchPromotions();
      } else if (action === 'deactivate') {
        await deactivatePromotionFn({ data: { id } });
        toast.success(`Promotion deactivated successfully`);
        fetchPromotions();
      } else if (action === 'archive') {
        setArchiveId(id);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} promotion`);
    }
  };

  const confirmArchive = async () => {
    if (!archiveId) return;
    try {
      await archivePromotionFn({ data: { id: archiveId } });
      toast.success("Promotion archived successfully");
      fetchPromotions();
    } catch (err: any) {
      toast.error(err.message || "Failed to archive promotion");
    } finally {
      setArchiveId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-5">
        <Tag className="h-5 w-5 text-primary" />
        <p className="text-sm font-medium text-ink">
          Dynamic pricing engine active. POS integration is pending (calculations work, but are not yet wired to checkout).
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-ink tracking-tight">Promotions & Discounts</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-full font-bold shadow-md">
          <Plus className="mr-2 h-4 w-4" /> New Promotion
        </Button>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white/50 backdrop-blur-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm font-medium text-muted-foreground">Loading promotions...</div>
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="mx-auto h-12 w-12 text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-ink">No promotions yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first promotion to boost sales.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-stone-50/50">
              <TableRow>
                <TableHead className="font-semibold text-ink">Name</TableHead>
                <TableHead className="font-semibold text-ink">Type</TableHead>
                <TableHead className="font-semibold text-ink">Discount</TableHead>
                <TableHead className="font-semibold text-ink">Target</TableHead>
                <TableHead className="font-semibold text-ink">Valid Until</TableHead>
                <TableHead className="font-semibold text-ink">Status</TableHead>
                <TableHead className="font-semibold text-ink text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold text-ink">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full bg-stone-50 text-xs">
                      {p.discountType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {p.discountType === "Percentage" ? `${p.discountValue}%` : `AED ${p.discountValue}`}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{p.target}</span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {new Date(p.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`rounded-full text-xs font-semibold ${p.status === 'Active' ? 'bg-success/10 text-success' : 'bg-stone-100 text-stone-500'}`}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-500" onClick={() => openEdit(p)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {p.status === 'Active' ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-500" onClick={() => handleAction('deactivate', p.id)} title="Deactivate">
                        <Square className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleAction('activate', p.id)} title="Activate">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleAction('archive', p.id)} title="Archive">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] border-stone-200/50 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-ink flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" /> Create Promotion
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Promotion Name</Label>
                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="e.g. Summer Sale" />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={form.discountType} onValueChange={(v) => setForm({...form, discountType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage (%)</SelectItem>
                    <SelectItem value="Fixed">Fixed Amount (AED)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({...form, discountValue: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Target Scope</Label>
                <Select value={form.target} onValueChange={(v) => setForm({...form, target: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Products</SelectItem>
                    <SelectItem value="Category">Specific Category</SelectItem>
                    <SelectItem value="Product">Specific Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.target === "Category" && (
                <div className="space-y-2 col-span-2">
                  <Label>Category ID</Label>
                  <Input value={form.targetCategory} onChange={(e) => setForm({...form, targetCategory: e.target.value})} placeholder="e.g. Beverages" />
                </div>
              )}
              {form.target === "Product" && (
                <div className="space-y-2 col-span-2">
                  <Label>Product IDs (comma separated)</Label>
                  <Input value={form.targetProductIds} onChange={(e) => setForm({...form, targetProductIds: e.target.value})} placeholder="e.g. PROD-1, PROD-2" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Min Quantity (Optional)</Label>
                <Input type="number" value={form.minQty} onChange={(e) => setForm({...form, minQty: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Max Quantity (Optional)</Label>
                <Input type="number" value={form.maxQty} onChange={(e) => setForm({...form, maxQty: e.target.value})} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full font-bold">
                {isSubmitting ? "Saving..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] border-stone-200/50 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-ink flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" /> Edit Promotion
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Promotion Name</Label>
                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={form.discountType} onValueChange={(v) => setForm({...form, discountType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage (%)</SelectItem>
                    <SelectItem value="Fixed">Fixed Amount (AED)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({...form, discountValue: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Target Scope</Label>
                <Select value={form.target} onValueChange={(v) => setForm({...form, target: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Products</SelectItem>
                    <SelectItem value="Category">Specific Category</SelectItem>
                    <SelectItem value="Product">Specific Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.target === "Category" && (
                <div className="space-y-2 col-span-2">
                  <Label>Category ID</Label>
                  <Input value={form.targetCategory} onChange={(e) => setForm({...form, targetCategory: e.target.value})} />
                </div>
              )}
              {form.target === "Product" && (
                <div className="space-y-2 col-span-2">
                  <Label>Product IDs (comma separated)</Label>
                  <Input value={form.targetProductIds} onChange={(e) => setForm({...form, targetProductIds: e.target.value})} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Min Quantity (Optional)</Label>
                <Input type="number" value={form.minQty} onChange={(e) => setForm({...form, minQty: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Max Quantity (Optional)</Label>
                <Input type="number" value={form.maxQty} onChange={(e) => setForm({...form, maxQty: e.target.value})} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full font-bold">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ARCHIVE CONFIRM MODAL */}
      <Dialog open={!!archiveId} onOpenChange={(open) => !open && setArchiveId(null)}>
        <DialogContent className="sm:max-w-[420px] border-stone-200/50 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-ink flex items-center gap-2">
              <Archive className="h-5 w-5 text-destructive" /> Archive Promotion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-ink font-medium">
            Are you sure you want to archive this promotion? It will be hidden from the active lists and cannot be modified later.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setArchiveId(null)} className="rounded-full font-bold">Cancel</Button>
            <Button variant="destructive" onClick={confirmArchive} className="rounded-full font-bold">
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
