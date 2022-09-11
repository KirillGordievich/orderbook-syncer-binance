module.exports = {
  env: {
    node: true,
    jest: true
  },
  globals: {
    'BigInt': true
  },
  rules: {
    'global-require': 'off',
    'class-methods-use-this': [0],
    'func-names': 'off',
    'no-underscore-dangle': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'no-restricted-syntax': 'off',
    "padding-line-between-statements": [
      "error",
      { "blankLine": "always", "prev": "*", "next": "return" },
      { "blankLine": "always", "prev": ["const", "let", "var"], "next": "*" },
      { "blankLine": "any", "prev": ["const", "let", "var"], "next": ["const", "let", "var"] }
    ],
    "brace-style": ["error", "1tbs", { "allowSingleLine": false }],
    "prefer-const": ["error", {
      "destructuring": "all",
      "ignoreReadBeforeAssign": true
    }]
  },
  extends: 'airbnb-base',
};
