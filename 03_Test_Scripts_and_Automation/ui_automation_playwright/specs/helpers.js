/**
 * Playwright Helpers – Shared Utilities
 * File: tests/e2e/specs/helpers.js
 */

const { expect } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const ADMIN_EMAIL = "admin@eduscale.id";
const ADMIN_PASSWORD = "admin123";

/**
 * Login ke aplikasi sebagai Admin
 * @param {import('@playwright/test').Page} page
 */
async function loginAsAdmin(page) {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(/login/);

    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', ADMIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Masuk")');

    // Tunggu redirect ke dashboard
    await page.waitForURL((url) => !url.href.includes("/login"), { timeout: 10000 });
}

/**
 * Logout dari aplikasi
 * @param {import('@playwright/test').Page} page
 */
async function logout(page) {
    // Coba berbagai selector untuk tombol logout
    const logoutSelectors = [
        'button:has-text("Logout")',
        'button:has-text("Keluar")',
        '[data-testid="logout"]',
        'text=Logout',
        'text=Keluar'
    ];

    for (const selector of logoutSelectors) {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await el.click();
            break;
        }
    }
}

/**
 * Navigasi ke halaman tertentu via sidebar
 * @param {import('@playwright/test').Page} page
 * @param {string} pageName - Nama menu (e.g., "Siswa", "Guru")
 */
async function navigateTo(page, pageName) {
    await page.click(`text=${pageName}`, { timeout: 5000 });
    await page.waitForLoadState("networkidle");
}

module.exports = { loginAsAdmin, logout, navigateTo, BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD };
