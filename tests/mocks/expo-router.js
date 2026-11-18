const React = require('react');

const MockTabs = (props) => React.createElement('Tabs', props, props.children);
MockTabs.Screen = (props) => React.createElement('Screen', props);

const MockStack = (props) => React.createElement('Stack', props, props.children);
MockStack.Screen = (props) => React.createElement('StackScreen', props);

module.exports = {
  Tabs: MockTabs,
  Stack: MockStack,
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
};
