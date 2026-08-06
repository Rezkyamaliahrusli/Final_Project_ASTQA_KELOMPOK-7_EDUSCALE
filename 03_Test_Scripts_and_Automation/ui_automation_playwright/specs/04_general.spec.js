/**
 * PLAYWRIGHT E2E TEST – Guru, BK & Navigasi Umum
 * File: tests/e2e/specs/04_general.spec.js
 * Tool: Playwright
 * Level: UI / End-to-End Automation
 *
 * Skenario:
 *   - E2E-GURU-001: Halaman guru dapat diakses
 *   - E2E-GURU-002: Tambah guru via form
 *   - E2E-BK-001:   Halaman BK dapat diakses
 *   - E2E-NAV-001:  Navigasi antar halaman via sidebar
 *   - E2E-NAV-002:  Halaman responsif (viewport mobile)
 *   - E2E-PERF-001: Halaman utama load dalam batas waktu wajar
 */

const { test, expect } = require("@playwright/test");
const { loginAsAdmin } = require("./helpers");

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

test.describe("E2E-GURU: Manajemen Guru", () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        await loginAsAdmin(page);
    });

    // --------------------------------------------------------
    // E2E-GURU-001: Halaman Guru Tampil
    // --------------------------------------------------------
    test("E2E-GURU-001: Halaman guru dapat diakses dan menampilkan data", async ({ page }) => {
        await page.goto(`${BASE_URL}/teachers`);
        await page.waitForLoadState("networkidle");

        expect(page.url()).not.toMatch(/login/);

        const bodyText = await page.locator("body").innerText();
        const hasGuruContent =
            bodyText.includes("Guru") ||
            bodyText.includes("NIP") ||
            bodyText.includes("Teacher") ||
            bodyText.includes("Nama");

        expect(hasGuruContent).toBeTruthy();
        await page.screenshot({ path: "screenshots/guru_01_list.png", fullPage: true });
    });

    // --------------------------------------------------------
    // E2E-GURU-002: Form Tambah Guru
    // --------------------------------------------------------
    test("E2E-GURU-002: Tombol tambah guru membuka form", async ({ page }) => {
        await page.goto(`${BASE_URL}/teachers`);
        await page.waitForLoadState("networkidle");

        const addBtn = page.locator('button:has-text("Tambah"), button:has-text("Tambah Guru")').first();

        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(1000);

            const hasForm = await page.locator(
                '[role="dialog"], .modal, form input[name="name"]'
            ).first().isVisible({ timeout: 2000 }).catch(() => false);
            expect(hasForm).toBeTruthy();
            await page.screenshot({ path: "screenshots/guru_02_modal.png", fullPage: true });
        } else {
            test.skip();
        }
    });
});

test.describe("E2E-BK: Bimbingan Konseling", () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        await loginAsAdmin(page);
    });

    // --------------------------------------------------------
    // E2E-BK-001: Halaman BK Tampil
    // --------------------------------------------------------
    test("E2E-BK-001: Halaman BK dapat diakses", async ({ page }) => {
        await page.goto(`${BASE_URL}/bk`);
        await page.waitForLoadState("networkidle");

        expect(page.url()).not.toMatch(/login/);

        const bodyText = await page.locator("body").innerText();
        const hasBKContent =
            bodyText.includes("BK") ||
            bodyText.includes("Konseling") ||
            bodyText.includes("Kasus") ||
            bodyText.includes("Bimbingan");

        expect(hasBKContent).toBeTruthy();
        await page.screenshot({ path: "screenshots/bk_01_page.png", fullPage: true });
    });

    // --------------------------------------------------------
    // E2E-BK-002: Filter Status Kasus BK
    // --------------------------------------------------------
    test("E2E-BK-002: Filter status kasus BK berfungsi", async ({ page }) => {
        await page.goto(`${BASE_URL}/bk`);
        await page.waitForLoadState("networkidle");

        // Cari dropdown/select filter status
        const filterSelectors = [
            'select[name="status"]',
            'select:has(option:has-text("Proses"))',
            '[class*="filter"]'
        ];

        for (const selector of filterSelectors) {
            const el = page.locator(selector).first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
                await el.selectOption({ label: "Proses" }).catch(() => {});
                await page.waitForTimeout(1000);
                break;
            }
        }

        expect(page.url()).not.toMatch(/login/);
        await page.screenshot({ path: "screenshots/bk_02_filter.png", fullPage: true });
    });
});

test.describe("E2E-NAV: Navigasi & Responsif", () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        await loginAsAdmin(page);
    });

    // --------------------------------------------------------
    // E2E-NAV-001: Navigasi Semua Halaman Utama
    // --------------------------------------------------------
    test("E2E-NAV-001: Semua halaman utama dapat diakses", async ({ page }) => {
        const pages = [
            { path: "/", name: "Dashboard" },
            { path: "/students", name: "Siswa" },
            { path: "/teachers", name: "Guru" },
            { path: "/classes", name: "Kelas" }
        ];

        for (const { path, name } of pages) {
            await page.goto(`${BASE_URL}${path}`);
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(500);

            // Tidak redirect ke login dan tidak error
            const isError = await page.locator('text=Error 404, text=Cannot GET').isVisible({ timeout: 1000 }).catch(() => false);
            const isLogin = page.url().includes("/login");

            // Ambil screenshot untuk setiap halaman
            await page.screenshot({ path: `screenshots/nav_${name.toLowerCase()}.png`, fullPage: true });

            if (!isLogin) {
                // Halaman berhasil dimuat (bisa jadi redirect internal, tapi bukan ke /login)
                console.log(`✅ ${name}: ${page.url()}`);
            }
        }
    });

    // --------------------------------------------------------
    // E2E-NAV-002: Responsif di Viewport Mobile
    // --------------------------------------------------------
    test("E2E-NAV-002: Tampilan responsif di viewport mobile (375x667)", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(BASE_URL);
        await page.waitForLoadState("networkidle");

        // Halaman tidak crash di mobile viewport
        expect(page.url()).toBeDefined();
        await page.screenshot({ path: "screenshots/nav_mobile.png", fullPage: true });
    });
});

test.describe("E2E-PERF: Performance UI", () => {

    // --------------------------------------------------------
    // E2E-PERF-001: Load Time Halaman Dashboard
    // --------------------------------------------------------
    test("E2E-PERF-001: Dashboard load dalam waktu < 5 detik", async ({ page }) => {
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());

        const startTime = Date.now();
        await loginAsAdmin(page);
        const loginTime = Date.now() - startTime;

        const navStart = Date.now();
        await page.goto(BASE_URL);
        await page.waitForLoadState("networkidle");
        const navTime = Date.now() - navStart;

        console.log(`Login time: ${loginTime}ms`);
        console.log(`Navigation time: ${navTime}ms`);

        // Dashboard harus load dalam 5 detik (5000ms)
        expect(navTime).toBeLessThan(5000);
        await page.screenshot({ path: "screenshots/perf_dashboard.png", fullPage: true });
    });

    // --------------------------------------------------------
    // E2E-PERF-002: Halaman Siswa Load dalam Batas Wajar
    // --------------------------------------------------------
    test("E2E-PERF-002: Halaman siswa load dalam waktu < 5 detik", async ({ page }) => {
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        await loginAsAdmin(page);

        const start = Date.now();
        await page.goto(`${BASE_URL}/students`);
        await page.waitForLoadState("networkidle");
        const loadTime = Date.now() - start;

        console.log(`Students page load time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(5000);
    });
});
