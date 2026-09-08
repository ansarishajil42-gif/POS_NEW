import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, AlertCircle, FileSpreadsheet, Building2, Coins, Activity } from "lucide-react";
import { 
  getSalesSummaryReportFn,
  getBranchSalesReportFn,
  getProductSalesReportFn,
  getCategorySalesReportFn,
  getCashierSalesReportFn,
  getInventoryValuationReportFn,
  getLowStockReportFn,
  getExpiryReportFn,
  getPurchaseReportFn,
  getVendorReportFn,
  getVatSummaryReportFn,
  getReportBranchesServerFn
} from "@/lib/reports-server";
import {
  getTenantsServerFn,
  getBillingOverviewServerFn,
  getAnalyticsServerFn,
  getPlatformSettingsServerFn
} from "@/lib/super-admin-server";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";

interface ReportsTabProps {
  selectedTenantId?: string;
  isSuperAdmin?: boolean;
}

export function ReportsTab({ selectedTenantId, isSuperAdmin }: ReportsTabProps) {
  const [reportType, setReportType] = useState<string>(isSuperAdmin ? "master-report" : "sales-summary");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
  );
  const [branchId, setBranchId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: branchesRes } = useQuery({
    queryKey: ['report-branches', selectedTenantId],
    queryFn: async () => await getReportBranchesServerFn({ data: { tenantId: selectedTenantId || undefined } }),
  });

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      let res;
      const bId = branchId === "all" ? undefined : branchId;
      const tId = selectedTenantId || undefined;
      const payload: any = { branchId: bId, tenantId: tId };
      const datePayload: any = { startDate, endDate, branchId: bId, tenantId: tId };
      
      switch (reportType) {
        case "master-report": {
          const [tenantsRes, billingRes, analyticsRes, platformRes] = await Promise.all([
            getTenantsServerFn(),
            getBillingOverviewServerFn(),
            getAnalyticsServerFn(),
            getPlatformSettingsServerFn()
          ]);

          const currency = platformRes?.data?.currency || "AED";

          res = {
            success: true,
            data: {
              isMasterReport: true,
              currency,
              section1_tenants: tenantsRes?.success ? tenantsRes.tenants.map((t: any) => ({
                name: t.name,
                plan: t.plan,
                status: t.status,
                outlets: t.outlets ?? 0,
                tills: t.tills ?? 0,
              })) : [],
              section2_billingOverview: billingRes?.success ? {
                totalTenants: billingRes.overview.totalTenants,
                totalRevenueCollected: `${currency} ${(billingRes.overview.totalRevenueCollected || 0).toFixed(2)}`,
                overdueCount: billingRes.overview.overdueCount,
                dueSoonCount: billingRes.overview.dueSoonCount,
              } : null,
              section2_billingTenants: billingRes?.success ? billingRes.tenants.map((t: any) => ({
                tenantName: t.tenantName,
                plan: t.plan,
                status: t.status === "active" ? "Active" : t.status === "due_soon" ? "Due Soon" : t.status === "overdue" ? "Overdue" : "No Record",
                punctuality: t.punctuality,
                totalPaidAllTime: `${currency} ${(t.totalPaid || 0).toFixed(2)}`,
                lastPaymentDate: t.lastPaymentDate ? new Date(t.lastPaymentDate).toLocaleDateString() : "Never",
                lastPaymentAmount: t.lastPaymentAmount !== null ? `${currency} ${Number(t.lastPaymentAmount).toFixed(2)}` : "-",
              })) : [],
              section3_analytics: analyticsRes?.success ? {
                totalTenants: analyticsRes.tenantStats?.total ?? 0,
                activeTenants: analyticsRes.tenantStats?.active ?? 0,
                suspendedTenants: analyticsRes.tenantStats?.suspended ?? 0,
              } : null,
              section3_activityLogs: analyticsRes?.success && analyticsRes.systemLogs ? analyticsRes.systemLogs.map((log: any) => ({
                timestamp: log[0],
                level: log[1],
                action: log[2],
              })) : [],
            }
          };
          break;
        }
        case "subscription-billing": {
          const [billingRes, platformRes] = await Promise.all([
            getBillingOverviewServerFn(),
            getPlatformSettingsServerFn()
          ]);
          const currency = platformRes?.data?.currency || "AED";
          res = {
            success: true,
            data: {
              isSubscriptionBilling: true,
              overview: billingRes?.success ? billingRes.overview : null,
              tenants: billingRes?.success ? billingRes.tenants.map((t: any) => ({
                tenantName: t.tenantName,
                plan: t.plan,
                status: t.status === "active" ? "Active" : t.status === "due_soon" ? "Due Soon" : t.status === "overdue" ? "Overdue" : "No Record",
                punctuality: t.punctuality,
                totalPaidAllTime: `${currency} ${(t.totalPaid || 0).toFixed(2)}`,
                lastPaymentDate: t.lastPaymentDate ? new Date(t.lastPaymentDate).toLocaleDateString() : "Never",
                lastPaymentAmount: t.lastPaymentAmount !== null ? `${currency} ${Number(t.lastPaymentAmount).toFixed(2)}` : "-",
              })) : []
            }
          };
          break;
        }
        case "platform-analytics": {
          const analyticsRes = await getAnalyticsServerFn();
          res = {
            success: true,
            data: {
              isPlatformAnalytics: true,
              tenantStats: {
                total: analyticsRes?.tenantStats?.total ?? 0,
                active: analyticsRes?.tenantStats?.active ?? 0,
                suspended: analyticsRes?.tenantStats?.suspended ?? 0,
              },
              systemLogs: analyticsRes?.systemLogs ? analyticsRes.systemLogs.map((log: any) => ({
                timestamp: log[0],
                level: log[1],
                action: log[2],
              })) : []
            }
          };
          break;
        }
        case "sales-summary":
          res = await getSalesSummaryReportFn({ data: datePayload });
          break;
        case "branch-sales":
          res = await getBranchSalesReportFn({ data: { startDate, endDate, tenantId: tId } });
          break;
        case "product-sales":
          res = await getProductSalesReportFn({ data: datePayload });
          break;
        case "category-sales":
          res = await getCategorySalesReportFn({ data: datePayload });
          break;
        case "cashier-sales":
          res = await getCashierSalesReportFn({ data: datePayload });
          break;
        case "inventory-valuation":
          res = await getInventoryValuationReportFn({ data: payload });
          break;
        case "low-stock":
          res = await getLowStockReportFn({ data: payload });
          break;
        case "expiry":
          res = await getExpiryReportFn({ data: { ...payload, daysThreshold: 30 } });
          break;
        case "purchase":
          res = await getPurchaseReportFn({ data: datePayload });
          break;
        case "vendor":
          res = await getVendorReportFn({ data: { startDate, endDate, tenantId: tId } });
          break;
        case "vat-summary":
          res = await getVatSummaryReportFn({ data: { startDate, endDate, tenantId: tId } });
          break;
        default:
          throw new Error("Invalid report type");
      }

      if (res && res.success) {
        setReportData(res.data);
      } else {
        throw new Error("Failed to load report data");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the report.");
      toast.error(err.message || "Report generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!reportData) return;
    
    try {
      if (reportData.isMasterReport) {
        let csv = "=== MASTER REPORT: PLATFORM OVERVIEW ===\n";
        csv += `Generated,${new Date().toLocaleString()}\n\n`;

        csv += "--- SECTION 1: TENANTS OVERVIEW ---\n";
        csv += "Tenant Name,Plan,Status,Outlets Count,Tills Count\n";
        reportData.section1_tenants.forEach((t: any) => {
          csv += `"${t.name}","${t.plan}","${t.status}","${t.outlets}","${t.tills}"\n`;
        });
        csv += "\n";

        csv += "--- SECTION 2: BILLING & REVENUE ---\n";
        if (reportData.section2_billingOverview) {
          const ov = reportData.section2_billingOverview;
          csv += `Total Onboarded Clients,${ov.totalTenants}\n`;
          csv += `Total Revenue Collected,${ov.totalRevenueCollected}\n`;
          csv += `Overdue Clients Count,${ov.overdueCount}\n`;
          csv += `Due Soon Count,${ov.dueSoonCount}\n\n`;
        }
        csv += "Tenant Name,Plan,Billing Status,Payment Punctuality,Total Paid All-Time,Last Payment Date,Last Payment Amount\n";
        reportData.section2_billingTenants.forEach((t: any) => {
          csv += `"${t.tenantName}","${t.plan}","${t.status}","${t.punctuality}","${t.totalPaidAllTime}","${t.lastPaymentDate}","${t.lastPaymentAmount}"\n`;
        });
        csv += "\n";

        csv += "--- SECTION 3: PLATFORM ANALYTICS & ACTIVITY LOG ---\n";
        if (reportData.section3_analytics) {
          const an = reportData.section3_analytics;
          csv += `Total Tenants,${an.totalTenants}\n`;
          csv += `Active Tenants,${an.activeTenants}\n`;
          csv += `Suspended Tenants,${an.suspendedTenants}\n\n`;
        }
        csv += "Timestamp,Level,Action\n";
        reportData.section3_activityLogs.forEach((log: any) => {
          csv += `"${log.timestamp}","${log.level}","${log.action}"\n`;
        });

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `master_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Master Report CSV downloaded successfully!");
        return;
      }

      if (reportData.isSubscriptionBilling) {
        let csv = "=== SUBSCRIPTION BILLING REPORT ===\n";
        csv += `Generated,${new Date().toLocaleString()}\n\n`;
        if (reportData.overview) {
          const ov = reportData.overview;
          csv += `Total Revenue Collected,${ov.totalRevenueCollected}\n`;
          csv += `Overdue Count,${ov.overdueCount}\n`;
          csv += `Due Soon Count,${ov.dueSoonCount}\n\n`;
        }
        csv += "Tenant Name,Plan,Billing Status,Payment Punctuality,Total Paid All-Time,Last Payment Date,Last Payment Amount\n";
        reportData.tenants.forEach((t: any) => {
          csv += `"${t.tenantName}","${t.plan}","${t.status}","${t.punctuality}","${t.totalPaidAllTime}","${t.lastPaymentDate}","${t.lastPaymentAmount}"\n`;
        });

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `subscription_billing_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Subscription Billing CSV downloaded successfully!");
        return;
      }

      if (reportData.isPlatformAnalytics) {
        let csv = "=== PLATFORM ANALYTICS REPORT ===\n";
        csv += `Generated,${new Date().toLocaleString()}\n\n`;
        if (reportData.tenantStats) {
          csv += `Total Tenants,${reportData.tenantStats.total}\n`;
          csv += `Active Tenants,${reportData.tenantStats.active}\n`;
          csv += `Suspended Tenants,${reportData.tenantStats.suspended}\n\n`;
        }
        csv += "Timestamp,Level,Action\n";
        reportData.systemLogs.forEach((log: any) => {
          csv += `"${log.timestamp}","${log.level}","${log.action}"\n`;
        });

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `platform_analytics_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Platform Analytics CSV downloaded successfully!");
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,";
      let headers: string[] = [];
      
      if (Array.isArray(reportData)) {
        if (reportData.length === 0) {
          toast.info("No data to export");
          return;
        }
        headers = Object.keys(reportData[0]);
        csvContent += headers.join(",") + "\n";
        
        reportData.forEach(item => {
          const row = headers.map(header => {
            let val = item[header];
            if (val === null || val === undefined) val = "";
            val = String(val).replace(/"/g, '""');
            return `"${val}"`;
          });
          csvContent += row.join(",") + "\n";
        });
      } else {
        headers = ["Metric", "Value"];
        csvContent += headers.join(",") + "\n";
        Object.entries(reportData).forEach(([key, val]) => {
          let strVal = String(val).replace(/"/g, '""');
          csvContent += `"${key}","${strVal}"\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to export CSV");
    }
  };

  const handleExportPdf = () => {
    if (!reportData) return;
    try {
      if (reportData.isMasterReport) {
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        
        // Header Banner
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 24, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("MASTER REPORT - PLATFORM OVERVIEW", 14, 15);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated: ${new Date().toLocaleString()}`, 145, 15);

        let currentY = 32;

        const checkPageBreak = (neededHeight: number) => {
          if (currentY + neededHeight > 275) {
            doc.addPage();
            currentY = 20;
          }
        };

        const renderSectionHeader = (title: string) => {
          checkPageBreak(12);
          doc.setFillColor(241, 245, 249);
          doc.rect(14, currentY, 182, 8, "F");
          doc.setDrawColor(203, 213, 225);
          doc.rect(14, currentY, 182, 8, "S");
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(title, 18, currentY + 5.5);
          currentY += 12;
        };

        // Section 1: Tenants Overview
        renderSectionHeader("SECTION 1: TENANTS OVERVIEW");
        if (reportData.section1_tenants.length > 0) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setFillColor(248, 250, 252);
          doc.rect(14, currentY - 3, 182, 6, "F");
          doc.text("Tenant Name", 16, currentY);
          doc.text("Plan", 75, currentY);
          doc.text("Status", 110, currentY);
          doc.text("Outlets", 145, currentY);
          doc.text("Tills", 175, currentY);
          currentY += 6;

          doc.setFont("helvetica", "normal");
          reportData.section1_tenants.forEach((t: any, idx: number) => {
            checkPageBreak(6);
            if (idx % 2 === 1) {
              doc.setFillColor(250, 250, 250);
              doc.rect(14, currentY - 4, 182, 6, "F");
            }
            doc.text(String(t.name).substring(0, 30), 16, currentY);
            doc.text(String(t.plan), 75, currentY);
            doc.text(String(t.status), 110, currentY);
            doc.text(String(t.outlets), 145, currentY);
            doc.text(String(t.tills), 175, currentY);
            currentY += 6;
          });
        } else {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text("No tenant records found.", 16, currentY);
          currentY += 6;
        }
        currentY += 4;

        // Section 2: Billing & Revenue
        renderSectionHeader("SECTION 2: BILLING & REVENUE");
        if (reportData.section2_billingOverview) {
          const ov = reportData.section2_billingOverview;
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text(`Onboarded Clients: ${ov.totalTenants}  |  Total Revenue: ${ov.totalRevenueCollected}  |  Overdue: ${ov.overdueCount}  |  Due Soon: ${ov.dueSoonCount}`, 16, currentY);
          currentY += 8;
        }

        if (reportData.section2_billingTenants.length > 0) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setFillColor(248, 250, 252);
          doc.rect(14, currentY - 3, 182, 6, "F");
          doc.text("Tenant", 16, currentY);
          doc.text("Plan", 50, currentY);
          doc.text("Status", 75, currentY);
          doc.text("Punctuality", 100, currentY);
          doc.text("Total Paid", 145, currentY);
          doc.text("Last Pay", 175, currentY);
          currentY += 6;

          doc.setFont("helvetica", "normal");
          reportData.section2_billingTenants.forEach((t: any, idx: number) => {
            checkPageBreak(6);
            if (idx % 2 === 1) {
              doc.setFillColor(250, 250, 250);
              doc.rect(14, currentY - 4, 182, 6, "F");
            }
            doc.text(String(t.tenantName).substring(0, 18), 16, currentY);
            doc.text(String(t.plan), 50, currentY);
            doc.text(String(t.status), 75, currentY);
            doc.text(String(t.punctuality).substring(0, 22), 100, currentY);
            doc.text(String(t.totalPaidAllTime), 145, currentY);
            doc.text(String(t.lastPaymentDate), 175, currentY);
            currentY += 6;
          });
        }
        currentY += 4;

        // Section 3: Platform Analytics & Activity Log
        renderSectionHeader("SECTION 3: PLATFORM ANALYTICS & ACTIVITY LOG");
        if (reportData.section3_analytics) {
          const an = reportData.section3_analytics;
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text(`Total Tenants: ${an.totalTenants}  |  Active Tenants: ${an.activeTenants}  |  Suspended Tenants: ${an.suspendedTenants}`, 16, currentY);
          currentY += 8;
        }

        if (reportData.section3_activityLogs.length > 0) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setFillColor(248, 250, 252);
          doc.rect(14, currentY - 3, 182, 6, "F");
          doc.text("Timestamp", 16, currentY);
          doc.text("Level", 50, currentY);
          doc.text("Action Details", 75, currentY);
          currentY += 6;

          doc.setFont("helvetica", "normal");
          reportData.section3_activityLogs.forEach((log: any, idx: number) => {
            checkPageBreak(6);
            if (idx % 2 === 1) {
              doc.setFillColor(250, 250, 250);
              doc.rect(14, currentY - 4, 182, 6, "F");
            }
            doc.text(String(log.timestamp), 16, currentY);
            doc.text(String(log.level), 50, currentY);
            doc.text(String(log.action).substring(0, 65), 75, currentY);
            currentY += 6;
          });
        } else {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text("No activity logs found.", 16, currentY);
          currentY += 6;
        }

        doc.save(`master_report_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("Master Report PDF downloaded successfully!");
        return;
      }

      if (reportData.isSubscriptionBilling) {
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 24, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("SUBSCRIPTION BILLING REPORT", 14, 15);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated: ${new Date().toLocaleString()}`, 145, 15);

        let currentY = 35;
        if (reportData.overview) {
          const ov = reportData.overview;
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(`Total Revenue Collected: AED ${(ov.totalRevenueCollected || 0).toFixed(2)}`, 14, currentY);
          doc.text(`Overdue Count: ${ov.overdueCount}  |  Due Soon Count: ${ov.dueSoonCount}`, 120, currentY);
          currentY += 10;
        }

        if (reportData.tenants.length > 0) {
          doc.setFillColor(241, 245, 249);
          doc.rect(14, currentY - 4, 182, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text("Tenant", 16, currentY);
          doc.text("Plan", 50, currentY);
          doc.text("Status", 75, currentY);
          doc.text("Punctuality", 100, currentY);
          doc.text("Total Paid", 145, currentY);
          doc.text("Last Pay", 175, currentY);
          currentY += 8;

          doc.setFont("helvetica", "normal");
          reportData.tenants.forEach((t: any, idx: number) => {
            if (currentY > 270) {
              doc.addPage();
              currentY = 20;
            }
            if (idx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(14, currentY - 4, 182, 6, "F");
            }
            doc.text(String(t.tenantName).substring(0, 18), 16, currentY);
            doc.text(String(t.plan), 50, currentY);
            doc.text(String(t.status), 75, currentY);
            doc.text(String(t.punctuality).substring(0, 22), 100, currentY);
            doc.text(String(t.totalPaidAllTime), 145, currentY);
            doc.text(String(t.lastPaymentDate), 175, currentY);
            currentY += 6;
          });
        }

        doc.save(`subscription_billing_report_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("Subscription Billing PDF downloaded successfully!");
        return;
      }

      if (reportData.isPlatformAnalytics) {
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 24, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("PLATFORM ANALYTICS REPORT", 14, 15);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated: ${new Date().toLocaleString()}`, 145, 15);

        let currentY = 35;
        if (reportData.tenantStats) {
          const ts = reportData.tenantStats;
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(`Total Tenants: ${ts.total}  |  Active Tenants: ${ts.active}  |  Suspended Tenants: ${ts.suspended}`, 14, currentY);
          currentY += 10;
        }

        if (reportData.systemLogs.length > 0) {
          doc.setFillColor(241, 245, 249);
          doc.rect(14, currentY - 4, 182, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text("Timestamp", 16, currentY);
          doc.text("Level", 50, currentY);
          doc.text("Action Details", 75, currentY);
          currentY += 8;

          doc.setFont("helvetica", "normal");
          reportData.systemLogs.forEach((log: any, idx: number) => {
            if (currentY > 270) {
              doc.addPage();
              currentY = 20;
            }
            if (idx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(14, currentY - 4, 182, 6, "F");
            }
            doc.text(String(log.timestamp), 16, currentY);
            doc.text(String(log.level), 50, currentY);
            doc.text(String(log.action).substring(0, 65), 75, currentY);
            currentY += 6;
          });
        }

        doc.save(`platform_analytics_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("Platform Analytics PDF downloaded successfully!");
        return;
      }

      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      
      // Header Banner
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 24, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`${reportType.replace("-", " ").toUpperCase()} REPORT`, 14, 15);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 15);

      // Metadata Subtitle
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      let currentY = 32;
      
      if (needsDate) {
        doc.text(`Date Range: ${startDate} to ${endDate}`, 14, currentY);
        currentY += 6;
      }
      
      if (isSuperAdmin) {
        doc.text(`Scope: ${selectedTenantId === "all" || !selectedTenantId ? "All Tenants (Platform-Wide)" : `Tenant ID: ${selectedTenantId}`}`, 14, currentY);
        currentY += 6;
      }

      currentY += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY, 196, currentY);
      currentY += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      if (Array.isArray(reportData)) {
        if (reportData.length === 0) {
          doc.text("No records found for this selection.", 14, currentY);
        } else {
          const headers = Object.keys(reportData[0]);
          // Render Table Header
          doc.setFillColor(241, 245, 249);
          doc.rect(14, currentY - 4, 182, 7, "F");
          doc.setFont("helvetica", "bold");
          
          let colX = 16;
          const colWidth = Math.min(178 / headers.length, 45);
          headers.forEach(h => {
            const label = h.replace(/([A-Z])/g, ' $1').trim().toUpperCase().substring(0, 15);
            doc.text(label, colX, currentY);
            colX += colWidth;
          });

          currentY += 8;
          doc.setFont("helvetica", "normal");

          reportData.forEach((rowObj, idx) => {
            if (currentY > 270) {
              doc.addPage();
              currentY = 20;
            }
            if (idx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(14, currentY - 4, 182, 6, "F");
            }
            let rowX = 16;
            headers.forEach(h => {
              const val = rowObj[h] !== null && rowObj[h] !== undefined ? String(rowObj[h]) : "-";
              doc.text(val.substring(0, 18), rowX, currentY);
              rowX += colWidth;
            });
            currentY += 6;
          });
        }
      } else {
        // Summary Object Cards
        Object.entries(reportData).forEach(([key, val]) => {
          if (key === 'notes') return;
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
          const strVal = val !== null && val !== undefined ? String(val) : "-";
          
          doc.setFont("helvetica", "bold");
          doc.text(`${label}:`, 16, currentY);
          doc.setFont("helvetica", "normal");
          doc.text(strVal, 90, currentY);
          currentY += 7;
        });

        if (reportData.notes) {
          currentY += 6;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.text(`Note: ${reportData.notes}`, 14, currentY);
        }
      }

      doc.save(`${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF report downloaded successfully!");
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast.error(err?.message || "Failed to export PDF");
    }
  };

  const needsDate = !["inventory-valuation", "low-stock", "expiry", "master-report", "subscription-billing", "platform-analytics"].includes(reportType);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
        <div className="space-y-2 w-full sm:w-1/3">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {isSuperAdmin ? (
                <>
                  <SelectItem value="master-report">Master Report (Platform Overview)</SelectItem>
                  <SelectItem value="subscription-billing">Subscription Billing Report</SelectItem>
                  <SelectItem value="platform-analytics">Platform Analytics Report</SelectItem>
                  <SelectItem value="sales-summary">Sales Summary</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="sales-summary">Sales Summary</SelectItem>
                  <SelectItem value="branch-sales">Branch Sales</SelectItem>
                  <SelectItem value="product-sales">Product Sales</SelectItem>
                  <SelectItem value="category-sales">Category Sales</SelectItem>
                  <SelectItem value="cashier-sales">Cashier Sales</SelectItem>
                  <SelectItem value="inventory-valuation">Inventory Valuation</SelectItem>
                  <SelectItem value="low-stock">Low Stock Report</SelectItem>
                  <SelectItem value="expiry">Near Expiry Batches</SelectItem>
                  <SelectItem value="purchase">Purchase Orders</SelectItem>
                  <SelectItem value="vendor">Vendor Spend</SelectItem>
                  <SelectItem value="vat-summary">UAE VAT Summary</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {needsDate && (
          <>
            <div className="space-y-2 w-full sm:w-1/5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2 w-full sm:w-1/5">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </>
        )}

        <div className="space-y-2 w-full sm:w-1/5">
          <Label>Branch</Label>
          <Select value={branchId} onValueChange={setBranchId} disabled={reportType === 'branch-sales' || reportType === 'master-report' || reportType === 'subscription-billing' || reportType === 'platform-analytics'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branchesRes?.success && branchesRes.branches?.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto font-bold rounded-xl">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          Generate
        </Button>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden min-h-[400px]">
        {!reportData && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-[400px] text-stone-400">
            <FileText className="h-16 w-16 mb-4 opacity-20" />
            <p className="font-medium text-lg text-ink/70">Select options and generate a report</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-[400px] text-primary">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p className="font-bold animate-pulse">Crunching platform overview data...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-[400px] text-destructive">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {reportData && !loading && (
          <div className="p-4 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-lg capitalize">{reportType.replace("-", " ")} Results</h3>
                {needsDate && <p className="text-sm text-muted-foreground">Period: {startDate} to {endDate}</p>}
                {reportData.scope && <p className="text-xs font-semibold text-primary mt-0.5">Scope: {reportData.scope}</p>}
                {reportType === "vat-summary" && <p className="text-xs text-warning mt-1">{reportData.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportCsv} className="rounded-full shadow-sm text-xs">
                  <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" /> Export CSV
                </Button>
                <Button variant="outline" onClick={handleExportPdf} className="rounded-full shadow-sm text-xs">
                  <Download className="h-4 w-4 mr-1.5 text-rose-600" /> Export PDF
                </Button>
              </div>
            </div>

            {/* Master Report UI */}
            {reportData.isMasterReport && (
              <div className="space-y-8">
                {/* Section 1: Tenants Overview */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 border-b border-stone-200 pb-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-base">Section 1: Tenants Overview</h4>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <Table>
                      <TableHeader className="bg-stone-50">
                        <TableRow>
                          <TableHead className="font-bold">Tenant Name</TableHead>
                          <TableHead className="font-bold">Plan</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="font-bold text-right">Outlets / Branches</TableHead>
                          <TableHead className="font-bold text-right">Tills Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.section1_tenants.map((t: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold">{t.name}</TableCell>
                            <TableCell>{t.plan}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {t.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">{t.outlets}</TableCell>
                            <TableCell className="text-right font-medium">{t.tills}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Section 2: Subscription Billing & Revenue */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 border-b border-stone-200 pb-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-base">Section 2: Billing & Revenue (Platform Subscription Income)</h4>
                  </div>

                  {reportData.section2_billingOverview && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-medium text-slate-600">Total Onboarded Clients</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">
                          {reportData.section2_billingOverview.totalTenants}
                        </p>
                      </div>
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                        <p className="text-xs font-medium text-emerald-700">Total Revenue Collected (All-Time)</p>
                        <p className="text-xl font-bold text-emerald-900 mt-1">
                          {reportData.section2_billingOverview.totalRevenueCollected}
                        </p>
                      </div>
                      <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                        <p className="text-xs font-medium text-rose-700">Overdue Clients Count</p>
                        <p className="text-xl font-bold text-rose-900 mt-1">
                          {reportData.section2_billingOverview.overdueCount}
                        </p>
                      </div>
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                        <p className="text-xs font-medium text-amber-700">Due Soon Count</p>
                        <p className="text-xl font-bold text-amber-900 mt-1">
                          {reportData.section2_billingOverview.dueSoonCount}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <Table>
                      <TableHeader className="bg-stone-50">
                        <TableRow>
                          <TableHead className="font-bold">Tenant Name</TableHead>
                          <TableHead className="font-bold">Plan</TableHead>
                          <TableHead className="font-bold">Billing Status</TableHead>
                          <TableHead className="font-bold">Payment Punctuality Track Record</TableHead>
                          <TableHead className="font-bold">Total Paid (All-Time)</TableHead>
                          <TableHead className="font-bold">Last Payment Date</TableHead>
                          <TableHead className="font-bold">Last Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.section2_billingTenants.map((t: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold">{t.tenantName}</TableCell>
                            <TableCell>{t.plan}</TableCell>
                            <TableCell>{t.status}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.punctuality.startsWith('Paid On Time') ? 'bg-emerald-100 text-emerald-800' : t.punctuality.startsWith('Paid Late') ? 'bg-amber-100 text-amber-800' : t.punctuality.startsWith('Payment Overdue') ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                                {t.punctuality}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold">{t.totalPaidAllTime}</TableCell>
                            <TableCell>{t.lastPaymentDate}</TableCell>
                            <TableCell>{t.lastPaymentAmount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Section 3: Platform Activity Log & Tenant Counts */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 border-b border-stone-200 pb-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-base">Section 3: Platform Activity Log & Tenant Counts</h4>
                  </div>

                  {reportData.section3_analytics && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                        <p className="text-xs text-stone-500 font-medium">Total Tenants</p>
                        <p className="text-lg font-bold text-ink truncate mt-1">{reportData.section3_analytics.totalTenants}</p>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                        <p className="text-xs text-stone-500 font-medium">Active Tenants</p>
                        <p className="text-lg font-bold text-emerald-700 truncate mt-1">{reportData.section3_analytics.activeTenants}</p>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                        <p className="text-xs text-stone-500 font-medium">Suspended Tenants</p>
                        <p className="text-lg font-bold text-rose-700 truncate mt-1">{reportData.section3_analytics.suspendedTenants}</p>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <Table>
                      <TableHeader className="bg-stone-50">
                        <TableRow>
                          <TableHead className="font-bold">Timestamp</TableHead>
                          <TableHead className="font-bold">Level</TableHead>
                          <TableHead className="font-bold">Platform Action Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.section3_activityLogs.map((log: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs text-stone-600">{log.timestamp}</TableCell>
                            <TableCell>
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {log.level}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-ink">{log.action}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Billing UI */}
            {reportData.isSubscriptionBilling && (
              <div className="space-y-6">
                {reportData.overview && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <p className="text-xs font-medium text-emerald-700">Total Revenue Collected</p>
                      <p className="text-xl font-bold text-emerald-900 mt-1">
                        AED {(reportData.overview.totalRevenueCollected || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                      <p className="text-xs font-medium text-rose-700">Overdue Tenants</p>
                      <p className="text-xl font-bold text-rose-900 mt-1">{reportData.overview.overdueCount}</p>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                      <p className="text-xs font-medium text-amber-700">Due Soon Tenants</p>
                      <p className="text-xl font-bold text-amber-900 mt-1">{reportData.overview.dueSoonCount}</p>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <Table>
                    <TableHeader className="bg-stone-50">
                      <TableRow>
                        <TableHead className="font-bold">Tenant Name</TableHead>
                        <TableHead className="font-bold">Plan</TableHead>
                        <TableHead className="font-bold">Billing Status</TableHead>
                        <TableHead className="font-bold">Payment Punctuality</TableHead>
                        <TableHead className="font-bold">Total Paid</TableHead>
                        <TableHead className="font-bold">Last Payment Date</TableHead>
                        <TableHead className="font-bold">Last Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.tenants.map((t: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold">{t.tenantName}</TableCell>
                          <TableCell>{t.plan}</TableCell>
                          <TableCell>{t.status}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.punctuality.startsWith('Paid On Time') ? 'bg-emerald-100 text-emerald-800' : t.punctuality.startsWith('Paid Late') ? 'bg-amber-100 text-amber-800' : t.punctuality.startsWith('Payment Overdue') ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                              {t.punctuality}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">{t.totalPaidAllTime}</TableCell>
                          <TableCell>{t.lastPaymentDate}</TableCell>
                          <TableCell>{t.lastPaymentAmount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Platform Analytics UI */}
            {reportData.isPlatformAnalytics && (
              <div className="space-y-6">
                {reportData.tenantStats && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-medium text-slate-600">Total Tenants</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{reportData.tenantStats.total}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <p className="text-xs font-medium text-emerald-700">Active Tenants</p>
                      <p className="text-xl font-bold text-emerald-900 mt-1">{reportData.tenantStats.active}</p>
                    </div>
                    <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                      <p className="text-xs font-medium text-rose-700">Suspended Tenants</p>
                      <p className="text-xl font-bold text-rose-900 mt-1">{reportData.tenantStats.suspended}</p>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <Table>
                    <TableHeader className="bg-stone-50">
                      <TableRow>
                        <TableHead className="font-bold">Timestamp</TableHead>
                        <TableHead className="font-bold">Level</TableHead>
                        <TableHead className="font-bold">Platform Action Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.systemLogs.map((log: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs text-stone-600">{log.timestamp}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {log.level}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-ink">{log.action}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Standard Array & Object Reports UI */}
            {!reportData.isMasterReport && !reportData.isSubscriptionBilling && !reportData.isPlatformAnalytics && (
              <div className="overflow-x-auto">
                {Array.isArray(reportData) ? (
                  reportData.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-stone-50">
                        <TableRow>
                          {Object.keys(reportData[0]).map(key => (
                            <TableHead key={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((val: any, j) => (
                              <TableCell key={j}>
                                {val !== null && val !== undefined ? String(val) : "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-stone-500 font-medium">No results found for this period/filter.</div>
                  )
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(reportData).map(([key, val]) => {
                      if (key === 'notes' || key === 'scope' || key.startsWith('is')) return null;
                      return (
                        <div key={key} className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                          <p className="text-sm text-stone-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-2xl font-bold text-ink truncate mt-1">
                            {val !== null && val !== undefined ? String(val) : "-"}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
