const eslintPluginTs = require('@typescript-eslint/eslint-plugin');
const parserTs = require('@typescript-eslint/parser');
const pluginUnusedImports = require('eslint-plugin-unused-imports');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

/** @type {import("eslint").Linter.FlatConfig} */
module.exports = [
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: parserTs,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': eslintPluginTs,
            'unused-imports': pluginUnusedImports,
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            ...eslintPluginTs.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'off',

            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
        },
    },
];
