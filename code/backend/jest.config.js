module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest/setup.js'], // ✅ Ensure setup files are loaded
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-navigation|@react-navigation|react-native-gesture-handler|react-native-webrtc)/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/jest/__mocks__/fileMock.js', // ✅ Corrected path
  },
};
