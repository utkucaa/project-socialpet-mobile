const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable CSS support for web
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Add CSS support for web platform
config.resolver.assetExts.push('css');

module.exports = config; 