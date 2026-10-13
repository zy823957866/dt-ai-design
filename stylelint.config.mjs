export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'import-notation': 'string',
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'apply',
          'config',
          'plugin',
          'utility',
          'variant',
          'custom-variant',
          'source',
          'reference',
          'screen',
        ],
      },
    ],
  },
};
