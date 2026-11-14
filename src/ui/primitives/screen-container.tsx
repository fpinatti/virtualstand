import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { tokens } from '../tokens';

export interface ScreenContainerProps {
  children: React.ReactNode;
  constrainWidth?: boolean;
  padded?: boolean;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function ScreenContainer({
  children,
  constrainWidth = true,
  padded = false,
  scrollable = false,
  style,
  contentStyle,
}: ScreenContainerProps) {
  if (scrollable) {
    return (
      <ScrollView
        style={[styles.outer, style]}
        contentContainerStyle={[
          styles.scrollContent,
          constrainWidth && styles.constrained,
          padded && styles.padded,
          contentStyle,
        ]}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.outer, style]}>
      <View
        style={[
          styles.inner,
          constrainWidth && styles.constrained,
          padded && styles.padded,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: tokens.colors.surface.canvas,
  },
  inner: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    padding: tokens.spacing.lg,
  },
  padded: {
    padding: tokens.spacing.lg,
  },
  constrained: {
    maxWidth: tokens.layout.maxContentWidth,
    alignSelf: 'center',
  },
});
