import { jsPDF } from "jspdf";

// Brand Color Palette (matching subscription-invoice-pdf.ts exactly)
const brandLime: [number, number, number] = [57, 255, 20];      // #39ff14
const darkInk: [number, number, number] = [17, 24, 39];         // #111827
const mutedSlate: [number, number, number] = [100, 116, 139];   // #64748b
const borderSlate: [number, number, number] = [226, 232, 240];  // #e2e8f0
const surfaceLight: [number, number, number] = [248, 250, 252]; // #f8fafc

const pageLeft = 14;
const pageRight = 196;

export interface ReportFilterInfo {
  startDate?: string;
  endDate?: string;
  branchName?: string;
  asOfDate?: string;
  trn?: string;
}

/** Formats numbers to clean standard currency string (e.g. 1,234.56) */
function fmt(val?: number | string): string {
  const num = typeof val === "string" ? parseFloat(val) : (val ?? 0);
  return Number(isNaN(num) ? 0 : num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Formats ISO dates to DD Mon YYYY */
function fmtDate(d?: string | Date): string {
  if (!d) return "—";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Standard Header for Financial Reports
 * Renders the vector logo, legal company details, report title, date range, branch, and print timestamp.
 */
function renderReportHeader(
  doc: jsPDF,
  reportTitle: string,
  filters: ReportFilterInfo
): number {
  // Vector Brand Logo (matching subscription-invoice-pdf.ts)
  doc.setFillColor(brandLime[0], brandLime[1], brandLime[2]);
  doc.roundedRect(pageLeft, 14, 2.2, 7.5, 1.1, 1.1, "F");

  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.roundedRect(pageLeft + 3.2, 14, 2.2, 7.5, 1.1, 1.1, "F");

  // Wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("cloudynation", pageLeft + 7.5, 21);

  const wordmarkWidth = doc.getTextWidth("cloudynation");
  doc.setTextColor(brandLime[0], brandLime[1], brandLime[2]);
  doc.text("pos", pageLeft + 7.5 + wordmarkWidth, 21);

  // Legal Platform Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text("Cloudynation POS | License: CWS-1V-227668", pageLeft, 26.5);
  doc.text("26th Floor, Amber Gem Tower, Ajman, UAE", pageLeft, 30.5);
  doc.text("Info@cloudynationpos.com | +971 55 217 7186 | www.cloudynationpos.com", pageLeft, 34.5);

  // Right-aligned Report Title & Meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(reportTitle.toUpperCase(), pageRight, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);

  let metaY = 25.5;
  if (filters.startDate && filters.endDate) {
    doc.text(`Period: ${fmtDate(filters.startDate)} to ${fmtDate(filters.endDate)}`, pageRight, metaY, { align: "right" });
    metaY += 4.5;
  } else if (filters.asOfDate) {
    doc.text(`As of Date: ${fmtDate(filters.asOfDate)}`, pageRight, metaY, { align: "right" });
    metaY += 4.5;
  }

  const branchText = filters.branchName || "All Branches";
  doc.text(`Branch Scope: ${branchText}`, pageRight, metaY, { align: "right" });
  metaY += 4.5;

  if (filters.trn) {
    doc.text(`TRN: ${filters.trn}`, pageRight, metaY, { align: "right" });
    metaY += 4.5;
  }

  const printedAt = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Generated: ${printedAt}`, pageRight, metaY, { align: "right" });

  // Divider Line
  const lineY = Math.max(metaY + 3.5, 42);
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.4);
  doc.line(pageLeft, lineY, pageRight, lineY);

  return lineY + 7;
}

/** Standard Footer */
function renderReportFooter(doc: jsPDF, pageNum: number, totalPages?: number) {
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.3);
  doc.line(pageLeft, 280, pageRight, 280);

  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Confidential & Electronically Generated - Cloudynation POS Financial Reports", pageLeft, 285);
  const pageLabel = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
  doc.text(pageLabel, pageRight, 285, { align: "right" });
}

/** Helper to draw a KPI summary card on PDF */
function drawKpiCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  value: string,
  subtext?: string,
  accentColor: [number, number, number] = darkInk
) {
  doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 1.8, 1.8, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(title.toUpperCase(), x + 3.5, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(value, x + 3.5, y + 11);

  if (subtext) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text(subtext, x + 3.5, y + 15);
  }
}

// ============================================================================
// 1. EXECUTIVE FINANCIAL SUMMARY PDF
// ============================================================================
export function generateExecutiveSummaryPdf(data: any, filters: ReportFilterInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = renderReportHeader(doc, "Executive Financial Summary", filters);

  // 5 KPI Cards in 2 rows
  const cardW = (pageRight - pageLeft - 6) / 3;
  const cardH = 18;

  // Row 1
  drawKpiCard(doc, pageLeft, y, cardW, cardH, "Total Revenue", `AED ${fmt(data.totalRevenue)}`, `${data.orderCount || 0} completed orders`, [22, 101, 52]);
  drawKpiCard(doc, pageLeft + cardW + 3, y, cardW, cardH, "Cost of Goods (COGS)", `AED ${fmt(data.cogs)}`, "Direct merchandise cost basis");
  drawKpiCard(doc, pageLeft + (cardW + 3) * 2, y, cardW, cardH, "Gross Operating Profit", `AED ${fmt(data.grossProfit)}`, `${data.grossMarginPct || 0}% gross margin`, [22, 101, 52]);

  y += cardH + 3.5;

  // Row 2 (2 cards wider)
  const cardW2 = (pageRight - pageLeft - 3) / 2;
  drawKpiCard(doc, pageLeft, y, cardW2, cardH, "Outstanding Payables", `AED ${fmt(data.outstandingPayables)}`, `${data.unpaidInvoiceCount || 0} unpaid vendor bills`, [185, 28, 28]);
  drawKpiCard(doc, pageLeft + cardW2 + 3, y, cardW2, cardH, "Inventory Asset Value", `AED ${fmt(data.inventoryAssetValue)}`, `${(data.totalStockUnits || 0).toLocaleString()} stock units on hand`, [37, 99, 235]);

  y += cardH + 9;

  // Detailed Summary Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Executive Financial Statement Breakdown", pageLeft, y);
  y += 4;

  // Table Header
  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.rect(pageLeft, y, pageRight - pageLeft, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("FINANCIAL METRIC", pageLeft + 3, y + 4.8);
  doc.text("AMOUNT (AED)", 135, y + 4.8, { align: "right" });
  doc.text("OPERATIONAL CONTEXT", pageRight - 3, y + 4.8, { align: "right" });

  y += 7;

  const rows = [
    { metric: "Gross Sales Revenue", amount: fmt(data.totalRevenue), notes: `Sum of completed sales (${data.orderCount || 0} orders)` },
    { metric: "Cost of Goods Sold (COGS)", amount: fmt(data.cogs), notes: "Direct inventory acquisition cost" },
    { metric: "Gross Operating Margin", amount: `+${fmt(data.grossProfit)}`, notes: `Gross Profit Margin: ${data.grossMarginPct || 0}%` },
    { metric: "Accounts Payable (Liabilities)", amount: fmt(data.outstandingPayables), notes: `Pending settlement (${data.unpaidInvoiceCount || 0} invoices)` },
    { metric: "Inventory Asset Value (Real-Time)", amount: fmt(data.inventoryAssetValue), notes: `Cost valuation across ${(data.totalStockUnits || 0).toLocaleString()} units` },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
      doc.rect(pageLeft, y, pageRight - pageLeft, 7, "F");
    }
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.setLineWidth(0.2);
    doc.line(pageLeft, y + 7, pageRight, y + 7);

    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text(r.metric, pageLeft + 3, y + 5);

    if (idx === 2) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 101, 52);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    }
    doc.text(r.amount, 135, y + 5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text(r.notes, pageRight - 3, y + 5, { align: "right" });

    y += 7;
  });

  renderReportFooter(doc, 1, 1);
  doc.save("executive-financial-summary.pdf");
}

// ============================================================================
// 2. SALES & MARGIN ANALYSIS PDF
// ============================================================================
export function generateSalesMarginPdf(data: any, filters: ReportFilterInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = renderReportHeader(doc, "Sales & Margin Breakdown", filters);

  // Top KPIs
  const cardW = (pageRight - pageLeft - 3) / 2;
  drawKpiCard(doc, pageLeft, y, cardW, 16, "Total Tender Volume", `AED ${fmt(data.totalTenderAmount)}`, `${data.tenders?.length || 0} payment method categories`);
  drawKpiCard(doc, pageLeft + cardW + 3, y, cardW, 16, "Total Channel Sales", `AED ${fmt(data.totalChannelAmount)}`, `${data.channels?.length || 0} fulfillment channels`);

  y += 22;

  // Section: Tender Breakdown & Channel Breakdown Side by Side
  const colW = (pageRight - pageLeft - 4) / 2;

  // Tender Table Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Revenue by Tender Method", pageLeft, y);

  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.rect(pageLeft, y + 2, colW, 6, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("METHOD", pageLeft + 2, y + 6.2);
  doc.text("COUNT", pageLeft + colW - 25, y + 6.2, { align: "right" });
  doc.text("TOTAL (AED)", pageLeft + colW - 2, y + 6.2, { align: "right" });

  // Channel Table Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Revenue by Channel", pageLeft + colW + 4, y);

  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.rect(pageLeft + colW + 4, y + 2, colW, 6, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("CHANNEL", pageLeft + colW + 6, y + 6.2);
  doc.text("ORDERS", pageRight - 25, y + 6.2, { align: "right" });
  doc.text("TOTAL (AED)", pageRight - 2, y + 6.2, { align: "right" });

  y += 8;

  // Render Rows for Tenders & Channels
  const maxRows = Math.max(data.tenders?.length || 0, data.channels?.length || 0, 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (let i = 0; i < maxRows; i++) {
    const t = data.tenders?.[i];
    const c = data.channels?.[i];

    if (t) {
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(String(t.method), pageLeft + 2, y + 4.5);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(String(t.count || 0), pageLeft + colW - 25, y + 4.5, { align: "right" });
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(fmt(t.amount), pageLeft + colW - 2, y + 4.5, { align: "right" });
    } else if (i === 0) {
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text("No tender records", pageLeft + 2, y + 4.5);
    }

    if (c) {
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(String(c.channel), pageLeft + colW + 6, y + 4.5);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(String(c.count || 0), pageRight - 25, y + 4.5, { align: "right" });
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(fmt(c.amount), pageRight - 2, y + 4.5, { align: "right" });
    } else if (i === 0) {
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text("No channel records", pageLeft + colW + 6, y + 4.5);
    }

    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.setLineWidth(0.2);
    doc.line(pageLeft, y + 6, pageLeft + colW, y + 6);
    doc.line(pageLeft + colW + 4, y + 6, pageRight, y + 6);
    y += 6;
  }

  y += 7;

  // Section 2: Top Products by Gross Profit
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Top 10 Products by Gross Profit", pageLeft, y);
  y += 3.5;

  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.rect(pageLeft, y, pageRight - pageLeft, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("#", pageLeft + 2, y + 4.2);
  doc.text("PRODUCT NAME", pageLeft + 8, y + 4.2);
  doc.text("CATEGORY", pageLeft + 70, y + 4.2);
  doc.text("UNITS", 115, y + 4.2, { align: "right" });
  doc.text("REVENUE", 140, y + 4.2, { align: "right" });
  doc.text("COGS", 165, y + 4.2, { align: "right" });
  doc.text("PROFIT", pageRight - 15, y + 4.2, { align: "right" });
  doc.text("MARGIN", pageRight - 2, y + 4.2, { align: "right" });

  y += 6;

  if (!data.topProducts || data.topProducts.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text("No product sales recorded in this period.", pageLeft + 2, y + 5);
  } else {
    data.topProducts.slice(0, 10).forEach((p: any, idx: number) => {
      if (idx % 2 === 0) {
        doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
        doc.rect(pageLeft, y, pageRight - pageLeft, 6, "F");
      }
      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.setLineWidth(0.2);
      doc.line(pageLeft, y + 6, pageRight, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(String(idx + 1), pageLeft + 2, y + 4.2);

      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      const truncatedName = p.productName?.length > 32 ? p.productName.substring(0, 30) + "…" : p.productName;
      doc.text(truncatedName, pageLeft + 8, y + 4.2);

      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      const truncatedCat = p.category?.length > 18 ? p.category.substring(0, 16) + "…" : (p.category || "General");
      doc.text(truncatedCat, pageLeft + 70, y + 4.2);

      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(String(p.unitsSold || 0), 115, y + 4.2, { align: "right" });
      doc.text(fmt(p.revenue), 140, y + 4.2, { align: "right" });
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(fmt(p.cogs), 165, y + 4.2, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 101, 52);
      doc.text(fmt(p.grossProfit), pageRight - 15, y + 4.2, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(`${p.marginPct}%`, pageRight - 2, y + 4.2, { align: "right" });

      y += 6;
    });
  }

  renderReportFooter(doc, 1, 1);
  doc.save("sales-margin-analysis.pdf");
}

// ============================================================================
// 3. ACCOUNTS PAYABLE AGING PDF
// ============================================================================
export function generateApAgingPdf(data: any, filters: ReportFilterInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = renderReportHeader(doc, "Accounts Payable Aging Ledger", filters);

  // 5 Aging Bucket Cards
  const cardW = (pageRight - pageLeft - 8) / 5;
  const cardH = 16;
  drawKpiCard(doc, pageLeft, y, cardW, cardH, "Total Payables", `AED ${fmt(data.summary?.totalOutstanding)}`, `${data.summary?.totalCount || 0} unpaid bills`);
  drawKpiCard(doc, pageLeft + (cardW + 2), y, cardW, cardH, "Current (Not Due)", `AED ${fmt(data.summary?.current?.amount)}`, `${data.summary?.current?.count || 0} on schedule`, [22, 101, 52]);
  drawKpiCard(doc, pageLeft + (cardW + 2) * 2, y, cardW, cardH, "1–30 Days", `AED ${fmt(data.summary?.overdue1To30?.amount)}`, `${data.summary?.overdue1To30?.count || 0} overdue`, [180, 83, 9]);
  drawKpiCard(doc, pageLeft + (cardW + 2) * 3, y, cardW, cardH, "31–60 Days", `AED ${fmt(data.summary?.overdue31To60?.amount)}`, `${data.summary?.overdue31To60?.count || 0} overdue`, [194, 65, 12]);
  drawKpiCard(doc, pageLeft + (cardW + 2) * 4, y, cardW, cardH, "60+ Days", `AED ${fmt(data.summary?.overdue60Plus?.amount)}`, `${data.summary?.overdue60Plus?.count || 0} critical`, [185, 28, 28]);

  y += cardH + 7;

  // Invoices Ledger Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Unpaid Vendor Invoices Ledger", pageLeft, y);
  y += 3.5;

  const renderTableHead = (currentY: number) => {
    doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.rect(pageLeft, currentY, pageRight - pageLeft, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("VENDOR NAME", pageLeft + 2, currentY + 4.2);
    doc.text("INVOICE #", pageLeft + 52, currentY + 4.2);
    doc.text("DUE DATE", pageLeft + 85, currentY + 4.2);
    doc.text("STATUS / OVERDUE", 125, currentY + 4.2, { align: "right" });
    doc.text("TOTAL (AED)", 150, currentY + 4.2, { align: "right" });
    doc.text("BALANCE DUE (AED)", pageRight - 2, currentY + 4.2, { align: "right" });
    return currentY + 6;
  };

  y = renderTableHead(y);

  const invoices = data.invoices || [];
  let pageNum = 1;

  if (invoices.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text("No outstanding vendor invoices found. All vendor bills are settled or none exist.", pageLeft + 2, y + 5);
  } else {
    invoices.forEach((inv: any, idx: number) => {
      // Check page overflow
      if (y > 270) {
        renderReportFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        y = renderReportHeader(doc, "Accounts Payable Aging Ledger (Cont.)", filters);
        y = renderTableHead(y);
      }

      if (idx % 2 === 0) {
        doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
        doc.rect(pageLeft, y, pageRight - pageLeft, 6, "F");
      }
      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.setLineWidth(0.2);
      doc.line(pageLeft, y + 6, pageRight, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      const vName = inv.vendorName?.length > 26 ? inv.vendorName.substring(0, 24) + "…" : inv.vendorName;
      doc.text(vName || "Vendor", pageLeft + 2, y + 4.2);

      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(String(inv.invoiceNumber || "—"), pageLeft + 52, y + 4.2);
      doc.text(fmtDate(inv.dueDate), pageLeft + 85, y + 4.2);

      if (inv.daysOverdue > 0) {
        doc.setTextColor(inv.daysOverdue > 60 ? 185 : inv.daysOverdue > 30 ? 194 : 180, inv.daysOverdue > 60 ? 28 : inv.daysOverdue > 30 ? 65 : 83, inv.daysOverdue > 60 ? 28 : inv.daysOverdue > 30 ? 12 : 9);
        doc.text(`${inv.daysOverdue}d overdue (${inv.bucket})`, 125, y + 4.2, { align: "right" });
      } else {
        doc.setTextColor(22, 101, 52);
        doc.text("Current (On Schedule)", 125, y + 4.2, { align: "right" });
      }

      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(fmt(inv.total), 150, y + 4.2, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(fmt(inv.balanceDue), pageRight - 2, y + 4.2, { align: "right" });

      y += 6;
    });
  }

  renderReportFooter(doc, pageNum);
  doc.save("accounts-payable-aging.pdf");
}

// ============================================================================
// 4. INVENTORY VALUATION PDF
// ============================================================================
export function generateInventoryValuationPdf(data: any, filters: ReportFilterInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = renderReportHeader(doc, "Inventory Valuation Statement", filters);

  // 4 KPI Cards
  const cardW = (pageRight - pageLeft - 6) / 4;
  const cardH = 16;
  drawKpiCard(doc, pageLeft, y, cardW, cardH, "Value at Cost", `AED ${fmt(data.totals?.totalCostValue)}`, "Asset acquisition cost basis", [37, 99, 235]);
  drawKpiCard(doc, pageLeft + (cardW + 2), y, cardW, cardH, "Value at Retail", `AED ${fmt(data.totals?.totalRetailValue)}`, "Potential retail shelf revenue", [147, 51, 234]);
  drawKpiCard(doc, pageLeft + (cardW + 2) * 2, y, cardW, cardH, "Unrealized Margin", `AED ${fmt(data.totals?.unrealizedMargin)}`, `${data.totals?.unrealizedMarginPct || 0}% potential margin`, [22, 101, 52]);
  drawKpiCard(doc, pageLeft + (cardW + 2) * 3, y, cardW, cardH, "Stock Units on Hand", (data.totals?.totalStockUnits || 0).toLocaleString(), `Across ${data.totals?.totalProducts || 0} active SKUs`);

  y += cardH + 7;

  // Category Breakdown Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Valuation Breakdown by Merchandise Category", pageLeft, y);
  y += 3.5;

  const renderCatHeader = (curY: number) => {
    doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.rect(pageLeft, curY, pageRight - pageLeft, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("CATEGORY", pageLeft + 2, curY + 4.2);
    doc.text("SKUS", 70, curY + 4.2, { align: "right" });
    doc.text("UNITS", 95, curY + 4.2, { align: "right" });
    doc.text("COST VALUE (AED)", 130, curY + 4.2, { align: "right" });
    doc.text("RETAIL VALUE (AED)", 165, curY + 4.2, { align: "right" });
    doc.text("MARGIN %", pageRight - 2, curY + 4.2, { align: "right" });
    return curY + 6;
  };

  y = renderCatHeader(y);

  const categories = data.categories || [];
  if (categories.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text("No active stock records found for this scope.", pageLeft + 2, y + 5);
    y += 8;
  } else {
    categories.forEach((c: any, idx: number) => {
      if (y > 270) {
        renderReportFooter(doc, 1);
        doc.addPage();
        y = renderReportHeader(doc, "Inventory Valuation Statement (Cont.)", filters);
        y = renderCatHeader(y);
      }

      if (idx % 2 === 0) {
        doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
        doc.rect(pageLeft, y, pageRight - pageLeft, 6, "F");
      }
      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.setLineWidth(0.2);
      doc.line(pageLeft, y + 6, pageRight, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(String(c.category), pageLeft + 2, y + 4.2);

      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(String(c.productCount || 0), 70, y + 4.2, { align: "right" });
      doc.text(String((c.stockUnits || 0).toLocaleString()), 95, y + 4.2, { align: "right" });

      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(fmt(c.costValue), 130, y + 4.2, { align: "right" });
      doc.text(fmt(c.retailValue), 165, y + 4.2, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 101, 52);
      doc.text(`${c.marginPct}%`, pageRight - 2, y + 4.2, { align: "right" });

      y += 6;
    });
  }

  // Branch Breakdown Table (if available)
  const branches = data.branches || [];
  if (branches.length > 0) {
    y += 6;
    if (y > 240) {
      renderReportFooter(doc, 1);
      doc.addPage();
      y = renderReportHeader(doc, "Inventory Valuation - Store Locations", filters);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text("Valuation Allocation by Store Branch", pageLeft, y);
    y += 3.5;

    doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.rect(pageLeft, y, pageRight - pageLeft, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("BRANCH NAME", pageLeft + 2, y + 4.2);
    doc.text("SKUS", 70, y + 4.2, { align: "right" });
    doc.text("UNITS", 95, y + 4.2, { align: "right" });
    doc.text("COST VALUE (AED)", 130, y + 4.2, { align: "right" });
    doc.text("RETAIL VALUE (AED)", 165, y + 4.2, { align: "right" });
    doc.text("MARGIN %", pageRight - 2, y + 4.2, { align: "right" });

    y += 6;

    branches.forEach((b: any, idx: number) => {
      if (idx % 2 === 0) {
        doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
        doc.rect(pageLeft, y, pageRight - pageLeft, 6, "F");
      }
      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.setLineWidth(0.2);
      doc.line(pageLeft, y + 6, pageRight, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(String(b.branchName), pageLeft + 2, y + 4.2);

      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(String(b.productCount || 0), 70, y + 4.2, { align: "right" });
      doc.text(String((b.stockUnits || 0).toLocaleString()), 95, y + 4.2, { align: "right" });

      doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
      doc.text(fmt(b.costValue), 130, y + 4.2, { align: "right" });
      doc.text(fmt(b.retailValue), 165, y + 4.2, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 101, 52);
      doc.text(`${b.marginPct}%`, pageRight - 2, y + 4.2, { align: "right" });

      y += 6;
    });
  }

  renderReportFooter(doc, 1, 1);
  doc.save("inventory-valuation-report.pdf");
}

// ============================================================================
// 5. UAE VAT 201 RETURN STATEMENT PDF
// ============================================================================
export function generateVatReturnPdf(data: any, filters: ReportFilterInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  filters.trn = data.trn;
  let y = renderReportHeader(doc, "UAE VAT 201 Return Statement", filters);

  // 3 KPI Cards
  const cardW = (pageRight - pageLeft - 4) / 3;
  const cardH = 18;
  drawKpiCard(doc, pageLeft, y, cardW, cardH, "Output VAT (Box 1)", `AED ${fmt(data.output?.outputVat)}`, `${data.output?.salesCount || 0} completed taxable orders`, [37, 99, 235]);
  drawKpiCard(doc, pageLeft + cardW + 2, y, cardW, cardH, "Input VAT (Box 9)", `AED ${fmt(data.input?.inputVat)}`, `${data.input?.purchasesCount || 0} recoverable purchase bills`, [147, 51, 234]);

  const isPayable = data.net?.position === "payable";
  const isRefundable = data.net?.position === "refundable";
  const netTitle = isPayable ? "Net VAT Payable" : isRefundable ? "Net VAT Refundable" : "Net VAT Balanced";
  const netColor: [number, number, number] = isPayable ? [185, 28, 28] : isRefundable ? [22, 101, 52] : darkInk;
  const netSub = isPayable ? "Due to Federal Tax Authority" : isRefundable ? "Claimable refund from FTA" : "Balanced zero liability";
  drawKpiCard(doc, pageLeft + (cardW + 2) * 2, y, cardW, cardH, netTitle, `AED ${fmt(data.net?.amount)}`, netSub, netColor);

  y += cardH + 8;

  // Declaration Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("UAE VAT 201 Tax Declaration Breakdown", pageLeft, y);
  y += 4;

  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.rect(pageLeft, y, pageRight - pageLeft, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TAX BOX / DESCRIPTION", pageLeft + 3, y + 4.8);
  doc.text("TXNS", 95, y + 4.8, { align: "right" });
  doc.text("NET (EX-VAT)", 128, y + 4.8, { align: "right" });
  doc.text("RATE", 148, y + 4.8, { align: "right" });
  doc.text("VAT AMOUNT (AED)", pageRight - 3, y + 4.8, { align: "right" });

  y += 7;

  // Row 1: Box 1 Output VAT
  doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
  doc.rect(pageLeft, y, pageRight - pageLeft, 9, "F");
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.2);
  doc.line(pageLeft, y + 9, pageRight, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Box 1: Standard Rated Supplies (Sales)", pageLeft + 3, y + 4.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text("Output VAT collected from POS customers & delivery channels", pageLeft + 3, y + 7.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(String(data.output?.salesCount || 0), 95, y + 5.5, { align: "right" });
  doc.text(fmt(data.output?.netSalesExVat), 128, y + 5.5, { align: "right" });
  doc.text("5.00%", 148, y + 5.5, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(fmt(data.output?.outputVat), pageRight - 3, y + 5.5, { align: "right" });

  y += 9;

  // Row 2: Box 9 Input VAT
  doc.rect(pageLeft, y, pageRight - pageLeft, 9, "F");
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.line(pageLeft, y + 9, pageRight, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Box 9: Standard Rated Expenses & Purchases", pageLeft + 3, y + 4.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text("Recoverable input VAT paid on vendor bills & operational purchases", pageLeft + 3, y + 7.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(String(data.input?.purchasesCount || 0), 95, y + 5.5, { align: "right" });
  doc.text(fmt(data.input?.netPurchasesExVat), 128, y + 5.5, { align: "right" });
  doc.text("5.00%", 148, y + 5.5, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(147, 51, 234);
  doc.text(fmt(data.input?.inputVat), pageRight - 3, y + 5.5, { align: "right" });

  y += 9;

  // Row 3: Box 14 Net VAT Position
  doc.setFillColor(243, 244, 246);
  doc.rect(pageLeft, y, pageRight - pageLeft, 10, "F");
  doc.setDrawColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.setLineWidth(0.4);
  doc.line(pageLeft, y + 10, pageRight, y + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  const box14Title = isPayable
    ? "Box 14: Net VAT Payable to FTA"
    : isRefundable
    ? "Box 14: Net VAT Refund Claimable from FTA"
    : "Box 14: Net VAT Balanced Position";
  doc.text(box14Title, pageLeft + 3, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text("Total Output Tax (Box 1) minus Total Input Tax Recoverable (Box 9)", pageLeft + 3, y + 8);

  doc.text("—", 95, y + 6, { align: "right" });
  const netNet = (data.output?.netSalesExVat || 0) - (data.input?.netPurchasesExVat || 0);
  doc.text(fmt(netNet), 128, y + 6, { align: "right" });
  doc.text("—", 148, y + 6, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(netColor[0], netColor[1], netColor[2]);
  doc.text(`AED ${fmt(data.net?.amount)}`, pageRight - 3, y + 6, { align: "right" });

  y += 18;

  // Compliance & Regulatory Advisory Box
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageLeft, y, pageRight - pageLeft, 16, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text("REGULATORY ADVISORY & COMPLIANCE NOTICE", pageLeft + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14);
  const disclaimerText =
    "This statement is an operational summary based on recorded transactional data in the Cloudynation POS system. Please verify transaction logs and accounting records against official Federal Tax Authority (FTA) filing requirements and designated tax period boundaries prior to submission on the EmaraTax portal.";
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageRight - pageLeft - 8);
  doc.text(splitDisclaimer, pageLeft + 4, y + 9.5);

  renderReportFooter(doc, 1, 1);
  doc.save("uae-vat-201-return.pdf");
}
