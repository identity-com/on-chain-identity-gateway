/**
 * @type {import('prettier').Config}
 **/
module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  proseWrap: 'always',
  printWidth: 120,
  tabWidth: 2,
  overrides: [
    {
      // see: https://github.com/prettier-solidity/prettier-plugin-solidity#configuration-file
      files: "*.sol",
      options: {
        compiler: "0.8.9",
        printWidth: 120,
        tabWidth: 4,
        useTabs: false,
        singleQuote: false,
        bracketSpacing: false,
      },
    },
  ],
};
