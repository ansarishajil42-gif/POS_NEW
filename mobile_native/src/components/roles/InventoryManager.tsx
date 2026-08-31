import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { AppHeader, ScreenBody } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet, Field } from '../ui/Primitives';
import { useAuth } from '../../lib/auth';
import { useInventoryManager, FEFOBatch, StockTransfer, InventoryProduct } from '../../lib/InventoryManagerContext';
import { formatCurrency } from '../../lib/utils';
import { Toast, type ToastType } from '../ui/Toast';
import {
  Boxes,
  AlertTriangle,
  Calendar,
  ArrowUpDown,
  Bell,
  Search,
  Plus,
  Download,
  Clipboard,
  ShoppingCart,
  FileText
} from 'lucide-react-native';

export function InventoryHome() {
  const { branch } = useAuth();
  const { products, transfers, batches, adjustStock, fetchData } = useInventoryManager();

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Stock Adjustment Form State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjProductId, setAdjProductId] = useState('');
  const [adjBranchId, setAdjBranchId] = useState('');
  const [adjQty, setAdjQty] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');

  // Dropdown selector toggle states
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);

  // Local search/filter states
  const [q, setQ] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');

  // Dynamic list of unique branches based on active inventory products
  const branchesFilter = useMemo(() => {
    const names = new Set(products.map((p) => p.branch).filter(Boolean));
    return ['All', ...Array.from(names)];
  }, [products]);

  const lowStockCount = useMemo(() => products.filter((p) => p.stock <= p.reorder).length, [products]);
  const nearExpiryCount = useMemo(() => batches.filter((b) => b.status !== 'fresh').length, [batches]);
  const pendingTransfers = useMemo(() => transfers.filter((t) => t.status !== 'Received' && t.status !== 'Completed').length, [transfers]);

  const handleStartCount = () => {
    // Audit counting triggers scanner terminal syncing simulation
    Alert.alert('Stock Count Started', 'Physical stock count sequence initiated. Scanner terminals synchronized.');
  };

  const handleExportStock = () => {
    showToast('Branch stock levels sheet has been exported to CSV.', 'success');
  };

  const handleAdjustSubmit = async () => {
    if (!adjProductId || !adjBranchId || !adjQty || !adjReason) {
      showToast('Please fill all stock adjustment fields.', 'error');
      return;
    }
    const qtyChange = parseInt(adjQty);
    if (isNaN(qtyChange) || qtyChange === 0) {
      showToast('Quantity change cannot be zero.', 'error');
      return;
    }

    try {
      await adjustStock(adjProductId, adjBranchId, null, qtyChange, adjReason);
      showToast('Manual stock adjustment logged successfully.', 'success');
      setAdjustOpen(false);
      setAdjProductId('');
      setAdjBranchId('');
      setAdjQty('');
      setAdjReason('');
      setProductSearch('');
      setBranchSearch('');
    } catch (e: any) {
      showToast(e.message || 'Failed to adjust stock', 'error');
    }
  };

  // Memoized Searchable Selectors for stock adjust form
  const filteredProductPicker = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const selectedProductObj = useMemo(() => {
    return products.find((p) => p.productId === adjProductId);
  }, [products, adjProductId]);

  // Unique list of branch records
  const uniqueBranchRecords = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p.branchId && p.branch) {
        map.set(p.branchId, { id: p.branchId, name: p.branch });
      }
    });
    return Array.from(map.values()).filter((b) =>
      b.name.toLowerCase().includes(branchSearch.toLowerCase())
    );
  }, [products, branchSearch]);

  const selectedBranchObj = useMemo(() => {
    return uniqueBranchRecords.find((b) => b.id === adjBranchId);
  }, [uniqueBranchRecords, adjBranchId]);

  // Filtered Stock Levels list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase());
      const matchesBranch = selectedBranch === 'All' || p.branch === selectedBranch;
      return matchesQuery && matchesBranch;
    });
  }, [products, q, selectedBranch]);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        {/* Actions panel */}
        <View style={styles.headerBtnWrapper}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button style={{ flex: 1 }} variant="primary" onClick={handleStartCount}>
              <Boxes size={15} color="#0f172a" style={{ marginRight: 6 }} />
              Start Count
            </Button>
            <Button style={{ flex: 1 }} variant="secondary" onClick={() => setAdjustOpen(true)}>
              <Plus size={15} color="#475569" style={{ marginRight: 6 }} />
              Stock Adjust
            </Button>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard label="Total SKUs" value={String(products.length)} icon={<Boxes size={16} color="#39ff14" />} accent="brand" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Low Stock" value={String(lowStockCount)} icon={<AlertTriangle size={16} color="#ef4444" />} accent="amber" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Near Expiry" value={String(nearExpiryCount)} icon={<Calendar size={16} color="#d97706" />} accent="amber" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Pending Transfers" value={String(pendingTransfers)} icon={<ArrowUpDown size={16} color="#0284c7" />} accent="sky" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Stock Levels</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search SKU or Product Name..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        {/* Branch Filter & Export Buttons */}
        <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContainer}>
            {branchesFilter.map((brName) => (
              <TouchableOpacity
                key={brName}
                style={[styles.catBadge, selectedBranch === brName && styles.catBadgeActive]}
                onPress={() => setSelectedBranch(brName)}
              >
                <Text style={[styles.catBadgeText, selectedBranch === brName && styles.catBadgeTextActive]}>
                  {brName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Button variant="secondary" onClick={handleExportStock}>
            <Download size={14} color="#475569" style={{ marginRight: 6 }} />
            Export Inventory Report
          </Button>
        </View>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          <View style={styles.listContainer}>
            {filteredProducts.map((p) => {
              const isLow = p.stock <= p.reorder;
              return (
                <Card key={p.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productMeta}>SKU: {p.sku} · Category: {p.category} · Branch: {p.branch}</Text>
                      <Text style={styles.productMeta}>Reorder Trigger: {p.reorder} {p.unit}</Text>
                    </View>
                    <View style={styles.productPriceCol}>
                      <Text style={styles.productPrice}>{p.stock} {p.unit}</Text>
                      <Badge variant={isLow ? 'warn' : 'success'}>
                        {isLow ? 'Low Stock' : 'Healthy'}
                      </Badge>
                    </View>
                  </View>
                </Card>
              );
            })}
            {filteredProducts.length === 0 && (
              <Text style={styles.noDataText}>No inventory matches your filters.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>

      {/* Manual Stock Adjust Sheet */}
      <Sheet
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Manual Stock Adjust"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleAdjustSubmit}>Save</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          {/* Searchable Product Dropdown */}
          <Field label="Select Product">
            <TouchableOpacity onPress={() => setProductPickerOpen(!productPickerOpen)} style={styles.modalInput}>
              <Text style={{ color: selectedProductObj ? '#0f172a' : '#94a3b8' }}>
                {selectedProductObj ? selectedProductObj.name : 'Choose Product...'}
              </Text>
            </TouchableOpacity>

            {productPickerOpen && (
              <View style={styles.searchableDropdownContainer}>
                <View style={styles.dropdownSearchField}>
                  <Search size={14} color="#94a3b8" />
                  <TextInput
                    placeholder="Search product name..."
                    placeholderTextColor="#94a3b8"
                    value={productSearch}
                    onChangeText={setProductSearch}
                    style={styles.dropdownSearchInput}
                  />
                </View>
                <ScrollView style={styles.dropdownListScroll} nestedScrollEnabled>
                  {filteredProductPicker.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.dropdownItem, adjProductId === p.productId && styles.dropdownItemActive]}
                      onPress={() => {
                        setAdjProductId(p.productId);
                        setProductPickerOpen(false);
                        setProductSearch('');
                      }}
                    >
                      <Text style={[styles.dropdownItemText, adjProductId === p.productId && styles.dropdownItemTextActive]}>
                        {p.name} (Stock: {p.stock})
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredProductPicker.length === 0 && (
                    <Text style={styles.noDataText}>No matching products.</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </Field>

          {/* Searchable Branch Dropdown */}
          <Field label="Select Branch">
            <TouchableOpacity onPress={() => setBranchPickerOpen(!branchPickerOpen)} style={styles.modalInput}>
              <Text style={{ color: selectedBranchObj ? '#0f172a' : '#94a3b8' }}>
                {selectedBranchObj ? selectedBranchObj.name : 'Choose Branch...'}
              </Text>
            </TouchableOpacity>

            {branchPickerOpen && (
              <View style={styles.searchableDropdownContainer}>
                <View style={styles.dropdownSearchField}>
                  <Search size={14} color="#94a3b8" />
                  <TextInput
                    placeholder="Search branch name..."
                    placeholderTextColor="#94a3b8"
                    value={branchSearch}
                    onChangeText={setBranchSearch}
                    style={styles.dropdownSearchInput}
                  />
                </View>
                <ScrollView style={styles.dropdownListScroll} nestedScrollEnabled>
                  {uniqueBranchRecords.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.dropdownItem, adjBranchId === b.id && styles.dropdownItemActive]}
                      onPress={() => {
                        setAdjBranchId(b.id);
                        setBranchPickerOpen(false);
                        setBranchSearch('');
                      }}
                    >
                      <Text style={[styles.dropdownItemText, adjBranchId === b.id && styles.dropdownItemTextActive]}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {uniqueBranchRecords.length === 0 && (
                    <Text style={styles.noDataText}>No matching branches.</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </Field>

          <Field label="Qty Change (+ / -)">
            <TextInput
              placeholder="e.g. 10 or -5"
              value={adjQty}
              onChangeText={setAdjQty}
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>

          <Field label="Reason">
            <TextInput
              placeholder="e.g. Audit variance, damage correction..."
              value={adjReason}
              onChangeText={setAdjReason}
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function InventoryBatches() {
  const { branch } = useAuth();
  const { batches, updateClearancePrice } = useInventoryManager();

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Search and Modal states
  const [q, setQ] = useState('');
  const [clearanceOpen, setClearanceOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<FEFOBatch | null>(null);
  const [clearanceVal, setClearanceVal] = useState('');

  const handleSetClearance = async () => {
    if (!selectedBatch) return;
    const discount = parseFloat(clearanceVal);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      showToast('Please enter a valid clearance discount percentage (1-100%).', 'error');
      return;
    }

    try {
      await updateClearancePrice(selectedBatch.productId, discount);
      showToast(`Clearance campaign generated at ${discount}% off for ${selectedBatch.product}.`, 'success');
      setClearanceVal('');
      setSelectedBatch(null);
      setClearanceOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to submit clearance promotion', 'error');
    }
  };

  const filteredBatches = useMemo(() => {
    return batches.filter((b) =>
      b.batchNumber.toLowerCase().includes(q.toLowerCase()) || b.product.toLowerCase().includes(q.toLowerCase())
    );
  }, [batches, q]);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Batch & Expiry (FEFO)</Text>

        {/* Batch Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search Batch No. or Product Name..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {filteredBatches.map((b) => (
              <Card key={b.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{b.product}</Text>
                    <Text style={styles.productMeta}>Batch No: {b.batchNumber} · Stock: {b.qty} units</Text>
                    {b.branchName && (
                      <Text style={styles.productMeta}>Branch: {b.branchName}</Text>
                    )}
                  </View>
                  <View style={styles.productPriceCol}>
                    <Text style={styles.productMeta}>Exp {b.expiry}</Text>
                    <Badge variant={statusVariant(b.status)} style={styles.marginT4}>
                      {b.status === 'urgent' ? 'Urgent' : b.status === 'near' ? 'Near' : 'Fresh'}
                    </Badge>
                  </View>
                </View>
                {(b.status === 'urgent' || b.status === 'near') && (
                  <Button
                    variant="secondary"
                    style={styles.clearanceBtn}
                    onClick={() => {
                      setSelectedBatch(b);
                      setClearanceOpen(true);
                    }}
                  >
                    Set Clearance Price
                  </Button>
                )}
              </Card>
            ))}
            {filteredBatches.length === 0 && (
              <Text style={styles.noDataText}>No batches found.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>

      {/* Clearance Price Sheet */}
      <Sheet
        open={clearanceOpen}
        onClose={() => {
          setSelectedBatch(null);
          setClearanceOpen(false);
        }}
        title="Apply Clearance Promo"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => {
              setSelectedBatch(null);
              setClearanceOpen(false);
            }}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleSetClearance}>Set Price</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          {selectedBatch && (
            <>
              <Field label="Product">
                <Text style={styles.productName}>{selectedBatch.product}</Text>
                <Text style={styles.productMeta}>Batch: {selectedBatch.batchNumber} · Expiry: {selectedBatch.expiry}</Text>
              </Field>
              <Field label="Clearance Discount Percentage (%)">
                <TextInput
                  placeholder="e.g. 20"
                  value={clearanceVal}
                  onChangeText={setClearanceVal}
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                  style={styles.modalInput}
                />
              </Field>
            </>
          )}
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function InventoryTransfers() {
  const { branch } = useAuth();
  const { products, transfers, branches, allTenantBranches, addTransfer } = useInventoryManager();

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Create wizard states
  const [newTransferOpen, setNewTransferOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qtyVal, setQtyVal] = useState('');
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');

  // Dropdowns filters searches
  const [productSearch, setProductSearch] = useState('');
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // Dropdown open triggers
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [originPickerOpen, setOriginPickerOpen] = useState(false);
  const [destPickerOpen, setDestPickerOpen] = useState(false);

  const handleCreateTransfer = async () => {
    if (!selectedProductId || !originId || !destinationId) {
      showToast('Please select product, origin, and destination branches.', 'error');
      return;
    }
    if (originId === destinationId) {
      showToast('Origin and destination branches must be different.', 'error');
      return;
    }
    const qty = parseInt(qtyVal);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid transfer quantity.', 'error');
      return;
    }

    try {
      await addTransfer(selectedProductId, originId, destinationId, qty);
      showToast('Inter-branch stock transfer initiated successfully.', 'success');
      setSelectedProductId('');
      setQtyVal('');
      setOriginId('');
      setDestinationId('');
      setNewTransferOpen(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to initiate transfer', 'error');
    }
  };

  // Search filter list computation
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const selectedProductObj = useMemo(() => {
    return products.find((p) => p.productId === selectedProductId);
  }, [products, selectedProductId]);

  const filteredOriginBranches = useMemo(() => {
    return branches.filter((b) => b.name.toLowerCase().includes(originSearch.toLowerCase()));
  }, [branches, originSearch]);

  const selectedOriginObj = useMemo(() => {
    return branches.find((b) => b.id === originId);
  }, [branches, originId]);

  const filteredDestBranches = useMemo(() => {
    return allTenantBranches.filter((b) => b.name.toLowerCase().includes(destSearch.toLowerCase()));
  }, [allTenantBranches, destSearch]);

  const selectedDestObj = useMemo(() => {
    return allTenantBranches.find((b) => b.id === destinationId);
  }, [allTenantBranches, destinationId]);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        <View style={styles.headerRow}>
          <Text style={styles.mainTitle}>Inter-Branch Transfers</Text>
          <Button style={styles.newBtn} onClick={() => setNewTransferOpen(true)}>
            + New
          </Button>
        </View>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {transfers.map((t) => (
              <Card key={t.id}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{t.id}</Text>
                    <Text style={styles.productName}>{t.item}</Text>
                    <Text style={styles.productMeta}>From: {t.from} → To: {t.to}</Text>
                    <Text style={styles.productMeta}>Requested on {t.date}</Text>
                  </View>
                  <View style={styles.productPriceCol}>
                    <Text style={styles.productPrice}>{t.qty} units</Text>
                    <Badge variant={t.status === 'Completed' ? 'success' : 'warn'}>
                      {t.status}
                    </Badge>
                  </View>
                </View>
              </Card>
            ))}
            {transfers.length === 0 && (
              <Text style={styles.noDataText}>No active stock transfers recorded.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>

      {/* New Transfer Wizard */}
      <Sheet
        open={newTransferOpen}
        onClose={() => setNewTransferOpen(false)}
        title="Inter-Branch Stock Transfer"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setNewTransferOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleCreateTransfer}>Initiate</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          {/* Searchable Product picker */}
          <Field label="Select Product">
            <TouchableOpacity onPress={() => setProductPickerOpen(!productPickerOpen)} style={styles.modalInput}>
              <Text style={{ color: selectedProductObj ? '#0f172a' : '#94a3b8' }}>
                {selectedProductObj ? selectedProductObj.name : 'Choose Product...'}
              </Text>
            </TouchableOpacity>

            {productPickerOpen && (
              <View style={styles.searchableDropdownContainer}>
                <View style={styles.dropdownSearchField}>
                  <Search size={14} color="#94a3b8" />
                  <TextInput
                    placeholder="Search product name..."
                    placeholderTextColor="#94a3b8"
                    value={productSearch}
                    onChangeText={setProductSearch}
                    style={styles.dropdownSearchInput}
                  />
                </View>
                <ScrollView style={styles.dropdownListScroll} nestedScrollEnabled>
                  {filteredProducts.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.dropdownItem, selectedProductId === p.productId && styles.dropdownItemActive]}
                      onPress={() => {
                        setSelectedProductId(p.productId);
                        setProductPickerOpen(false);
                        setProductSearch('');
                      }}
                    >
                      <Text style={[styles.dropdownItemText, selectedProductId === p.productId && styles.dropdownItemTextActive]}>
                        {p.name} (Stock: {p.stock})
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredProducts.length === 0 && (
                    <Text style={styles.noDataText}>No matching products.</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </Field>

          {/* Searchable Origin branch dropdown */}
          <Field label="Origin Branch">
            <TouchableOpacity onPress={() => setOriginPickerOpen(!originPickerOpen)} style={styles.modalInput}>
              <Text style={{ color: selectedOriginObj ? '#0f172a' : '#94a3b8' }}>
                {selectedOriginObj ? selectedOriginObj.name : 'Choose Origin branch...'}
              </Text>
            </TouchableOpacity>

            {originPickerOpen && (
              <View style={styles.searchableDropdownContainer}>
                <View style={styles.dropdownSearchField}>
                  <Search size={14} color="#94a3b8" />
                  <TextInput
                    placeholder="Search origin branch..."
                    placeholderTextColor="#94a3b8"
                    value={originSearch}
                    onChangeText={setOriginSearch}
                    style={styles.dropdownSearchInput}
                  />
                </View>
                <ScrollView style={styles.dropdownListScroll} nestedScrollEnabled>
                  {filteredOriginBranches.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.dropdownItem, originId === b.id && styles.dropdownItemActive]}
                      onPress={() => {
                        setOriginId(b.id);
                        setOriginPickerOpen(false);
                        setOriginSearch('');
                      }}
                    >
                      <Text style={[styles.dropdownItemText, originId === b.id && styles.dropdownItemTextActive]}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredOriginBranches.length === 0 && (
                    <Text style={styles.noDataText}>No matching branches.</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </Field>

          {/* Searchable Destination branch dropdown */}
          <Field label="Destination Branch">
            <TouchableOpacity onPress={() => setDestPickerOpen(!destPickerOpen)} style={styles.modalInput}>
              <Text style={{ color: selectedDestObj ? '#0f172a' : '#94a3b8' }}>
                {selectedDestObj ? selectedDestObj.name : 'Choose Target branch...'}
              </Text>
            </TouchableOpacity>

            {destPickerOpen && (
              <View style={styles.searchableDropdownContainer}>
                <View style={styles.dropdownSearchField}>
                  <Search size={14} color="#94a3b8" />
                  <TextInput
                    placeholder="Search destination branch..."
                    placeholderTextColor="#94a3b8"
                    value={destSearch}
                    onChangeText={setDestSearch}
                    style={styles.dropdownSearchInput}
                  />
                </View>
                <ScrollView style={styles.dropdownListScroll} nestedScrollEnabled>
                  {filteredDestBranches.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.dropdownItem, destinationId === b.id && styles.dropdownItemActive]}
                      onPress={() => {
                        setDestinationId(b.id);
                        setDestPickerOpen(false);
                        setDestSearch('');
                      }}
                    >
                      <Text style={[styles.dropdownItemText, destinationId === b.id && styles.dropdownItemTextActive]}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredDestBranches.length === 0 && (
                    <Text style={styles.noDataText}>No matching branches.</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </Field>

          <Field label="Quantity to Move">
            <TextInput
              placeholder="e.g. 50"
              value={qtyVal}
              onChangeText={setQtyVal}
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function InventoryAlerts() {
  const { branch } = useAuth();
  const { products, batches, vendors, raisePoDraft } = useInventoryManager();

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // PO Draft Form state
  const [poOpen, setPoOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [poQty, setPoQty] = useState('50');

  // Search selectors filter text
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorPickerOpen, setVendorPickerOpen] = useState(false);

  const handleRaiseDraftSubmit = async () => {
    if (!selectedProductId || !selectedBranchId || !selectedVendorId) {
      showToast('Please select vendor and verify branch details.', 'error');
      return;
    }
    const qty = parseInt(poQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid purchase quantity.', 'error');
      return;
    }

    try {
      await raisePoDraft(selectedVendorId, selectedBranchId, selectedProductId, qty);
      showToast('Purchase Order Draft submitted successfully to Head Office.', 'success');
      setPoOpen(false);
      setSelectedProductId('');
      setSelectedBranchId('');
      setSelectedVendorId('');
      setPoQty('50');
    } catch (e: any) {
      showToast(e.message || 'Failed to raise PO draft', 'error');
    }
  };

  const lowStock = useMemo(() => products.filter((p) => p.stock <= p.reorder), [products]);

  const alerts = useMemo(() => {
    return [
      ...lowStock.map((p) => ({
        id: p.id,
        productId: p.productId,
        branchId: p.branchId,
        type: 'Low Stock',
        msg: `${p.name} — ${p.stock} units remaining (Reorder: ${p.reorder})`,
        level: 'warn',
        productName: p.name,
      })),
      ...batches
        .filter((b) => b.status !== 'fresh')
        .map((b) => ({
          id: b.id,
          productId: b.productId,
          branchId: b.branchId || '',
          type: 'Near Expiry',
          msg: `${b.product} (Batch: ${b.batchNumber}) — exp ${b.expiry}`,
          level: b.status === 'urgent' ? 'error' : 'warn',
          productName: b.product,
        })),
    ];
  }, [lowStock, batches]);

  // Search filter list vendor
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => v.name.toLowerCase().includes(vendorSearch.toLowerCase()));
  }, [vendors, vendorSearch]);

  const selectedVendorObj = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId);
  }, [vendors, selectedVendorId]);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Low-Stock Alerts</Text>
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {alerts.map((a) => (
              <Card key={a.id}>
                <View style={styles.alertHeaderRow}>
                  <Bell size={16} color={a.level === 'error' ? '#ef4444' : '#d97706'} style={{ marginRight: 10 }} />
                  <View style={styles.alertContent}>
                    <Text style={styles.productName}>{a.type}</Text>
                    <Text style={styles.productMeta}>{a.msg}</Text>
                  </View>
                  <Badge variant={a.level === 'error' ? 'error' : 'warn'}>
                    {a.level === 'error' ? 'Urgent' : 'Warn'}
                  </Badge>
                </View>
                {a.type === 'Low Stock' && (
                  <Button
                    variant="secondary"
                    style={styles.clearanceBtn}
                    onClick={() => {
                      setSelectedProductId(a.productId);
                      setSelectedBranchId(a.branchId);
                      setPoOpen(true);
                    }}
                  >
                    <ShoppingCart size={14} color="#475569" style={{ marginRight: 6 }} />
                    Raise PO Draft
                  </Button>
                )}
              </Card>
            ))}
            {alerts.length === 0 && (
              <Text style={styles.noDataText}>All inventory levels are healthy.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>

      {/* PO Draft Sheet Selector */}
      <Sheet
        open={poOpen}
        onClose={() => setPoOpen(false)}
        title="Raise Purchase Order Draft"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setPoOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleRaiseDraftSubmit}>Submit PO</Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          {/* Searchable Vendor picker */}
          <Field label="Select Supplier Vendor">
            <TouchableOpacity onPress={() => setVendorPickerOpen(!vendorPickerOpen)} style={styles.modalInput}>
              <Text style={{ color: selectedVendorObj ? '#0f172a' : '#94a3b8' }}>
                {selectedVendorObj ? selectedVendorObj.name : 'Choose Vendor...'}
              </Text>
            </TouchableOpacity>

            {vendorPickerOpen && (
              <View style={styles.searchableDropdownContainer}>
                <View style={styles.dropdownSearchField}>
                  <Search size={14} color="#94a3b8" />
                  <TextInput
                    placeholder="Search vendor name..."
                    placeholderTextColor="#94a3b8"
                    value={vendorSearch}
                    onChangeText={setVendorSearch}
                    style={styles.dropdownSearchInput}
                  />
                </View>
                <ScrollView style={styles.dropdownListScroll} nestedScrollEnabled>
                  {filteredVendors.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.dropdownItem, selectedVendorId === v.id && styles.dropdownItemActive]}
                      onPress={() => {
                        setSelectedVendorId(v.id);
                        setVendorPickerOpen(false);
                        setVendorSearch('');
                      }}
                    >
                      <Text style={[styles.dropdownItemText, selectedVendorId === v.id && styles.dropdownItemTextActive]}>
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredVendors.length === 0 && (
                    <Text style={styles.noDataText}>No matching vendors.</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </Field>

          <Field label="Order Quantity (Units)">
            <TextInput
              placeholder="e.g. 50"
              value={poQty}
              onChangeText={setPoQty}
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />
          </Field>
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function InventoryValuation() {
  const { branch } = useAuth();
  const { products } = useInventoryManager();
  const [q, setQ] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
    );
  }, [products, q]);

  // Compute total valuation (Stock Qty * Cost Price)
  const totalValuation = useMemo(() => {
    return products.reduce((sum, p) => {
      const cost = parseFloat(p.costPrice || '0.00');
      return sum + p.stock * cost;
    }, 0);
  }, [products]);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Inventory Valuation Report</Text>

        <View style={styles.statsGrid}>
          <View style={{ width: '100%', padding: 4 }}>
            <StatCard
              label="Total Stock Valuation"
              value={formatCurrency(totalValuation)}
              icon={<Boxes size={18} color="#39ff14" />}
              accent="brand"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Asset Value breakdown</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search SKU or Product Name..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {filteredProducts.map((p) => {
              const cost = parseFloat(p.costPrice || '0.00');
              const itemValuation = p.stock * cost;
              return (
                <Card key={p.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productMeta}>SKU: {p.sku} · Branch: {p.branch}</Text>
                      <Text style={styles.productMeta}>Cost Price: {formatCurrency(cost)}</Text>
                      <Text style={styles.productMeta}>Stock: {p.stock} {p.unit}</Text>
                    </View>
                    <View style={styles.productPriceCol}>
                      <Text style={[styles.productPrice, { color: '#0284c7' }]}>
                        {formatCurrency(itemValuation)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
            {filteredProducts.length === 0 && (
              <Text style={styles.noDataText}>No inventory records.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>
    </View>
  );
}

export function InventoryLedger() {
  const { branch } = useAuth();
  const { ledger } = useInventoryManager();
  const [q, setQ] = useState('');

  const filteredLedger = useMemo(() => {
    return ledger.filter((r) =>
      r.productName.toLowerCase().includes(q.toLowerCase()) ||
      r.transactionType.toLowerCase().includes(q.toLowerCase())
    );
  }, [ledger, q]);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="IM" branch={branch} />
      <ScreenBody>
        <Text style={styles.mainTitle}>Stock Movement Ledger</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search Ledger Log..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {filteredLedger.map((r) => {
              const sign = r.changedQuantity > 0 ? '+' : '';
              const badgeType = r.transactionType.startsWith('Transfer Out') || r.transactionType.startsWith('Sale') ? 'error' : 'success';
              return (
                <Card key={r.id}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{r.productName}</Text>
                      <Text style={styles.productMeta}>Branch: {r.branchName}</Text>
                      {r.batchNumber && (
                        <Text style={styles.productMeta}>Batch: {r.batchNumber}</Text>
                      )}
                      <Text style={styles.productMeta}>Stock Shift: {r.previousQuantity} → {r.newQuantity}</Text>
                      <Text style={styles.productMeta}>Logged: {new Date(r.createdAt).toLocaleString()}</Text>
                    </View>
                    <View style={styles.productPriceCol}>
                      <Text style={[styles.productPrice, { color: r.changedQuantity > 0 ? '#16a34a' : '#dc2626' }]}>
                        {sign}{r.changedQuantity}
                      </Text>
                      <Badge variant={badgeType}>
                        {r.transactionType}
                      </Badge>
                    </View>
                  </View>
                </Card>
              );
            })}
            {filteredLedger.length === 0 && (
              <Text style={styles.noDataText}>No stock movements recorded in the ledger.</Text>
            )}
          </View>
        </ScrollView>
      </ScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginVertical: 4,
  },
  halfCol: {
    width: '50%',
    padding: 4,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  listContainer: {
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  productMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  productPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  marginT4: {
    marginTop: 4,
  },
  clearanceBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },

  // Stock filters styling
  headerBtnWrapper: {
    marginBottom: 12,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  categoryScrollContainer: {
    gap: 8,
    paddingRight: 16,
  },
  catBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  catBadgeActive: {
    backgroundColor: '#39ff14',
    borderColor: '#39ff14',
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  catBadgeTextActive: {
    color: '#0f172a',
  },
  noDataText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 24,
  },

  // Modal forms
  modalForm: {
    gap: 12,
    paddingVertical: 8,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Searchable dropdown styles
  searchableDropdownContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownSearchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
  },
  dropdownSearchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 12,
    color: '#0f172a',
  },
  dropdownListScroll: {
    maxHeight: 140,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemActive: {
    backgroundColor: '#e6ffe6',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#334155',
  },
  dropdownItemTextActive: {
    fontWeight: 'bold',
    color: '#16a34a',
  },
  sheetFooterBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetFooterBtn: {
    flex: 1,
  },
});
