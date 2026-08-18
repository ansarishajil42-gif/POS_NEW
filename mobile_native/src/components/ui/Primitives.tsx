import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetOverlay}
      >
        {/* Backdrop overlay */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sheetBackdrop}
          onPress={onClose}
        />
        
        {/* Sliding Card Content */}
        <View style={styles.sheetContent}>
          {/* Top handle bar */}
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>

          {title && (
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
                <Text style={styles.sheetCloseText}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scrollable Children Body */}
          <ScrollView
            style={styles.sheetBody}
            contentContainerStyle={styles.sheetBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {/* Optional Footer */}
          {footer && (
            <View style={styles.sheetFooter}>
              {footer}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  disabled,
  full = false,
  style,
  textStyle,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  full?: boolean;
  style?: any;
  textStyle?: any;
}) {
  const variantStyles = {
    primary: {
      btn: { backgroundColor: '#39ff14', borderWidth: 0 },
      txt: { color: '#0f172a', fontWeight: 'bold' },
    },
    secondary: {
      btn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
      txt: { color: '#475569' },
    },
    ghost: {
      btn: { backgroundColor: 'transparent', borderWidth: 0 },
      txt: { color: '#475569' },
    },
    danger: {
      btn: { backgroundColor: '#ef4444', borderWidth: 0 },
      txt: { color: '#ffffff' },
    },
  }[variant];

  // If children is plain text, wrap it in a <Text> component
  const renderChildren = () => {
    if (typeof children === 'string' || typeof children === 'number') {
      return (
        <Text style={[styles.btnText, variantStyles.txt, textStyle]}>
          {children}
        </Text>
      );
    }
    if (Array.isArray(children)) {
      const hasText = children.some(
        (c) => typeof c === 'string' || typeof c === 'number'
      );
      if (hasText) {
        return (
          <Text style={[styles.btnText, variantStyles.txt, textStyle]}>
            {children}
          </Text>
        );
      }
    }
    return children;
  };

  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        variantStyles.btn,
        full && styles.btnFull,
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      {renderChildren()}
    </TouchableOpacity>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  prefix,
  style,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'numeric';
  prefix?: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.inputGroup, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={styles.inputWrapper}>
        {prefix && <View style={styles.inputPrefix}>{prefix}</View>}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={type === 'password'}
          keyboardType={
            type === 'numeric'
              ? 'numeric'
              : type === 'email'
              ? 'email-address'
              : 'default'
          }
          style={styles.textInput}
        />
      </View>
    </View>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function EmptyState({ icon, title, sub }: { icon?: React.ReactNode; title: string; sub?: string }) {
  return (
    <View style={styles.emptyContainer}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub && <Text style={styles.emptySub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sheet Styles
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheetContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  sheetHandle: {
    height: 5,
    width: 38,
    borderRadius: 2.5,
    backgroundColor: '#cbd5e1',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sheetCloseBtn: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: {
    fontSize: 18,
    color: '#64748b',
    lineHeight: 20,
    textAlign: 'center',
  },
  sheetBody: {
    paddingHorizontal: 20,
  },
  sheetBodyContent: {
    paddingBottom: 24,
  },
  sheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },

  // Button Styles
  btn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 4,
  },
  btnFull: {
    width: '100%',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Input Styles
  inputGroup: {
    marginVertical: 6,
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputPrefix: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },

  // Field Styles
  fieldContainer: {
    marginVertical: 6,
  },

  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
});
