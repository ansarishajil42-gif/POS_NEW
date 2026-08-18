import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { Logo } from './Logo';
import { Button, Sheet, Input } from './ui/Primitives';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  Store,
  ChevronRight,
  Zap,
  CheckCircle2,
  Layers,
  Receipt,
  Network,
  Check,
  Building,
  Mail,
  Phone,
  Globe,
  Settings,
  Database,
  Cpu,
  ArrowRight,
  TrendingUp
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

// 📊 High-fidelity SVG Mockup for Head Office Dashboard
function HeadOfficeMockup() {
  return (
    <View style={mockupStyles.container}>
      <View style={mockupStyles.header}>
        <View style={mockupStyles.dotRow}>
          <View style={[mockupStyles.windowDot, { backgroundColor: '#ef4444' }]} />
          <View style={[mockupStyles.windowDot, { backgroundColor: '#eab308' }]} />
          <View style={[mockupStyles.windowDot, { backgroundColor: '#22c55e' }]} />
        </View>
        <Text style={mockupStyles.headerText}>app.cloudynationpos.com/hq</Text>
      </View>
      <View style={mockupStyles.body}>
        <View style={mockupStyles.topStats}>
          <View style={mockupStyles.statBox}>
            <Text style={mockupStyles.statVal}>$45.2k</Text>
            <View style={mockupStyles.barMini} />
          </View>
          <View style={mockupStyles.statBox}>
            <Text style={mockupStyles.statVal}>181 Active</Text>
            <View style={[mockupStyles.barMini, { backgroundColor: '#39ff14' }]} />
          </View>
        </View>
        <View style={mockupStyles.chartWrapper}>
          <Svg width="100%" height="60" viewBox="0 0 260 60">
            <Path
              d="M0,50 Q40,30 80,45 T160,15 T240,10 L240,60 L0,60 Z"
              fill="rgba(57, 255, 20, 0.08)"
            />
            <Path
              d="M0,50 Q40,30 80,45 T160,15 T240,10"
              fill="none"
              stroke="#39ff14"
              strokeWidth="2.5"
            />
            <Circle cx="160" cy="15" r="4" fill="#39ff14" />
          </Svg>
        </View>
      </View>
    </View>
  );
}

// 🛒 High-fidelity SVG Mockup for Cashier POS Till
function CashierTillMockup() {
  return (
    <View style={mockupStyles.container}>
      <View style={mockupStyles.header}>
        <View style={mockupStyles.dotRow}>
          <View style={mockupStyles.windowDot} />
          <View style={mockupStyles.windowDot} />
        </View>
        <Text style={mockupStyles.headerText}>Till #04 Terminal</Text>
      </View>
      <View style={[mockupStyles.body, { flexDirection: 'row', gap: 6 }]}>
        {/* Cart Item Grid */}
        <View style={{ flex: 1.3, gap: 4 }}>
          <View style={mockupStyles.gridItem}><Text style={mockupStyles.gridTxt}>Fresh Milk 1L</Text></View>
          <View style={mockupStyles.gridItem}><Text style={mockupStyles.gridTxt}>Almarai Yogurt</Text></View>
          <View style={[mockupStyles.gridItem, { borderColor: '#39ff14' }]}><Text style={mockupStyles.gridTxt}>Croissant 1pc</Text></View>
        </View>
        {/* Cart Total Column */}
        <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 6, justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 7, color: '#64748b' }}>Cart Total</Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#0f172a', marginTop: 2 }}>$24.50</Text>
          </View>
          <View style={{ height: 18, backgroundColor: '#39ff14', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#0b0f19' }}>Pay Now</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function LandingPage({ onSignInClick }: { onSignInClick: () => void }) {
  // Billing cycle switcher
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Interactive Modules Explorer Tabs
  const [activeModule, setActiveModule] = useState<'hq' | 'store' | 'cashier' | 'aggregator'>('hq');

  const moduleDetails = {
    hq: {
      title: "Head Office Command Center",
      desc: "Central control for large multi-branch networks. Setup global security limits, localized VAT systems, and master catalogs.",
      bullets: [
        "Dynamic multi-tenant control",
        "FIFO/FEFO expiry clearance workflows",
        "Global inventory visibility & pricing tiers"
      ]
    },
    store: {
      title: "Store Management Hub",
      desc: "Oversee daily operations, manage local store transfers, track staff register shifts, and process mid-shift cash drops.",
      bullets: [
        "Audit logs and local stock tracking",
        "Mid-shift cash drop declarations",
        "Staff shift controls and X/Z audit summaries"
      ]
    },
    cashier: {
      title: "Fast Cashier Till Terminal",
      desc: "An offline-first, sub-50ms lookup cashier till interface. Scan items, connect loyalty cards, and split payment methods easily.",
      bullets: [
        "100% Offline-mode processing capacity",
        "Quick keys layout with barcode & scale readings",
        "Split payment settlement models"
      ]
    },
    aggregator: {
      title: "Aggregators & Delivery Integration",
      desc: "Connect Talabat, Careem, and Deliveroo directly. Sync store catalog menus and live order updates automatically.",
      bullets: [
        "Single-click catalog menu publisher",
        "Automatic live order ingestion queues",
        "Real-time stock reservation guards"
      ]
    }
  };

  const currentModule = moduleDetails[activeModule];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      
      {/* Top Navigation Header */}
      <View style={styles.header}>
        <Logo size="sm" />
        <TouchableOpacity
          onPress={onSignInClick}
          style={styles.signInButton}
          activeOpacity={0.8}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 🚀 Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badgeWrapper}>
            <Badge variant="brand" dot>UAE Retail Platform</Badge>
          </View>
          <Text style={styles.heroTitle}>Run your entire supermarket chain from one platform</Text>
          <Text style={styles.heroDesc}>
            cloudynationpos is a white-label, multi-tenant POS platform that unifies head office, every branch till and every delivery aggregator — offline-capable, VAT-compliant and ready to brand as your own.
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity
              onPress={onSignInClick}
              style={styles.primaryBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>See it in action</Text>
              <ChevronRight size={18} color="#0b0f19" />
            </TouchableOpacity>
          </View>

          {/* Interactive Vector Graphic Mockup */}
          <View style={styles.mockupWrapper}>
            <HeadOfficeMockup />
          </View>
        </View>

        {/* 📊 Core Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>99.9%</Text>
            <Text style={styles.statLabel}>API Uptime</Text>
          </View>
          <View style={[styles.statCol, styles.statColBorder]}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Offline Mode</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>5,000+</Text>
            <Text style={styles.statLabel}>Tills Capacity</Text>
          </View>
        </View>

        {/* ⚙️ Interactive Modules Explorer Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSubtitle}>Platform Explorer</Text>
          <Text style={styles.sectionTitle}>Interactive Module Tabs</Text>
        </View>

        {/* Horizontal tabs switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {[
            { key: 'hq', label: 'Head Office' },
            { key: 'store', label: 'Store Manager' },
            { key: 'cashier', label: 'Cashier Till' },
            { key: 'aggregator', label: 'Aggregator' }
          ].map((item) => {
            const isActive = activeModule === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setActiveModule(item.key as any)}
                style={[styles.tabBadge, isActive && styles.tabBadgeActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Interactive content card */}
        <Card style={styles.moduleDetailCard}>
          <Text style={styles.moduleDetailTitle}>{currentModule.title}</Text>
          <Text style={styles.moduleDetailDesc}>{currentModule.desc}</Text>
          <View style={styles.moduleBullets}>
            {currentModule.bullets.map((b, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <CheckCircle2 size={15} color="#39ff14" />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* 📋 Four Main Core Modules Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSubtitle}>Operating System</Text>
          <Text style={styles.sectionTitle}>Four modules, one ecosystem</Text>
        </View>

        <View style={styles.featuresList}>
          <Card style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <Layers size={18} color="#39ff14" />
              </View>
              <Text style={styles.featureTitleText}>Head Office Command</Text>
            </View>
            <Text style={styles.featureDescText}>
              Set up locations, centralize product directories, manage global pricing tiers, configure tax templates and monitor system-wide activity logs.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <Store size={18} color="#39ff14" />
              </View>
              <Text style={styles.featureTitleText}>Store Operations</Text>
            </View>
            <Text style={styles.featureDescText}>
              Control branch stock inventory, trigger branch-to-branch transfers, audit cash drawers, and review shift sales data summaries.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <Receipt size={18} color="#39ff14" />
              </View>
              <Text style={styles.featureTitleText}>Cashier Terminal Till</Text>
            </View>
            <Text style={styles.featureDescText}>
              Sub-50ms product barcodes scans, scales, and offline checkout mode which reconciles automatically once connected back.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <Network size={18} color="#39ff14" />
              </View>
              <Text style={styles.featureTitleText}>Delivery Aggregator</Text>
            </View>
            <Text style={styles.featureDescText}>
              Synchronize storefront listings, auto-ingest orders into till queues, publish catalog menus, and lock stock levels instantly.
            </Text>
          </Card>
        </View>

        {/* 💻 Cashier POS Mockup Section */}
        <View style={styles.mockupSection}>
          <Text style={styles.sectionSubtitle}>Terminal UI</Text>
          <Text style={styles.sectionTitle}>Ultra-fast Cashier Till Interface</Text>
          <Text style={styles.mockupDesc}>
            A cashier screen built for speed. Support quick items grid, touch-to-add, instant cart calculations and split payment selections.
          </Text>
          <CashierTillMockup />
        </View>

        {/* 🌐 White Label Feature List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSubtitle}>White Label</Text>
          <Text style={styles.sectionTitle}>Branded Multi-Tenant Sandbox</Text>
        </View>

        <View style={styles.whiteLabelGrid}>
          {[
            { title: 'Custom Domains', desc: 'Deploy on your own corporate web domain.' },
            { title: 'SMTP Settings', desc: 'Configure custom outbound receipts mail server.' },
            { title: 'VAT Configurations', desc: 'Pre-set tax templates matching regional rules.' },
            { title: 'Multi-Currency', desc: 'Accept AED, SAR, OMR, and custom retail cash.' },
            { title: 'Webhook API', desc: 'Hook logs directly into your external ERP database.' },
            { title: 'Developer Keys', desc: 'Establish oauth client secrets for aggregator APIs.' }
          ].map((item, idx) => (
            <View key={idx} style={styles.whiteLabelItem}>
              <Text style={styles.whiteLabelItemTitle}>{item.title}</Text>
              <Text style={styles.whiteLabelItemDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>

        {/* 💳 Plan Pricing Packages */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSubtitle}>Plans</Text>
          <Text style={styles.sectionTitle}>Flexible options for retail growth</Text>
        </View>

        {/* Billing cycle toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            onPress={() => setBillingCycle('monthly')}
            style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setBillingCycle('annual')}
            style={[styles.toggleBtn, billingCycle === 'annual' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, billingCycle === 'annual' && styles.toggleTextActive]}>Annual (-20%)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pricingCards}>
          <Card style={styles.pricingCard}>
            <Text style={styles.planName}>Starter</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>$</Text>
              <Text style={styles.priceValue}>{billingCycle === 'annual' ? '79' : '99'}</Text>
              <Text style={styles.priceDuration}>/mo</Text>
            </View>
            <Text style={styles.planDesc}>Ideal for single supermarket locations looking for simple, offline POS checkouts.</Text>
            <View style={styles.planDivider} />
            <View style={styles.planFeatures}>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>1 Outlet active</Text></View>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Up to 3 concurrent tills</Text></View>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Standard UAE VAT receipts</Text></View>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Offline mode support</Text></View>
            </View>
          </Card>

          <Card style={[styles.pricingCard, styles.pricingCardFeatured]}>
            <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>Featured Plan</Text></View>
            <Text style={styles.planName}>Growth</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>$</Text>
              <Text style={styles.priceValue}>{billingCycle === 'annual' ? '199' : '249'}</Text>
              <Text style={styles.priceDuration}>/mo</Text>
            </View>
            <Text style={styles.planDesc}>Perfect for expanding regional supermarket chains that need centralized control.</Text>
            <View style={styles.planDivider} />
            <View style={styles.planFeatures}>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Up to 5 Outlets active</Text></View>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Unlimited cashiers & tills</Text></View>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Central HQ catalog editor</Text></View>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Mid-shift drops & X/Z reports</Text></View>
            </View>
          </Card>

          <Card style={styles.pricingCard}>
            <Text style={styles.planName}>Enterprise</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>$</Text>
              <Text style={styles.priceValue}>Custom</Text>
            </View>
            <Text style={styles.planDesc}>Enterprise white-label solution for full customization, custom hosting, and integrations.</Text>
            <View style={styles.planDivider} />
            <View style={styles.planFeatures}>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Unlimited outlets & locations</Text></View>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Dedicated database server</Text></View>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Talabat/Careem menu sync</Text></View>
              <View style={styles.planFeatureRow}><Check size={14} color="#39ff14" /><Text style={styles.planFeatureText}>Custom localized tax settings</Text></View>
            </View>
          </Card>
        </View>

        {/* 📁 Detailed Mobile Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <Logo size="sm" />
            <Text style={styles.footerTagline}>The enterprise white-label POS platform for UAE supermarket chains.</Text>
          </View>
          
          <View style={styles.footerLinksRow}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Product</Text>
              <Text style={styles.footerLinkText}>Features</Text>
              <Text style={styles.footerLinkText}>Modules</Text>
              <Text style={styles.footerLinkText}>Pricing Plans</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Platform</Text>
              <Text style={styles.footerLinkText}>Multi-tenant</Text>
              <Text style={styles.footerLinkText}>Developer Hub</Text>
              <Text style={styles.footerLinkText}>API Status</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Compliance</Text>
              <Text style={styles.footerLinkText}>UAE VAT 5%</Text>
              <Text style={styles.footerLinkText}>FTA Approved</Text>
              <Text style={styles.footerLinkText}>ZATCA Compliant</Text>
            </View>
          </View>

          <View style={styles.footerDivider} />

          <Text style={styles.footerCopyright}>© 2026 cloudynationpos. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const mockupStyles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    width: '100%',
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    height: 28,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 10,
  },
  windowDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  headerText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#94a3b8',
  },
  body: {
    padding: 10,
    backgroundColor: '#ffffff',
  },
  topStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statVal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  barMini: {
    height: 3,
    width: '60%',
    backgroundColor: '#cbd5e1',
    borderRadius: 1.5,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItem: {
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  gridTxt: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#39ff14',
    backgroundColor: '#ffffff',
  },
  signInText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  badgeWrapper: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  heroActions: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#39ff14',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#0b0f19',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  mockupWrapper: {
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statColBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#f1f5f9',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  tabsScroll: {
    marginBottom: 12,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBadgeActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#39ff14',
    borderWidth: 1,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  tabBadgeTextActive: {
    color: '#0b0f19',
  },
  moduleDetailCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 16,
    marginBottom: 24,
  },
  moduleDetailTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  moduleDetailDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  moduleBullets: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  featuresList: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 14,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  featureIconContainer: {
    height: 32,
    width: 32,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  featureTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  featureDescText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  mockupSection: {
    backgroundColor: '#f8fafc',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  mockupDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginTop: 8,
  },
  whiteLabelGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  whiteLabelItem: {
    width: (screenWidth - 50) / 2,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
  },
  whiteLabelItemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  whiteLabelItemDesc: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#0f172a',
  },
  pricingCards: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  pricingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 16,
  },
  pricingCardFeatured: {
    borderColor: '#39ff14',
    borderWidth: 2,
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#39ff14',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0b0f19',
  },
  planName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  priceSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginRight: 2,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  priceDuration: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 2,
  },
  planDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 12,
  },
  planDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  planFeatures: {
    gap: 8,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planFeatureText: {
    fontSize: 11,
    color: '#475569',
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  footerTop: {
    marginBottom: 20,
  },
  footerTagline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 18,
  },
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  footerCol: {
    flex: 1,
  },
  footerColTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  footerLinkText: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 8,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  footerCopyright: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
