import { useState, useEffect } from "react";
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Send,
  Loader2,
  Lock,
  Building2,
  User,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getAllTicketsForSuperAdminServerFn,
  getTicketDetailsServerFn,
  replyToTicketServerFn,
  updateTicketStatusServerFn,
  type SupportTicketItem,
  type SupportTicketMessageItem,
} from "@/lib/support-tickets-server";

export function SuperAdminSupportTicketsTab({
  tenants,
}: {
  tenants: { id: string; name: string; subdomain?: string }[];
}) {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    waitingOnCustomer: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTenantId, setSelectedTenantId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Ticket Desk modal state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportTicketMessageItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await getAllTicketsForSuperAdminServerFn({
        data: {
          tenantId: selectedTenantId !== "all" ? selectedTenantId : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          priority: selectedPriority !== "all" ? selectedPriority : undefined,
          search: searchQuery.trim() || undefined,
        },
      });
      if (res.success) {
        setTickets(res.tickets || []);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedTenantId, selectedStatus, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const openTicketDesk = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setLoadingDetails(true);
    setReplyText("");
    setIsInternalNote(false);
    try {
      const res = await getTicketDetailsServerFn({ data: { ticketId } });
      if (res.success && res.ticket) {
        setActiveTicket(res.ticket);
        setTicketMessages(res.messages || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load ticket conversation.");
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
          isInternalNote,
        },
      });
      if (res.success && res.message) {
        setTicketMessages((prev) => [...prev, res.message]);
        setReplyText("");
        setIsInternalNote(false);
        if (activeTicket && res.status) {
          setActiveTicket({ ...activeTicket, status: res.status });
        }
        fetchTickets();
        toast.success(isInternalNote ? "Internal note added." : "Reply sent to tenant.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send response.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicketId || !activeTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await updateTicketStatusServerFn({
        data: {
          ticketId: selectedTicketId,
          status: newStatus,
        },
      });
      if (res.success && res.ticket) {
        setActiveTicket({ ...activeTicket, status: newStatus });
        fetchTickets();
        toast.success(`Ticket status updated to "${newStatus}".`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update ticket status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedTicketId || !activeTicket) return;
    try {
      const res = await updateTicketStatusServerFn({
        data: {
          ticketId: selectedTicketId,
          status: activeTicket.status,
          priority: newPriority,
        },
      });
      if (res.success && res.ticket) {
        setActiveTicket({ ...activeTicket, priority: newPriority });
        fetchTickets();
        toast.success(`Priority updated to "${newPriority}".`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to change priority.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Open</Badge>;
      case "In Progress":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">In Progress</Badge>;
      case "Waiting on Customer":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Waiting on Customer</Badge>;
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
      {/* Top Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-6 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-ink">Support Tickets Central</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage, review, reply, and resolve support requests from all onboarded tenant chains.
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          disabled={loading}
          className="rounded-xl self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Tickets</p>
            <p className="text-2xl font-extrabold text-ink mt-1">{metrics.total}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Open / Pending</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{metrics.open}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">In Progress</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">
              {metrics.inProgress + metrics.waitingOnCustomer}
            </p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resolved / Closed</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {metrics.resolved + metrics.closed}
            </p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticket #, title, description, tenant, or submitter email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:w-auto">
            {/* Tenant Filter */}
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger className="rounded-xl text-xs w-[140px]">
                <SelectValue placeholder="Tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="rounded-xl text-xs w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Waiting on Customer">Awaiting Customer</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="rounded-xl text-xs w-[120px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="sm" className="rounded-xl text-xs font-semibold shrink-0">
            Search
          </Button>
        </form>
      </div>

      {/* Master Tickets Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Tickets Master List</h3>
          <span className="text-xs text-muted-foreground">{tickets.length} matching tickets</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">Loading tickets across all tenants...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <LifeBuoy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm font-bold text-ink">No support tickets found</p>
            <p className="text-xs text-muted-foreground mt-1">
              There are currently no tickets matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-surface-2/80">
                <TableRow>
                  <TableHead className="py-3 text-xs font-bold uppercase">Ticket #</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Tenant</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Subject / Category</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Priority</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Status</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Submitter</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase">Last Updated</TableHead>
                  <TableHead className="py-3 text-xs font-bold uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow
                    key={t.id}
                    className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                    onClick={() => openTicketDesk(t.id)}
                  >
                    <TableCell className="py-4 font-mono text-xs font-bold text-primary">
                      {t.ticketNumber}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-sm text-ink">{t.tenantName || "Unknown Tenant"}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {t.tenantSubdomain ? `${t.tenantSubdomain}.cloudynationpos.ae` : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 max-w-[260px]">
                      <div className="font-semibold text-sm text-ink truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">
                        {t.category} · {t.messageCount || 1} msgs
                      </div>
                    </TableCell>
                    <TableCell className="py-4">{getPriorityBadge(t.priority)}</TableCell>
                    <TableCell className="py-4">{getStatusBadge(t.status)}</TableCell>
                    <TableCell className="py-4 text-xs">
                      <div className="font-semibold text-ink">{t.submitterName || "Head Office User"}</div>
                      <div className="text-muted-foreground">{t.submitterEmail || "—"}</div>
                    </TableCell>
                    <TableCell className="py-4 text-xs text-muted-foreground">
                      {new Date(t.updatedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTicketDesk(t.id)}
                        className="rounded-xl text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        Manage & Reply
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* SUPER ADMIN TICKET DESK MODAL */}
      <Dialog open={Boolean(selectedTicketId)} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col rounded-2xl p-0 overflow-hidden">
          {loadingDetails || !activeTicket ? (
            <div className="py-24 text-center text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm">Loading ticket workspace...</p>
            </div>
          ) : (
            <>
              {/* Header with Tenant Context and Quick Status Controller */}
              <div className="p-5 border-b border-border bg-surface-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                      {activeTicket.ticketNumber}
                    </span>
                    {getStatusBadge(activeTicket.status)}
                    {getPriorityBadge(activeTicket.priority)}
                  </div>

                  {/* Status Switcher & Priority Control */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[11px] font-bold uppercase text-muted-foreground">Status:</Label>
                      <Select
                        value={activeTicket.status}
                        onValueChange={handleStatusChange}
                        disabled={updatingStatus}
                      >
                        <SelectTrigger className="h-8 rounded-xl text-xs w-[145px] font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Waiting on Customer">Waiting on Customer</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Label className="text-[11px] font-bold uppercase text-muted-foreground">Priority:</Label>
                      <Select
                        value={activeTicket.priority}
                        onValueChange={handlePriorityChange}
                      >
                        <SelectTrigger className="h-8 rounded-xl text-xs w-[110px] font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Tenant & Submitter Metadata Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-ink">{activeTicket.tenant?.name || "Tenant"}</span>
                    <span>({activeTicket.tenant?.plan} Plan)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-ink">{activeTicket.submitter?.name || "Staff"}</span>
                    <span>({activeTicket.submitter?.email})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>
                      Opened: {new Date(activeTicket.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[46vh] bg-surface">
                {/* Original Ticket Description */}
                <div className="rounded-2xl bg-surface-2 border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-border/60">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{activeTicket.title}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Category: <span className="font-semibold text-ink">{activeTicket.category}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(activeTicket.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                    {activeTicket.description}
                  </p>
                </div>

                {/* Message replies timeline */}
                {ticketMessages.slice(1).map((m) => {
                  const isStaff = m.senderRole === "Super Admin";
                  const isInternal = m.isInternalNote;

                  if (isInternal) {
                    return (
                      <div key={m.id} className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-800 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Internal Note by {m.senderName}
                          </span>
                          <span className="text-[10px] text-amber-700">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-amber-900 whitespace-pre-wrap">{m.message}</p>
                      </div>
                    );
                  }

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

              {/* Super Admin Response Composer */}
              <div className="p-4 border-t border-border bg-surface-2 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Compose Response</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <Lock className="h-3 w-3" />
                    Internal Note (Hidden from tenant)
                  </label>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder={
                      isInternalNote
                        ? "Add private note for platform engineering/support team..."
                        : "Type official response to tenant admin..."
                    }
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="rounded-xl resize-none bg-surface text-xs"
                    disabled={sendingReply}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className={`rounded-xl px-4 shrink-0 font-semibold ${
                      isInternalNote
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {sendingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1.5" />
                        {isInternalNote ? "Save Note" : "Send Reply"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
