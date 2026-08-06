// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * Playwright Configuration – EduScale E2E Tests
 * Dokumentasi: https://playwright.dev/docs/test-configuration
 *
 * Cara menjalankan:
 *   cd tests/e2e
 *   npm install
 *   npx playwright install chromium
 *   npm test                      # Jalankan semua E2E tests
 *   npm run test:headed           # Jalankan dengan browser terlihat
 *   npm run test:report           # Buka HTML report
 */

module.exports = defineConfig({
    testDir: "./specs",
    timeout: 30000,
    expect: { timeout: 5000 },
    fullyParallel: false,       // Sequential untuk menghindari konflik state
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: 1,                 // 1 worker (sequential execution)
    reporter: [
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["list"],
        ["json", { outputFile: "playwright-report/results.json" }]
    ],
    use: {
        baseURL: process.env.BASE_URL || "http://localhost:5173",
        headless: true,
        viewport: { width: 1280, height: 720 },
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        trace: "retain-on-failure",
        actionTimeout: 10000,
        navigationTimeout: 15000
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] }
        },
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] }
        }
    ]
});
