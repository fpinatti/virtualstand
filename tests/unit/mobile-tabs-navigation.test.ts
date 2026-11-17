import React from 'react';

jest.mock('expo-router', () => {
  const R = require('react');
  const MockTabs = (props: any) => R.createElement('Tabs', props, props.children);
  MockTabs.Screen = (props: any) => R.createElement('Screen', props);
  return {
    Tabs: MockTabs,
  };
});

import TabsLayout from '@/../app/(tabs)/_layout';

interface ScreenProps {
  name: string;
  options: {
    tabBarIcon: (props: { color: string; size: number; focused: boolean }) => React.ReactElement<{ color: string; name: string }>;
  };
}

describe('User Story 4: Mobile Bottom Tab Bar Icons (Feature 014)', () => {
  it('renders TabsLayout without crashing', () => {
    const element = React.createElement(TabsLayout);
    expect(element).toBeDefined();
  });

  it('defines explicit vector icon mappings for collection, shelf, and settings tabs', () => {
    const layout = TabsLayout();
    expect(layout).toBeDefined();
    expect(layout.props.children).toBeDefined();

    const screens = (React.Children.toArray(layout.props.children) as unknown) as Array<React.ReactElement<ScreenProps>>;
    expect(screens.length).toBe(3);

    const screenNames = screens.map((s) => s.props.name);
    expect(screenNames).toEqual(['collection', 'shelf', 'settings']);

    // Collection tab uses library icons
    const collectionIcon = screens[0].props.options.tabBarIcon({
      color: '#F59E0B',
      size: 24,
      focused: true,
    });
    expect(collectionIcon.props.name).toBe('library');

    const collectionUnfocused = screens[0].props.options.tabBarIcon({
      color: '#888888',
      size: 24,
      focused: false,
    });
    expect(collectionUnfocused.props.name).toBe('library-outline');

    // Shelf tab uses cube icons
    const shelfIcon = screens[1].props.options.tabBarIcon({
      color: '#F59E0B',
      size: 24,
      focused: true,
    });
    expect(shelfIcon.props.name).toBe('cube');

    // Settings tab uses settings icons
    const settingsIcon = screens[2].props.options.tabBarIcon({
      color: '#F59E0B',
      size: 24,
      focused: true,
    });
    expect(settingsIcon.props.name).toBe('settings');
  });
});
