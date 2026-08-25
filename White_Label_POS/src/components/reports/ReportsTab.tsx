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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";
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
  getVatSummaryReportFn
} from "@/lib/reports-server";
import { useQuery } from "@tanstack/react-query";
import { getBranchesServerFn } from "@/lib/super-admin-server"; // Assuming this is available

export function ReportsTab() {
  const [reportType, setReportType] = useState<string>("sales-summary");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  // Default end date is tomorrow to make it inclusive of today since our backend uses lt(endDate)
  const [endDate, setEndDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
  );
  const [branchId, setBranchId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: branchesRes } = useQuery({
    queryKey: ['head-office-branches'],
    queryFn: async () => await getBranchesServerFn(),
  });

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      let res;
      const bId = branchId === "all" ? undefined : branchId;
      
      switch (reportType) {
        case "sales-summary":
          res = await getSalesSummaryReportFn({ data: { startDate, endDate, branchId: bId } });
          break;
        case "branch-sales":
          res = await getBranchSalesReportFn({ data: { startDate, endDate } });
          break;
        case "product-sales":
          res = await getProductSalesReportFn({ data: { startDate, endDate, branchId: bId } });
          break;
        case "category-sales":
          res = await getCategorySalesReportFn({ data: { startDate, endDate, branchId: bId } });
          break;
        case "cashier-sales":
          res = await getCashierSalesReportFn({ data: { startDate, endDate, branchId: bId } });
          break;
        case "inventory-valuation":
          res = await getInventoryValuationReportFn({ data: { branchId: bId } });
          break;
        case "low-stock":
          res = await getLowStockReportFn({ data: { branchId: bId } });
          break;
        case "expiry":
          res = await getExpiryReportFn({ data: { branchId: bId, daysThreshold: 30 } }); // Hardcoded 30 days for now
          break;
        case "purchase":
          res = await getPurchaseReportFn({ data: { startDate, endDate, branchId: bId } });
          break;
        case "vendor":
          res = await getVendorReportFn({ data: { startDate, endDate } });
          break;
        case "vat-summary":
          res = await getVatSummaryReportFn({ data: { startDate, endDate } });
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
      let csvContent = "data:text/csv;charset=utf-8,";
      let headers: string[] = [];
      let rows: any[] = [];
      
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
            val = String(val).replace(/"/g, '""'); // escape quotes
            return `"${val}"`;
          });
          csvContent += row.join(",") + "\n";
        });
      } else {
        // Object (Summary Report)
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
    } catch (err) {
      toast.error("Failed to export CSV");
    }
  };

  const needsDate = !["inventory-valuation", "low-stock", "expiry"].includes(reportType);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
        <div className="space-y-2 w-full sm:w-1/4">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sales-summary">Sales Summary</SelectItem>
              <SelectItem value="branch-sales">Branch Sales</SelectItem>
              <SelectItem value="product-sales">Product Sales</SelectItem>
              <SelectItem value="category-sales">Category Sales</SelectItem>
              <SelectItem value="cashier-sales">Cashier Sales</SelectItem>
              <SelectItem value="inventory-valuation">Inventory Valuation</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="expiry">Expiry (30 Days)</SelectItem>
              <SelectItem value="purchase">Purchase Orders</SelectItem>
              <SelectItem value="vendor">Vendor Summary</SelectItem>
              <SelectItem value="vat-summary">UAE VAT Summary</SelectItem>
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
          <Select value={branchId} onValueChange={setBranchId} disabled={reportType === 'branch-sales'}>
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
            <p className="font-bold animate-pulse">Crunching numbers...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-[400px] text-destructive">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {reportData && !loading && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg capitalize">{reportType.replace("-", " ")} Results</h3>
                {needsDate && <p className="text-sm text-muted-foreground">Period: {startDate} to {endDate}</p>}
                {reportType === "vat-summary" && <p className="text-xs text-warning mt-1">{reportData.notes}</p>}
              </div>
              <Button variant="outline" onClick={handleExportCsv} className="rounded-full shadow-sm">
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </div>

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
                    if (key === 'notes') return null;
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
          </div>
        )}
      </div>
    </div>
  );
}
