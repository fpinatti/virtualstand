import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { tokens } from '../tokens';
import { Badge } from './badge';
import { Button } from './button';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  subtitle,
  badgeText,
  actionLabel,
  onActionPress,
  onAction,
  style,
}: SectionHeaderProps) {
  const handler = onActionPress ?? onAction;
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badgeText ? <Badge label={badgeText} tone="neutral" /> : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && handler ? (
        <Button label={actionLabel} variant="secondary" size="sm" onPress={handler} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: tokens.spacing.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.h2.fontSize,
    lineHeight: tokens.typography.h2.lineHeight,
    fontWeight: tokens.typography.h2.fontWeight,
    color: tokens.colors.text.primary,
  },
  subtitle: {
    fontSize: tokens.typography.caption.fontSize,
    lineHeight: tokens.typography.caption.lineHeight,
    color: tokens.colors.text.secondary,
  },
});
