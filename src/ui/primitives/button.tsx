import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { tokens, ButtonVariant, ButtonSize } from '../tokens';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerVariantStyle: ViewStyle =
    variant === 'primary'
      ? styles.primaryContainer
      : variant === 'secondary'
      ? styles.secondaryContainer
      : variant === 'danger'
      ? styles.dangerContainer
      : styles.ghostContainer;

  const labelVariantStyle: TextStyle =
    variant === 'primary'
      ? styles.primaryLabel
      : variant === 'secondary'
      ? styles.secondaryLabel
      : variant === 'danger'
      ? styles.dangerLabel
      : styles.ghostLabel;

  const spinnerColor =
    variant === 'primary'
      ? tokens.colors.text.inverse
      : variant === 'danger'
      ? tokens.colors.status.danger
      : tokens.colors.text.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={size === 'sm' ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined}
      style={[
        styles.baseContainer,
        size === 'sm' ? styles.smContainer : styles.mdContainer,
        containerVariantStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <Text
          style={[
            styles.baseLabel,
            size === 'sm' ? styles.smLabel : styles.mdLabel,
            labelVariantStyle,
            textStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radii.md,
    minWidth: tokens.layout.minTouchTarget,
  },
  mdContainer: {
    minHeight: tokens.layout.minTouchTarget,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
  },
  smContainer: {
    minHeight: 36,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
  },
  fullWidth: {
    width: '100%',
  },
  primaryContainer: {
    backgroundColor: tokens.colors.accent.primary,
  },
  secondaryContainer: {
    backgroundColor: tokens.colors.surface.interactive,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  dangerContainer: {
    backgroundColor: tokens.colors.status.dangerSubtle,
    borderWidth: 1,
    borderColor: tokens.colors.status.danger,
  },
  disabledContainer: {
    opacity: 0.45,
  },
  baseLabel: {
    textAlign: 'center',
  },
  mdLabel: {
    fontSize: tokens.typography.bodyStrong.fontSize,
    lineHeight: tokens.typography.bodyStrong.lineHeight,
    fontWeight: '700',
  },
  smLabel: {
    fontSize: tokens.typography.caption.fontSize,
    lineHeight: tokens.typography.caption.lineHeight,
    fontWeight: '600',
  },
  primaryLabel: {
    color: tokens.colors.text.inverse,
  },
  secondaryLabel: {
    color: tokens.colors.text.primary,
  },
  ghostLabel: {
    color: tokens.colors.text.secondary,
  },
  dangerLabel: {
    color: tokens.colors.status.danger,
  },
});
