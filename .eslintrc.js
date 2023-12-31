module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/react-in-jsx-scope.md#when-not-to-use-it
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  overrides: [
    {
      env: { node: true },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: { sourceType: 'script' },
    },
  ],
  plugins: ['react', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'prettier/prettier': 'error',
    'import/prefer-default-export': 'off',
    'no-continue': 'warn',
    'react/jsx-no-useless-fragment': 'off',
    'react/require-default-props': 'off',

    'jsx-a11y/label-has-associated-control': [
      'error',
      {
        required: {
          some: ['nesting', 'id'],
        },
      },
    ],
    'jsx-a11y/label-has-for': [
      'error',
      {
        required: {
          some: ['nesting', 'id'],
        },
      },
    ],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        groups: [
          'builtin',
          'external',
          'internal',
          ['index', 'sibling', 'parent'],
        ],
        pathGroups: [
          {
            pattern: '@mui/**',
            group: 'external',
            position: 'after',
          },
          {
            pattern: 'src/shared/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: 'src/store/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: 'src/features/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: 'src/pages/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '*.scss',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: [],
      },
    ],
  },
};
