const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: [
        '@react-navigation',
        'react-native-reanimated',
        'react-native-gesture-handler',
        '@react-native-async-storage/async-storage',
        'react-native-safe-area-context',
        'react-native-screens',
        'react-native-vector-icons',
        'expo-image-picker',
        'expo-file-system',
        'expo-image-manipulator'
      ]
    }
  }, argv);

  // Add custom webpack configuration
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web'
  };

  // Add fallbacks for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "path": require.resolve("path-browserify"),
    "fs": false,
    "os": require.resolve("os-browserify/browser"),
    "buffer": require.resolve("buffer/")
  };

  // Add polyfills
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  );

  return config;
}; 