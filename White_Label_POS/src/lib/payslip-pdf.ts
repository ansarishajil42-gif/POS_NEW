import { jsPDF } from "jspdf";

export interface PayslipPdfData {
  payslipNumber: string;
  periodMonth: string; // e.g. "2026-09"
  generatedAt: string | Date;
  status: string; // "Draft" | "Approved" | "Paid"
  approvedByName?: string | null;
  approvedAt?: string | Date | null;
  paidAt?: string | Date | null;
  currency?: string;
  employee: {
    id: string;
    name: string;
    role: string;
    branchName: string;
    joinDate?: string | null;
    bankName?: string | null;
    maskedIban?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  earnings: {
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: number;
    totalAllowances: number;
    grossSalary: number;
  };
  deductions: {
    unpaidDays: number;
    unpaidDeduction: number;
    standardDeductions: number;
    totalDeductions: number;
    notes?: string | null;
  };
  netSalary: number;
}

const formatCurrency = (val: number, curr = "AED") => {
  return `${curr} ${Number(val || 0).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Generates an official branded PDF payslip for an employee.
 * Uses the exact brand assets, vector logo, and color system of Cloudynation POS.
 */
export function generatePayslipPdf(data: PayslipPdfData) {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });
  const curr = data.currency || "AED";

  // Brand Color Palette
  const brandLime: [number, number, number] = [57, 255, 20]; // #39ff14
  const darkInk: [number, number, number] = [17, 24, 39]; // #111827
  const mutedSlate: [number, number, number] = [100, 116, 139]; // #64748b
  const borderSlate: [number, number, number] = [226, 232, 240]; // #e2e8f0
  const surfaceLight: [number, number, number] = [248, 250, 252]; // #f8fafc
  const highlightGreen: [number, number, number] = [16, 185, 129]; // #10b981
  const deductionRed: [number, number, number] = [225, 29, 72]; // #e11d48

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

  // Legal Platform Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text("Cloudynation POS", pageLeft, 27.5);
  doc.text("License No.: CWS-1V-227668", pageLeft, 32);
  doc.text("26th Floor, Amber Gem Tower, Ajman, UAE", pageLeft, 36.5);
  doc.text("Info@cloudynationpos.com | +971 55 217 7186 | www.cloudynationpos.com", pageLeft, 41);

  // Right-aligned Payslip Title & Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("PAYSLIP / SALARY STATEMENT", pageRight, 21, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(`Ref: ${data.payslipNumber}`, pageRight, 27, { align: "right" });

  // Format Month name (e.g. September 2026)
  let monthLabel = data.periodMonth;
  try {
    const [y, m] = data.periodMonth.split("-");
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {}

  doc.text(`Pay Period: ${monthLabel}`, pageRight, 32, { align: "right" });

  const generatedDateStr = new Date(data.generatedAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.text(`Issue Date: ${generatedDateStr}`, pageRight, 37, { align: "right" });

  // Branded Accent Divider Line
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.4);
  doc.line(pageLeft, 45, pageRight, 45);

  // -------------------------------------------------------------
  // 2. Employee Details Card (2 Columns Box)
  // -------------------------------------------------------------
  let y = 52;
  const boxHeight = 36;
  doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.roundedRect(pageLeft, y, pageRight - pageLeft, boxHeight, 2, 2, "FD");

  // Left Column
  const col1X = pageLeft + 5;
  let textY = y + 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Employee Name:", col1X, textY);
  doc.setFont("helvetica", "normal");
  doc.text(data.employee.name, col1X + 32, textY);

  textY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Designation / Role:", col1X, textY);
  doc.setFont("helvetica", "normal");
  doc.text(data.employee.role.replace(/_/g, " ").toUpperCase(), col1X + 32, textY);

  textY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Branch Assignment:", col1X, textY);
  doc.setFont("helvetica", "normal");
  doc.text(data.employee.branchName || "Unassigned", col1X + 32, textY);

  textY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Employment Joined:", col1X, textY);
  doc.setFont("helvetica", "normal");
  doc.text(data.employee.joinDate || "Not recorded", col1X + 32, textY);

  // Right Column
  const col2X = 110;
  textY = y + 7;
  doc.setFont("helvetica", "bold");
  doc.text("Employee ID:", col2X, textY);
  doc.setFont("helvetica", "normal");
  doc.text(data.employee.id.slice(0, 13) + "...", col2X + 28, textY);

  textY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Disbursement Status:", col2X, textY);
  doc.setFont("helvetica", "bold");
  if (data.status === "Paid") {
    doc.setTextColor(highlightGreen[0], highlightGreen[1], highlightGreen[2]);
  } else if (data.status === "Approved") {
    doc.setTextColor(37, 99, 235); // blue
  } else {
    doc.setTextColor(217, 119, 6); // amber
  }
  doc.text(data.status.toUpperCase(), col2X + 38, textY);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);

  textY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Bank Name:", col2X, textY);
  doc.setFont("helvetica", "normal");
  doc.text(data.employee.bankName || "Not configured", col2X + 28, textY);

  textY += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Account / IBAN:", col2X, textY);
  doc.setFont("helvetica", "normal");
  doc.text(data.employee.maskedIban || "Not configured", col2X + 28, textY);

  // -------------------------------------------------------------
  // 3. Earnings & Deductions Tables (Side by Side Breakdown)
  // -------------------------------------------------------------
  y = 96;
  const tableWidth = (pageRight - pageLeft - 6) / 2; // ~88mm each
  const rightTableX = pageLeft + tableWidth + 6;

  // Earnings Header
  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.roundedRect(pageLeft, y, tableWidth, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("EARNINGS & ALLOWANCES", pageLeft + 4, y + 4.8);
  doc.text("AMOUNT", pageLeft + tableWidth - 4, y + 4.8, { align: "right" });

  // Deductions Header
  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.roundedRect(rightTableX, y, tableWidth, 7, 1.5, 1.5, "F");
  doc.text("DEDUCTIONS & ADJUSTMENTS", rightTableX + 4, y + 4.8);
  doc.text("AMOUNT", rightTableX + tableWidth - 4, y + 4.8, { align: "right" });

  // Earnings Rows
  const earningsRows = [
    { label: "Basic Salary", amount: data.earnings.basicSalary },
    { label: "Housing Allowance", amount: data.earnings.housingAllowance },
    { label: "Transport Allowance", amount: data.earnings.transportAllowance },
    { label: "Other Allowances", amount: data.earnings.otherAllowances },
  ];

  // Deductions Rows
  const deductionsRows = [
    {
      label: `Unpaid Time Off (${data.deductions.unpaidDays} ${data.deductions.unpaidDays === 1 ? "day" : "days"})`,
      amount: data.deductions.unpaidDeduction,
      isSub: true,
    },
    {
      label: "Standard Deductions",
      amount: data.deductions.standardDeductions,
      isSub: false,
    },
  ];

  let rowY = y + 13;
  const rowHeight = 7;
  doc.setFontSize(8.5);

  // Print Earnings
  earningsRows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
      doc.rect(pageLeft, rowY - 4.5, tableWidth, rowHeight, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text(r.label, pageLeft + 4, rowY);
    doc.text(formatCurrency(r.amount, curr), pageLeft + tableWidth - 4, rowY, { align: "right" });
    rowY += rowHeight;
  });

  // Print Deductions
  let dRowY = y + 13;
  deductionsRows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
      doc.rect(rightTableX, dRowY - 4.5, tableWidth, rowHeight, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text(r.label, rightTableX + 4, dRowY);
    if (r.amount > 0) {
      doc.setTextColor(deductionRed[0], deductionRed[1], deductionRed[2]);
      doc.text(`-${formatCurrency(r.amount, curr)}`, rightTableX + tableWidth - 4, dRowY, { align: "right" });
    } else {
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text(formatCurrency(0, curr), rightTableX + tableWidth - 4, dRowY, { align: "right" });
    }
    dRowY += rowHeight;
  });

  // Fill empty rows for alignment
  for (let i = deductionsRows.length; i < earningsRows.length; i++) {
    if (i % 2 === 1) {
      doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
      doc.rect(rightTableX, dRowY - 4.5, tableWidth, rowHeight, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text("-", rightTableX + 4, dRowY);
    doc.text(formatCurrency(0, curr), rightTableX + tableWidth - 4, dRowY, { align: "right" });
    dRowY += rowHeight;
  }

  // Earnings & Deductions Totals Line
  const totalsY = Math.max(rowY, dRowY) + 2;

  // Total Gross Box
  doc.setFillColor(surfaceLight[0], surfaceLight[1], surfaceLight[2]);
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.roundedRect(pageLeft, totalsY - 4.5, tableWidth, 8, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("TOTAL GROSS SALARY:", pageLeft + 4, totalsY + 1);
  doc.text(formatCurrency(data.earnings.grossSalary, curr), pageLeft + tableWidth - 4, totalsY + 1, { align: "right" });

  // Total Deductions Box
  doc.roundedRect(rightTableX, totalsY - 4.5, tableWidth, 8, 1, 1, "FD");
  doc.text("TOTAL DEDUCTIONS:", rightTableX + 4, totalsY + 1);
  doc.setTextColor(data.deductions.totalDeductions > 0 ? deductionRed[0] : darkInk[0], data.deductions.totalDeductions > 0 ? deductionRed[1] : darkInk[1], data.deductions.totalDeductions > 0 ? deductionRed[2] : darkInk[2]);
  doc.text(
    data.deductions.totalDeductions > 0 ? `-${formatCurrency(data.deductions.totalDeductions, curr)}` : formatCurrency(0, curr),
    rightTableX + tableWidth - 4,
    totalsY + 1,
    { align: "right" }
  );

  // -------------------------------------------------------------
  // 4. Net Salary Callout Banner (Prominent VIP Box)
  // -------------------------------------------------------------
  const netBannerY = totalsY + 14;
  doc.setFillColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.roundedRect(pageLeft, netBannerY, pageRight - pageLeft, 22, 2.5, 2.5, "F");

  // Left side banner text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("NET SALARY PAYABLE", pageLeft + 8, netBannerY + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(brandLime[0], brandLime[1], brandLime[2]);
  doc.text("(Gross Salary - Total Deductions & Adjustments)", pageLeft + 8, netBannerY + 15.5);

  // Right side net amount
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(brandLime[0], brandLime[1], brandLime[2]);
  doc.text(formatCurrency(data.netSalary, curr), pageRight - 8, netBannerY + 13.5, { align: "right" });

  // -------------------------------------------------------------
  // 5. Notes / Calculation Remarks
  // -------------------------------------------------------------
  let remarksY = netBannerY + 30;
  if (data.deductions.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.text("Payroll Calculation Remarks:", pageLeft, remarksY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text(data.deductions.notes, pageLeft, remarksY + 5);
    remarksY += 12;
  }

  // -------------------------------------------------------------
  // 6. Signatures & Acknowledgement Lines
  // -------------------------------------------------------------
  const sigY = Math.max(remarksY + 10, 225);

  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.4);

  // Employer Signature Line
  const sigBoxWidth = 70;
  doc.line(pageLeft, sigY, pageLeft + sigBoxWidth, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Authorized Employer Representative", pageLeft, sigY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(data.approvedByName ? `Approved by ${data.approvedByName}` : "Cloudynation POS Head Office HR", pageLeft, sigY + 9);

  // Employee Acknowledgement Line
  const empSigX = pageRight - sigBoxWidth;
  doc.line(empSigX, sigY, pageRight, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text("Employee Signature / Acknowledgement", empSigX, sigY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(data.employee.name, empSigX, sigY + 9);

  // -------------------------------------------------------------
  // 7. Footer: Official Disclaimer
  // -------------------------------------------------------------
  const footerY = 278;
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.line(pageLeft, footerY - 5, pageRight, footerY - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(
    "This is a system-generated payslip issued by Cloudynation POS Payroll Management Engine.",
    105,
    footerY,
    { align: "center" }
  );
  doc.text(
    "Confidential document • Any discrepancy must be reported to HR within 7 business days.",
    105,
    footerY + 4,
    { align: "center" }
  );

  // Save / Trigger Download
  const cleanName = data.employee.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Payslip_${cleanName}_${data.periodMonth}.pdf`;
  doc.save(fileName);
}
