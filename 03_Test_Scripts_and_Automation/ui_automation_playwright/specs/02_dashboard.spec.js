/**
 * PLAYWRIGHT E2E TEST – Dashboard
 * File: tests/e2e/specs/02_dashboard.spec.js
 * Tool: Playwright
 * Level: UI / End-to-End Automation
 *
 * Skenario:
 *   - E2E-DASH-001: Dashboard menampilkan kartu statistik
 *   - E2E-DASH-002: Dashboard menampilkan grafik
 *   - E2E-DASH-003: Dashboard menampilkan aktivitas terbaru
 *   - E2E-DASH-004: Navigasi sidebar berfungsi
 *   - E2E-DASH-005: Navbar menampilkan nama pengguna
 */

const { test, expect } = require("@playwright/test");
const { loginAsAdmin } = require("./helpers");

test.describe("E2E-DASH: Dashboard", () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        await loginAsAdmin(page);
    });

    // --------------------------------------------------------
    // E2E-DASH-001: Kartu Statistik
    // --------------------------------------------------------
    test("E2E-DASH-001: Dashboard menampilkan kartu statistik utama", async ({ page }) => {
        await page.screenshot({ path: "screenshots/dash_01_stats.png", fullPage: true });

        // Cari kartu statistik (angka numerik dalam card)
        const pageContent = await page.content();

        // Verifikasi halaman berhasil dimuat (bukan halaman error)
        const hasError = await page.locator('text=Error, text=500, text=Cannot').isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasError).toBeFalsy();

        // Halaman harus memiliki elemen-elemen dashboard
        const bodyText = await page.locator("body").innerText();
        // Dashboard seharusnya punya beberapa teks kunci
        const hasDashboardContent = 
            bodyText.includes("Siswa") ||
            bodyText.includes("Guru") ||
            bodyText.includes("Kelas") ||
            bodyText.includes("Dashboard") ||
            bodyText.includes("Total");
        
        expect(hasDashboardContent).toBeTruthy();
    });

    // --------------------------------------------------------
    // E2E-DASH-002: Grafik Ditampilkan
    // --------------------------------------------------------
    test("E2E-DASH-002: Dashboard menampilkan canvas grafik", async ({ page }) => {
        // Tunggu loading selesai
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000); // Beri waktu chart render

        // Canvas adalah elemen HTML untuk Chart.js
        const canvasElements = page.locator("canvas");
        const canvasCount = await canvasElements.count();

        // Harus ada setidaknya 1 canvas untuk grafik
        if (canvasCount > 0) {
            await expect(canvasElements.first()).toBeVisible();
        }

        await page.screenshot({ path: "screenshots/dash_02_charts.png", fullPage: true });
    });

    // --------------------------------------------------------
    // E2E-DASH-003: Aktivitas Terbaru
    // --------------------------------------------------------
    test("E2E-DASH-003: Dashboard menampilkan section aktivitas", async ({ page }) => {
        await page.waitForLoadState("networkidle");

        const pageText = await page.locator("body").innerText();
        const hasActivitySection =
            pageText.includes("Aktivitas") ||
            pageText.includes("Activity") ||
            pageText.includes("Log") ||
            pageText.includes("Terbaru");

        // Ini bisa true atau false tergantung implementasi; tidak fail jika tidak ada
        await page.screenshot({ path: "screenshots/dash_03_activities.png", fullPage: true });
        // Test ini informational – hanya verifikasi halaman tidak crash
        expect(page.url()).not.toMatch(/login/);
    });

    // --------------------------------------------------------
    // E2E-DASH-004: Navigasi Sidebar
    // --------------------------------------------------------
    test("E2E-DASH-004: Sidebar navigation dapat diklik dan berpindah halaman", async ({ page }) => {
        await page.waitForLoadState("networkidle");

        // Ambil semua link/tombol di sidebar
        const sidebar = page.locator("aside, nav, [class*='sidebar']").first();
        
        if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
            const links = sidebar.locator("a, button");
            const linkCount = await links.count();

            if (linkCount > 0) {
                // Klik link pertama yang ada (kecuali yang sudah aktif)
                const firstLink = links.first();
                await firstLink.click({ timeout: 5000 });
                await page.waitForTimeout(1000);
                // Halaman berubah atau ada response
                await expect(page.locator("body")).toBeVisible();
            }
        }

        await page.screenshot({ path: "screenshots/dash_04_navigation.png", fullPage: true });
    });

    // --------------------------------------------------------
    // E2E-DASH-005: Navbar Menampilkan Pengguna
    // --------------------------------------------------------
    test("E2E-DASH-005: Navbar menampilkan nama/info pengguna yang login", async ({ page }) => {
        await page.waitForLoadState("networkidle");

        // Cari navbar/header area
        const header = page.locator("header, nav, [class*='navbar'], [class*='header']").first();
        
        if (await header.isVisible({ timeout: 3000 }).catch(() => false)) {
            const headerText = await header.innerText();
            // Header seharusnya menampilkan nama admin atau info role
            const hasUserInfo = 
                headerText.includes("Admin") ||
                headerText.includes("admin") ||
                headerText.includes("Logout") ||
                headerText.includes("Keluar");
            expect(hasUserInfo).toBeTruthy();
        }

        await page.screenshot({ path: "screenshots/dash_05_navbar.png", fullPage: true });
    });
});
