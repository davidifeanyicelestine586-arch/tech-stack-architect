export default {
  testDir: ".",
  testMatch: "scripts/header-collision-audit.spec.mjs",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3000",
    headless: true,
  },
};
