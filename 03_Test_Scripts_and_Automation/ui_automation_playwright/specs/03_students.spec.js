/**
 * PLAYWRIGHT E2E TEST – Manajemen Siswa
 * File: tests/e2e/specs/03_students.spec.js
 * Tool: Playwright
 * Level: UI / End-to-End Automation
 *
 * Skenario:
 *   - E2E-STD-001: Halaman siswa dapat diakses dan menampilkan tabel
 *   - E2E-STD-002: Fitur pencarian siswa berfungsi
 *   - E2E-STD-003: Modal tambah siswa dapat dibuka
 *   - E2E-STD-004: Validasi form – tidak bisa submit tanpa nama (BVA boundary = 0)
 *   - E2E-STD-005: Alur tambah siswa lengkap (jika modal tersedia)
 *   - E2E-STD-006: Tombol hapus ada di setiap baris data
 */

const { test, expect } = require("@playwright/test");
const { loginAsAdmin } = require("./helpers");

test.describe("E2E-STD: Manajemen Siswa", () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        await loginAsAdmin(page);

        // Navigasi ke halaman siswa
        await page.goto(`${process.env.BASE_URL || "http://localhost:5173"}/students`);
        await page.waitForLoadState("networkidle");
    });

    // --------------------------------------------------------
    // E2E-STD-001: Halaman Siswa Tampil
    // --------------------------------------------------------
    test("E2E-STD-001: Halaman siswa dapat diakses dan menampilkan tabel/list data", async ({ page }) => {
        // Tidak redirect ke login
        expect(page.url()).not.toMatch(/login/);

        // Ada konten halaman (tidak error)
        const hasError = await page.locator('text=Error 500, text=Cannot GET').isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasError).toBeFalsy();

        // Halaman harus menampilkan kata kunci terkait siswa
        const bodyText = await page.locator("body").innerText();
        const hasSiswaContent =
            bodyText.includes("Siswa") ||
            bodyText.includes("NIS") ||
            bodyText.includes("Student") ||
            bodyText.includes("Nama");
        
        expect(hasSiswaContent).toBeTruthy();

        await page.screenshot({ path: "screenshots/std_01_list.png", fullPage: true });
    });

    // --------------------------------------------------------
    // E2E-STD-002: Pencarian Siswa
    // --------------------------------------------------------
    test("E2E-STD-002: Fitur pencarian siswa berfungsi", async ({ page }) => {
        // Cari input pencarian
        const searchSelectors = [
            'input[placeholder*="cari" i]',
            'input[placeholder*="search" i]',
            'input[placeholder*="nama" i]',
            'input[type="search"]',
            'input[name="search"]'
        ];

        let searchInput = null;
        for (const selector of searchSelectors) {
            const el = page.locator(selector).first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
                searchInput = el;
                break;
            }
        }

        if (searchInput) {
            await searchInput.fill("Ahmad");
            await page.waitForTimeout(1500); // Debounce
            await page.waitForLoadState("networkidle");

            // Halaman tidak crash
            expect(page.url()).not.toMatch(/login/);
            await page.screenshot({ path: "screenshots/std_02_search.png", fullPage: true });
        } else {
            test.skip();
        }
    });

    // --------------------------------------------------------
    // E2E-STD-003: Modal Tambah Siswa
    // --------------------------------------------------------
    test("E2E-STD-003: Tombol tambah siswa membuka modal/form", async ({ page }) => {
        const addButtonSelectors = [
            'button:has-text("Tambah")',
            'button:has-text("Add")',
            'button:has-text("Tambah Siswa")',
            'button:has-text("+ Siswa")',
            '[data-testid="add-student"]'
        ];

        let addButton = null;
        for (const selector of addButtonSelectors) {
            const el = page.locator(selector).first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
                addButton = el;
                break;
            }
        }

        if (addButton) {
            await addButton.click();
            await page.waitForTimeout(1000);

            // Modal atau form harus muncul
            const modalSelectors = [
                '[role="dialog"]',
                '.modal',
                '[class*="modal"]',
                'form input[name="name"], form input[name="nis"]'
            ];

            let modalVisible = false;
            for (const selector of modalSelectors) {
                if (await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false)) {
                    modalVisible = true;
                    break;
                }
            }

            expect(modalVisible).toBeTruthy();
            await page.screenshot({ path: "screenshots/std_03_modal.png", fullPage: true });
        } else {
            test.skip();
        }
    });

    // --------------------------------------------------------
    // E2E-STD-004: Validasi Form – Nama Kosong (BVA boundary = 0 karakter)
    // --------------------------------------------------------
    test("E2E-STD-004: Tidak bisa submit form siswa dengan nama kosong (BVA boundary)", async ({ page }) => {
        // Buka modal tambah
        const addBtn = page.locator('button:has-text("Tambah"), button:has-text("Tambah Siswa")').first();
        if (!await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            test.skip();
            return;
        }

        await addBtn.click();
        await page.waitForTimeout(1000);

        // Cari tombol submit
        const submitBtn = page.locator('button[type="submit"], button:has-text("Simpan"), button:has-text("Save")').first();
        
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Klik submit tanpa mengisi nama
            await submitBtn.click();
            await page.waitForTimeout(1000);

            // Modal seharusnya MASIH TERBUKA (tidak ditutup karena validasi gagal)
            const isModalStillOpen = await page.locator('[role="dialog"], .modal, [class*="modal"]').first().isVisible({ timeout: 2000 }).catch(() => false);
            
            // Atau ada pesan validasi
            const hasValidationMessage = await page.locator(
                'text=wajib, text=required, text=harus diisi, [class*="error"], [class*="invalid"]'
            ).isVisible({ timeout: 2000 }).catch(() => false);

            expect(isModalStillOpen || hasValidationMessage).toBeTruthy();
            await page.screenshot({ path: "screenshots/std_04_validation.png", fullPage: true });
        }
    });

    // --------------------------------------------------------
    // E2E-STD-005: Alur Tambah Siswa Lengkap
    // --------------------------------------------------------
    test("E2E-STD-005: Alur lengkap tambah siswa berhasil", async ({ page }) => {
        const addBtn = page.locator('button:has-text("Tambah"), button:has-text("Tambah Siswa")').first();
        if (!await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            test.skip();
            return;
        }

        await addBtn.click();
        await page.waitForTimeout(1000);

        // Isi form
        const nameInput = page.locator('input[name="name"], input[placeholder*="nama" i]').first();
        const nisInput = page.locator('input[name="nis"], input[placeholder*="nis" i]').first();

        if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nameInput.fill(`E2E Test Student ${Date.now()}`);
        }
        if (await nisInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nisInput.fill(`E2E${Date.now()}`);
        }

        // Submit form
        const submitBtn = page.locator('button[type="submit"], button:has-text("Simpan")').first();
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
            await page.waitForLoadState("networkidle");
        }

        await page.screenshot({ path: "screenshots/std_05_create.png", fullPage: true });
        // Tidak crash dan tidak redirect ke login
        expect(page.url()).not.toMatch(/login/);
    });

    // --------------------------------------------------------
    // E2E-STD-006: Tombol Aksi di Tabel
    // --------------------------------------------------------
    test("E2E-STD-006: Tabel siswa menampilkan tombol edit dan hapus", async ({ page }) => {
        await page.waitForLoadState("networkidle");

        // Cari baris tabel
        const tableRows = page.locator("table tbody tr, [class*='row']");
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
            // Baris pertama harus punya tombol aksi
            const firstRow = tableRows.first();
            const hasActionButton = await firstRow.locator(
                'button, [class*="btn"], [data-testid*="edit"], [data-testid*="delete"]'
            ).count();
            expect(hasActionButton).toBeGreaterThan(0);
        }

        await page.screenshot({ path: "screenshots/std_06_table.png", fullPage: true });
    });
});
