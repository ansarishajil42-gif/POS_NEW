import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ScrollView,
  Platform
} from 'react-native';
import { useAuth } from '../lib/auth';
import { Logo } from './Logo';
import { Sheet, Button } from './ui/Primitives';
import {
  Home,
  Building2,
  TrendingUp,
  Settings,
  Store,
  Box,
  ShoppingCart,
  Menu as MenuIcon,
  Users,
  FileText,
  Layers,
  Truck,
  Bell,
  Clipboard,
  CheckSquare,
  Wallet,
  Receipt,
  ShoppingBag,
  List,
  File,
  ChevronLeft
} from 'lucide-react-native';

const tabIconMap: Record<string, React.ComponentType<any>> = {
  home: Home,
  building: Building2,
  chart: TrendingUp,
  settings: Settings,
  store: Store,
  box: Box,
  cart: ShoppingCart,
  menu: MenuIcon,
  users: Users,
  report: FileText,
  layers: Layers,
  truck: Truck,
  bell: Bell,
  clipboard: Clipboard,
  check: CheckSquare,
  wallet: Wallet,
  receipt: Receipt,
  'shopping-bag': ShoppingBag,
  list: List,
  file: File,
};

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  // On Native Mobile, PhoneFrame is simply a Safe Area wrapper
  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft size={22} color="#475569" />
          </TouchableOpacity>
        )}
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSub}>{subtitle}</Text>}
        </View>
        {right && <View style={styles.rightHeaderWrapper}>{right}</View>}
      </View>
    </View>
  );
}

export function AppHeader({
  roleLabel,
  branch,
  onProfile,
  offline,
  bufferedCount,
}: {
  roleLabel: string;
  branch?: string;
  onProfile?: () => void;
  offline?: 'synced' | 'buffering';
  bufferedCount?: number;
}) {
  const { signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleProfileClick = () => {
    if (onProfile) {
      onProfile();
    } else {
      setProfileOpen(true);
    }
  };

  const isSynced = offline === 'synced';

  return (
    <>
      <View style={styles.appHeader}>
        <View style={styles.appHeaderRow}>
          <Logo size="sm" />
          <View style={styles.appHeaderRight}>
            {offline && (
              <View style={[
                styles.offlineBadge,
                { backgroundColor: isSynced ? '#f0fdf4' : '#fffbeb', borderColor: isSynced ? '#bbf7d0' : '#fef3c7' }
              ]}>
                <View style={[styles.badgeDot, { backgroundColor: isSynced ? '#39ff14' : '#eab308' }]} />
                <Text style={[styles.badgeText, { color: isSynced ? '#39ff14' : '#d97706' }]}>
                  {isSynced ? 'Synced' : `Offline · ${bufferedCount || 0}`}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={handleProfileClick} style={styles.profileCircle}>
              <Text style={styles.profileCircleText}>{roleLabel.charAt(0)}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {branch && (
          <View style={styles.branchSubHeader}>
            <Text style={styles.branchText}>{branch}</Text>
          </View>
        )}
      </View>

      {/* User Profile Sheet Modal */}
      <Sheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="User Profile"
        footer={
          <Button
            variant="danger"
            full
            onClick={() => {
              setProfileOpen(false);
              signOut();
            }}
          >
            Sign Out (Logout)
          </Button>
        }
      >
        <View style={styles.profileSheetBody}>
          <View style={styles.profileSheetHeader}>
            <View style={styles.profileSheetCircle}>
              <Text style={styles.profileSheetCircleText}>{roleLabel.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.profileSheetRoleName}>{roleLabel}</Text>
              <Text style={styles.profileSheetRoleSub}>{branch || 'Active Session'}</Text>
            </View>
          </View>

          <View style={styles.profileSheetDetails}>
            <View style={styles.profileDetailRow}>
              <Text style={styles.profileDetailLabel}>Terminal Duty Role:</Text>
              <Text style={styles.profileDetailValue}>{roleLabel}</Text>
            </View>
            <View style={styles.profileDetailRow}>
              <Text style={styles.profileDetailLabel}>Active Location:</Text>
              <Text style={styles.profileDetailValue}>{branch || 'All Outlets'}</Text>
            </View>
            <View style={styles.profileDetailRow}>
              <Text style={styles.profileDetailLabel}>Connection:</Text>
              <Text style={[styles.profileDetailValue, { color: '#39ff14' }]}>Online & Secured</Text>
            </View>
          </View>
        </View>
      </Sheet>
    </>
  );
}

export function BottomNav({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; icon: string }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <View style={styles.bottomNav}>
      <View style={styles.bottomNavRow}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const IconComponent = tabIconMap[tab.icon] || Home;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={styles.navItem}
              activeOpacity={0.8}
            >
              <IconComponent
                size={20}
                color={isActive ? '#39ff14' : '#64748b'}
              />
              <Text style={[
                styles.navLabel,
                { color: isActive ? '#39ff14' : '#64748b', fontWeight: isActive ? '700' : '500' }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function ScreenBody({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <ScrollView
      style={[styles.screenBody, style]}
      contentContainerStyle={styles.screenBodyContent}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenBody: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenBodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44,
  },
  contentContainer: {
    flex: 1,
  },
  // Screen Header Styles
  screenHeader: {
    height: 56,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
    marginLeft: -4,
  },
  titleWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  rightHeaderWrapper: {
    justifyContent: 'center',
  },

  // App Header Styles
  appHeader: {
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  appHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileCircle: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCircleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#39ff14',
  },
  branchSubHeader: {
    marginTop: 4,
  },
  branchText: {
    fontSize: 11,
    color: '#64748b',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Bottom Nav Styles
  bottomNav: {
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 32 : 12,
  },
  bottomNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 60,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
  },

  // Profile Sheet Styles
  profileSheetBody: {
    paddingVertical: 12,
  },
  profileSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  profileSheetCircle: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSheetCircleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#39ff14',
  },
  profileSheetRoleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  profileSheetRoleSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  profileSheetDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileDetailLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  profileDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
});
