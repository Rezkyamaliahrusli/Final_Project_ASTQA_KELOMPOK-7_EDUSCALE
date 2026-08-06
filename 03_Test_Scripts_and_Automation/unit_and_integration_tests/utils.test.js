/**
 * UNIT TEST – Utility Functions
 * File: tests/unit/utils.test.js
 * Framework: Jest
 * Level: Unit Testing
 */

const jwt = require("jsonwebtoken");

// Set JWT secret untuk testing
process.env.JWT_SECRET = "test_secret_key_eduscale";

const generateToken = require("../../src/utils/generateToken");

// ============================================================
// TEST SUITE: generateToken
// ============================================================
describe("generateToken", () => {
    const mockUser = {
        id: 1,
        email: "admin@eduscale.id",
        role_id: 1
    };

    test("UT-001: harus menghasilkan string token", () => {
        const token = generateToken(mockUser);
        expect(typeof token).toBe("string");
        expect(token.length).toBeGreaterThan(0);
    });

    test("UT-002: token harus bisa di-decode dengan secret yang benar", () => {
        const token = generateToken(mockUser);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.id).toBe(mockUser.id);
        expect(decoded.email).toBe(mockUser.email);
        expect(decoded.role_id).toBe(mockUser.role_id);
    });

    test("UT-003: token harus memiliki expiry (iat dan exp)", () => {
        const token = generateToken(mockUser);
        const decoded = jwt.decode(token);
        expect(decoded.iat).toBeDefined();
        expect(decoded.exp).toBeDefined();
        expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test("UT-004: token harus expire dalam ~1 hari", () => {
        const token = generateToken(mockUser);
        const decoded = jwt.decode(token);
        const diffSeconds = decoded.exp - decoded.iat;
        // 1 hari = 86400 detik (±5 detik toleransi)
        expect(diffSeconds).toBeGreaterThanOrEqual(86395);
        expect(diffSeconds).toBeLessThanOrEqual(86405);
    });

    test("UT-005: token dari user yang berbeda harus berbeda", () => {
        const token1 = generateToken({ id: 1, email: "a@a.com", role_id: 1 });
        const token2 = generateToken({ id: 2, email: "b@b.com", role_id: 2 });
        expect(token1).not.toBe(token2);
    });

    test("UT-006: token tidak valid jika diverifikasi dengan secret yang salah", () => {
        const token = generateToken(mockUser);
        expect(() => {
            jwt.verify(token, "wrong_secret");
        }).toThrow();
    });
});

// ============================================================
// TEST SUITE: Paginasi Logic
// ============================================================
describe("Paginasi Logic", () => {
    const calculatePagination = (page, limit, totalCount) => {
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(totalCount / limit);
        return { offset, totalPages };
    };

    test("UT-007: halaman 1 menghasilkan offset 0", () => {
        const { offset } = calculatePagination(1, 20, 100);
        expect(offset).toBe(0);
    });

    test("UT-008: halaman 2 menghasilkan offset sesuai limit", () => {
        const { offset } = calculatePagination(2, 20, 100);
        expect(offset).toBe(20);
    });

    test("UT-009: total halaman dihitung dengan benar", () => {
        const { totalPages } = calculatePagination(1, 20, 100);
        expect(totalPages).toBe(5);
    });

    test("UT-010: total halaman dibulatkan ke atas untuk sisa data", () => {
        const { totalPages } = calculatePagination(1, 20, 95);
        expect(totalPages).toBe(5);
    });

    test("UT-011: data kosong menghasilkan 0 total halaman", () => {
        const { totalPages } = calculatePagination(1, 20, 0);
        expect(totalPages).toBe(0);
    });
});

// ============================================================
// TEST SUITE: Password Validation Logic
// ============================================================
describe("Password Validation Logic", () => {
    const bcrypt = require("bcrypt");

    test("UT-012: password ter-hash tidak sama dengan password asli", async () => {
        const plain = "password123";
        const hashed = await bcrypt.hash(plain, 10);
        expect(hashed).not.toBe(plain);
    });

    test("UT-013: bcrypt.compare harus return true untuk password yang cocok", async () => {
        const plain = "password123";
        const hashed = await bcrypt.hash(plain, 10);
        const result = await bcrypt.compare(plain, hashed);
        expect(result).toBe(true);
    });

    test("UT-014: bcrypt.compare harus return false untuk password yang tidak cocok", async () => {
        const plain = "password123";
        const hashed = await bcrypt.hash(plain, 10);
        const result = await bcrypt.compare("wrongpassword", hashed);
        expect(result).toBe(false);
    });

    test("UT-015: hash yang berbeda dihasilkan untuk salt berbeda (bcrypt randomness)", async () => {
        const plain = "samepassword";
        const hash1 = await bcrypt.hash(plain, 10);
        const hash2 = await bcrypt.hash(plain, 10);
        expect(hash1).not.toBe(hash2);
        // Keduanya tetap harus valid
        const r1 = await bcrypt.compare(plain, hash1);
        const r2 = await bcrypt.compare(plain, hash2);
        expect(r1).toBe(true);
        expect(r2).toBe(true);
    });
});

// ============================================================
// TEST SUITE: Input Validation Logic
// ============================================================
describe("Input Validation Logic", () => {
    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validateRequired = (value) => {
        return value !== null && value !== undefined && value.toString().trim().length > 0;
    };

    test("UT-016: email valid harus lolos validasi", () => {
        expect(validateEmail("admin@eduscale.id")).toBe(true);
        expect(validateEmail("guru@sekolah.com")).toBe(true);
    });

    test("UT-017: email tidak valid harus gagal validasi", () => {
        expect(validateEmail("notanemail")).toBe(false);
        expect(validateEmail("@domain.com")).toBe(false);
        expect(validateEmail("user@")).toBe(false);
        expect(validateEmail("")).toBe(false);
    });

    test("UT-018: nilai required yang valid harus lolos", () => {
        expect(validateRequired("John")).toBe(true);
        expect(validateRequired("123")).toBe(true);
    });

    test("UT-019: nilai kosong harus gagal validasi required", () => {
        expect(validateRequired("")).toBe(false);
        expect(validateRequired("   ")).toBe(false);
        expect(validateRequired(null)).toBe(false);
        expect(validateRequired(undefined)).toBe(false);
    });
});
