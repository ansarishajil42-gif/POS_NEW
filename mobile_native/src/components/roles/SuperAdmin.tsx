import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge, statusVariant } from '../ui/Badge';
import { Button, Sheet } from '../ui/Primitives';
import { useAuth } from '../../lib/auth';
import { useSuperAdmin, Tenant, Branch } from '../../lib/SuperAdminContext';
import { networkSales, apiTraffic, systemLogs } from '../../lib/mockData';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  Building2,
  Trello,
  DollarSign,
  Activity,
  AlertTriangle,
  Info,
  AlertCircle,
  Plus,
  Coins,
  Trash2,
  ArrowUpCircle,
  Ban
} from 'lucide-react-native';

export function SuperAdminHome() {
  const { branch } = useAuth();
  const { tenants } = useSuperAdmin();

  const activeTenants = tenants.filter((t) => t.status === 'active' || t.status === 'trial').length;
  const totalTills = tenants.reduce((a, t) => a + t.tills, 0);
  const mrr = tenants.reduce((a, t) => a + t.mrr, 0);

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody>
        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <StatCard label="Total Tenants" value={String(tenants.length)} sub={`${activeTenants} active`} icon={<Building2 size={16} color="#39ff14" />} accent="brand" />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="Active Tills" value={String(totalTills)} sub="network-wide" icon={<Trello size={16} color="#0284c7" />} accent="sky" trend={{ dir: 'up', value: '4.2%' }} />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="MRR" value={`$${(mrr / 1000).toFixed(1)}k`} sub="monthly recurring" icon={<DollarSign size={16} color="#39ff14" />} accent="brand" trend={{ dir: 'up', value: '8.1%' }} />
          </View>
          <View style={styles.halfCol}>
            <StatCard label="System Status" value="Healthy" sub="all regions ok" icon={<Activity size={16} color="#39ff14" />} accent="brand" />
          </View>
        </View>

        {/* Network Sales Area Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartCardTitle}>Network Sales</Text>
            <Badge variant="success" dot>Live</Badge>
          </View>
          <View style={styles.svgWrapper}>
            <Svg width="100%" height={120} viewBox="0 0 340 120" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="gsa1" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#39ff14" stopOpacity={0.25} />
                  <Stop offset="1" stopColor="#39ff14" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              {/* Shaded Area */}
              <Path
                d="M0,100 Q50,70 100,80 T200,40 T300,20 T340,50 L340,120 L0,120 Z"
                fill="url(#gsa1)"
              />
              {/* Spline line */}
              <Path
                d="M0,100 Q50,70 100,80 T200,40 T300,20 T340,50"
                fill="none"
                stroke="#39ff14"
                strokeWidth="2.5"
              />
            </Svg>
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabelText}>Mon</Text>
            <Text style={styles.chartLabelText}>Wed</Text>
            <Text style={styles.chartLabelText}>Fri</Text>
            <Text style={styles.chartLabelText}>Sun</Text>
          </View>
        </Card>

        {/* Plan Mix and Regions Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.halfCol}>
            <Card style={styles.flex1}>
              <Text style={styles.subCardTitle}>Plan Mix</Text>
              <View style={styles.planMixList}>
                {['Enterprise', 'Growth', 'Starter'].map((p) => {
                  const count = tenants.filter((t) => t.plan === p).length;
                  const pct = tenants.length > 0 ? (count / tenants.length) * 100 : 0;
                  return (
                    <View key={p} style={styles.planMixRow}>
                      <View style={styles.planMixInfo}>
                        <Text style={styles.planNameText}>{p}</Text>
                        <Text style={styles.planCountText}>{count}</Text>
                      </View>
                      <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
          <View style={styles.halfCol}>
            <Card style={styles.flex1}>
              <Text style={styles.subCardTitle}>Regions</Text>
              <View style={styles.regionsList}>
                <View style={styles.regionRow}><Text style={styles.regionText}>UAE</Text><Badge variant="brand">3</Badge></View>
                <View style={styles.regionRow}><Text style={styles.regionText}>KSA</Text><Badge variant="info">1</Badge></View>
                <View style={styles.regionRow}><Text style={styles.regionText}>Qatar</Text><Badge variant="info">1</Badge></View>
                <View style={styles.regionRow}><Text style={styles.regionText}>Bahrain</Text><Badge variant="warn">1</Badge></View>
              </View>
            </Card>
          </View>
        </View>
      </ScreenBody>
    </View>
  );
}

export function SuperAdminTenants({ onOpen }: { onOpen: (id: string) => void }) {
  const { branch } = useAuth();
  const { tenants, branches, createTenant, addBranch, vatRate, inclusive } = useSuperAdmin();

  // Dialog/Sheet states
  const [createOpen, setCreateOpen] = useState(false);
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [manageBranchesTenantId, setManageBranchesTenantId] = useState<string | null>(null);

  // Form states - Create Tenant
  const [tenantName, setTenantName] = useState('');
  const [outletLimit, setOutletLimit] = useState('2');
  const [tillLimit, setTillLimit] = useState('6');
  const [trn, setTrn] = useState('');

  // Form states - Global Add Branch
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [branchStatus, setBranchStatus] = useState<'Active' | 'Suspended'>('Active');

  const handleCreateTenant = () => {
    if (!tenantName.trim()) {
      Alert.alert('Error', 'Please enter a chain name');
      return;
    }
    createTenant(
      tenantName,
      parseInt(outletLimit) || 2,
      parseInt(tillLimit) || 6,
      trn || '100000000000003'
    );
    Alert.alert('Success', `Tenant "${tenantName}" provisioned successfully`);
    setTenantName('');
    setOutletLimit('2');
    setTillLimit('6');
    setTrn('');
    setCreateOpen(false);
  };

  const handleAddBranchGlobal = () => {
    if (!selectedTenantId) {
      Alert.alert('Error', 'Please select a tenant');
      return;
    }
    if (!branchName.trim() || !branchLocation.trim()) {
      Alert.alert('Error', 'Please enter branch name and location');
      return;
    }
    try {
      addBranch(selectedTenantId, branchName, branchLocation, branchStatus);
      Alert.alert('Success', `Branch "${branchName}" added successfully`);
      setBranchName('');
      setBranchLocation('');
      setBranchStatus('Active');
      setSelectedTenantId('');
      setAddBranchOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody>
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Tenants</Text>
          <Badge variant="neutral">{tenants.length} accounts</Badge>
        </View>

        {/* Global Action Buttons */}
        <View style={styles.globalActionRow}>
          <Button
            variant="secondary"
            style={styles.globalActionBtn}
            onClick={() => {
              if (tenants.length > 0) {
                setSelectedTenantId(tenants[0].id);
              }
              setAddBranchOpen(true);
            }}
          >
            <Building2 size={14} color="#475569" style={{ marginRight: 6 }} />
            Add Branch
          </Button>
          <Button
            variant="primary"
            style={styles.globalActionBtn}
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={14} color="#0f172a" style={{ marginRight: 6 }} />
            Create Tenant
          </Button>
        </View>

        <View style={styles.tenantsList}>
          {tenants.map((t) => (
            <Card key={t.id} style={styles.tenantCard}>
              <View style={styles.tenantCardTop}>
                <View style={styles.tenantMeta}>
                  <Text style={styles.tenantName}>{t.name}</Text>
                  <Text style={styles.tenantCountry}>{t.country} · {t.plan} plan</Text>
                </View>
                <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
              </View>
              <View style={styles.metricGrid}>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricValue}>
                    {branches.filter((b) => b.tenantId === t.id).length} / {t.outlets}
                  </Text>
                  <Text style={styles.metricLabel}>Branches</Text>
                </View>
                <View style={styles.metricColumn}><Text style={styles.metricValue}>{t.tills}</Text><Text style={styles.metricLabel}>Tills</Text></View>
                <View style={styles.metricColumn}><Text style={styles.metricValue}>${t.mrr}</Text><Text style={styles.metricLabel}>MRR</Text></View>
              </View>

              <View style={styles.cardActionsRow}>
                <Button
                  variant="secondary"
                  style={styles.cardActionBtn}
                  onClick={() => setManageBranchesTenantId(t.id)}
                >
                  Branches
                </Button>
                <Button
                  variant="ghost"
                  style={styles.cardActionBtn}
                  onClick={() => onOpen(t.id)}
                >
                  Configure
                </Button>
              </View>
            </Card>
          ))}
        </View>
      </ScreenBody>

      {/* CREATE TENANT SHEET */}
      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create tenant account"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleCreateTenant}>Create tenant</Button>
          </View>
        }
      >
        <View style={styles.sheetForm}>
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>Chain name</Text>
            <TextInput
              placeholder="e.g. Marina Grocers LLC"
              value={tenantName}
              onChangeText={setTenantName}
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>
          <View style={styles.formRow}>
            <View style={[styles.inputItem, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Outlet limit</Text>
              <TextInput
                keyboardType="numeric"
                value={outletLimit}
                onChangeText={setOutletLimit}
                style={styles.textInput}
              />
            </View>
            <View style={[styles.inputItem, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Till limit</Text>
              <TextInput
                keyboardType="numeric"
                value={tillLimit}
                onChangeText={setTillLimit}
                style={styles.textInput}
              />
            </View>
          </View>
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>TRN (Tax Registration Number)</Text>
            <TextInput
              placeholder="100000000000003"
              value={trn}
              onChangeText={setTrn}
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>
          <View style={styles.templatePreviewBox}>
            <Text style={styles.templatePreviewText}>
              Tax template applied on creation: UAE VAT {vatRate}% · {inclusive ? 'inclusive' : 'exclusive'} pricing · AED
            </Text>
          </View>
        </View>
      </Sheet>

      {/* GLOBAL ADD BRANCH SHEET */}
      <Sheet
        open={addBranchOpen}
        onClose={() => setAddBranchOpen(false)}
        title="Add Branch"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setAddBranchOpen(false)}>Cancel</Button>
            <Button variant="primary" style={styles.sheetFooterBtn} onClick={handleAddBranchGlobal}>Save Branch</Button>
          </View>
        }
      >
        <View style={styles.sheetForm}>
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>Select Tenant</Text>
            <View style={styles.tenantPickerScrollContainer}>
              <ScrollView style={styles.tenantPickerScroll} nestedScrollEnabled>
                {tenants.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.pickerItem, selectedTenantId === t.id && styles.pickerItemActive]}
                    onPress={() => setSelectedTenantId(t.id)}
                  >
                    <Text style={[styles.pickerItemText, selectedTenantId === t.id && styles.pickerItemTextActive]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputItem, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Branch Name</Text>
              <TextInput
                placeholder="e.g. Marina Branch"
                value={branchName}
                onChangeText={setBranchName}
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
              />
            </View>
            <View style={[styles.inputItem, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                placeholder="e.g. Dubai"
                value={branchLocation}
                onChangeText={setBranchLocation}
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
              />
            </View>
          </View>

          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segBtn, branchStatus === 'Active' && styles.segBtnActive]}
                onPress={() => setBranchStatus('Active')}
              >
                <Text style={[styles.segTxt, branchStatus === 'Active' && styles.segTxtActive]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segBtn, branchStatus === 'Suspended' && styles.segBtnActive]}
                onPress={() => setBranchStatus('Suspended')}
              >
                <Text style={[styles.segTxt, branchStatus === 'Suspended' && styles.segTxtActive]}>Suspended</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Sheet>

      {/* MANAGE BRANCHES SHEET (TENANT SPECIFIC) */}
      {manageBranchesTenantId && (
        <ManageBranchesSheet
          tenantId={manageBranchesTenantId}
          onClose={() => setManageBranchesTenantId(null)}
        />
      )}
    </View>
  );
}

function ManageBranchesSheet({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const { tenants, branches, addBranch, deleteBranch } = useSuperAdmin();
  const t = tenants.find((x) => x.id === tenantId);

  const [bName, setBName] = useState('');
  const [bLoc, setBLoc] = useState('');

  if (!t) return null;

  const tenantBranches = branches.filter((b) => b.tenantId === tenantId);

  const handleAdd = () => {
    if (!bName.trim() || !bLoc.trim()) {
      Alert.alert('Error', 'Please enter branch name and location');
      return;
    }
    try {
      addBranch(tenantId, bName, bLoc, 'Active');
      Alert.alert('Success', `Branch "${bName}" added successfully.`);
      setBName('');
      setBLoc('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (branch: Branch) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${branch.name}? This action cannot be undone and will decrement the tenant's outlet limit.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBranch(branch.id);
            Alert.alert('Deleted', `Branch ${branch.name} has been removed.`);
          },
        },
      ]
    );
  };

  return (
    <Sheet
      open={true}
      onClose={onClose}
      title={`Manage Branches — ${t.name}`}
      footer={<Button full onClick={onClose}>Close</Button>}
    >
      <View style={styles.manageBranchesContainer}>
        {/* Inline Add Form */}
        <Card style={styles.inlineAddFormCard}>
          <Text style={styles.subCardTitle}>Quick Add Branch</Text>
          <View style={styles.formRow}>
            <TextInput
              placeholder="Branch Name"
              value={bName}
              onChangeText={setBName}
              placeholderTextColor="#94a3b8"
              style={[styles.textInput, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              placeholder="Location"
              value={bLoc}
              onChangeText={setBLoc}
              placeholderTextColor="#94a3b8"
              style={[styles.textInput, { flex: 1 }]}
            />
          </View>
          <Button variant="primary" style={{ marginTop: 8 }} onClick={handleAdd}>
            Add Branch
          </Button>
        </Card>

        {/* Branches Table List */}
        <View style={styles.branchesListWrapper}>
          <Text style={styles.subCardTitle}>Active Branches ({tenantBranches.length})</Text>
          {tenantBranches.length === 0 ? (
            <Text style={styles.noBranchesText}>No branches registered for this tenant.</Text>
          ) : (
            tenantBranches.map((b) => (
              <View key={b.id} style={styles.branchTableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.branchTableName}>{b.name}</Text>
                  <Text style={styles.branchTableLoc}>{b.location}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Badge variant={b.status === 'Active' ? 'success' : 'warn'}>
                    {b.status}
                  </Badge>
                </View>
                <TouchableOpacity
                  style={styles.branchTableDeleteBtn}
                  onPress={() => handleDelete(b)}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </Sheet>
  );
}

export function TenantDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { branch } = useAuth();
  const { tenants, branches, upgradeTenant, toggleTenantStatus } = useSuperAdmin();
  const t = tenants.find((x) => x.id === id);
  const [action, setAction] = useState<string | null>(null);

  if (!t) return null;

  const handleActionConfirm = () => {
    if (action === 'suspend') {
      toggleTenantStatus(t.id);
      Alert.alert('Status Updated', `${t.name} status changed to ${t.status === 'suspended' ? 'suspended' : 'active'}`);
    } else if (action === 'upgrade') {
      if (t.plan === 'Enterprise') {
        Alert.alert('Max Plan', 'Tenant is already on the highest plan (Enterprise)');
      } else {
        upgradeTenant(t.id);
        Alert.alert('Upgraded', `${t.name} upgraded successfully`);
      }
    } else if (action === 'impersonate') {
      Alert.alert('Impersonation', `Signing in as admin of ${t.name}...`);
    }
    setAction(null);
  };

  const tenantBranchesCount = branches.filter((b) => b.tenantId === t.id).length;

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenHeader title={t.name} subtitle={`${t.plan} · ${t.country}`} onBack={onBack} />
      <ScreenBody>
        <Card style={styles.statusCard}>
          <View>
            <Text style={styles.statusSub}>Current status</Text>
            <Text style={styles.statusVal}>{t.status}</Text>
          </View>
          <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
        </Card>

        <View style={styles.statsGrid}>
          <View style={styles.thirdCol}>
            <StatCard label="Branches" value={`${tenantBranchesCount} / ${t.outlets}`} icon={<Building2 size={14} color="#475569" />} accent="ink" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="Tills" value={String(t.tills)} icon={<Trello size={14} color="#0284c7" />} accent="sky" />
          </View>
          <View style={styles.thirdCol}>
            <StatCard label="MRR" value={`$${t.mrr}`} icon={<DollarSign size={14} color="#39ff14" />} accent="brand" />
          </View>
        </View>

        <Card style={styles.configCard}>
          <Text style={styles.configCardTitle}>Configuration</Text>
          <View style={styles.configList}>
            <DetailRow label="Plan tier" value={t.plan} />
            <DetailRow label="Country" value={t.country} />
            <DetailRow label="TRN" value={t.trn} />
            <DetailRow label="Billing cycle" value="Monthly" />
            <DetailRow label="Branch limit" value={`${tenantBranchesCount} / ${t.outlets}`} />
          </View>
        </Card>

        <View style={styles.actionsGrid}>
          <Button variant="secondary" onClick={() => setAction('upgrade')} style={styles.actionBtn} disabled={t.plan === 'Enterprise'}>Upgrade Plan</Button>
          <Button variant="secondary" onClick={() => setAction('configure')} style={styles.actionBtn}>Configure</Button>
          <Button variant="danger" onClick={() => setAction('suspend')} style={styles.actionBtn}>{t.status === 'suspended' ? 'Reactivate' : 'Suspend'}</Button>
          <Button variant="ghost" onClick={() => setAction('impersonate')} style={styles.actionBtn}>Impersonate</Button>
        </View>
      </ScreenBody>

      <Sheet
        open={!!action}
        onClose={() => setAction(null)}
        title="Confirm action"
        footer={
          <View style={styles.sheetFooterBtnRow}>
            <Button variant="secondary" style={styles.sheetFooterBtn} onClick={() => setAction(null)}>Cancel</Button>
            <Button variant={action === 'suspend' ? 'danger' : 'primary'} style={styles.sheetFooterBtn} onClick={handleActionConfirm}>Confirm</Button>
          </View>
        }
      >
        <Text style={styles.confirmMsg}>
          {action === 'suspend' && `This will toggle suspension of ${t.name}. All tills and branches will reflect this status.`}
          {action === 'upgrade' && `This will upgrade ${t.name} to the next pricing tier.`}
          {action === 'configure' && `Adjust tax templates, currency, and feature flags for ${t.name}. (Settings tab modifies these values platform-wide)`}
          {action === 'impersonate' && `You will sign in as ${t.name}'s admin to view their workspace.`}
        </Text>
      </Sheet>
    </View>
  );
}

export function SuperAdminAnalytics() {
  const { branch } = useAuth();
  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody>
        <Text style={styles.analyticsTitle}>Platform Analytics</Text>

        <Card style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>Active Tills Over Time</Text>
          <View style={styles.svgWrapper}>
            <Svg width="100%" height={120} viewBox="0 0 340 120" preserveAspectRatio="none">
              <Path d="M0,30 L340,30 M0,60 L340,60 M0,90 L340,90" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              <Path
                d="M10,95 L65,85 L120,70 L175,55 L230,40 L285,30 L330,45"
                fill="none"
                stroke="#39ff14"
                strokeWidth="2.5"
              />
              <Circle cx="10" cy="95" r="4" fill="#39ff14" />
              <Circle cx="65" cy="85" r="4" fill="#39ff14" />
              <Circle cx="120" cy="70" r="4" fill="#39ff14" />
              <Circle cx="175" cy="55" r="4" fill="#39ff14" />
              <Circle cx="230" cy="40" r="4" fill="#39ff14" />
              <Circle cx="285" cy="30" r="4" fill="#39ff14" />
              <Circle cx="330" cy="45" r="4" fill="#39ff14" />
            </Svg>
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabelText}>Mon</Text>
            <Text style={styles.chartLabelText}>Wed</Text>
            <Text style={styles.chartLabelText}>Fri</Text>
            <Text style={styles.chartLabelText}>Sun</Text>
          </View>
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>API Traffic (req/min)</Text>
          <View style={styles.svgWrapper}>
            <Svg width="100%" height={120} viewBox="0 0 340 120" preserveAspectRatio="none">
              <Path d="M0,35 L340,35 M0,70 L340,70 M0,105 L340,105" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              <Rect x="20" y="85" width="22" height="35" rx="3" fill="#39ff14" />
              <Rect x="75" y="95" width="22" height="25" rx="3" fill="#39ff14" />
              <Rect x="130" y="45" width="22" height="75" rx="3" fill="#39ff14" />
              <Rect x="185" y="25" width="22" height="95" rx="3" fill="#39ff14" />
              <Rect x="240" y="15" width="22" height="105" rx="3" fill="#39ff14" />
              <Rect x="295" y="55" width="22" height="65" rx="3" fill="#39ff14" />
            </Svg>
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabelText}>00</Text>
            <Text style={styles.chartLabelText}>04</Text>
            <Text style={styles.chartLabelText}>08</Text>
            <Text style={styles.chartLabelText}>12</Text>
            <Text style={styles.chartLabelText}>16</Text>
            <Text style={styles.chartLabelText}>20</Text>
          </View>
        </Card>

        <Card style={styles.logsCard}>
          <Text style={styles.chartCardTitle}>System Logs</Text>
          <View style={styles.logsList}>
            {systemLogs.map((l) => (
              <View key={l.id} style={styles.logRow}>
                <View style={styles.logMetaBox}>
                  <Text style={styles.logMsg}>{l.msg}</Text>
                  <Text style={styles.logTime}>{l.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScreenBody>
    </View>
  );
}

export function SuperAdminSettings() {
  const { branch } = useAuth();
  const { vatRate, inclusive, platformConfig, updateVatRate, updateInclusive, updatePlatformConfig } = useSuperAdmin();

  // Local state for vat input to allow editing before save
  const [localVat, setLocalVat] = useState(vatRate);

  const handleSaveTaxTemplate = () => {
    updateVatRate(localVat);
    Alert.alert('Success', 'Global tax template saved successfully.');
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="SA" branch={branch} />
      <ScreenBody>
        <Text style={styles.analyticsTitle}>Platform Settings</Text>

        {/* Global Tax Templates */}
        <Card style={styles.paddedCard}>
          <Text style={styles.chartCardTitle}>Global Tax Templates</Text>
          <View style={styles.settingsForm}>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Standard VAT rate (%)</Text>
              <TextInput
                value={localVat}
                onChangeText={setLocalVat}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleText}>Tax-inclusive shelf pricing</Text>
                <Text style={styles.toggleSubtext}>Default display mode for new tenants.</Text>
              </View>
              <TouchableOpacity
                onPress={() => updateInclusive(!inclusive)}
                style={[
                  styles.switchTrack,
                  inclusive ? styles.trackOn : styles.trackOff
                ]}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.switchThumb,
                  inclusive ? styles.thumbOn : styles.thumbOff
                ]} />
              </TouchableOpacity>
            </View>

            {/* Templates List */}
            <View style={styles.settingsListCard}>
              <Text style={styles.settingsListCardTitle}>Templates Preview</Text>
              <View style={styles.settingsListRow}>
                <Text style={styles.settingsListRowText}>· UAE VAT Standard</Text>
                <Badge variant="neutral">{localVat}%</Badge>
              </View>
              <View style={styles.settingsListRow}>
                <Text style={styles.settingsListRowText}>· UAE Zero-rated</Text>
                <Badge variant="neutral">0% (basic food)</Badge>
              </View>
              <View style={styles.settingsListRow}>
                <Text style={styles.settingsListRowText}>· Out of scope</Text>
                <Badge variant="neutral">Exempt</Badge>
              </View>
            </View>

            <Button full style={styles.saveBtn} onClick={handleSaveTaxTemplate}>Save Template</Button>
          </View>
        </Card>

        {/* Regional & Currency Settings */}
        <Card style={styles.paddedCard}>
          <Text style={styles.chartCardTitle}>Regional & Currency Settings</Text>
          <View style={styles.settingsForm}>
            <DetailRow label="Base currency" value="AED — UAE Dirham" />
            <DetailRow label="Rounding" value="Nearest 0.25 AED (cash)" />
            <DetailRow label="Fiscal calendar" value="January – December" />
            <DetailRow label="Timezone" value="Asia/Dubai (GMT+4)" />
            <DetailRow label="Data residency" value="UAE region" />
            
            <View style={styles.gmvContainer}>
              <Coins size={16} color="#16a34a" style={{ marginRight: 8 }} />
              <Text style={styles.gmvText}>Platform-wide GMV this month: 48.6M AED</Text>
            </View>
          </View>
        </Card>

        {/* Platform Configuration (toggles) */}
        <Card style={styles.paddedCard}>
          <Text style={styles.chartCardTitle}>Platform Configuration</Text>
          <View style={styles.togglesList}>
            <ToggleRow
              label="Allow tenant self-signup"
              on={platformConfig.selfSignup}
              onChange={(val) => updatePlatformConfig('selfSignup', val)}
            />
            <ToggleRow
              label="Enforce 2FA for all admins"
              on={platformConfig.enforce2FA}
              onChange={(val) => updatePlatformConfig('enforce2FA', val)}
            />
            <ToggleRow
              label="Auto-suspend on payment failure"
              on={platformConfig.autoSuspend}
              onChange={(val) => updatePlatformConfig('autoSuspend', val)}
            />
            <ToggleRow
              label="Beta features"
              on={platformConfig.betaFeatures}
              onChange={(val) => updatePlatformConfig('betaFeatures', val)}
            />
          </View>
        </Card>
      </ScreenBody>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (val: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleText}>{label}</Text>
      <TouchableOpacity
        onPress={() => onChange(!on)}
        style={[
          styles.switchTrack,
          on ? styles.trackOn : styles.trackOff
        ]}
        activeOpacity={0.8}
      >
        <View style={[
          styles.switchThumb,
          on ? styles.thumbOn : styles.thumbOff
        ]} />
      </TouchableOpacity>
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
  thirdCol: {
    width: '33.33%',
    padding: 4,
  },
  chartCard: {
    padding: 16,
    marginVertical: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
  },
  svgWrapper: {
    height: 120,
    marginTop: 8,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  chartLabelText: {
    fontSize: 9,
    color: '#94a3b8',
  },
  subCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  planMixList: {
    gap: 10,
  },
  planMixRow: {
    gap: 4,
  },
  planMixInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planNameText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  planCountText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#39ff14',
  },
  regionsList: {
    gap: 8,
  },
  regionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  // Tenants Listing
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tenantsList: {
    gap: 12,
  },
  tenantCard: {
    padding: 16,
  },
  tenantCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tenantMeta: {
    flex: 1,
    marginRight: 12,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tenantCountry: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metricColumn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  metricLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  // Tenant details
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 6,
  },
  statusSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  statusVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  configCard: {
    padding: 16,
    marginVertical: 8,
  },
  configCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  configList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginVertical: 12,
  },
  actionBtn: {
    width: '50%',
    padding: 4,
  },
  confirmMsg: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    paddingVertical: 8,
  },
  // Analytics
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  logsCard: {
    padding: 16,
    marginVertical: 6,
  },
  logsList: {
    gap: 12,
    marginTop: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  logMetaBox: {
    flex: 1,
  },
  logMsg: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  logTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  // Settings
  paddedCard: {
    padding: 16,
    marginVertical: 6,
  },
  settingsForm: {
    gap: 12,
    marginTop: 8,
  },
  inputItem: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  togglesList: {
    gap: 12,
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  toggleText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: '#39ff14',
  },
  trackOff: {
    backgroundColor: '#cbd5e1',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
  saveBtn: {
    marginTop: 12,
  },

  // Global actions for Tenants list
  globalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  globalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card action buttons
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  cardActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  // Form layout in sheets
  sheetForm: {
    gap: 12,
    paddingVertical: 8,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetFooterBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetFooterBtn: {
    flex: 1,
  },
  templatePreviewBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  templatePreviewText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  // Segmented control status picker
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    marginTop: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  segTxt: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  segTxtActive: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  // Custom scrollable tenant picker
  tenantPickerScrollContainer: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    marginTop: 4,
  },
  tenantPickerScroll: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemActive: {
    backgroundColor: '#39ff14',
  },
  pickerItemText: {
    fontSize: 13,
    color: '#334155',
  },
  pickerItemTextActive: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  // Manage Branches design
  manageBranchesContainer: {
    gap: 16,
  },
  inlineAddFormCard: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  branchesListWrapper: {
    gap: 8,
    marginVertical: 8,
  },
  noBranchesText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  branchTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  branchTableName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  branchTableLoc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  branchTableDeleteBtn: {
    padding: 8,
  },
  // Settings view
  toggleSubtext: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  settingsListCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 8,
  },
  settingsListCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  settingsListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingsListRowText: {
    fontSize: 12,
    color: '#475569',
  },
  gmvContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
    padding: 10,
    marginTop: 12,
  },
  gmvText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
});
