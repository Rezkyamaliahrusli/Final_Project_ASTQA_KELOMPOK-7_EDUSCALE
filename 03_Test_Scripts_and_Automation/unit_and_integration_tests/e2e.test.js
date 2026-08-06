/**
 * SYSTEM TEST – End-to-End (E2E) Tests
 * File: tests/system/e2e.test.js
 * Framework: Jest + Supertest (simulasi browser flow)
 * Level: System Testing
 *
 * Catatan: Test ini mensimulasikan skenario pengguna nyata dari
 * awal (login) hingga akhir (operasi CRUD lengkap).
 * Untuk E2E dengan browser nyata, lihat: tests/system/playwright/
 */

process.env.JWT_SECRET = "test_secret_key_eduscale";
process.env.NODE_ENV = "test";

const request = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const generateToken = require("../../src/utils/generateToken");
const authMiddleware = require("../../src/middleware/authMiddleware");

// ============================================================
// SETUP: Full System Test App
// ============================================================

const setupSystemApp = () => {
    const app = express();
    app.use(express.json({ limit: "10mb" }));

    // In-memory state
    const db = {
        users: [{ id: 1, name: "Admin", email: "admin@eduscale.id", password: "$HASHED", role_id: 1, Role: { name: "Admin" } }],
        students: [],
        teachers: [],
        classes: [{ id: 1, name: "X-A", grade: "X" }],
        bkCases: [],
        journals: [],
        activityLogs: []
    };

    const logActivity = (userId, action, desc) => {
        db.activityLogs.push({ id: db.activityLogs.length + 1, user_id: userId, action, description: desc, createdAt: new Date() });
    };

    // AUTH
    app.post("/api/auth/login", async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Field wajib diisi" });
        if (email === "admin@eduscale.id" && password === "admin123") {
            const token = generateToken({ id: 1, email, role_id: 1 });
            logActivity(1, "Login", `User ${email} login`);
            return res.json({ message: "Login berhasil", token, user: { id: 1, name: "Admin", email, role: { name: "Admin" } } });
        }
        return res.status(401).json({ message: "Email atau password salah" });
    });

    // STUDENTS
    app.get("/api/students", authMiddleware, (req, res) => {
        const { search, status } = req.query;
        let data = [...db.students];
        if (search) data = data.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
        if (status) data = data.filter((s) => s.status === status);
        res.json({ data, total: data.length, page: 1, totalPages: 1 });
    });

    app.get("/api/students/:id", authMiddleware, (req, res) => {
        const s = db.students.find((s) => s.id === parseInt(req.params.id));
        if (!s) return res.status(404).json({ message: "Siswa tidak ditemukan" });
        res.json(s);
    });

    app.post("/api/students", authMiddleware, (req, res) => {
        const { name, nis } = req.body;
        if (!name) return res.status(400).json({ message: "Nama wajib diisi" });
        if (nis && db.students.find((s) => s.nis === nis)) {
            return res.status(400).json({ message: "NIS sudah terdaftar" });
        }
        const s = { id: db.students.length + 1, status: "Aktif", ...req.body };
        db.students.push(s);
        logActivity(req.user.id, "Tambah Siswa", `Menambahkan siswa: ${s.name}`);
        res.status(201).json({ message: "Siswa berhasil ditambahkan", student: s });
    });

    app.put("/api/students/:id", authMiddleware, (req, res) => {
        const idx = db.students.findIndex((s) => s.id === parseInt(req.params.id));
        if (idx === -1) return res.status(404).json({ message: "Siswa tidak ditemukan" });
        db.students[idx] = { ...db.students[idx], ...req.body };
        logActivity(req.user.id, "Update Siswa", `Update siswa: ${db.students[idx].name}`);
        res.json({ message: "Siswa berhasil diupdate", student: db.students[idx] });
    });

    app.put("/api/students/:id/status", authMiddleware, (req, res) => {
        const idx = db.students.findIndex((s) => s.id === parseInt(req.params.id));
        if (idx === -1) return res.status(404).json({ message: "Siswa tidak ditemukan" });
        db.students[idx].status = req.body.status;
        res.json({ message: "Status berhasil diupdate", student: db.students[idx] });
    });

    app.delete("/api/students/:id", authMiddleware, (req, res) => {
        const idx = db.students.findIndex((s) => s.id === parseInt(req.params.id));
        if (idx === -1) return res.status(404).json({ message: "Siswa tidak ditemukan" });
        const deleted = db.students.splice(idx, 1)[0];
        logActivity(req.user.id, "Hapus Siswa", `Hapus siswa: ${deleted.name}`);
        res.json({ message: "Siswa berhasil dihapus" });
    });

    // TEACHERS
    app.get("/api/teachers", authMiddleware, (req, res) => {
        res.json({ data: db.teachers, total: db.teachers.length });
    });

    app.post("/api/teachers", authMiddleware, (req, res) => {
        if (!req.body.name) return res.status(400).json({ message: "Nama wajib diisi" });
        const t = { id: db.teachers.length + 1, ...req.body };
        db.teachers.push(t);
        res.status(201).json({ message: "Guru berhasil ditambahkan", teacher: t });
    });

    // BK CASES
    app.get("/api/bk/cases", authMiddleware, (req, res) => {
        res.json({ data: db.bkCases, total: db.bkCases.length });
    });

    app.post("/api/bk/cases", authMiddleware, (req, res) => {
        if (!req.body.student_id) return res.status(400).json({ message: "student_id wajib diisi" });
        const c = { id: db.bkCases.length + 1, status: "Proses", ...req.body };
        db.bkCases.push(c);
        res.status(201).json({ message: "Kasus BK berhasil ditambahkan", data: c });
    });

    app.put("/api/bk/cases/:id", authMiddleware, (req, res) => {
        const idx = db.bkCases.findIndex((c) => c.id === parseInt(req.params.id));
        if (idx === -1) return res.status(404).json({ message: "Kasus BK tidak ditemukan" });
        db.bkCases[idx] = { ...db.bkCases[idx], ...req.body };
        res.json({ message: "Kasus BK berhasil diupdate", data: db.bkCases[idx] });
    });

    // DASHBOARD
    app.get("/api/dashboard/stats", authMiddleware, (req, res) => {
        res.json({
            totalStudents: db.students.filter((s) => s.status === "Aktif").length,
            totalTeachers: db.teachers.length,
            totalClasses: db.classes.length,
            activeBKCases: db.bkCases.filter((c) => c.status === "Proses").length,
            journalsThisMonth: db.journals.length
        });
    });

    // AUDIT LOG
    app.get("/api/activities", authMiddleware, (req, res) => {
        res.json({ data: [...db.activityLogs].reverse() });
    });

    return { app, db };
};

// ============================================================
// SYSTEM TESTS
// ============================================================

describe("ST-01: Skenario Lengkap Login & Navigasi", () => {
    const { app } = setupSystemApp();

    test("ST-001: User tidak dapat mengakses sistem tanpa login", async () => {
        const endpoints = ["/api/students", "/api/teachers", "/api/dashboard/stats"];
        for (const endpoint of endpoints) {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        }
    });

    test("ST-002: Login dengan kredensial valid memberikan akses ke sistem", async () => {
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@eduscale.id", password: "admin123" });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();

        // Gunakan token untuk akses data
        const token = loginRes.body.token;
        const dashRes = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${token}`);
        expect(dashRes.status).toBe(200);
    });

    test("ST-003: Login dengan kredensial salah tidak memberikan akses", async () => {
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@eduscale.id", password: "wrong" });
        expect(loginRes.status).toBe(401);

        // Tidak ada token untuk digunakan
        expect(loginRes.body.token).toBeUndefined();
    });
});

describe("ST-02: Skenario Penuh CRUD Siswa", () => {
    const { app, db } = setupSystemApp();
    let authToken;
    let createdStudentId;

    beforeAll(async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@eduscale.id", password: "admin123" });
        authToken = res.body.token;
    });

    test("ST-004: Daftar siswa awal kosong", async () => {
        const res = await request(app)
            .get("/api/students")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(0);
    });

    test("ST-005: Admin dapat menambahkan siswa baru", async () => {
        const res = await request(app)
            .post("/api/students")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Ahmad Fauzan", nis: "2024001", gender: "L", class_id: 1 });
        expect(res.status).toBe(201);
        expect(res.body.student.name).toBe("Ahmad Fauzan");
        createdStudentId = res.body.student.id;
    });

    test("ST-006: Siswa yang ditambahkan muncul di daftar", async () => {
        const res = await request(app)
            .get("/api/students")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(1);
        expect(res.body.data[0].name).toBe("Ahmad Fauzan");
    });

    test("ST-007: Tidak bisa menambah siswa dengan NIS yang sama", async () => {
        const res = await request(app)
            .post("/api/students")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Siswa Lain", nis: "2024001" });
        expect(res.status).toBe(400);
    });

    test("ST-008: Admin dapat mengupdate data siswa", async () => {
        const res = await request(app)
            .put(`/api/students/${createdStudentId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Ahmad Fauzan Updated" });
        expect(res.status).toBe(200);
        expect(res.body.student.name).toBe("Ahmad Fauzan Updated");
    });

    test("ST-009: Admin dapat mengubah status siswa", async () => {
        const res = await request(app)
            .put(`/api/students/${createdStudentId}/status`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ status: "Lulus" });
        expect(res.status).toBe(200);
        expect(res.body.student.status).toBe("Lulus");
    });

    test("ST-010: Filter berdasarkan status bekerja dengan benar", async () => {
        const res = await request(app)
            .get("/api/students?status=Aktif")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        // Siswa yang diubah ke Lulus tidak muncul
        expect(res.body.total).toBe(0);
    });

    test("ST-011: Admin dapat menghapus siswa", async () => {
        const res = await request(app)
            .delete(`/api/students/${createdStudentId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
    });

    test("ST-012: Setelah dihapus, siswa tidak ditemukan", async () => {
        const res = await request(app)
            .get(`/api/students/${createdStudentId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(404);
    });
});

describe("ST-03: Skenario Penuh BK Case Flow", () => {
    const { app, db } = setupSystemApp();
    let authToken;
    let studentId;
    let bkCaseId;

    beforeAll(async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@eduscale.id", password: "admin123" });
        authToken = res.body.token;

        // Buat siswa untuk kasus BK
        const sRes = await request(app)
            .post("/api/students")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Siswa BK Test", nis: "BK001" });
        studentId = sRes.body.student.id;
    });

    test("ST-013: Membuat kasus BK baru untuk siswa", async () => {
        const res = await request(app)
            .post("/api/bk/cases")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ student_id: studentId, type: "Kedisiplinan", description: "Sering terlambat", date: "2026-07-15" });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe("Proses");
        bkCaseId = res.body.data.id;
    });

    test("ST-014: Kasus BK muncul dalam daftar dengan status Proses", async () => {
        const res = await request(app)
            .get("/api/bk/cases")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        const bkCase = res.body.data.find((c) => c.id === bkCaseId);
        expect(bkCase).toBeDefined();
        expect(bkCase.status).toBe("Proses");
    });

    test("ST-015: Dashboard menampilkan kasus BK aktif", async () => {
        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.activeBKCases).toBeGreaterThan(0);
    });

    test("ST-016: Admin dapat menutup kasus BK (status → Selesai)", async () => {
        const res = await request(app)
            .put(`/api/bk/cases/${bkCaseId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ status: "Selesai" });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("Selesai");
    });

    test("ST-017: Setelah ditutup, dashboard tidak menghitung kasus sebagai aktif", async () => {
        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.body.activeBKCases).toBe(0);
    });
});

describe("ST-04: Skenario Audit Log", () => {
    const { app, db } = setupSystemApp();
    let authToken;

    beforeAll(async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@eduscale.id", password: "admin123" });
        authToken = res.body.token;
    });

    test("ST-018: Setelah login, aktivitas tercatat di audit log", async () => {
        const res = await request(app)
            .get("/api/activities")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    test("ST-019: Setelah tambah siswa, aktivitas baru tercatat", async () => {
        const logCountBefore = db.activityLogs.length;

        await request(app)
            .post("/api/students")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Siswa Log Test", nis: "LOG001" });

        expect(db.activityLogs.length).toBeGreaterThan(logCountBefore);
        const lastLog = db.activityLogs[db.activityLogs.length - 1];
        expect(lastLog.action).toBe("Tambah Siswa");
    });

    test("ST-020: Setelah hapus siswa, aktivitas tercatat", async () => {
        const createRes = await request(app)
            .post("/api/students")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Hapus Log Test", nis: "LOG002" });
        const id = createRes.body.student.id;

        const logCountBefore = db.activityLogs.length;
        await request(app)
            .delete(`/api/students/${id}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(db.activityLogs.length).toBeGreaterThan(logCountBefore);
        const lastLog = db.activityLogs[db.activityLogs.length - 1];
        expect(lastLog.action).toBe("Hapus Siswa");
    });
});

describe("ST-05: Skenario Dashboard Konsistensi Data", () => {
    const { app, db } = setupSystemApp();
    let authToken;

    beforeAll(async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@eduscale.id", password: "admin123" });
        authToken = res.body.token;
    });

    test("ST-021: totalStudents di dashboard sama dengan jumlah siswa aktif", async () => {
        // Tambah beberapa siswa
        await request(app).post("/api/students").set("Authorization", `Bearer ${authToken}`).send({ name: "S1", nis: "D001", status: "Aktif" });
        await request(app).post("/api/students").set("Authorization", `Bearer ${authToken}`).send({ name: "S2", nis: "D002", status: "Aktif" });

        const dashRes = await request(app).get("/api/dashboard/stats").set("Authorization", `Bearer ${authToken}`);
        const activeCount = db.students.filter((s) => s.status === "Aktif").length;
        expect(dashRes.body.totalStudents).toBe(activeCount);
    });

    test("ST-022: totalTeachers di dashboard sama dengan jumlah guru", async () => {
        await request(app).post("/api/teachers").set("Authorization", `Bearer ${authToken}`).send({ name: "Guru 1" });

        const dashRes = await request(app).get("/api/dashboard/stats").set("Authorization", `Bearer ${authToken}`);
        expect(dashRes.body.totalTeachers).toBe(db.teachers.length);
    });
});
