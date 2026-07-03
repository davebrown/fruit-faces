module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./src/__mocks__/setup.js'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/src/__mocks__/styleMock.js'
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  }
};
