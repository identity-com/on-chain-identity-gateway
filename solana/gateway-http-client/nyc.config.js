module.exports = {
  clean: true,
  cache: false,
  'check-coverage': true,
  reporter: 'lcov',
  all: true,
  lines: 85,
  functions: 78,
  statements: 85,
  branches: 73,
  include: ['src/**'],
  reportDir: `${__dirname}/coverage`,
};
