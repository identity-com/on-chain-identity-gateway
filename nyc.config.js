module.exports = {
  clean: true,
  cache: false,
  'check-coverage': true,
  reporter: 'lcov',
  all: true,
  lines: 100,
  functions: 100,
  statements: 100,
  branches: 86,
  include: ['src/**'],
  reportDir: `${__dirname}/coverage`,
};
