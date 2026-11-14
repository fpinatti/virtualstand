import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { tokens, BadgeTone } from '../tokens';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  tabularNums?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({
  label,
  tone = 'neutral',
  tabularNums = false,
  style,
  textStyle,
}: BadgeProps) {
  const bgStyle: ViewStyle =
    tone === 'primary' || tone === 'accent'
      ? styles.primaryBg
      : tone === 'success'
      ? styles.successBg
      : tone === 'warning'
      ? styles.warningBg
      : tone === 'danger'
      ? styles.dangerBg
      : tone === 'info'
      ? styles.infoBg
      : styles.neutralBg;

  const fgStyle: TextStyle =
    tone === 'primary' || tone === 'accent'
      ? styles.primaryText
      : tone === 'success'
      ? styles.successText
      : tone === 'warning'
      ? styles.warningText
      : tone === 'danger'
      ? styles.dangerText
      : tone === 'info'
      ? styles.infoText
      : styles.neutralText;

  return (
    <View style={[styles.container, bgStyle, style]}>
      <Text
        style={[
          styles.label,
          fgStyle,
          tabularNums && { fontVariant: ['tabular-nums'] },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: tokens.typography.micro.fontSize,
    lineHeight: tokens.typography.micro.lineHeight,
    fontWeight: tokens.typography.micro.fontWeight,
  },
  neutralBg: {
    backgroundColor: tokens.colors.surface.interactive,
  },
  neutralText: {
    color: tokens.colors.text.secondary,
  },
  primaryBg: {
    backgroundColor: tokens.colors.accent.primarySubtle,
    borderWidth: 1,
    borderColor: tokens.colors.accent.primary,
  },
  primaryText: {
    color: tokens.colors.accent.primary,
  },
  successBg: {
    backgroundColor: tokens.colors.status.successSubtle,
  },
  successText: {
    color: tokens.colors.status.success,
  },
  warningBg: {
    backgroundColor: tokens.colors.status.warningSubtle,
  },
  warningText: {
    color: tokens.colors.status.warning,
  },
  dangerBg: {
    backgroundColor: tokens.colors.status.dangerSubtle,
  },
  dangerText: {
    color: tokens.colors.status.danger,
  },
  infoBg: {
    backgroundColor: tokens.colors.status.infoSubtle,
  },
  infoText: {
    color: tokens.colors.status.info,
  },
});
