/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  // Sets process.env (DATABASE_URL, JWT secrets) before any module imports env.
  setupFiles: ["<rootDir>/src/test/setupEnv.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/index.ts",
    "!src/test/**",
  ],
};
