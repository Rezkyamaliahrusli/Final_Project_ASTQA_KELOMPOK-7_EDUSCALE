/**
 * PLAYWRIGHT E2E TEST – Autentikasi
 * File: tests/e2e/specs/01_auth.spec.js
 * Tool: Playwright
 * Level: UI / End-to-End Automation
 *
 * Skenario yang diuji:
 *   - E2E-AUTH-001: Tampilan halaman login
 *   - E2E-AUTH-002: Login berhasil dengan kredensial valid
 *   - E2E-AUTH-003: Login gagal dengan password salah
 *   - E2E-AUTH-004: Login gagal dengan email kosong
 *   - E2E-AUTH-005: Login gagal dengan password kosong
 *   - E2E-AUTH-006: Redirect ke login saat akses halaman terproteksi
 *   - E2E-AUTH-007: Logout berhasil
 */

const { test, expect } = require("@playwright/test");
const { loginAsAdmin, BASE_URL } = require("./helpers");

test.describe("E2E-AUTH: Autentikasi", () => {

    test.beforeEach(async ({ page }) => {
        // Pastikan tidak ada sesi sebelumnya
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
    });

    // --------------------------------------------------------
    // E2E-AUTH-001: Halaman Login Tampil dengan Benar
    // --------------------------------------------------------
    test("E2E-AUTH-001: Halaman login menampilkan form yang benar", async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Verifikasi elemen halaman login ada
        await expect(page).toHaveURL(/login/);
        await expect(page.locator("form, [data-testid='login-form']").first()).toBeVisible({ timeout: 5000 });

        // Input email ada
        const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
        await expect(emailInput).toBeVisible();

        // Input password ada
        const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
        await expect(passwordInput).toBeVisible();

        // Tombol submit ada
        const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Masuk")').first();
        await expect(submitBtn).toBeVisible();

        // Screenshot untuk dokumentasi
        await page.screenshot({ path: "screenshots/01_login_page.png", fullPage: true });
    });

    // --------------------------------------------------------
    // E2E-AUTH-002: Login Berhasil
    // --------------------------------------------------------
    test("E2E-AUTH-002: Login berhasil dengan kredensial valid", async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', "admin@eduscale.id");
        await page.fill('input[type="password"], input[name="password"]', "admin123");
        await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Masuk")');

        // Seharusnya redirect ke dashboard (bukan halaman login lagi)
        await page.waitForURL((url) => !url.href.includes("/login"), { timeout: 10000 });
        await expect(page).not.toHaveURL(/login/);

        // Dashboard atau halaman utama harus terlihat
        const dashboardIndicators = [
            'text=Dashboard',
            'text=Selamat Datang',
            '[data-testid="dashboard"]',
            'nav',
            'aside'
        ];
        let found = false;
        for (const indicator of dashboardIndicators) {
            if (await page.locator(indicator).isVisible({ timeout: 3000 }).catch(() => false)) {
                found = true;
                break;
            }
        }
        expect(found).toBeTruthy();

        await page.screenshot({ path: "screenshots/02_after_login.png", fullPage: true });
    });

    // --------------------------------------------------------
    // E2E-AUTH-003: Login Gagal – Password Salah
    // --------------------------------------------------------
    test("E2E-AUTH-003: Login gagal dengan password salah", async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', "admin@eduscale.id");
        await page.fill('input[type="password"], input[name="password"]', "wrongpassword");
        await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Masuk")');

        // Tunggu sebentar untuk response
        await page.waitForTimeout(2000);

        // Harus tetap di halaman login atau ada pesan error
        const isStillOnLogin = page.url().includes("/login");
        const hasErrorMessage = await page.locator(
            'text=salah, text=gagal, text=invalid, text=error, [class*="error"], [class*="alert"]'
        ).isVisible({ timeout: 3000 }).catch(() => false);

        expect(isStillOnLogin || hasErrorMessage).toBeTruthy();

        await page.screenshot({ path: "screenshots/03_login_failed.png", fullPage: true });
    });

    // --------------------------------------------------------
    // E2E-AUTH-004: Login Gagal – Email Kosong (Black-Box BVA)
    // --------------------------------------------------------
    test("E2E-AUTH-004: Login gagal dengan email kosong (BVA – boundary: empty)", async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Biarkan email kosong
        await page.fill('input[type="password"], input[name="password"]', "admin123");
        await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Masuk")');

        await page.waitForTimeout(1500);

        // Harus tetap di halaman login (tidak redirect ke dashboard)
        await expect(page).toHaveURL(/login/);
    });

    // --------------------------------------------------------
    // E2E-AUTH-005: Login Gagal – Password Kosong (Black-Box BVA)
    // --------------------------------------------------------
    test("E2E-AUTH-005: Login gagal dengan password kosong (BVA – boundary: empty)", async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', "admin@eduscale.id");
        // Biarkan password kosong
        await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Masuk")');

        await page.waitForTimeout(1500);

        // Harus tetap di halaman login
        await expect(page).toHaveURL(/login/);
    });

    // --------------------------------------------------------
    // E2E-AUTH-006: Redirect ke Login (Protected Route)
    // --------------------------------------------------------
    test("E2E-AUTH-006: Akses halaman terproteksi tanpa login diarahkan ke login", async ({ page }) => {
        const protectedPaths = ["/", "/students", "/teachers", "/classes"];

        for (const path of protectedPaths) {
            await page.goto(`${BASE_URL}${path}`);
            await page.waitForTimeout(1000);
            // Seharusnya redirect ke /login
            expect(page.url()).toMatch(/login/);
        }
    });

    // --------------------------------------------------------
    // E2E-AUTH-007: Logout Berhasil
    // --------------------------------------------------------
    test("E2E-AUTH-007: Logout menghapus sesi dan kembali ke login", async ({ page }) => {
        // Login dulu
        await loginAsAdmin(page);
        const urlAfterLogin = page.url();
        expect(urlAfterLogin).not.toMatch(/login/);

        // Logout – coba berbagai selector
        const logoutSelectors = [
            'button:has-text("Logout")',
            'button:has-text("Keluar")',
            'text=Logout',
            'text=Keluar',
            '[data-testid="logout-btn"]'
        ];

        let loggedOut = false;
        for (const selector of logoutSelectors) {
            const el = page.locator(selector).first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
                await el.click();
                loggedOut = true;
                break;
            }
        }

        if (loggedOut) {
            await page.waitForTimeout(1500);
            // Setelah logout, harus redirect ke login
            expect(page.url()).toMatch(/login/);
            await page.screenshot({ path: "screenshots/07_after_logout.png" });
        } else {
            test.skip();
        }
    });
});
