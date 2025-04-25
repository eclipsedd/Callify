module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    '@react-native',
    'plugin:react/recommended',
    'plugin:jest/recommended',
    'eslint:recommended',
  ],
  plugins: ['react', 'jest'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Relax common warnings
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react/prop-types': 'off',

    // Improve code clarity
    'no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
    'no-console': 'warn',

    // Common issues in RN: require text inside <Text>
    'react/jsx-no-undef': 'error',
    'react/jsx-key': 'warn',
    'react-native/no-inline-styles': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
