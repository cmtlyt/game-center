import antfu from '@antfu/eslint-config';

export default antfu({
  type: 'app',
  vue: true,
  typescript: true,
  formatters: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: true,
  },
  rules: {
    'no-console': ['error', { allow: ['debug'] }],
  },
});
