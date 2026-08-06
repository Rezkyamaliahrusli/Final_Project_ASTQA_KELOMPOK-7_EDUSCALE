/**
 * BLACK-BOX TESTING – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
 * File: tests/blackbox/blackbox.test.js
 * Framework: Jest + Supertest
 * Level: Black-Box Testing
 *
 * Teknik:
 *   - EP  (Equivalence Partitioning): Membagi input menjadi kelas ekivalen
 *           valid dan tidak valid, lalu menguji satu wakil dari setiap kelas.
 *   - BVA (Boundary Value Analysis): Menguji nilai tepat di batas, satu di
 *           atas batas, dan satu di bawah batas dari setiap partisi.
 *
 * Modul yang diuji:
 *   1. Login (email & password)
 *   2. Register (name, email, password, role_id)
 *   3. Paginasi (page, limit)
 *   4. Tambah Siswa (name, NIS, status)
 *   5. Tambah Guru (name, NIP)
 *   6. BK Case (status, student_id)
 */

process.env.JWT_SECRET = "test_secret_key_eduscale";
process.env.NODE_ENV = "test";

const request = require("supertest");
const express = require("express");
const generateToken = require("../../src/utils/generateToken");
const authMiddleware = require("../../src/middleware/authMiddleware");

// ============================================================
// SETUP TEST APP (in-memory)
// ============================================================
const buildApp = () => {
    const app = express();
    app.use(express.json({ limit: "10mb" }));

    const db = {
        users: [{ id: 1, name: "Admin", email: "admin@eduscale.id", role_id: 1 }],
        students: [],
        teachers: [],
        bkCases: []
    };

    const bcrypt = require("bcrypt");

    // AUTH – Login
    app.post("/api/auth/login", async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Field wajib diisi" });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: "Format email tidak valid" });
        if (password.length < 6) return res.status(400).json({ message: "Password minimal 6 karakter" });

        if (email === "admin@eduscale.id" && password === "admin123") {
            const token = generateToken({ id: 1, email, role_id: 1 });
            return res.json({ message: "Login berhasil", token, user: { id: 1, name: "Admin", email } });
        }
        return res.status(401).json({ message: "Email atau password salah" });
    });

    // AUTH – Register
    app.post("/api/auth/register", async (req, res) => {
        const { name, email, password, role_id } = req.body;
        if (!name || name.trim().length === 0) return res.status(400).json({ message: "Nama wajib diisi" });
        if (name.length > 100) return res.status(400).json({ message: "Nama terlalu panjang (maks 100 karakter)" });
        if (!email) return res.status(400).json({ message: "Email wajib diisi" });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: "Format email tidak valid" });
        if (!password || password.length < 6) return res.status(400).json({ message: "Password minimal 6 karakter" });
        if (password.length > 72) return res.status(400).json({ message: "Password terlalu panjang" });
        if (!role_id || role_id < 1 || role_id > 3) return res.status(400).json({ message: "Role tidak valid" });
        if (db.users.find((u) => u.email === email)) return res.status(400).json({ message: "Email sudah digunakan" });

        const newUser = { id: db.users.length + 1, name, email, role_id };
        db.users.push(newUser);
        return res.status(201).json({ message: "User berhasil dibuat", user: newUser });
    });

    // STUDENTS
    app.post("/api/students", authMiddleware, (req, res) => {
        const { name, nis, status } = req.body;
        if (!name || name.trim().length === 0) return res.status(400).json({ message: "Nama wajib diisi" });
        if (name.length > 100) return res.status(400).json({ message: "Nama terlalu panjang" });
        if (nis && (nis.length < 3 || nis.length > 20)) return res.status(400).json({ message: "NIS harus 3-20 karakter" });
        const validStatuses = ["Aktif", "Lulus", "Pindah", "Keluar"];
        if (status && !validStatuses.includes(status)) return res.status(400).json({ message: "Status tidak valid" });
        if (nis && db.students.find((s) => s.nis === nis)) return res.status(400).json({ message: "NIS sudah terdaftar" });

        const s = { id: db.students.length + 1, name, nis, status: status || "Aktif" };
        db.students.push(s);
        res.status(201).json({ message: "Siswa berhasil ditambahkan", student: s });
    });

    app.get("/api/students", authMiddleware, (req, res) => {
        const rawPage = req.query.page;
        const rawLimit = req.query.limit;
        const page = rawPage !== undefined ? parseInt(rawPage) : 1;
        const limit = rawLimit !== undefined ? parseInt(rawLimit) : 20;
        if (rawPage !== undefined && (isNaN(page) || page < 1)) return res.status(400).json({ message: "Page minimal 1" });
        if (rawLimit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) return res.status(400).json({ message: "Limit harus antara 1-100" });

        const offset = (page - 1) * limit;
        const data = db.students.slice(offset, offset + limit);
        res.json({ data, total: db.students.length, page, totalPages: Math.ceil(db.students.length / limit) });
    });

    // TEACHERS
    app.post("/api/teachers", authMiddleware, (req, res) => {
        const { name, nip } = req.body;
        if (!name || name.trim().length === 0) return res.status(400).json({ message: "Nama wajib diisi" });
        if (nip && (nip.length !== 18)) return res.status(400).json({ message: "NIP harus 18 digit" });
        const t = { id: db.teachers.length + 1, name, nip };
        db.teachers.push(t);
        res.status(201).json({ message: "Guru berhasil ditambahkan", teacher: t });
    });

    // BK CASES
    app.post("/api/bk/cases", authMiddleware, (req, res) => {
        const { student_id, status } = req.body;
        if (!student_id) return res.status(400).json({ message: "student_id wajib diisi" });
        const validStatuses = ["Proses", "Selesai"];
        if (status && !validStatuses.includes(status)) return res.status(400).json({ message: "Status tidak valid" });
        const c = { id: db.bkCases.length + 1, student_id, status: status || "Proses", ...req.body };
        db.bkCases.push(c);
        res.status(201).json({ message: "Kasus BK berhasil ditambahkan", data: c });
    });

    return app;
};

// ============================================================
// SHARED HELPERS
// ============================================================
const getToken = () => generateToken({ id: 1, email: "admin@eduscale.id", role_id: 1 });
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

// ============================================================
// ┌─────────────────────────────────────────────────────────┐
// │   MODUL 1: LOGIN – EP & BVA                             │
// └─────────────────────────────────────────────────────────┘
//
// Equivalence Partitioning – Email:
//   EP1 (valid)  : format email valid, terdaftar  → 200
//   EP2 (invalid): format email salah (bukan email) → 400
//   EP3 (invalid): email kosong/null               → 400
//   EP4 (valid fmt, tidak terdaftar)               → 401
//
// Equivalence Partitioning – Password:
//   EP5 (valid)  : password ≥ 6 karakter & cocok  → 200
//   EP6 (invalid): password < 6 karakter           → 400
//   EP7 (valid panjang, salah)                     → 401
//
// BVA – Password length (batas minimum = 6):
//   BVA1: panjang 5 (di bawah batas) → 400
//   BVA2: panjang 6 (tepat batas)    → 401 atau 200
//   BVA3: panjang 7 (di atas batas)  → 401 atau 200
// ============================================================
describe("BB-01: Login – Equivalence Partitioning & BVA", () => {
    const app = buildApp();

    // --- EP Tests ---
    describe("EP – Email", () => {
        test("BB-EP-001: EP1 – email valid & terdaftar, password benar → 200", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@eduscale.id",
                password: "admin123"
            });
            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
        });

        test("BB-EP-002: EP2 – format email tidak valid → 400", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "bukan_email",
                password: "admin123"
            });
            expect(res.status).toBe(400);
        });

        test("BB-EP-003: EP2 – email tanpa domain → 400", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@",
                password: "admin123"
            });
            expect(res.status).toBe(400);
        });

        test("BB-EP-004: EP3 – email kosong → 400", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "",
                password: "admin123"
            });
            expect(res.status).toBe(400);
        });

        test("BB-EP-005: EP4 – email valid tapi tidak terdaftar → 401", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "tidakterdaftar@eduscale.id",
                password: "admin123"
            });
            expect(res.status).toBe(401);
        });
    });

    describe("EP – Password", () => {
        test("BB-EP-006: EP6 – password < 6 karakter → 400", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@eduscale.id",
                password: "12345"
            });
            expect(res.status).toBe(400);
        });

        test("BB-EP-007: EP7 – password ≥ 6 karakter tapi salah → 401", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@eduscale.id",
                password: "wrongpassword"
            });
            expect(res.status).toBe(401);
        });

        test("BB-EP-008: EP3 – password kosong → 400", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@eduscale.id",
                password: ""
            });
            expect(res.status).toBe(400);
        });
    });

    describe("BVA – Password Length (batas min = 6 karakter)", () => {
        test("BB-BVA-001: password 5 karakter (di bawah batas) → 400", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@eduscale.id",
                password: "12345"  // length = 5
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/6/);
        });

        test("BB-BVA-002: password 6 karakter (tepat batas minimum) → tidak 400 (diterima format)", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@eduscale.id",
                password: "123456"  // length = 6, valid format
            });
            // Format valid (≥6), tapi password salah → 401 (bukan 400)
            expect(res.status).toBe(401);
        });

        test("BB-BVA-003: password 7 karakter (di atas batas) → tidak 400 (diterima format)", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@eduscale.id",
                password: "1234567"  // length = 7
            });
            expect(res.status).toBe(401);
        });

        test("BB-BVA-004: password KOSONG (nol karakter, di bawah batas) → 400", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@eduscale.id",
                password: ""  // length = 0
            });
            expect(res.status).toBe(400);
        });

        test("BB-BVA-005: password tepat benar (admin123 = 8 karakter) → 200", async () => {
            const res = await request(app).post("/api/auth/login").send({
                email: "admin@eduscale.id",
                password: "admin123"  // length = 8, benar
            });
            expect(res.status).toBe(200);
        });
    });
});

// ============================================================
// ┌─────────────────────────────────────────────────────────┐
// │   MODUL 2: REGISTER – EP & BVA                          │
// └─────────────────────────────────────────────────────────┘
//
// EP – Name:
//   EP1 (valid)  : nama 1-100 karakter            → 201
//   EP2 (invalid): nama kosong                    → 400
//   EP3 (invalid): nama > 100 karakter            → 400
//
// EP – Role ID:
//   EP4 (valid)  : role_id ∈ {1, 2, 3}           → 201
//   EP5 (invalid): role_id ∉ {1, 2, 3}           → 400
//
// BVA – Name length (batas: 1 min, 100 max):
//   BVA1: 0 karakter (di bawah min)               → 400
//   BVA2: 1 karakter (tepat min)                  → 201
//   BVA3: 2 karakter (di atas min)                → 201
//   BVA4: 99 karakter (di bawah max)              → 201
//   BVA5: 100 karakter (tepat max)                → 201
//   BVA6: 101 karakter (di atas max)              → 400
//
// BVA – Role ID (batas: 1 min, 3 max):
//   BVA7: role_id = 0 (di bawah min)              → 400
//   BVA8: role_id = 1 (tepat min)                 → 201
//   BVA9: role_id = 3 (tepat max)                 → 201
//   BVA10: role_id = 4 (di atas max)              → 400
// ============================================================
describe("BB-02: Register – Equivalence Partitioning & BVA", () => {
    let app;
    beforeEach(() => { app = buildApp(); }); // fresh app per test (fresh db)

    describe("EP – Name", () => {
        test("BB-EP-009: EP1 – nama valid (1-100 karakter) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "Budi Santoso",
                email: "budi@test.com",
                password: "password123",
                role_id: 2
            });
            expect(res.status).toBe(201);
        });

        test("BB-EP-010: EP2 – nama kosong → 400", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "",
                email: "test2@test.com",
                password: "password123",
                role_id: 2
            });
            expect(res.status).toBe(400);
        });

        test("BB-EP-011: EP3 – nama > 100 karakter → 400", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "A".repeat(101),
                email: "test3@test.com",
                password: "password123",
                role_id: 2
            });
            expect(res.status).toBe(400);
        });
    });

    describe("EP – Role ID", () => {
        test("BB-EP-012: EP4 – role_id = 1 (Admin) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "User Admin", email: "ua@test.com", password: "pass123", role_id: 1
            });
            expect(res.status).toBe(201);
        });

        test("BB-EP-013: EP4 – role_id = 2 (Guru) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "User Guru", email: "ug@test.com", password: "pass123", role_id: 2
            });
            expect(res.status).toBe(201);
        });

        test("BB-EP-014: EP4 – role_id = 3 (BK) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "User BK", email: "ubk@test.com", password: "pass123", role_id: 3
            });
            expect(res.status).toBe(201);
        });

        test("BB-EP-015: EP5 – role_id = 0 (tidak valid) → 400", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "User Invalid", email: "ui@test.com", password: "pass123", role_id: 0
            });
            expect(res.status).toBe(400);
        });

        test("BB-EP-016: EP5 – role_id = 99 (tidak valid) → 400", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "User Invalid", email: "ui2@test.com", password: "pass123", role_id: 99
            });
            expect(res.status).toBe(400);
        });
    });

    describe("BVA – Name Length (batas: min=1, max=100)", () => {
        test("BB-BVA-006: nama 0 karakter (di bawah min) → 400", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "", email: "bva1@test.com", password: "pass123", role_id: 2
            });
            expect(res.status).toBe(400);
        });

        test("BB-BVA-007: nama 1 karakter (tepat min) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "A", email: "bva2@test.com", password: "pass123", role_id: 2
            });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-008: nama 2 karakter (di atas min) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "AB", email: "bva3@test.com", password: "pass123", role_id: 2
            });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-009: nama 99 karakter (di bawah max) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "A".repeat(99), email: "bva4@test.com", password: "pass123", role_id: 2
            });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-010: nama 100 karakter (tepat max) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "A".repeat(100), email: "bva5@test.com", password: "pass123", role_id: 2
            });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-011: nama 101 karakter (di atas max) → 400", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "A".repeat(101), email: "bva6@test.com", password: "pass123", role_id: 2
            });
            expect(res.status).toBe(400);
        });
    });

    describe("BVA – Role ID (batas: min=1, max=3)", () => {
        test("BB-BVA-012: role_id = 0 (di bawah min) → 400", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "Test", email: "r0@test.com", password: "pass123", role_id: 0
            });
            expect(res.status).toBe(400);
        });

        test("BB-BVA-013: role_id = 1 (tepat min) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "Test", email: "r1@test.com", password: "pass123", role_id: 1
            });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-014: role_id = 3 (tepat max) → 201", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "Test", email: "r3@test.com", password: "pass123", role_id: 3
            });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-015: role_id = 4 (di atas max) → 400", async () => {
            const res = await request(app).post("/api/auth/register").send({
                name: "Test", email: "r4@test.com", password: "pass123", role_id: 4
            });
            expect(res.status).toBe(400);
        });
    });
});

// ============================================================
// ┌─────────────────────────────────────────────────────────┐
// │   MODUL 3: PAGINASI – BVA                               │
// └─────────────────────────────────────────────────────────┘
//
// BVA – Page (batas min = 1):
//   BVA1: page = 0 (di bawah min) → 400
//   BVA2: page = 1 (tepat min)    → 200
//   BVA3: page = 2 (di atas min)  → 200
//
// BVA – Limit (batas: min=1, max=100):
//   BVA4: limit = 0 (di bawah min)  → 400
//   BVA5: limit = 1 (tepat min)     → 200
//   BVA6: limit = 100 (tepat max)   → 200
//   BVA7: limit = 101 (di atas max) → 400
// ============================================================
describe("BB-03: Paginasi – Boundary Value Analysis", () => {
    const app = buildApp();
    const headers = authHeader();

    describe("BVA – Page Number", () => {
        test("BB-BVA-016: page = 0 (di bawah minimum) → 400", async () => {
            const res = await request(app).get("/api/students?page=0&limit=10").set("Authorization", headers.Authorization);
            expect(res.status).toBe(400);
        });

        test("BB-BVA-017: page = 1 (tepat minimum) → 200", async () => {
            const res = await request(app).get("/api/students?page=1&limit=10").set("Authorization", headers.Authorization);
            expect(res.status).toBe(200);
        });

        test("BB-BVA-018: page = 2 (di atas minimum) → 200", async () => {
            const res = await request(app).get("/api/students?page=2&limit=10").set("Authorization", headers.Authorization);
            expect(res.status).toBe(200);
        });
    });

    describe("BVA – Limit Per Page", () => {
        test("BB-BVA-019: limit = 0 (di bawah minimum) → 400", async () => {
            const res = await request(app).get("/api/students?page=1&limit=0").set("Authorization", headers.Authorization);
            expect(res.status).toBe(400);
        });

        test("BB-BVA-020: limit = 1 (tepat minimum) → 200", async () => {
            const res = await request(app).get("/api/students?page=1&limit=1").set("Authorization", headers.Authorization);
            expect(res.status).toBe(200);
        });

        test("BB-BVA-021: limit = 100 (tepat maksimum) → 200", async () => {
            const res = await request(app).get("/api/students?page=1&limit=100").set("Authorization", headers.Authorization);
            expect(res.status).toBe(200);
        });

        test("BB-BVA-022: limit = 101 (di atas maksimum) → 400", async () => {
            const res = await request(app).get("/api/students?page=1&limit=101").set("Authorization", headers.Authorization);
            expect(res.status).toBe(400);
        });
    });
});

// ============================================================
// ┌─────────────────────────────────────────────────────────┐
// │   MODUL 4: TAMBAH SISWA – EP & BVA                      │
// └─────────────────────────────────────────────────────────┘
//
// EP – Name siswa:
//   EP1 (valid)  : nama 1-100 karakter   → 201
//   EP2 (invalid): nama kosong           → 400
//   EP3 (invalid): nama > 100 karakter   → 400
//
// EP – Status siswa:
//   EP4 (valid)  : "Aktif","Lulus","Pindah","Keluar"  → 201
//   EP5 (invalid): nilai di luar enum                 → 400
//
// EP – NIS:
//   EP6 (valid)  : NIS 3-20 karakter    → 201
//   EP7 (invalid): NIS < 3 karakter     → 400
//   EP8 (invalid): NIS > 20 karakter    → 400
//   EP9 (invalid): NIS duplikat         → 400
//
// BVA – NIS length (batas: min=3, max=20):
//   BVA1: 2 karakter (di bawah min)  → 400
//   BVA2: 3 karakter (tepat min)     → 201
//   BVA3: 4 karakter (di atas min)   → 201
//   BVA4: 19 karakter (di bawah max) → 201
//   BVA5: 20 karakter (tepat max)    → 201
//   BVA6: 21 karakter (di atas max)  → 400
// ============================================================
describe("BB-04: Tambah Siswa – Equivalence Partitioning & BVA", () => {
    let app;
    beforeEach(() => { app = buildApp(); });

    const headers = authHeader();

    describe("EP – Nama Siswa", () => {
        test("BB-EP-017: EP1 – nama valid → 201", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Ahmad Fauzan", nis: "2024001" });
            expect(res.status).toBe(201);
        });

        test("BB-EP-018: EP2 – nama kosong → 400", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "", nis: "2024002" });
            expect(res.status).toBe(400);
        });

        test("BB-EP-019: EP3 – nama > 100 karakter → 400", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "A".repeat(101), nis: "2024003" });
            expect(res.status).toBe(400);
        });
    });

    describe("EP – Status Siswa", () => {
        test("BB-EP-020: EP4 – status 'Aktif' (valid) → 201", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa A", nis: "S001", status: "Aktif" });
            expect(res.status).toBe(201);
        });

        test("BB-EP-021: EP4 – status 'Lulus' (valid) → 201", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa B", nis: "S002", status: "Lulus" });
            expect(res.status).toBe(201);
        });

        test("BB-EP-022: EP4 – status 'Pindah' (valid) → 201", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa C", nis: "S003", status: "Pindah" });
            expect(res.status).toBe(201);
        });

        test("BB-EP-023: EP4 – status 'Keluar' (valid) → 201", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa D", nis: "S004", status: "Keluar" });
            expect(res.status).toBe(201);
        });

        test("BB-EP-024: EP5 – status 'Dropout' (tidak valid) → 400", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa E", nis: "S005", status: "Dropout" });
            expect(res.status).toBe(400);
        });

        test("BB-EP-025: EP5 – status 'aktif' (huruf kecil, tidak valid) → 400", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa F", nis: "S006", status: "aktif" });
            expect(res.status).toBe(400);
        });
    });

    describe("EP – NIS", () => {
        test("BB-EP-026: EP9 – NIS duplikat → 400", async () => {
            await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa 1", nis: "DUPLIKAT" });
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa 2", nis: "DUPLIKAT" });
            expect(res.status).toBe(400);
        });
    });

    describe("BVA – NIS Length (batas: min=3, max=20)", () => {
        test("BB-BVA-023: NIS 2 karakter (di bawah minimum) → 400", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa BVA", nis: "AB" });
            expect(res.status).toBe(400);
        });

        test("BB-BVA-024: NIS 3 karakter (tepat minimum) → 201", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa BVA", nis: "ABC" });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-025: NIS 4 karakter (di atas minimum) → 201", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa BVA", nis: "ABCD" });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-026: NIS 19 karakter (di bawah maksimum) → 201", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa BVA", nis: "A".repeat(19) });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-027: NIS 20 karakter (tepat maksimum) → 201", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa BVA", nis: "A".repeat(20) });
            expect(res.status).toBe(201);
        });

        test("BB-BVA-028: NIS 21 karakter (di atas maksimum) → 400", async () => {
            const res = await request(app).post("/api/students").set("Authorization", headers.Authorization).send({ name: "Siswa BVA", nis: "A".repeat(21) });
            expect(res.status).toBe(400);
        });
    });
});

// ============================================================
// ┌─────────────────────────────────────────────────────────┐
// │   MODUL 5: TAMBAH GURU – BVA NIP                        │
// └─────────────────────────────────────────────────────────┘
//
// NIP Guru = 18 digit (fixed length):
//   BVA1: 17 digit (di bawah)     → 400
//   BVA2: 18 digit (tepat)        → 201
//   BVA3: 19 digit (di atas)      → 400
//   EP1 : tanpa NIP               → 201 (opsional)
// ============================================================
describe("BB-05: Tambah Guru – BVA NIP Length", () => {
    let app;
    beforeEach(() => { app = buildApp(); });
    const headers = authHeader();

    test("BB-BVA-029: NIP 17 digit (di bawah batas) → 400", async () => {
        const res = await request(app).post("/api/teachers").set("Authorization", headers.Authorization).send({ name: "Pak Guru", nip: "1".repeat(17) });
        expect(res.status).toBe(400);
    });

    test("BB-BVA-030: NIP 18 digit (tepat batas) → 201", async () => {
        const res = await request(app).post("/api/teachers").set("Authorization", headers.Authorization).send({ name: "Pak Guru", nip: "1".repeat(18) });
        expect(res.status).toBe(201);
    });

    test("BB-BVA-031: NIP 19 digit (di atas batas) → 400", async () => {
        const res = await request(app).post("/api/teachers").set("Authorization", headers.Authorization).send({ name: "Pak Guru", nip: "1".repeat(19) });
        expect(res.status).toBe(400);
    });

    test("BB-EP-027: EP1 – guru tanpa NIP (NIP opsional) → 201", async () => {
        const res = await request(app).post("/api/teachers").set("Authorization", headers.Authorization).send({ name: "Bu Guru Tanpa NIP" });
        expect(res.status).toBe(201);
    });

    test("BB-EP-028: EP2 – guru tanpa nama → 400", async () => {
        const res = await request(app).post("/api/teachers").set("Authorization", headers.Authorization).send({ nip: "1".repeat(18) });
        expect(res.status).toBe(400);
    });
});

// ============================================================
// ┌─────────────────────────────────────────────────────────┐
// │   MODUL 6: BK CASE – EP Status                          │
// └─────────────────────────────────────────────────────────┘
//
// EP – Status BK Case:
//   EP1 (valid)  : "Proses"  → 201
//   EP2 (valid)  : "Selesai" → 201
//   EP3 (invalid): nilai lain → 400
//   EP4 (default): tanpa status → 201 (default ke "Proses")
//
// EP – student_id:
//   EP5 (valid)  : student_id ada → 201
//   EP6 (invalid): tanpa student_id → 400
// ============================================================
describe("BB-06: Kasus BK – Equivalence Partitioning Status", () => {
    let app;
    beforeEach(() => { app = buildApp(); });
    const headers = authHeader();

    test("BB-EP-029: EP1 – status 'Proses' (valid) → 201", async () => {
        const res = await request(app).post("/api/bk/cases").set("Authorization", headers.Authorization).send({ student_id: 1, type: "Kedisiplinan", status: "Proses" });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe("Proses");
    });

    test("BB-EP-030: EP2 – status 'Selesai' (valid) → 201", async () => {
        const res = await request(app).post("/api/bk/cases").set("Authorization", headers.Authorization).send({ student_id: 1, type: "Akademik", status: "Selesai" });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe("Selesai");
    });

    test("BB-EP-031: EP3 – status 'Pending' (tidak valid) → 400", async () => {
        const res = await request(app).post("/api/bk/cases").set("Authorization", headers.Authorization).send({ student_id: 1, type: "Sosial", status: "Pending" });
        expect(res.status).toBe(400);
    });

    test("BB-EP-032: EP3 – status 'proses' (case-sensitive, tidak valid) → 400", async () => {
        const res = await request(app).post("/api/bk/cases").set("Authorization", headers.Authorization).send({ student_id: 1, status: "proses" });
        expect(res.status).toBe(400);
    });

    test("BB-EP-033: EP4 – tanpa status → 201 (default 'Proses')", async () => {
        const res = await request(app).post("/api/bk/cases").set("Authorization", headers.Authorization).send({ student_id: 1, type: "Akademik" });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe("Proses");
    });

    test("BB-EP-034: EP6 – tanpa student_id → 400", async () => {
        const res = await request(app).post("/api/bk/cases").set("Authorization", headers.Authorization).send({ type: "Kedisiplinan", status: "Proses" });
        expect(res.status).toBe(400);
    });
});
