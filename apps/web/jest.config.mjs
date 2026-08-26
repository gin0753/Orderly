import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  clearMocks: true,
  roots: ["<rootDir>/test"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/test/browser/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
});
