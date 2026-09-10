import React, { useEffect, useState, useMemo } from "react";
import {
  CreditCard,
  Building2,
  Calendar,
  AlertTriangle,
  Receipt,
  Download,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Store,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getMyTenantBillingFn } from "@/lib/head-office-server";
import { generateSubscriptionInvoicePdf } from "@/lib/subscription-invoice-pdf";

export function TenantSubscriptionBillingTab() {
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<any>(null);

  // Invoice Filters & Pagination
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [invoicePage, setInvoicePage] = useState(1);
  const invoicePageSize = 10;

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const res = await getMyTenantBillingFn();
      if (res.success && res.data) {
        setBillingData(res.data);
      } else {
        toast.error(res.error || "Failed to load subscription details");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const tenant = billingData?.tenant || {};
  const subscription = billingData?.subscription || {};
  const branchCount = billingData?.branchCount || 0;
  const outletLimit = tenant.outletLimit || 5;
  const outletUsagePercent = Math.min(100, Math.round((branchCount / outletLimit) * 100));

  const allInvoices = billingData?.invoices || [];

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv: any) => {
      if (invoiceSearch.trim()) {
        const q = invoiceSearch.toLowerCase().trim();
        const numMatch = inv.invoiceNumber?.toLowerCase().includes(q);
        const planMatch = inv.planName?.toLowerCase().includes(q);
        if (!numMatch && !planMatch) return false;
      }
      if (invoiceStatusFilter !== "all") {
        if (invoiceStatusFilter === "paid") {
          if (inv.paymentStatus !== "paid" && inv.paymentStatus !== "manual_paid") return false;
        } else if (invoiceStatusFilter === "pending") {
          if (inv.paymentStatus !== "pending_gateway_integration" && inv.paymentStatus !== "pending") return false;
        } else if (invoiceStatusFilter === "overdue") {
          if (inv.paymentStatus !== "overdue") return false;
        }
      }
      return true;
    });
  }, [allInvoices, invoiceSearch, invoiceStatusFilter]);

  const totalInvoicePages = Math.max(1, Math.ceil(filteredInvoices.length / invoicePageSize));
  const currentInvoicePage = Math.min(invoicePage, totalInvoicePages);
  const invoiceStartIndex = (currentInvoicePage - 1) * invoicePageSize;
  const paginatedInvoices = filteredInvoices.slice(
    invoiceStartIndex,
    invoiceStartIndex + invoicePageSize
  );

  const formatDate = (d: any) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" });
  };

  const isSubOverdue = subscription.status === "overdue";
  const subStatus = subscription.status || "active";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-3 text-xs font-semibold text-muted-foreground">Loading subscription & billing profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-md border border-slate-700">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-lime-400/20 text-lime-400 border border-lime-400/30">
              <CreditCard className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-white">Subscription & Plan Billing</h1>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Transparently monitor your Cloudynation POS plan entitlements, renewal schedule, and official tax invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-lime-400/40 bg-lime-400/10 text-lime-300 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            {tenant.plan || "Active"} Tier
          </Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Plan */}
        <div className="panel p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Plan</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-ink">{tenant.plan || "Starter"}</div>
          <div className="mt-1 text-xs text-muted-foreground capitalize font-semibold">
            {subscription.billingCycle ? subscription.billingCycle.replace(/_/g, " ") : "Monthly"} Billing
          </div>
        </div>

        {/* Card 2: Account Status */}
        <div className="panel p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Standing Status</span>
            {isSubOverdue ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wider ${
              isSubOverdue
                ? "bg-destructive/15 text-destructive border border-destructive/30"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
            }`}>
              <span className={`h-2 w-2 rounded-full ${isSubOverdue ? "bg-destructive animate-pulse" : "bg-emerald-500"}`} />
              {subStatus}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {isSubOverdue ? "Settlement past due date" : "Account in good standing"}
          </div>
        </div>

        {/* Card 3: Next Renewal Date */}
        <div className="panel p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Next Renewal Due</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-black text-ink">
            {formatDate(subscription.currentPeriodEndDate)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {subscription.subscriptionStartDate ? `Started ${formatDate(subscription.subscriptionStartDate)}` : "Ongoing period"}
          </div>
        </div>

        {/* Card 4: Outlets Capacity */}
        <div className="panel p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Outlets Quota</span>
            <Store className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-ink">{branchCount}</span>
            <span className="text-xs font-semibold text-muted-foreground">Limit: {outletLimit}</span>
          </div>
          <div className="mt-2">
            <Progress value={outletUsagePercent} className="h-1.5" />
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            {outletLimit - branchCount > 0 ? `${outletLimit - branchCount} outlet slots available` : "Capacity reached"}
          </div>
        </div>
      </div>

      {/* Plan Entitlements Banner */}
      <div className="panel p-5 rounded-2xl border border-border bg-surface-2/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-ink">Plan Entitlements & Allocation</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Includes up to <strong>{outletLimit} Outlets</strong>, <strong>{tenant.tillLimit || 10} Tills</strong>, and <strong>{tenant.monthlyOrderLimit?.toLocaleString() || "10,000"} Orders/Month</strong>.
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-surface px-3 py-2 rounded-xl border border-border">
          Need higher limits? Contact your platform Super Administrator.
        </div>
      </div>

      {/* Invoice History Section */}
      <div className="panel p-6 rounded-2xl border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-ink">Subscription Tax Invoices</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official electronic tax invoices issued for your subscription periods. Download stamped PDF receipts or settle pending charges online.
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-surface-2/60 p-3 rounded-2xl border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number..."
              value={invoiceSearch}
              onChange={(e) => {
                setInvoiceSearch(e.target.value);
                setInvoicePage(1);
              }}
              className="pl-9 h-9 text-xs rounded-xl bg-surface"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[160px]">
              <Select
                value={invoiceStatusFilter}
                onValueChange={(val) => {
                  setInvoiceStatusFilter(val);
                  setInvoicePage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl bg-surface">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Invoices</SelectItem>
                  <SelectItem value="paid">Paid & Settled</SelectItem>
                  <SelectItem value="pending">Pending Payment</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(invoiceSearch || invoiceStatusFilter !== "all") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-ink rounded-xl"
                onClick={() => {
                  setInvoiceSearch("");
                  setInvoiceStatusFilter("all");
                  setInvoicePage(1);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto w-full rounded-2xl border border-border">
          <Table className="w-full">
            <TableHeader className="bg-surface-2/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Ref</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan & Cycle</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Coverage Period</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total (AED)</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground font-medium text-xs">
                    {filteredInvoices.length === 0 && (invoiceSearch || invoiceStatusFilter !== "all")
                      ? "No invoices match the selected filter criteria."
                      : "No subscription invoices recorded yet."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((inv: any) => {
                  const isPaid = inv.paymentStatus === "paid" || inv.paymentStatus === "manual_paid";
                  const isPending = inv.paymentStatus === "pending_gateway_integration" || inv.paymentStatus === "pending";
                  const isOverdue = inv.paymentStatus === "overdue";

                  // Check if a real payment URL exists for online settlement
                  const payUrl = inv.mamoPaymentUrl || null;
                  const hasPaymentLink = Boolean(payUrl);

                  return (
                    <TableRow key={inv.id} className="group hover:bg-primary/[0.03] transition-colors">
                      <TableCell className="p-4 font-mono text-xs font-extrabold text-ink">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="p-4">
                        <Badge variant="secondary" className="rounded-xl px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-extrabold">
                          {inv.planName}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {inv.billingCycle ? inv.billingCycle.replace(/_/g, " ") : "Monthly"} ({inv.durationMonths || 1} mo)
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-xs text-muted-foreground font-medium">
                        {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="text-sm font-extrabold text-ink">
                          AED {Number(inv.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          VAT incl. ({inv.vatAmount || "0.00"})
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/15 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-success">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            Paid & Settled
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-amber-700 dark:text-amber-400">
                            <Clock className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                            Pending Payment
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/15 px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            Overdue
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && hasPaymentLink && payUrl && (
                            <Button
                              size="sm"
                              className="rounded-xl h-8 text-xs font-bold shadow-sm bg-lime-500 hover:bg-lime-600 text-slate-950 transition-all hover:-translate-y-0.5"
                              asChild
                            >
                              <a href={payUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Pay Now
                              </a>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl h-8 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                            onClick={() => {
                              try {
                                generateSubscriptionInvoicePdf({
                                  ...inv,
                                  tenantName: tenant.name || "Cloudynation POS",
                                  tenantSubdomain: tenant.subdomain,
                                  tenantTrn: tenant.trn,
                                });
                                toast.success("Tax invoice PDF downloaded!");
                              } catch (e: any) {
                                toast.error("Failed to export PDF: " + e.message);
                              }
                            }}
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5 text-primary group-hover:text-primary-foreground" /> PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1 pt-1">
          <div>
            {filteredInvoices.length > 0 ? (
              <>
                Showing <span className="font-semibold text-ink">{invoiceStartIndex + 1}</span> to{" "}
                <span className="font-semibold text-ink">
                  {Math.min(invoiceStartIndex + invoicePageSize, filteredInvoices.length)}
                </span>{" "}
                of <span className="font-semibold text-ink">{filteredInvoices.length}</span> invoices
              </>
            ) : (
              <span>0 invoices</span>
            )}
          </div>

          {totalInvoicePages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs font-semibold rounded-xl"
                disabled={currentInvoicePage <= 1}
                onClick={() => setInvoicePage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>

              <span className="px-2 font-mono text-xs font-semibold text-ink">
                Page {currentInvoicePage} of {totalInvoicePages}
              </span>

              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs font-semibold rounded-xl"
                disabled={currentInvoicePage >= totalInvoicePages}
                onClick={() => setInvoicePage((prev) => Math.min(prev + 1, totalInvoicePages))}
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
