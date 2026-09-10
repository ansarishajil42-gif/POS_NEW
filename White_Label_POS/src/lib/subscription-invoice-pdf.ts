import { jsPDF } from "jspdf";

export interface SubscriptionInvoiceData {
  invoiceNumber: string;
  tenantName: string;
  tenantSubdomain?: string;
  tenantTrn?: string;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  planName: string;
  billingCycle: string;
  durationMonths: number;
  subtotal: number | string;
  vatAmount: number | string;
  totalAmount: number | string;
  currency?: string;
  paymentStatus: string;
  paymentMethod?: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  createdAt: string | Date;
}

/**
 * Generates an official branded PDF tax invoice for a tenant subscription.
 * Uses the exact brand assets, vector logo, and color system of cloudynationpos.
 */
export function generateSubscriptionInvoicePdf(invoice: SubscriptionInvoiceData) {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });
  const currency = invoice.currency || "AED";

  // Brand Color Palette
  const brandLime: [number, number, number] = [57, 255, 20];      // #39ff14
  const darkInk: [number, number, number] = [17, 24, 39];         // #111827
  const mutedSlate: [number, number, number] = [100, 116, 139];   // #64748b
  const borderSlate: [number, number, number] = [226, 232, 240];  // #e2e8f0
  const surfaceLight: [number, number, number] = [248, 250, 252]; // #f8fafc

  const pageRight = 196;
  const pageLeft = 14;

  // -------------------------------------------------------------
  // 1. Header: Vector Brand Logo (Matching Logo.tsx exactly)
  // -------------------------------------------------------------
  // Two vertical rounded pills
  doc.setFillColor(brandLime[0], brandLime[1], brandLime[2]);
  doc.roundedRect(pageLeft, 15, 2.2, 7.5, 1.1, 1.1, "F");

  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.roundedRect(pageLeft + 3.2, 15, 2.2, 7.5, 1.1, 1.1, "F");

  // Wordmark: "cloudynation" in dark ink, "pos" in neon lime
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("cloudynation", pageLeft + 7.5, 22);

  const wordmarkWidth = doc.getTextWidth("cloudynation");
  doc.setTextColor(brandLime[0], brandLime[1], brandLime[2]);
  doc.text("pos", pageLeft + 7.5 + wordmarkWidth, 22);

  // Real Legal Platform Details (Replacing placeholder info)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text("Cloudynation POS", pageLeft, 27.5);
  doc.text("License No.: CWS-1V-227668", pageLeft, 32);
  doc.text("26th Floor, Amber Gem Tower, Ajman, UAE", pageLeft, 36.5);
  doc.text("Info@cloudynationpos.com | +971 55 217 7186 | www.cloudynationpos.com", pageLeft, 41);

  // Right-aligned Invoice Title & Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("TAX INVOICE", pageRight, 21, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(`Invoice Ref: ${invoice.invoiceNumber}`, pageRight, 27, { align: "right" });

  const issueDateStr = new Date(invoice.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const dueDateStr = new Date(invoice.periodEnd).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  doc.text(`Issued Date: ${issueDateStr}`, pageRight, 32, { align: "right" });
  doc.text(`Period Due: ${dueDateStr}`, pageRight, 37, { align: "right" });

  // Branded Accent Divider Line (Thin lime highlight above border)
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.4);
  doc.line(pageLeft, 46, pageRight, 46);

  // -------------------------------------------------------------
  // 2. Billed To & Subscription Details
  // -------------------------------------------------------------
  let y = 54;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Billed To (Tenant Account):", pageLeft, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(invoice.tenantName, pageLeft, y);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);

  if (invoice.tenantSubdomain) {
    y += 4.5;
    doc.text(`Domain: ${invoice.tenantSubdomain}.cloudynationpos.com`, pageLeft, y);
  }
  if (invoice.tenantTrn) {
    y += 4.5;
    doc.text(`TRN: ${invoice.tenantTrn}`, pageLeft, y);
  }
  if (invoice.adminName) {
    y += 4.5;
    doc.text(`Contact: ${invoice.adminName}`, pageLeft, y);
  }
  if (invoice.adminEmail) {
    y += 4.5;
    doc.text(`Email: ${invoice.adminEmail}`, pageLeft, y);
  }

  // Right-aligned Subscription Details
  const colRightX = 115;
  let rightY = 54;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Subscription Details:", colRightX, rightY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);

  rightY += 5;
  doc.text(`Plan Tier: ${invoice.planName}`, colRightX, rightY);
  
  rightY += 4.5;
  doc.text(`Billing Cycle: ${invoice.billingCycle.toUpperCase().replace(/_/g, " ")}`, colRightX, rightY);

  // Coverage Period: ASCII "to" instead of unicode arrow to avoid text overlapping/garbling
  const startStr = new Date(invoice.periodStart).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const endStr = new Date(invoice.periodEnd).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  rightY += 4.5;
  doc.text(`Coverage: ${startStr} to ${endStr}`, colRightX, rightY);

  rightY += 4.5;
  const statusFormatted = invoice.paymentStatus.toUpperCase().replace(/_/g, " ");
  doc.text(`Payment Status: ${statusFormatted}`, colRightX, rightY);

  rightY += 4.5;
  const methodFormatted = (invoice.paymentMethod || "Mamo Pay").toUpperCase().replace(/_/g, " ");
  doc.text(`Payment Gateway: ${methodFormatted}`, colRightX, rightY);

  // -------------------------------------------------------------
  // 3. Line Items Table
  // -------------------------------------------------------------
  const tableStartY = Math.max(y, rightY) + 8;

  // Table Header Background
  doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
  doc.rect(pageLeft, tableStartY, pageRight - pageLeft, 8, "F");

  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.3);
  doc.line(pageLeft, tableStartY, pageRight, tableStartY);
  doc.line(pageLeft, tableStartY + 8, pageRight, tableStartY + 8);

  const headerTextY = tableStartY + 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("PLAN DESCRIPTION", pageLeft + 3, headerTextY);
  doc.text("DURATION", 110, headerTextY, { align: "right" });
  doc.text(`RATE (${currency})`, 150, headerTextY, { align: "right" });
  doc.text(`SUBTOTAL (${currency})`, pageRight - 3, headerTextY, { align: "right" });

  // Table Row
  let itemY = tableStartY + 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);

  const lineDescription = `${invoice.planName} Tier SaaS Subscription (${invoice.billingCycle.replace(/_/g, " ")})`;
  doc.text(lineDescription, pageLeft + 3, itemY);
  doc.text(`${invoice.durationMonths} Month${invoice.durationMonths > 1 ? "s" : ""}`, 110, itemY, { align: "right" });

  const subtotalNum = Number(invoice.subtotal || 0);
  const vatNum = Number(invoice.vatAmount || 0);
  const totalNum = Number(invoice.totalAmount || 0);

  const ratePerMonth = invoice.durationMonths > 0 ? (subtotalNum / invoice.durationMonths).toFixed(2) : subtotalNum.toFixed(2);
  doc.text(`${ratePerMonth}`, 150, itemY, { align: "right" });
  doc.text(`${subtotalNum.toFixed(2)}`, pageRight - 3, itemY, { align: "right" });

  // Bottom Table Border
  itemY += 6;
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.line(pageLeft, itemY, pageRight, itemY);

  // -------------------------------------------------------------
  // 4. Financial Summary Breakdown
  // -------------------------------------------------------------
  itemY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text("Subtotal:", 150, itemY, { align: "right" });
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(`${subtotalNum.toFixed(2)} ${currency}`, pageRight - 3, itemY, { align: "right" });

  itemY += 6;
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text("UAE VAT (5.00%):", 150, itemY, { align: "right" });
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(`${vatNum.toFixed(2)} ${currency}`, pageRight - 3, itemY, { align: "right" });

  // Total Due Highlight Box
  itemY += 5;
  doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.roundedRect(120, itemY, pageRight - 120, 11, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Total Due:", 150, itemY + 7.5, { align: "right" });
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(`${totalNum.toFixed(2)} ${currency}`, pageRight - 3, itemY + 7.5, { align: "right" });

  // -------------------------------------------------------------
  // 5. Payment Status Stamp Box (Branded Tones)
  // -------------------------------------------------------------
  itemY += 22;
  const isPaid = invoice.paymentStatus === "paid" || invoice.paymentStatus === "manual_paid";
  const isOverdue = invoice.paymentStatus === "overdue";

  if (isPaid) {
    // Paid & Settled (Light mint background with lime border)
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(57, 255, 20);
    doc.setLineWidth(0.6);
    doc.roundedRect(pageLeft, itemY, pageRight - pageLeft, 13, 2, 2, "FD");
    
    doc.setTextColor(22, 101, 52);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("PAYMENT STATUS: PAID & SETTLED", 105, itemY + 8.5, { align: "center" });
  } else if (isOverdue) {
    // Overdue (Rose/Red alert)
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.6);
    doc.roundedRect(pageLeft, itemY, pageRight - pageLeft, 13, 2, 2, "FD");
    
    doc.setTextColor(185, 28, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("PAYMENT STATUS: OVERDUE - PAYMENT REQUIRED", 105, itemY + 8.5, { align: "center" });
  } else {
    // Pending Gateway Integration (Amber)
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.6);
    doc.roundedRect(pageLeft, itemY, pageRight - pageLeft, 13, 2, 2, "FD");
    
    doc.setTextColor(180, 83, 9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("PAYMENT STATUS: PENDING GATEWAY INTEGRATION (MAMO PAY)", 105, itemY + 8.5, { align: "center" });
  }

  // -------------------------------------------------------------
  // 6. Clean Footer Notes
  // -------------------------------------------------------------
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.3);
  doc.line(pageLeft, 274, pageRight, 274);

  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Electronically generated Tax Invoice - Cloudynation POS SaaS Platform - Ajman, UAE", 105, 279, { align: "center" });
  doc.text("License: CWS-1V-227668 - Info@cloudynationpos.com - www.cloudynationpos.com", 105, 283, { align: "center" });

  doc.save(`subscription-invoice-${invoice.invoiceNumber}.pdf`);
}
