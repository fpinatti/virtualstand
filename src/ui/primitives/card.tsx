import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { tokens, CardVariant, SpacingKey } from '../tokens';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: SpacingKey;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  variant = 'default',
  padding = 'lg',
  style,
}: CardProps) {
  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? styles.elevated
      : variant === 'outlined'
      ? styles.outlined
      : variant === 'subtle' || variant === 'sunken'
      ? styles.subtle
      : styles.default;

  return (
    <View
      style={[
        styles.base,
        variantStyle,
        { padding: tokens.spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radii.lg,
  },
  default: {
    backgroundColor: tokens.colors.surface.card,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  elevated: {
    backgroundColor: tokens.colors.surface.elevated,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  subtle: {
    backgroundColor: tokens.colors.surface.canvas,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
});
