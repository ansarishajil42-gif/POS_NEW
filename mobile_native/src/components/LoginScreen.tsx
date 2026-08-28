import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager
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
  const [selected, setSelected] = useState<Role | null>(null);
  const [email, setEmail] = useState('superadmin@cloudynationpos.com');
  const [password, setPassword] = useState('superadmin@cloudynationpos.com');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Chevron rotation animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Spring-back translateY animation
  const translateAnim = useRef(new Animated.Value(0)).current;

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
    
    if (selected === 'super-admin') {
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
    } else {
      signIn(selected);
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
        <Text style={styles.subtitle}>Demo environment — select your role below</Text>
      </View>

      <View style={styles.formCard}>
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
          disabled={!selected}
          style={styles.submitBtn}
        >
          Sign In
        </Button>

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
  // Inline Dropdown Menu Styles
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
});
