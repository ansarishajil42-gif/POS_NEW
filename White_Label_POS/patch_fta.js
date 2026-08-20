const fs = require('fs');
const file = 'src/lib/head-office-server.ts';
let content = fs.readFileSync(file, 'utf8');

const newFn = \
export const generateFtaSummaryFn = createServerFn({ method: "POST" })
    .validator((d: { startDate: string; endDate: string; branchId?: string }) => d)
    .handler(async ({ data }) => {
        const tenantId = await getHeadOfficeTenant();
        
        const sDate = new Date(data.startDate);
        const eDate = new Date(data.endDate);
        eDate.setHours(23, 59, 59, 999);
        
        if (isNaN(sDate.getTime()) || isNaN(eDate.getTime()) || sDate > eDate) {
            throw new Error("Invalid date range");
        }

        const settings = await db.query.tenantSettings.findFirst({
            where: eq(tenantSettings.tenantId, tenantId)
        });
        const vatRate = settings ? parseFloat(settings.vatRate) / 100 : 0.05;
        const inclusive = settings ? settings.vatInclusive : true;
        const currency = settings ? settings.currency : "AED";

        // Query Sales
        const salesConditions = [
            eq(orders.tenantId, tenantId),
            sql\\\\\\ >= \\\\\\,
            sql\\\\\\ <= \\\\\\,
            eq(orders.status, "completed")
        ];
        if (data.branchId && data.branchId !== 'all') salesConditions.push(eq(orders.branchId, data.branchId));
        
        const sales = await db.select({
            subtotal: orders.subtotal,
            vat: orders.vat,
            total: orders.total
        }).from(orders).where(and(...salesConditions));

        // Query Purchases
        const purchaseConditions = [
            eq(purchaseOrders.tenantId, tenantId),
            sql\\\\\\ >= \\\\\\,
            sql\\\\\\ <= \\\\\\,
            inArray(purchaseOrders.status, ["GRN", "Invoiced"])
        ];
        if (data.branchId && data.branchId !== 'all') purchaseConditions.push(eq(purchaseOrders.branchId, data.branchId));

        const purchases = await db.select({
            total: purchaseOrders.total
        }).from(purchaseOrders).where(and(...purchaseConditions));

        let totalSales = 0;
        let outputVat = 0;
        let taxableSales = 0;

        sales.forEach(s => {
            totalSales += parseFloat(s.total as string);
            outputVat += parseFloat(s.vat as string);
            taxableSales += parseFloat(s.subtotal as string);
        });

        let totalPurchases = 0;
        let inputVat = 0;
        let taxablePurchases = 0;

        purchases.forEach(p => {
            const t = parseFloat(p.total as string);
            totalPurchases += t;
            if (inclusive) {
                const tax = t - (t / (1 + vatRate));
                inputVat += tax;
                taxablePurchases += (t - tax);
            } else {
                inputVat += t * vatRate;
                taxablePurchases += t;
            }
        });

        const netVat = outputVat - inputVat;

        // Create CSV String
        const BOM = "\\uFEFF";
        let csv = BOM;
        csv += '"FTA VAT Summary"\\n';
        csv += '"Date Range","' + sDate.toISOString().split('T')[0] + ' to ' + eDate.toISOString().split('T')[0] + '"\\n';
        csv += '"Currency","' + currency + '"\\n\\n';
        
        csv += '"Description","Amount"\\n';
        csv += '"Total Sales","' + totalSales.toFixed(2) + '"\\n';
        csv += '"Taxable Sales","' + taxableSales.toFixed(2) + '"\\n';
        csv += '"Output VAT (Collected)","' + outputVat.toFixed(2) + '"\\n';
        csv += '"Total Purchases","' + totalPurchases.toFixed(2) + '"\\n';
        csv += '"Taxable Purchases","' + taxablePurchases.toFixed(2) + '"\\n';
        csv += '"Input VAT (Paid)","' + inputVat.toFixed(2) + '"\\n';
        csv += '"Net VAT Due/(Refundable)","' + netVat.toFixed(2) + '"\\n';

        return { success: true, csv };
    });
\;

if (!content.includes('generateFtaSummaryFn')) {
    content += "\n" + newFn;
    fs.writeFileSync(file, content, 'utf8');
    console.log("Added generateFtaSummaryFn");
}
