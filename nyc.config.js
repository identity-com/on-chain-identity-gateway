module.exports = {
  clean: true,
  cache: false,
  'check-coverage': true,
  reporter: 'lcov',
  all: true,
  lines: 100,
  functions: 100, // coverage is actually higher than this, there is a yarn/nyc issue
  statements: 100,
  branches: 84,
  include: ["src/**"],
  reportDir: `${__dirname}/coverage`,
};
