const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'], // support .cjs files
  },
  server: {
    enhanceMiddleware: middleware => {
      return (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*'); // Enable CORS for debugging
        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
