const React = require('react');
const { Text } = require('react-native');

function MockIcon(props) {
  return React.createElement(Text, { testID: `icon-${props.name}`, ...props }, props.name);
}

module.exports = MockIcon;
module.exports.Ionicons = MockIcon;
module.exports.default = MockIcon;
