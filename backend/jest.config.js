/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true, // Automatically clears mock calls and instances between every test
  setupFilesAfterEnv: ["<rootDir>/tests/__mocks__/prismaMock.ts"], // Loads our fake database before tests
};
