import { useState, useEffect } from "react";
import {
  LifeBuoy,
  Plus,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Loader2,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getMyTenantTicketsServerFn,
  createSupportTicketServerFn,
  getTicketDetailsServerFn,
  replyToTicketServerFn,
  updateMySupportTicketServerFn,
  deleteMySupportTicketServerFn,
  type SupportTicketItem,
  type SupportTicketMessageItem,
} from "@/lib/support-tickets-server";

export function TenantSupportTab({
  isNewTicketModalOpen,
  setIsNewTicketModalOpen,
}: {
  isNewTicketModalOpen?: boolean;
  setIsNewTicketModalOpen?: (open: boolean) => void;
}) {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Internal create/edit modal state
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = isNewTicketModalOpen !== undefined ? isNewTicketModalOpen : internalModalOpen;
  const setModalOpen = (val: boolean) => {
    if (setIsNewTicketModalOpen) setIsNewTicketModalOpen(val);
    setInternalModalOpen(val);
  };

  const [editingTicket, setEditingTicket] = useState<SupportTicketItem | null>(null);
  const [ticketForm, setTicketForm] = useState({
    title: "",
    category: "General",
    priority: "Medium",
    description: "",
  });
  const [submittingForm, setSubmittingForm] = useState(false);

  // Delete confirmation modal state
  const [deletingTicket, setDeletingTicket] = useState<SupportTicketItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Ticket Chat / Details modal state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportTicketMessageItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await getMyTenantTicketsServerFn();
      if (res.success && res.tickets) {
        setTickets(res.tickets);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openCreateModal = () => {
    setEditingTicket(null);
    setTicketForm({
      title: "",
      category: "General",
      priority: "Medium",
      description: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (t: SupportTicketItem) => {
    if (t.status === "Resolved" || t.status === "Closed") {
      toast.error("Cannot edit a resolved or closed ticket.");
      return;
    }
    setEditingTicket(t);
    setTicketForm({
      title: t.title,
      category: t.category,
      priority: t.priority,
      description: t.description,
    });
    setModalOpen(true);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.title.trim()) {
      toast.error("Please enter a ticket title.");
      return;
    }
    if (!ticketForm.description.trim()) {
      toast.error("Please describe your issue.");
      return;
    }

    setSubmittingForm(true);
    try {
      if (editingTicket) {
        // Edit existing
        const res = await updateMySupportTicketServerFn({
          data: {
            ticketId: editingTicket.id,
            title: ticketForm.title,
            category: ticketForm.category,
            priority: ticketForm.priority,
            description: ticketForm.description,
          },
        });
        if (res.success) {
          toast.success("Support ticket updated successfully!");
          setModalOpen(false);
          fetchTickets();
        }
      } else {
        // Create new
        const res = await createSupportTicketServerFn({
          data: {
            title: ticketForm.title,
            category: ticketForm.category,
            priority: ticketForm.priority,
            description: ticketForm.description,
          },
        });
        if (res.success) {
          toast.success(`Support ticket ${res.ticket.ticketNumber} created!`);
          setModalOpen(false);
          fetchTickets();
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save support ticket.");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deletingTicket) return;
    setDeleting(true);
    try {
      const res = await deleteMySupportTicketServerFn({
        data: { ticketId: deletingTicket.id },
      });
      if (res.success) {
        toast.success("Support ticket deleted successfully.");
        setDeletingTicket(null);
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete support ticket.");
    } finally {
      setDeleting(false);
    }
  };

  const openTicketChat = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setLoadingDetails(true);
    setReplyText("");
    try {
      const res = await getTicketDetailsServerFn({ data: { ticketId } });
      if (res.success && res.ticket) {
        setActiveTicket(res.ticket);
        setTicketMessages(res.messages || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load ticket details.");
      setSelectedTicketId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await replyToTicketServerFn({
        data: {
          ticketId: selectedTicketId,
          message: replyText.trim(),
        },
      });
      if (res.success && res.message) {
        setTicketMessages((prev) => [...prev, res.message]);
        setReplyText("");
        if (activeTicket) {
          setActiveTicket({ ...activeTicket, status: res.status || activeTicket.status });
        }
        fetchTickets();
        toast.success("Reply sent to support team.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const openCount = tickets.filter(
    (t) => t.status === "Open" || t.status === "In Progress" || t.status === "Waiting on Customer"
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "Resolved" || t.status === "Closed"
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Open</Badge>;
      case "In Progress":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">In Progress</Badge>;
      case "Waiting on Customer":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Awaiting Your Reply</Badge>;
      case "Resolved":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Resolved</Badge>;
      case "Closed":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold">Urgent</Badge>;
      case "High":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">High</Badge>;
      case "Medium":
        return <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20">Medium</Badge>;
      case "Low":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-6 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-ink">Support & Help Desk</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Direct ticketing connection to CloudNation POS platform engineering and support.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            disabled={loading}
            className="rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Raise Support Ticket
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Tickets</p>
            <p className="text-2xl font-extrabold text-ink mt-1">{tickets.length}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Open / Active</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{openCount}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resolved</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{resolvedCount}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">My Organization Tickets</h3>
          <span className="text-xs text-muted-foreground">{tickets.length} tickets filed</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <LifeBuoy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm font-bold text-ink">No support tickets yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Whenever you encounter a technical bug, billing inquiry, or till issue, click below to open a ticket.
            </p>
            <Button size="sm" onClick={openCreateModal} className="mt-4 rounded-xl">
              <Plus className="mr-1.5 h-4 w-4" /> Open Your First Ticket
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-surface-2/80">
                <TableRow>
                  <TableHead className="py-3 text-xs font-bold uppercase">Ticket #</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Subject</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Category</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Priority</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Status</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Submitted</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Last Activity</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => {
                  const isLocked = t.status === "Resolved" || t.status === "Closed";
                  return (
                    <TableRow
                      key={t.id}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                      onClick={() => openTicketChat(t.id)}
                    >
                      <TableCell className="py-4 font-mono text-xs font-bold text-primary">
                        {t.ticketNumber}
                      </TableCell>
                      <TableCell className="py-4 font-medium text-sm text-ink max-w-[280px]">
                        <div className="font-semibold text-ink truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground truncate line-clamp-1 mt-0.5">
                          {t.description}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs text-muted-foreground font-medium">{t.category}</span>
                      </TableCell>
                      <TableCell className="py-4">{getPriorityBadge(t.priority)}</TableCell>
                      <TableCell className="py-4">{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="py-4 text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="py-4 text-xs text-muted-foreground">
                        {new Date(t.updatedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell
                        className="py-4 text-right"
                        onClick={(e) => e.stopPropagation()} // Stop row click
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Chat / View Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTicketChat(t.id)}
                            className="h-8 px-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg"
                            title="Open ticket thread"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                            {t.messageCount ? `${t.messageCount}` : "Chat"}
                          </Button>

                          {/* Edit Button: Visible/enabled ONLY when NOT Resolved/Closed */}
                          {!isLocked ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(t)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-ink hover:bg-secondary rounded-lg"
                              title="Edit ticket"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <span
                              className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground/30 cursor-not-allowed"
                              title="Cannot edit resolved or closed tickets"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </span>
                          )}

                          {/* Delete Button: Visible/enabled ONLY when NOT Resolved/Closed */}
                          {!isLocked ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingTicket(t)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                              title="Delete ticket"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <span
                              className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground/30 cursor-not-allowed"
                              title="Cannot delete resolved or closed tickets"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT TICKET MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-ink flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />
              {editingTicket ? `Edit Ticket (${editingTicket.ticketNumber})` : "Raise New Support Ticket"}
            </DialogTitle>
            <DialogDescription>
              {editingTicket
                ? "Update your ticket details. Only open tickets can be edited."
                : "Submit a support request to the platform team. We respond within standard SLA hours."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTicket} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-title" className="text-xs font-semibold">
                Issue Summary / Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ticket-title"
                placeholder="e.g. Till terminal printer offline in Branch 1"
                value={ticketForm.title}
                onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ticket-category" className="text-xs font-semibold">
                  Category
                </Label>
                <Select
                  value={ticketForm.category}
                  onValueChange={(val) => setTicketForm({ ...ticketForm, category: val })}
                >
                  <SelectTrigger id="ticket-category" className="rounded-xl">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical Bug</SelectItem>
                    <SelectItem value="Billing">Subscription / Billing</SelectItem>
                    <SelectItem value="Hardware / Till">Hardware / POS Till</SelectItem>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                    <SelectItem value="General">General Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ticket-priority" className="text-xs font-semibold">
                  Priority
                </Label>
                <Select
                  value={ticketForm.priority}
                  onValueChange={(val) => setTicketForm({ ...ticketForm, priority: val })}
                >
                  <SelectTrigger id="ticket-priority" className="rounded-xl">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent (Store Impacted)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-desc" className="text-xs font-semibold">
                Detailed Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="ticket-desc"
                placeholder="Explain the steps to reproduce, error messages seen, and which tills or staff are impacted..."
                rows={4}
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submittingForm}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingForm}
                className="rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submittingForm && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {editingTicket ? "Save Changes" : "Submit Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={Boolean(deletingTicket)} onOpenChange={(open) => !open && setDeletingTicket(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Support Ticket?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ticket{" "}
              <span className="font-mono font-bold text-ink">{deletingTicket?.ticketNumber}</span>?
              This will permanently remove this ticket and its messages history.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-secondary/50 rounded-xl text-xs text-muted-foreground">
            <span className="font-semibold text-ink">Ticket:</span> {deletingTicket?.title}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingTicket(null)}
              disabled={deleting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTicket}
              disabled={deleting}
              className="rounded-xl font-semibold"
            >
              {deleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
              Delete Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TICKET CHAT & THREAD DIALOG */}
      <Dialog open={Boolean(selectedTicketId)} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col rounded-2xl p-0 overflow-hidden">
          {loadingDetails || !activeTicket ? (
            <div className="py-24 text-center text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm">Loading ticket conversation...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-5 border-b border-border bg-surface-2 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {activeTicket.ticketNumber}
                    </span>
                    {getStatusBadge(activeTicket.status)}
                    {getPriorityBadge(activeTicket.priority)}
                  </div>
                  <h3 className="text-base font-bold text-ink mt-1.5">{activeTicket.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Category: <span className="font-medium text-ink">{activeTicket.category}</span> · Opened on{" "}
                    {new Date(activeTicket.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh] bg-surface">
                {/* Original Description as first message */}
                <div className="flex flex-col items-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-surface-2 border border-border p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-xs font-bold text-ink">
                        {activeTicket.submitter?.name || "You (Head Office)"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                      {activeTicket.description}
                    </p>
                  </div>
                </div>

                {/* Subsequent Messages */}
                {ticketMessages.slice(1).map((m) => {
                  const isStaff = m.senderRole === "Super Admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                          isStaff
                            ? "rounded-tr-none bg-primary text-primary-foreground"
                            : "rounded-tl-none bg-surface-2 border border-border text-ink"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className={`text-xs font-bold ${isStaff ? "text-primary-foreground/90" : "text-ink"}`}>
                            {m.senderName} {isStaff && "(Platform Support)"}
                          </span>
                          <span
                            className={`text-[10px] ${
                              isStaff ? "text-primary-foreground/75" : "text-muted-foreground"
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Box */}
              <div className="p-4 border-t border-border bg-surface-2">
                {activeTicket.status === "Closed" ? (
                  <div className="p-3 bg-secondary/70 rounded-xl text-center text-xs text-muted-foreground font-medium">
                    This support ticket has been closed. If you still have questions, please open a new ticket.
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message or response to support team..."
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="rounded-xl resize-none bg-surface"
                      disabled={sendingReply}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="rounded-xl px-4 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    >
                      {sendingReply ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1.5" /> Reply
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
