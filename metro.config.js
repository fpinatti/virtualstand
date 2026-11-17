const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent Metro from crawling 1.4 GB of rulebook PDFs
config.resolver.blockList = [
  /assets\/rulebooks\/.*/,
];

module.exports = config;
