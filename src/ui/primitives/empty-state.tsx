import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { tokens } from '../tokens';
import { Button } from './button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onActionPress,
  onAction,
  style,
}: EmptyStateProps) {
  const handler = onActionPress ?? onAction;
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && handler ? (
        <View style={styles.actionWrapper}>
          <Button label={actionLabel} variant="primary" onPress={handler} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.section,
    backgroundColor: tokens.colors.surface.canvas,
  },
  title: {
    fontSize: tokens.typography.h1.fontSize,
    lineHeight: tokens.typography.h1.lineHeight,
    fontWeight: tokens.typography.h1.fontWeight,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: tokens.typography.body.fontSize,
    lineHeight: tokens.typography.body.lineHeight,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 440,
  },
  actionWrapper: {
    marginTop: tokens.spacing.xxl,
  },
});
