import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Toast, ToastType } from '../ui/Toast';
import { useAuth } from '../../lib/auth';
import { useHeadOffice } from '../../lib/HeadOfficeContext';
import { apiClient } from '../../lib/apiClient';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  Tag,
  Users,
  DollarSign,
  Package,
  Clock,
  Truck,
  Check,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';

export type OperationalReportType =
  | 'sales-summary'
  | 'branch-sales'
  | 'product-sales'
  | 'category-sales'
  | 'cashier-sales'
  | 'inventory-valuation'
  | 'low-stock'
  | 'expiry'
  | 'purchase'
  | 'vendor'
  | 'vat-summary';

type DatePreset = 'today' | 'yesterday' | 'last-7' | 'last-30' | 'this-month' | 'custom';

interface ReportMeta {
  key: OperationalReportType;
  label: string;
  shortDesc: string;
  icon: (color: string) => React.ReactNode;
  usesDate: boolean;
  usesBranch: boolean;
  usesExpiryThreshold: boolean;
}

const REPORT_DEFINITIONS: ReportMeta[] = [
  {
    key: 'sales-summary',
    label: 'Sales Summary',
    shortDesc: 'Aggregated revenue, net sales & order count',
    icon: (c) => <TrendingUp size={16} color={c} />,
    usesDate: true,
    usesBranch: true,
    usesExpiryThreshold: false,
  },
  {
    key: 'branch-sales',
    label: 'Branch Sales',
    shortDesc: 'Performance breakdown across all active outlets',
    icon: (c) => <Building2 size={16} color={c} />,
    usesDate: true,
    usesBranch: false,
    usesExpiryThreshold: false,
  },
  {
    key: 'product-sales',
    label: 'Product Sales',
    shortDesc: 'Volume sold and gross turnover per item',
    icon: (c) => <ShoppingBag size={16} color={c} />,
    usesDate: true,
    usesBranch: true,
    usesExpiryThreshold: false,
  },
  {
    key: 'category-sales',
    label: 'Category Sales',
    shortDesc: 'Sales distribution by catalog category',
    icon: (c) => <Tag size={16} color={c} />,
    usesDate: true,
    usesBranch: true,
    usesExpiryThreshold: false,
  },
  {
    key: 'cashier-sales',
    label: 'Cashier Sales',
    shortDesc: 'Till volume & receipts per cashier staff',
    icon: (c) => <Users size={16} color={c} />,
    usesDate: true,
    usesBranch: true,
    usesExpiryThreshold: false,
  },
  {
    key: 'inventory-valuation',
    label: 'Inventory Valuation',
    shortDesc: 'Current holding value based on product cost price',
    icon: (c) => <DollarSign size={16} color={c} />,
    usesDate: false,
    usesBranch: true,
    usesExpiryThreshold: false,
  },
  {
    key: 'low-stock',
    label: 'Low Stock Alert',
    shortDesc: 'Items below defined reorder point threshold',
    icon: (c) => <AlertTriangle size={16} color={c} />,
    usesDate: false,
    usesBranch: true,
    usesExpiryThreshold: false,
  },
  {
    key: 'expiry',
    label: 'Expiry Batches',
    shortDesc: 'Batches approaching shelf-life threshold',
    icon: (c) => <Clock size={16} color={c} />,
    usesDate: false,
    usesBranch: true,
    usesExpiryThreshold: true,
  },
  {
    key: 'purchase',
    label: 'Purchase Orders',
    shortDesc: 'History of procurement POs and statuses',
    icon: (c) => <Package size={16} color={c} />,
    usesDate: true,
    usesBranch: true,
    usesExpiryThreshold: false,
  },
  {
    key: 'vendor',
    label: 'Vendor Purchases',
    shortDesc: 'Total spend volume grouped by vendor profile',
    icon: (c) => <Truck size={16} color={c} />,
    usesDate: true,
    usesBranch: false,
    usesExpiryThreshold: false,
  },
  {
    key: 'vat-summary',
    label: 'VAT Summary',
    shortDesc: 'Output VAT, taxable sales and statutory TRN',
    icon: (c) => <FileText size={16} color={c} />,
    usesDate: true,
    usesBranch: false,
    usesExpiryThreshold: false,
  },
];

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

export function HeadOfficeReportsVat({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const { branches } = useHeadOffice();

  // Active report
  const [activeReport, setActiveReport] = useState<OperationalReportType>('sales-summary');

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>('this-month');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [daysThreshold, setDaysThreshold] = useState<number>(30);
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  // Data & loading
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'error') => setToast({ message, type });

  const activeDef = useMemo(
    () => REPORT_DEFINITIONS.find((r) => r.key === activeReport) || REPORT_DEFINITIONS[0],
    [activeReport]
  );

  // Compute date range
  const { startDateStr, endDateStr } = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (datePreset === 'today') {
      const d = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { startDateStr: d, endDateStr: d };
    }

    if (datePreset === 'yesterday') {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const d = `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;
      return { startDateStr: d, endDateStr: d };
    }

    if (datePreset === 'last-7') {
      const p = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        startDateStr: `${p.getFullYear()}-${pad(p.getMonth() + 1)}-${pad(p.getDate())}`,
        endDateStr: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      };
    }

    if (datePreset === 'last-30') {
      const p = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        startDateStr: `${p.getFullYear()}-${pad(p.getMonth() + 1)}-${pad(p.getDate())}`,
        endDateStr: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      };
    }

    if (datePreset === 'this-month') {
      const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      return { startDateStr: start, endDateStr: end };
    }

    return {
      startDateStr: customStart || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
      endDateStr: customEnd || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    };
  }, [datePreset, customStart, customEnd]);

  // Fetch report handler
  const fetchReport = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const queryParts: string[] = [];

        if (activeDef.usesDate) {
          queryParts.push(`startDate=${encodeURIComponent(startDateStr)}`);
          queryParts.push(`endDate=${encodeURIComponent(endDateStr)}`);
        }

        if (activeDef.usesBranch && selectedBranchId !== 'all') {
          queryParts.push(`branchId=${encodeURIComponent(selectedBranchId)}`);
        }

        if (activeDef.usesExpiryThreshold) {
          queryParts.push(`daysThreshold=${daysThreshold}`);
        }

        const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const res = await apiClient.get<any>(`/operational-reports/${activeReport}${qs}`);

        if (res?.success && res.data !== undefined) {
          setReportData(res.data);
        } else {
          setReportData(null);
          showToast(res?.error || 'Failed to load report data', 'error');
        }
      } catch (err: any) {
        console.error('Error loading operational report:', err);
        showToast(err.message || 'Error fetching report data', 'error');
        setReportData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeReport, activeDef, startDateStr, endDateStr, selectedBranchId, daysThreshold]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const selectedBranchName = useMemo(() => {
    if (selectedBranchId === 'all') return 'All Branches';
    const found = branches.find((b: any) => b.id === selectedBranchId);
    return found?.name || 'Selected Branch';
  }, [selectedBranchId, branches]);

  // Export CSV
  const handleExportCsv = async () => {
    if (!reportData) {
      showToast('No report data available to export', 'warn');
      return;
    }
    setExportingCsv(true);

    try {
      let csvContent = '';
      const filename = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;

      if (activeReport === 'sales-summary') {
        csvContent = [
          'Metric,Value',
          `Order Count,${escapeCsv(reportData.orderCount)}`,
          `Net Sales (AED),${escapeCsv(reportData.netSales)}`,
          `VAT Amount (AED),${escapeCsv(reportData.vatAmount)}`,
          `Total Sales (AED),${escapeCsv(reportData.totalSales)}`,
          `Average Order Value (AED),${escapeCsv(reportData.averageOrderValue)}`,
          `Scope,${escapeCsv(reportData.scope)}`,
        ].join('\n');
      } else if (activeReport === 'vat-summary') {
        csvContent = [
          'Metric,Value',
          `TRN,${escapeCsv(reportData.trn)}`,
          `Taxable Orders Count,${escapeCsv(reportData.taxableOrdersCount)}`,
          `Standard Rated Sales Ex-VAT (AED),${escapeCsv(reportData.salesExVat)}`,
          `VAT Amount (AED),${escapeCsv(reportData.vatAmount)}`,
          `Total Sales Inc-VAT (AED),${escapeCsv(reportData.salesIncVat)}`,
          `Period Start,${escapeCsv(formatDate(reportData.periodStart))}`,
          `Period End,${escapeCsv(formatDate(reportData.periodEnd))}`,
        ].join('\n');
      } else if (Array.isArray(reportData)) {
        if (reportData.length === 0) {
          showToast('No records to export', 'warn');
          setExportingCsv(false);
          return;
        }

        if (activeReport === 'branch-sales') {
          const headers = ['Branch Name', 'Order Count', 'Net Sales (AED)', 'VAT (AED)', 'Total Sales (AED)'];
          const rows = reportData.map((r: any) =>
            [
              escapeCsv(r.branchName),
              escapeCsv(r.orderCount),
              escapeCsv(Number(r.netSales || 0).toFixed(2)),
              escapeCsv(Number(r.vatAmount || 0).toFixed(2)),
              escapeCsv(Number(r.totalSales || 0).toFixed(2)),
            ].join(',')
          );
          csvContent = [headers.join(','), ...rows].join('\n');
        } else if (activeReport === 'product-sales') {
          const headers = ['Product Name', 'Barcode', 'Quantity Sold', 'Gross Sales (AED)'];
          const rows = reportData.map((r: any) =>
            [
              escapeCsv(r.productName),
              escapeCsv(r.barcode || 'N/A'),
              escapeCsv(r.quantitySold),
              escapeCsv(Number(r.grossSales || 0).toFixed(2)),
            ].join(',')
          );
          csvContent = [headers.join(','), ...rows].join('\n');
        } else if (activeReport === 'category-sales') {
          const headers = ['Category', 'Quantity Sold', 'Order Line Count', 'Gross Sales (AED)'];
          const rows = reportData.map((r: any) =>
            [
              escapeCsv(r.category),
              escapeCsv(r.quantitySold),
              escapeCsv(r.orderLineCount),
              escapeCsv(Number(r.grossSales || 0).toFixed(2)),
            ].join(',')
          );
          csvContent = [headers.join(','), ...rows].join('\n');
        } else if (activeReport === 'cashier-sales') {
          const headers = ['Cashier Name', 'Order Count', 'Net Sales (AED)', 'VAT (AED)', 'Total Sales (AED)'];
          const rows = reportData.map((r: any) =>
            [
              escapeCsv(r.cashierName || 'Unassigned'),
              escapeCsv(r.orderCount),
              escapeCsv(Number(r.netSales || 0).toFixed(2)),
              escapeCsv(Number(r.vatAmount || 0).toFixed(2)),
              escapeCsv(Number(r.totalSales || 0).toFixed(2)),
            ].join(',')
          );
          csvContent = [headers.join(','), ...rows].join('\n');
        } else if (activeReport === 'inventory-valuation') {
          const headers = ['Branch', 'Product Name', 'Stock Qty', 'Unit Cost (AED)', 'Total Cost Value (AED)'];
          const rows = reportData.map((r: any) =>
            [
              escapeCsv(r.branchName),
              escapeCsv(r.productName),
              escapeCsv(r.quantity),
              escapeCsv(Number(r.unitCost || 0).toFixed(2)),
              escapeCsv(Number(r.totalCostValue || 0).toFixed(2)),
            ].join(',')
          );
          csvContent = [headers.join(','), ...rows].join('\n');
        } else if (activeReport === 'low-stock') {
          const headers = ['Branch', 'Product Name', 'Current Stock', 'Reorder Threshold', 'Shortage Qty'];
          const rows = reportData.map((r: any) =>
            [
              escapeCsv(r.branchName),
              escapeCsv(r.productName),
              escapeCsv(r.currentQuantity),
              escapeCsv(r.threshold),
              escapeCsv(r.shortage),
            ].join(',')
          );
          csvContent = [headers.join(','), ...rows].join('\n');
        } else if (activeReport === 'expiry') {
          const headers = ['Branch', 'Product Name', 'Batch Number', 'Stock Qty', 'Expiry Date', 'Days Remaining'];
          const rows = reportData.map((r: any) =>
            [
              escapeCsv(r.branchName || 'All Outlets'),
              escapeCsv(r.productName),
              escapeCsv(r.batchNumber),
              escapeCsv(r.quantity),
              escapeCsv(formatDate(r.expiryDate)),
              escapeCsv(Math.round(r.daysRemaining || 0)),
            ].join(',')
          );
          csvContent = [headers.join(','), ...rows].join('\n');
        } else if (activeReport === 'purchase') {
          const headers = ['PO ID', 'Vendor', 'Branch', 'PO Date', 'Status', 'Total Amount (AED)'];
          const rows = reportData.map((r: any) =>
            [
              escapeCsv(r.poId),
              escapeCsv(r.vendorName),
              escapeCsv(r.branchName || 'N/A'),
              escapeCsv(formatDate(r.poDate)),
              escapeCsv(r.status),
              escapeCsv(Number(r.totalAmount || 0).toFixed(2)),
            ].join(',')
          );
          csvContent = [headers.join(','), ...rows].join('\n');
        } else if (activeReport === 'vendor') {
          const headers = ['Vendor Name', 'Purchase Count', 'Total Spend (AED)'];
          const rows = reportData.map((r: any) =>
            [
              escapeCsv(r.vendorName),
              escapeCsv(r.purchaseCount),
              escapeCsv(Number(r.totalPurchaseValue || 0).toFixed(2)),
            ].join(',')
          );
          csvContent = [headers.join(','), ...rows].join('\n');
        }
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Exported ${activeDef.label} (CSV) successfully!`, 'success');
      } else {
        const fileUri = `${documentDirectory}${filename}`;
        await writeAsStringAsync(fileUri, csvContent, { encoding: EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: `Export ${activeDef.label}`,
            UTI: 'public.comma-separated-values-text',
          });
        }
        showToast(`Exported ${activeDef.label} (CSV) successfully!`, 'success');
      }
    } catch (err: any) {
      console.error('Export CSV error:', err);
      showToast(err.message || 'Failed to export CSV', 'error');
    } finally {
      setExportingCsv(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!reportData) {
      showToast('No report data available to export', 'warn');
      return;
    }
    setExportingPdf(true);

    try {
      const generatedDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      let contentHtml = '';

      if (activeReport === 'sales-summary') {
        contentHtml = `
          <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-label">Orders</div><div class="kpi-val">${reportData.orderCount}</div></div>
            <div class="kpi-card"><div class="kpi-label">Net Sales</div><div class="kpi-val">AED ${reportData.netSales}</div></div>
            <div class="kpi-card"><div class="kpi-label">VAT (5%)</div><div class="kpi-val">AED ${reportData.vatAmount}</div></div>
            <div class="kpi-card"><div class="kpi-label">Total Sales</div><div class="kpi-val" style="color: #166534;">AED ${reportData.totalSales}</div></div>
            <div class="kpi-card"><div class="kpi-label">Avg Order Value</div><div class="kpi-val">AED ${reportData.averageOrderValue}</div></div>
          </div>
        `;
      } else if (activeReport === 'vat-summary') {
        contentHtml = `
          <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-label">TRN Number</div><div class="kpi-val" style="font-size: 13px;">${reportData.trn}</div></div>
            <div class="kpi-card"><div class="kpi-label">Taxable Orders</div><div class="kpi-val">${reportData.taxableOrdersCount}</div></div>
            <div class="kpi-card"><div class="kpi-label">Net Sales (Ex-VAT)</div><div class="kpi-val">AED ${reportData.salesExVat}</div></div>
            <div class="kpi-card"><div class="kpi-label">Output VAT</div><div class="kpi-val" style="color: #0284c7;">AED ${reportData.vatAmount}</div></div>
            <div class="kpi-card"><div class="kpi-label">Gross Sales (Inc-VAT)</div><div class="kpi-val" style="color: #166534;">AED ${reportData.salesIncVat}</div></div>
          </div>
          <div style="margin-top: 20px; padding: 12px 16px; background: #f8fafc; border-left: 4px solid #39ff14; font-size: 11px; color: #475569;">
            <strong>Statutory Compliance Note:</strong> ${reportData.notes}
          </div>
        `;
      } else if (Array.isArray(reportData)) {
        let ths = '';
        let trs = '';

        if (activeReport === 'branch-sales') {
          ths = `<th>BRANCH</th><th style="text-align: right;">ORDERS</th><th style="text-align: right;">NET SALES</th><th style="text-align: right;">VAT</th><th style="text-align: right;">TOTAL</th>`;
          trs = reportData
            .map(
              (r: any) => `<tr>
              <td><strong>${r.branchName}</strong></td>
              <td style="text-align: right;">${r.orderCount}</td>
              <td style="text-align: right;">AED ${Number(r.netSales || 0).toFixed(2)}</td>
              <td style="text-align: right;">AED ${Number(r.vatAmount || 0).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700; color: #166534;">AED ${Number(r.totalSales || 0).toFixed(2)}</td>
            </tr>`
            )
            .join('');
        } else if (activeReport === 'product-sales') {
          ths = `<th>PRODUCT</th><th>BARCODE</th><th style="text-align: right;">QTY SOLD</th><th style="text-align: right;">GROSS SALES</th>`;
          trs = reportData
            .map(
              (r: any) => `<tr>
              <td><strong>${r.productName}</strong></td>
              <td style="color: #64748b;">${r.barcode || 'N/A'}</td>
              <td style="text-align: right; font-weight: 600;">${r.quantitySold}</td>
              <td style="text-align: right; font-weight: 700;">AED ${Number(r.grossSales || 0).toFixed(2)}</td>
            </tr>`
            )
            .join('');
        } else if (activeReport === 'category-sales') {
          ths = `<th>CATEGORY</th><th style="text-align: right;">QTY SOLD</th><th style="text-align: right;">ORDER LINES</th><th style="text-align: right;">GROSS SALES</th>`;
          trs = reportData
            .map(
              (r: any) => `<tr>
              <td><strong>${r.category}</strong></td>
              <td style="text-align: right;">${r.quantitySold}</td>
              <td style="text-align: right;">${r.orderLineCount}</td>
              <td style="text-align: right; font-weight: 700;">AED ${Number(r.grossSales || 0).toFixed(2)}</td>
            </tr>`
            )
            .join('');
        } else if (activeReport === 'cashier-sales') {
          ths = `<th>CASHIER</th><th style="text-align: right;">ORDERS</th><th style="text-align: right;">NET SALES</th><th style="text-align: right;">VAT</th><th style="text-align: right;">TOTAL SALES</th>`;
          trs = reportData
            .map(
              (r: any) => `<tr>
              <td><strong>${r.cashierName || 'Unassigned'}</strong></td>
              <td style="text-align: right;">${r.orderCount}</td>
              <td style="text-align: right;">AED ${Number(r.netSales || 0).toFixed(2)}</td>
              <td style="text-align: right;">AED ${Number(r.vatAmount || 0).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700;">AED ${Number(r.totalSales || 0).toFixed(2)}</td>
            </tr>`
            )
            .join('');
        } else if (activeReport === 'inventory-valuation') {
          ths = `<th>BRANCH</th><th>PRODUCT</th><th style="text-align: right;">STOCK</th><th style="text-align: right;">UNIT COST</th><th style="text-align: right;">VALUATION</th>`;
          trs = reportData
            .map(
              (r: any) => `<tr>
              <td>${r.branchName}</td>
              <td><strong>${r.productName}</strong></td>
              <td style="text-align: right;">${r.quantity}</td>
              <td style="text-align: right;">AED ${Number(r.unitCost || 0).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 700; color: #0284c7;">AED ${Number(r.totalCostValue || 0).toFixed(2)}</td>
            </tr>`
            )
            .join('');
        } else if (activeReport === 'low-stock') {
          ths = `<th>BRANCH</th><th>PRODUCT</th><th style="text-align: right;">STOCK</th><th style="text-align: right;">THRESHOLD</th><th style="text-align: right;">SHORTAGE</th>`;
          trs = reportData
            .map(
              (r: any) => `<tr>
              <td>${r.branchName}</td>
              <td><strong>${r.productName}</strong></td>
              <td style="text-align: right; font-weight: 700; color: #dc2626;">${r.currentQuantity}</td>
              <td style="text-align: right;">${r.threshold}</td>
              <td style="text-align: right; font-weight: 700; color: #d97706;">-${r.shortage}</td>
            </tr>`
            )
            .join('');
        } else if (activeReport === 'expiry') {
          ths = `<th>BRANCH</th><th>PRODUCT</th><th>BATCH</th><th style="text-align: right;">QTY</th><th>EXPIRY</th><th style="text-align: right;">DAYS LEFT</th>`;
          trs = reportData
            .map(
              (r: any) => `<tr>
              <td>${r.branchName || 'All'}</td>
              <td><strong>${r.productName}</strong></td>
              <td><code>${r.batchNumber}</code></td>
              <td style="text-align: right;">${r.quantity}</td>
              <td>${formatDate(r.expiryDate)}</td>
              <td style="text-align: right; font-weight: 700; color: ${Number(r.daysRemaining || 0) <= 7 ? '#dc2626' : '#d97706'};">${Math.round(r.daysRemaining || 0)}d</td>
            </tr>`
            )
            .join('');
        } else if (activeReport === 'purchase') {
          ths = `<th>PO ID</th><th>VENDOR</th><th>BRANCH</th><th>DATE</th><th>STATUS</th><th style="text-align: right;">TOTAL</th>`;
          trs = reportData
            .map(
              (r: any) => `<tr>
              <td><span style="font-family: monospace; font-size: 11px;">${r.poId ? r.poId.slice(0, 8) : 'N/A'}</span></td>
              <td><strong>${r.vendorName}</strong></td>
              <td>${r.branchName || 'N/A'}</td>
              <td>${formatDate(r.poDate)}</td>
              <td><span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; background: #f1f5f9; font-weight: 600;">${r.status}</span></td>
              <td style="text-align: right; font-weight: 700;">AED ${Number(r.totalAmount || 0).toFixed(2)}</td>
            </tr>`
            )
            .join('');
        } else if (activeReport === 'vendor') {
          ths = `<th>VENDOR</th><th style="text-align: right;">PO COUNT</th><th style="text-align: right;">TOTAL PURCHASES</th>`;
          trs = reportData
            .map(
              (r: any) => `<tr>
              <td><strong>${r.vendorName}</strong></td>
              <td style="text-align: right;">${r.purchaseCount}</td>
              <td style="text-align: right; font-weight: 700; color: #166534;">AED ${Number(r.totalPurchaseValue || 0).toFixed(2)}</td>
            </tr>`
            )
            .join('');
        }

        contentHtml = `
          <table>
            <thead><tr>${ths}</tr></thead>
            <tbody>${trs}</tbody>
          </table>
        `;
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${activeDef.label} Report</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      padding: 24px;
      font-size: 12px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .logo-pills {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-right: 6px;
    }
    .pill {
      width: 6px;
      height: 20px;
      border-radius: 3px;
    }
    .pill-lime { background-color: #39ff14; }
    .pill-dark { background-color: #111827; }
    .brand-text {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .brand-text span { color: #39ff14; }
    .company-info {
      font-size: 10px;
      color: #64748b;
      line-height: 1.4;
    }
    .title-block { text-align: right; }
    .doc-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0.5px;
    }
    .doc-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .filter-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 3px 8px;
      background: #f1f5f9;
      border-radius: 4px;
      font-size: 10px;
      color: #475569;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 14px 0 18px 0;
    }
    .kpi-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-card {
      flex: 1;
      min-width: 120px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
      font-weight: 700;
      color: #111827;
      padding: 8px 10px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 11.5px;
      color: #111827;
    }
    .footer-divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 30px 0 10px 0;
    }
    .footer-text {
      text-align: center;
      font-size: 9.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-wrap">
        <div class="logo-pills">
          <div class="pill pill-lime"></div>
          <div class="pill pill-dark"></div>
        </div>
        <div class="brand-text">cloudynation<span>pos</span></div>
      </div>
      <div class="company-info">
        License No.: CWS-1V-227668 | Amber Gem Tower, UAE<br />
        Info@cloudynationpos.com | Head Office Analytics &amp; VAT
      </div>
    </div>
    <div class="title-block">
      <div class="doc-title">${activeDef.label.toUpperCase()} REPORT</div>
      <div class="doc-date">Generated: ${generatedDate}</div>
      <div class="filter-badge">${activeDef.usesBranch ? selectedBranchName : 'All Outlets'} ${activeDef.usesDate ? `| ${startDateStr} to ${endDateStr}` : ''}</div>
    </div>
  </div>

  <div class="divider"></div>

  ${contentHtml}

  <div class="footer-divider"></div>
  <div class="footer-text">
    Electronically generated official operational report - Cloudynation POS SaaS Platform
  </div>
</body>
</html>`;

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          const printWin = window.open('', '_blank');
          if (printWin) {
            printWin.document.open();
            printWin.document.write(html);
            printWin.document.close();
            printWin.focus();
            setTimeout(() => {
              try {
                printWin.print();
              } catch (e) {}
            }, 300);
            showToast('Report opened in print window!', 'success');
            return;
          }
        }
      }

      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync().catch(() => false);
      if (canShare) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `${activeReport}-report.pdf`,
        });
      } else {
        await Print.printAsync({ html });
      }
      showToast(`Exported ${activeDef.label} (PDF) successfully!`, 'success');
    } catch (err: any) {
      console.error('Export PDF error:', err);
      showToast(err.message || 'Failed to export PDF', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenBody
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchReport(true)} tintColor="#39ff14" />}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ArrowLeft size={18} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.flex1}>
            <Text style={styles.screenTitle}>Reports &amp; VAT</Text>
            <Text style={styles.screenSubtitle}>11 Operational &amp; Inventory Reports</Text>
          </View>
        </View>

        {/* Report Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectorScroll}
          contentContainerStyle={styles.selectorContent}
        >
          {REPORT_DEFINITIONS.map((def) => {
            const isActive = def.key === activeReport;
            return (
              <TouchableOpacity
                key={def.key}
                style={[styles.reportPill, isActive && styles.reportPillActive]}
                onPress={() => setActiveReport(def.key)}
              >
                <View style={styles.pillIcon}>{def.icon(isActive ? '#0f172a' : '#64748b')}</View>
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{def.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Report Header Card */}
        <Card style={styles.activeMetaCard}>
          <View style={styles.activeMetaRow}>
            <View style={styles.activeMetaIcon}>{activeDef.icon('#39ff14')}</View>
            <View style={styles.flex1}>
              <Text style={styles.activeMetaTitle}>{activeDef.label}</Text>
              <Text style={styles.activeMetaDesc}>{activeDef.shortDesc}</Text>
            </View>
            <TouchableOpacity style={styles.iconActionBtn} onPress={() => fetchReport(true)} disabled={loading}>
              <RefreshCw size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Filters Row */}
          <View style={styles.filterSection}>
            {/* Branch Filter if applicable */}
            {activeDef.usesBranch && (
              <TouchableOpacity style={styles.filterChip} onPress={() => setBranchModalOpen(true)}>
                <Building2 size={13} color="#0284c7" />
                <Text style={styles.filterChipText}>{selectedBranchName}</Text>
              </TouchableOpacity>
            )}

            {/* Date Presets if applicable */}
            {activeDef.usesDate && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                {(['this-month', 'last-30', 'last-7', 'today', 'yesterday', 'custom'] as DatePreset[]).map((dp) => (
                  <TouchableOpacity
                    key={dp}
                    style={[styles.datePresetChip, datePreset === dp && styles.datePresetChipActive]}
                    onPress={() => {
                      setDatePreset(dp);
                      if (dp === 'custom') setCustomDateModalOpen(true);
                    }}
                  >
                    <Text style={[styles.datePresetText, datePreset === dp && styles.datePresetTextActive]}>
                      {dp === 'this-month'
                        ? 'This Month'
                        : dp === 'last-30'
                        ? '30 Days'
                        : dp === 'last-7'
                        ? '7 Days'
                        : dp === 'today'
                        ? 'Today'
                        : dp === 'yesterday'
                        ? 'Yesterday'
                        : 'Custom'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Expiry Threshold if applicable */}
            {activeDef.usesExpiryThreshold && (
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Expires within:</Text>
                {[7, 15, 30, 60, 90].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[styles.thresholdPill, daysThreshold === days && styles.thresholdPillActive]}
                    onPress={() => setDaysThreshold(days)}
                  >
                    <Text style={[styles.thresholdText, daysThreshold === days && styles.thresholdTextActive]}>
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Export Action Bar */}
          <View style={styles.exportBar}>
            <TouchableOpacity
              style={[styles.exportBtn, styles.exportCsvBtn]}
              onPress={handleExportCsv}
              disabled={exportingCsv || loading}
            >
              {exportingCsv ? (
                <ActivityIndicator size="small" color="#166534" />
              ) : (
                <>
                  <FileSpreadsheet size={15} color="#166534" />
                  <Text style={styles.exportCsvText}>Export CSV</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportBtn, styles.exportPdfBtn]}
              onPress={handleExportPdf}
              disabled={exportingPdf || loading}
            >
              {exportingPdf ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <>
                  <FileText size={15} color="#0f172a" />
                  <Text style={styles.exportPdfText}>Export PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Data View */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#39ff14" />
            <Text style={styles.loadingText}>Loading {activeDef.label}...</Text>
          </View>
        ) : !reportData ? (
          <Card style={styles.emptyCard}>
            <AlertTriangle size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySub}>No transactions or records matched the selected period and branch.</Text>
          </Card>
        ) : activeReport === 'sales-summary' ? (
          <View style={styles.statsContainer}>
            <View style={styles.statGrid}>
              <StatCard label="Orders" value={String(reportData.orderCount || 0)} sub="Completed orders" />
              <StatCard label="Net Sales" value={`AED ${reportData.netSales || '0.00'}`} sub="Excluding tax" />
              <StatCard label="VAT Output" value={`AED ${reportData.vatAmount || '0.00'}`} sub="5% UAE Standard" />
              <StatCard label="Total Sales" value={`AED ${reportData.totalSales || '0.00'}`} sub="Gross turnover" />
              <StatCard label="Avg Order Value" value={`AED ${reportData.averageOrderValue || '0.00'}`} sub="Basket average" />
            </View>
          </View>
        ) : activeReport === 'vat-summary' ? (
          <View style={styles.vatContainer}>
            <Card style={styles.trnCard}>
              <Text style={styles.trnLabel}>TAX REGISTRATION NUMBER (TRN)</Text>
              <Text style={styles.trnValue}>{reportData.trn || 'Not Configured'}</Text>
              <Text style={styles.trnSub}>Period: {formatDate(reportData.periodStart)} - {formatDate(reportData.periodEnd)}</Text>
            </Card>
            <View style={styles.statGrid}>
              <StatCard label="Taxable Orders" value={String(reportData.taxableOrdersCount || 0)} sub="Orders with VAT" />
              <StatCard label="Sales (Ex-VAT)" value={`AED ${reportData.salesExVat || '0.00'}`} sub="Taxable supplies" />
              <StatCard label="Output VAT" value={`AED ${reportData.vatAmount || '0.00'}`} sub="Payable to FTA" />
              <StatCard label="Total (Inc-VAT)" value={`AED ${reportData.salesIncVat || '0.00'}`} sub="Total collected" />
            </View>
            <Card style={styles.vatNoteCard}>
              <Text style={styles.vatNoteTitle}>Statutory VAT Note</Text>
              <Text style={styles.vatNoteBody}>{reportData.notes}</Text>
            </Card>
          </View>
        ) : Array.isArray(reportData) && reportData.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>0 Records Found</Text>
            <Text style={styles.emptySub}>No results found for the selected branch and criteria.</Text>
          </Card>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.listHeaderCount}>Showing {reportData.length} records</Text>
            {reportData.map((item: any, idx: number) => {
              if (activeReport === 'branch-sales') {
                return (
                  <Card key={item.branchId || idx} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{item.branchName}</Text>
                      <Badge variant="success">{item.orderCount} orders</Badge>
                    </View>
                    <View style={styles.recordDetailRow}>
                      <Text style={styles.recordMeta}>Net: AED {Number(item.netSales || 0).toFixed(2)}</Text>
                      <Text style={styles.recordMeta}>VAT: AED {Number(item.vatAmount || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.recordTotalRow}>
                      <Text style={styles.recordTotalLabel}>Total Sales:</Text>
                      <Text style={styles.recordTotalVal}>AED {Number(item.totalSales || 0).toFixed(2)}</Text>
                    </View>
                  </Card>
                );
              }

              if (activeReport === 'product-sales') {
                return (
                  <Card key={item.productId || idx} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{item.productName}</Text>
                      <Badge variant="brand">{item.quantitySold} sold</Badge>
                    </View>
                    <Text style={styles.barcodeText}>Barcode: {item.barcode || 'N/A'}</Text>
                    <View style={styles.recordTotalRow}>
                      <Text style={styles.recordTotalLabel}>Gross Sales:</Text>
                      <Text style={styles.recordTotalVal}>AED {Number(item.grossSales || 0).toFixed(2)}</Text>
                    </View>
                  </Card>
                );
              }

              if (activeReport === 'category-sales') {
                return (
                  <Card key={item.category || idx} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{item.category || 'Uncategorized'}</Text>
                      <Badge variant="neutral">{item.orderLineCount} lines</Badge>
                    </View>
                    <View style={styles.recordDetailRow}>
                      <Text style={styles.recordMeta}>Qty Sold: {item.quantitySold} units</Text>
                    </View>
                    <View style={styles.recordTotalRow}>
                      <Text style={styles.recordTotalLabel}>Gross Revenue:</Text>
                      <Text style={styles.recordTotalVal}>AED {Number(item.grossSales || 0).toFixed(2)}</Text>
                    </View>
                  </Card>
                );
              }

              if (activeReport === 'cashier-sales') {
                return (
                  <Card key={item.cashierId || idx} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{item.cashierName || 'Unassigned / System'}</Text>
                      <Badge variant="info">{item.orderCount} orders</Badge>
                    </View>
                    <View style={styles.recordDetailRow}>
                      <Text style={styles.recordMeta}>Net: AED {Number(item.netSales || 0).toFixed(2)}</Text>
                      <Text style={styles.recordMeta}>VAT: AED {Number(item.vatAmount || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.recordTotalRow}>
                      <Text style={styles.recordTotalLabel}>Total Till Sales:</Text>
                      <Text style={styles.recordTotalVal}>AED {Number(item.totalSales || 0).toFixed(2)}</Text>
                    </View>
                  </Card>
                );
              }

              if (activeReport === 'inventory-valuation') {
                return (
                  <Card key={`${item.branchName}-${item.productName}-${idx}`} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{item.productName}</Text>
                      <Badge variant="neutral">{item.branchName}</Badge>
                    </View>
                    <View style={styles.recordDetailRow}>
                      <Text style={styles.recordMeta}>Stock: {item.quantity} units</Text>
                      <Text style={styles.recordMeta}>Cost: AED {Number(item.unitCost || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.recordTotalRow}>
                      <Text style={styles.recordTotalLabel}>Valuation:</Text>
                      <Text style={[styles.recordTotalVal, { color: '#0284c7' }]}>
                        AED {Number(item.totalCostValue || 0).toFixed(2)}
                      </Text>
                    </View>
                  </Card>
                );
              }

              if (activeReport === 'low-stock') {
                return (
                  <Card key={`${item.branchName}-${item.productName}-${idx}`} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{item.productName}</Text>
                      <Badge variant="error">{item.currentQuantity} in stock</Badge>
                    </View>
                    <View style={styles.recordDetailRow}>
                      <Text style={styles.recordMeta}>Branch: {item.branchName}</Text>
                      <Text style={styles.recordMeta}>Reorder Threshold: {item.threshold}</Text>
                    </View>
                    <View style={styles.recordTotalRow}>
                      <Text style={styles.recordTotalLabel}>Shortage:</Text>
                      <Text style={[styles.recordTotalVal, { color: '#dc2626' }]}>-{item.shortage} units</Text>
                    </View>
                  </Card>
                );
              }

              if (activeReport === 'expiry') {
                const days = Math.round(item.daysRemaining || 0);
                const isUrgent = days <= 7;
                return (
                  <Card key={`${item.batchNumber}-${idx}`} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{item.productName}</Text>
                      <Badge variant={isUrgent ? 'error' : 'warn'}>
                        {days <= 0 ? 'Expired' : `${days}d left`}
                      </Badge>
                    </View>
                    <View style={styles.recordDetailRow}>
                      <Text style={styles.recordMeta}>Batch: {item.batchNumber}</Text>
                      <Text style={styles.recordMeta}>Stock: {item.quantity} units</Text>
                    </View>
                    <View style={styles.recordDetailRow}>
                      <Text style={styles.recordMeta}>Expiry Date: {formatDate(item.expiryDate)}</Text>
                      <Text style={styles.recordMeta}>Branch: {item.branchName || 'All Outlets'}</Text>
                    </View>
                  </Card>
                );
              }

              if (activeReport === 'purchase') {
                return (
                  <Card key={item.poId || idx} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{item.vendorName}</Text>
                      <Badge variant="info">{item.status}</Badge>
                    </View>
                    <View style={styles.recordDetailRow}>
                      <Text style={styles.recordMeta}>Branch: {item.branchName || 'N/A'}</Text>
                      <Text style={styles.recordMeta}>Date: {formatDate(item.poDate)}</Text>
                    </View>
                    <View style={styles.recordTotalRow}>
                      <Text style={styles.recordTotalLabel}>PO Total:</Text>
                      <Text style={styles.recordTotalVal}>AED {Number(item.totalAmount || 0).toFixed(2)}</Text>
                    </View>
                  </Card>
                );
              }

              if (activeReport === 'vendor') {
                return (
                  <Card key={item.vendorName || idx} style={styles.recordCard}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{item.vendorName}</Text>
                      <Badge variant="brand">{item.purchaseCount} POs</Badge>
                    </View>
                    <View style={styles.recordTotalRow}>
                      <Text style={styles.recordTotalLabel}>Total Spend:</Text>
                      <Text style={[styles.recordTotalVal, { color: '#166534' }]}>
                        AED {Number(item.totalPurchaseValue || 0).toFixed(2)}
                      </Text>
                    </View>
                  </Card>
                );
              }

              return null;
            })}
          </View>
        )}
      </ScreenBody>

      {/* Branch Selection Modal */}
      <Modal visible={branchModalOpen} transparent animationType="fade" onRequestClose={() => setBranchModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Branch Outlet</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[styles.modalItem, selectedBranchId === 'all' && styles.modalItemActive]}
                onPress={() => {
                  setSelectedBranchId('all');
                  setBranchModalOpen(false);
                }}
              >
                <Text style={[styles.modalItemText, selectedBranchId === 'all' && styles.modalItemTextActive]}>
                  All Branches (Consolidated)
                </Text>
                {selectedBranchId === 'all' && <Check size={16} color="#39ff14" />}
              </TouchableOpacity>
              {branches.map((b: any) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.modalItem, selectedBranchId === b.id && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedBranchId(b.id);
                    setBranchModalOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedBranchId === b.id && styles.modalItemTextActive]}>
                    {b.name}
                  </Text>
                  {selectedBranchId === b.id && <Check size={16} color="#39ff14" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Date Modal */}
      <Modal
        visible={customDateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomDateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Custom Date Range</Text>
            <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-01-01"
              value={customStart}
              onChangeText={setCustomStart}
            />
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-01-31"
              value={customEnd}
              onChangeText={setCustomEnd}
            />
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                if (customStart && customEnd) {
                  setCustomDateModalOpen(false);
                  fetchReport();
                } else {
                  showToast('Please enter both dates', 'warn');
                }
              }}
            >
              <Text style={styles.applyBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: '#f8fafc' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  selectorScroll: {
    marginVertical: 8,
  },
  selectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  reportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  reportPillActive: {
    backgroundColor: '#39ff14',
    borderColor: '#39ff14',
  },
  pillIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  activeMetaCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  activeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeMetaIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeMetaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  activeMetaDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  iconActionBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  filterSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#f0f9ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0284c7',
  },
  dateScroll: {
    flexDirection: 'row',
  },
  datePresetChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  datePresetChipActive: {
    backgroundColor: '#0f172a',
  },
  datePresetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  datePresetTextActive: {
    color: '#ffffff',
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thresholdLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  thresholdPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  thresholdPillActive: {
    backgroundColor: '#0f172a',
  },
  thresholdText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  thresholdTextActive: {
    color: '#39ff14',
  },
  exportBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  exportCsvBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  exportCsvText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  exportPdfBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  exportPdfText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyCard: {
    marginHorizontal: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 16,
  },
  statGrid: {
    gap: 8,
  },
  vatContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  trnCard: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
  },
  trnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#39ff14',
    letterSpacing: 0.5,
  },
  trnValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  trnSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  vatNoteCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
  },
  vatNoteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  vatNoteBody: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listHeaderCount: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  recordDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  recordMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  barcodeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  recordTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  recordTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  recordTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemActive: {
    backgroundColor: '#f8fafc',
  },
  modalItemText: {
    fontSize: 13,
    color: '#334155',
  },
  modalItemTextActive: {
    fontWeight: '700',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  applyBtn: {
    marginTop: 18,
    height: 44,
    backgroundColor: '#39ff14',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
});
