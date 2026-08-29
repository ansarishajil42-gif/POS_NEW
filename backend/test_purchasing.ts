import jwt from "jsonwebtoken";

async function runTest() {
  try {
    console.log('1. Logging in (creating token directly)...');
    
    const token = jwt.sign(
      { 
        id: '65fd2640-d744-49cd-a8a7-10a94d8d8666', 
        email: 'mirza@gmail.com', 
        role: 'cashier', 
        tenantId: 'dacf94f6-9eef-4b46-9a3c-c43ead83e686', 
        branchId: '4937682c-3caa-4e7b-bacc-7a347648bcf3' 
      }, 
      'super-secret-key-12345'
    );
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    console.log('2. Creating a product for PO test...');
    const prodRes = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ 
        name: `Test Product ${Date.now()}`, 
        barcode: `BAR-${Date.now()}`, 
        category: 'Test', 
        unit: 'pcs', 
        costPrice: '10', 
        salePrice: '20', 
        isBatchTracked: true, 
        stockQuantity: 0, 
        minStockLevel: 5 
      })
    });
    const product = await prodRes.json();
    console.log('Product created:', product.id || product);

    console.log('3. Creating Vendor...');
    const vendorRes = await fetch('http://localhost:3000/api/vendors', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ name: 'Test Vendor API', email: `test${Date.now()}@vendor.com`, trn: '123456789' })
    });
    const vendor = await vendorRes.json();
    console.log('Vendor response:', vendor.id || vendor);

    if (!vendor || !vendor.id) {
        throw new Error('Vendor ID is undefined: ' + JSON.stringify(vendor));
    }

    console.log('4. Creating PO...');
    const poRes = await fetch('http://localhost:3000/api/purchasing/pos', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        vendorId: vendor.id,
        total: product.salePriceRaw || product.price || 10,
        items: [{ productId: product.id, qty: 10, unitPrice: product.costPriceRaw || product.cost || 5 }]
      })
    });
    const po = await poRes.json();
    console.log('PO created:', po.id || po);

    if (!po || !po.id) {
        throw new Error('PO ID is undefined: ' + JSON.stringify(po));
    }

    console.log('5. Recording GRN...');
    const grnRes = await fetch(`http://localhost:3000/api/purchasing/pos/${po.id}/grn`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        items: [{ productId: product.id, receivedQty: 10, batchNumber: 'BATCH001', expiryDate: '2026-12-31' }]
      })
    });
    const grn = await grnRes.json();
    console.log('GRN created:', grn.id || grn);

    console.log('6. Converting to Invoice...');
    const invRes = await fetch(`http://localhost:3000/api/purchasing/grns/${grn.id}/invoice`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({})
    });
    const inv = await invRes.json();
    console.log('Invoice created:', inv.id || inv);

    console.log('TEST PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('TEST FAILED:', err.message);
  }
}

runTest();
