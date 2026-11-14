import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { tokens } from '../tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  errorText?: string | null;
  helperText?: string;
  tabularNums?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  errorText,
  helperText,
  tabularNums = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const resolvedError = error ?? errorText ?? null;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={tokens.colors.text.muted}
        onFocus={(e) => {
          setFocused(true);
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          if (onBlur) onBlur(e);
        }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          Boolean(resolvedError) && styles.inputError,
          tabularNums && { fontVariant: ['tabular-nums'] },
          style,
        ]}
        {...rest}
      />
      {resolvedError ? (
        <Text style={styles.errorText}>{resolvedError}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  label: {
    fontSize: tokens.typography.caption.fontSize,
    lineHeight: tokens.typography.caption.lineHeight,
    fontWeight: '600',
    color: tokens.colors.text.secondary,
  },
  input: {
    backgroundColor: tokens.colors.surface.canvas,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    borderRadius: tokens.radii.md,
    minHeight: tokens.layout.minTouchTarget,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.body.fontSize,
  },
  inputFocused: {
    borderColor: tokens.colors.border.focus,
  },
  inputError: {
    borderColor: tokens.colors.status.danger,
  },
  errorText: {
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    color: tokens.colors.status.danger,
  },
  helperText: {
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    color: tokens.colors.text.muted,
  },
});
