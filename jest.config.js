/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-file-system$': '<rootDir>/tests/mocks/expo-file-system.js',
    '^expo-sqlite$': '<rootDir>/tests/mocks/expo-sqlite.js',
  },
  testMatch: [
    '**/tests/**/*.test.(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
  setupFilesAfterEnv: [],
  verbose: true,
};

