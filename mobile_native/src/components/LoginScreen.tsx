import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
  Keyboard
} from 'react-native';
import { Logo } from './Logo';
import { Button, Input } from './ui/Primitives';
import { ROLES, type Role } from '../lib/types';
import { useAuth } from '../lib/auth';
import { Mail, Lock, Check, ChevronDown, ChevronLeft } from 'lucide-react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function LoginScreen({ onBack }: { onBack?: () => void }) {
  const { signIn } = useAuth();
  
  // Toggles: credentials vs pin
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'pin'>('credentials');

  // Credentials states
  const [selected, setSelected] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // PIN login states
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [pin, setPin] = useState('');

  // Chevron rotation animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Spring-back translateY animation
  const translateAnim = useRef(new Animated.Value(0)).current;

  // Fetch tenants and branches for PIN login
  useEffect(() => {
    const loadTenantsAndBranches = async () => {
      try {
        const { apiClient } = require('../lib/apiClient');
        const res = await apiClient.get('/auth/tenants-branches') as any;
        setTenantsList(res.tenants || []);
        setBranchesList(res.branches || []);
      } catch (err) {
        console.error('Failed to load tenants/branches:', err);
      }
    };
    loadTenantsAndBranches();
  }, []);

  const toggleDropdown = () => {
    const toValue = isDropdownOpen ? 0 : 1;

    // Trigger bounce scale / translateY
    translateAnim.setValue(0);
    Animated.sequence([
      Animated.timing(translateAnim, {
        toValue: 6,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(translateAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 12,
        speed: 12,
      })
    ]).start();

    // Rotate chevron arrow
    Animated.timing(rotateAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Smooth layout height expand
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSelectRole = (roleId: Role) => {
    setSelected(roleId);
    
    // Collapse dropdown smoothly
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(false);

    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    if (!selected) return;
    
    setIsLoading(true);
    try {
      const { apiClient, storage } = require('../lib/apiClient');
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.token) {
        await storage.setToken(res.token);
      }
      if (res.user) {
        await storage.setUser(res.user);
      }
      signIn(selected, res.user);
    } catch (err: any) {
      console.error('Login error:', err);
      alert(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const submitPin = async () => {
    if (!selectedTenantId || !selectedBranchId || !pin) {
      alert('Please select Tenant, Branch and enter PIN');
      return;
    }
    setIsLoading(true);
    try {
      const { apiClient, storage } = require('../lib/apiClient');
      const res = await apiClient.post('/auth/pin-login', {
        tenantId: selectedTenantId,
        branchId: selectedBranchId,
        pin
      }) as any;
      
      if (res.token) {
        await storage.setToken(res.token);
      }
      if (res.user) {
        await storage.setUser(res.user);
      }
      signIn('cashier', res.user);
    } catch (err: any) {
      console.error('PIN Login error:', err);
      alert(err.message || 'PIN login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.id === selected);

  const rotateValue = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {onBack && (
        <View style={styles.backRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <ChevronLeft size={20} color="#475569" />
            <Text style={styles.backText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.header}>
        <Logo size="lg" />
        <Text style={styles.title}>Sign in to your account</Text>
        <Text style={styles.subtitle}>Demo environment — login via credentials or PIN</Text>
      </View>

      <View style={styles.formCard}>
        {/* Toggle Login Method */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleTab, loginMethod === 'credentials' && styles.toggleTabActive]}
            onPress={() => setLoginMethod('credentials')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleTabText, loginMethod === 'credentials' && styles.toggleTabTextActive]}>
              Staff Credentials
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, loginMethod === 'pin' && styles.toggleTabActive]}
            onPress={() => setLoginMethod('pin')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleTabText, loginMethod === 'pin' && styles.toggleTabTextActive]}>
              Cashier PIN Login
            </Text>
          </TouchableOpacity>
        </View>

        {loginMethod === 'credentials' ? (
          <>
            <Input
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              type="email"
              prefix={<Mail size={16} color="#94a3b8" />}
            />

            <Input
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
              prefix={<Lock size={16} color="#94a3b8" />}
            />

            <View style={styles.selectGroup}>
              <Text style={styles.selectLabel}>Select Role</Text>
              <Animated.View style={{ transform: [{ translateY: translateAnim }] }}>
                <TouchableOpacity
                  onPress={toggleDropdown}
                  activeOpacity={0.9}
                  style={[
                    styles.selectTrigger,
                    isDropdownOpen ? styles.selectTriggerActive : styles.selectTriggerInactive
                  ]}
                >
                  <Text style={[styles.selectValue, selected ? styles.textActive : styles.textPlaceholder]}>
                    {selectedRole ? selectedRole.label : 'Choose your role…'}
                  </Text>
                  <Animated.View style={{ transform: [{ rotate: rotateValue }] }}>
                    <ChevronDown size={18} color="#94a3b8" />
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>

              {isDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled={true}>
                    {ROLES.map((r) => {
                      const isSelected = selected === r.id;
                      return (
                        <TouchableOpacity
                          key={r.id}
                          onPress={() => handleSelectRole(r.id)}
                          style={[
                            styles.dropdownItem,
                            isSelected ? styles.dropdownItemActive : styles.dropdownItemInactive
                          ]}
                          activeOpacity={0.7}
                        >
                          <View style={styles.dropdownItemLeft}>
                            <Text style={[styles.dropdownItemLabel, isSelected ? styles.dropdownItemLabelActive : styles.dropdownItemLabelInactive]}>
                              {r.label}
                            </Text>
                            <Text style={styles.dropdownItemSub}>{r.subtitle}</Text>
                          </View>
                          {isSelected && <Check size={16} color="#39ff14" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <Button
              full
              onClick={submit}
              disabled={!selected || isLoading}
              style={styles.submitBtn}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </>
        ) : (
          <>
            <View style={styles.selectGroup}>
              <Text style={styles.selectLabel}>Select Tenant</Text>
              <TextInput
                style={[styles.searchInput, { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f8fafc' }]}
                placeholder="Search Tenant..."
                placeholderTextColor="#94a3b8"
                value={tenantSearch}
                onFocus={() => {
                  setTenantDropdownOpen(true);
                  setBranchDropdownOpen(false);
                }}
                onChangeText={(text) => {
                  setTenantSearch(text);
                  setTenantDropdownOpen(true);
                }}
              />
              {tenantDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {tenantsList.filter(t => t.name.toLowerCase().includes(tenantSearch.toLowerCase())).map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => {
                          setSelectedTenantId(t.id);
                          setTenantSearch(t.name);
                          setTenantDropdownOpen(false);
                          setSelectedBranchId('');
                          setBranchSearch('');
                          Keyboard.dismiss();
                        }}
                        style={[styles.dropdownItem, selectedTenantId === t.id && styles.dropdownItemActive]}
                      >
                        <Text style={{ color: '#334155', fontWeight: selectedTenantId === t.id ? 'bold' : 'normal' }}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.selectGroup}>
              <Text style={styles.selectLabel}>Select Branch</Text>
              <TextInput
                style={[styles.searchInput, { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f8fafc' }]}
                placeholder="Search Branch..."
                placeholderTextColor="#94a3b8"
                value={branchSearch}
                onFocus={() => {
                  setBranchDropdownOpen(true);
                  setTenantDropdownOpen(false);
                }}
                onChangeText={(text) => {
                  setBranchSearch(text);
                  setBranchDropdownOpen(true);
                }}
                editable={!!selectedTenantId}
              />
              {branchDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {branchesList.filter(b => b.tenantId === selectedTenantId && b.name.toLowerCase().includes(branchSearch.toLowerCase())).map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        onPress={() => {
                          setSelectedBranchId(b.id);
                          setBranchSearch(b.name);
                          setBranchDropdownOpen(false);
                          Keyboard.dismiss();
                        }}
                        style={[styles.dropdownItem, selectedBranchId === b.id && styles.dropdownItemActive]}
                      >
                        <Text style={{ color: '#334155', fontWeight: selectedBranchId === b.id ? 'bold' : 'normal' }}>{b.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <Input
              label="Cashier 4-digit PIN"
              value={pin}
              onChange={(val) => setPin(val.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              type="password"
              prefix={<Lock size={16} color="#94a3b8" />}
            />

            <Button
              full
              onClick={submitPin}
              disabled={!selectedTenantId || !selectedBranchId || !pin || isLoading}
              style={styles.submitBtn}
            >
              {isLoading ? 'Accessing Till...' : 'Access Till'}
            </Button>
          </>
        )}

        <Text style={styles.termsText}>
          By signing in you agree to the cloudynationpos terms.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  toggleTabTextActive: {
    color: '#0f172a',
  },
  selectGroup: {
    marginVertical: 4,
    position: 'relative',
    zIndex: 50,
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectTriggerInactive: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  selectTriggerActive: {
    backgroundColor: '#ffffff',
    borderColor: '#39ff14',
    borderLeftWidth: 4,
    borderLeftColor: '#39ff14',
  },
  selectValue: {
    fontSize: 14,
  },
  textActive: {
    color: '#0f172a',
    fontWeight: '500',
  },
  textPlaceholder: {
    color: '#94a3b8',
  },
  submitBtn: {
    marginTop: 12,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownItemInactive: {
    backgroundColor: 'transparent',
  },
  dropdownItemActive: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#39ff14',
  },
  dropdownItemLeft: {
    flex: 1,
  },
  dropdownItemLabel: {
    fontSize: 14,
  },
  dropdownItemLabelActive: {
    fontWeight: 'bold',
    color: '#15803d',
  },
  dropdownItemLabelInactive: {
    fontWeight: '600',
    color: '#334155',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  backRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 16,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 4,
  },
  searchInput: {
    fontSize: 13,
    color: '#0f172a',
  },
});
