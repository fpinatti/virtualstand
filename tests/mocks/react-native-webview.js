const React = require('react');
const { View } = require('react-native');

const MockWebView = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    injectJavaScript: jest.fn(),
    reload: jest.fn(),
  }));
  return React.createElement(View, { testID: 'mock-webview', ...props });
});

module.exports = {
  WebView: MockWebView,
  default: MockWebView,
};
