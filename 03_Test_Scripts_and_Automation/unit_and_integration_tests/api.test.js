/**
 * INTEGRATION TEST – REST API Endpoints
 * File: tests/integration/api.test.js
 * Framework: Jest + Supertest
 * Level: Integration Testing
 *
 * Catatan: Test ini menguji integrasi Express app secara langsung
 * tanpa koneksi database nyata (menggunakan mock/in-memory state).
 * Untuk end-to-end dengan database nyata, gunakan tests/system/
 */

process.env.JWT_SECRET = "test_secret_key_eduscale";
process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const express = require("express");

// ============================================================
// SETUP: Mini Express App untuk Integration Testing
// (Mensimulasikan struktur app.js tanpa koneksi DB)
// ============================================================

const setupTestApp = () => {
    const app = express();
    app.use(express.json({ limit: "10mb" }));

    // Import middleware
    const authMiddleware = require("../../src/middleware/authMiddleware");

    // Mock data store (in-memory)
    let users = [
        {
            id: 1,
            name: "Administrator",
            email: "admin@eduscale.id",
            password: "$2b$10$testhashedpassword", // placeholder
            role_id: 1,
            Role: { name: "Admin" }
        }
    ];

    let students = [
        { id: 1, nis: "2024001", name: "Budi Santoso", gender: "L", status: "Aktif", class_id: 1 },
        { id: 2, nis: "2024002", name: "Siti Rahayu", gender: "P", status: "Aktif", class_id: 1 }
    ];

    let teachers = [
        { id: 1, nip: "199001012020001001", name: "Pak Ahmad Fauzi", specialization: "Matematika" }
    ];

    const bcrypt = require("bcrypt");
    const generateToken = require("../../src/utils/generateToken");

    // --- AUTH ROUTES (mocked) ---
    app.post("/api/auth/login", async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password wajib diisi" });
        }

        // Simulasi: hanya admin bisa login di test
        if (email === "admin@eduscale.id" && password === "admin123") {
            const user = { id: 1, email, role_id: 1 };
            const token = generateToken(user);
            return res.json({
                message: "Login berhasil",
                token,
                user: { id: 1, name: "Administrator", email, role: { name: "Admin" } }
            });
        }
        return res.status(401).json({ message: "Email atau password salah" });
    });

    app.post("/api/auth/register", async (req, res) => {
        const { name, email, password, role_id } = req.body;
        if (!name || !email || !password || !role_id) {
            return res.status(400).json({ message: "Semua field wajib diisi" });
        }
        const exists = users.find((u) => u.email === email);
        if (exists) {
            return res.status(400).json({ message: "Email sudah digunakan" });
        }
        const newUser = { id: users.length + 1, name, email, role_id };
        users.push(newUser);
        return res.status(201).json({ message: "User berhasil dibuat", user: newUser });
    });

    app.get("/api/auth/profile", authMiddleware, (req, res) => {
        const user = users.find((u) => u.id === req.user.id);
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
        res.json(user);
    });

    // --- STUDENT ROUTES (mocked) ---
    app.get("/api/students", authMiddleware, (req, res) => {
        const { search, page = 1, limit = 20 } = req.query;
        let filtered = [...students];
        if (search) {
            filtered = filtered.filter(
                (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search)
            );
        }
        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const data = filtered.slice(offset, offset + parseInt(limit));
        res.json({ data, total, page: parseInt(page), totalPages });
    });

    app.get("/api/students/:id", authMiddleware, (req, res) => {
        const student = students.find((s) => s.id === parseInt(req.params.id));
        if (!student) return res.status(404).json({ message: "Siswa tidak ditemukan" });
        res.json(student);
    });

    app.post("/api/students", authMiddleware, (req, res) => {
        const { name, nis } = req.body;
        if (!name) return res.status(400).json({ message: "Nama wajib diisi" });
        const newStudent = { id: students.length + 1, nis: nis || "AUTO", name, status: "Aktif", ...req.body };
        students.push(newStudent);
        res.status(201).json({ message: "Siswa berhasil ditambahkan", student: newStudent });
    });

    app.put("/api/students/:id", authMiddleware, (req, res) => {
        const idx = students.findIndex((s) => s.id === parseInt(req.params.id));
        if (idx === -1) return res.status(404).json({ message: "Siswa tidak ditemukan" });
        students[idx] = { ...students[idx], ...req.body };
        res.json({ message: "Siswa berhasil diupdate", student: students[idx] });
    });

    app.delete("/api/students/:id", authMiddleware, (req, res) => {
        const idx = students.findIndex((s) => s.id === parseInt(req.params.id));
        if (idx === -1) return res.status(404).json({ message: "Siswa tidak ditemukan" });
        students.splice(idx, 1);
        res.json({ message: "Siswa berhasil dihapus" });
    });

    // --- TEACHER ROUTES (mocked) ---
    app.get("/api/teachers", authMiddleware, (req, res) => {
        res.json({ data: teachers, total: teachers.length, page: 1, totalPages: 1 });
    });

    app.get("/api/teachers/:id", authMiddleware, (req, res) => {
        const teacher = teachers.find((t) => t.id === parseInt(req.params.id));
        if (!teacher) return res.status(404).json({ message: "Guru tidak ditemukan" });
        res.json(teacher);
    });

    app.post("/api/teachers", authMiddleware, (req, res) => {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Nama guru wajib diisi" });
        const newTeacher = { id: teachers.length + 1, ...req.body };
        teachers.push(newTeacher);
        res.status(201).json({ message: "Guru berhasil ditambahkan", teacher: newTeacher });
    });

    // --- DASHBOARD ROUTES (mocked) ---
    app.get("/api/dashboard/stats", authMiddleware, (req, res) => {
        res.json({
            totalStudents: students.filter((s) => s.status === "Aktif").length,
            totalTeachers: teachers.length,
            totalClasses: 3,
            activeBKCases: 1,
            journalsThisMonth: 10
        });
    });

    app.get("/api/dashboard/activities", authMiddleware, (req, res) => {
        res.json({ data: [{ id: 1, action: "Login", description: "User logged in" }] });
    });

    app.get("/api/dashboard/charts", authMiddleware, (req, res) => {
        res.json({
            studentsPerClass: [{ class_name: "X-A", count: 30 }],
            journalsPerMonth: [{ month: "Juli 2026", count: 10 }]
        });
    });

    // Base route
    app.get("/", (req, res) => res.json({ message: "EduScale API Running" }));

    return app;
};

// ============================================================
// HELPER
// ============================================================
const app = setupTestApp();

const getAuthToken = async () => {
    const res = await request(app).post("/api/auth/login").send({
        email: "admin@eduscale.id",
        password: "admin123"
    });
    return res.body.token;
};

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe("IT-01: Base API", () => {
    test("IT-001: GET / harus mengembalikan pesan API Running", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("EduScale");
    });
});

// --- AUTH ---
describe("IT-02: Authentication Endpoints", () => {
    test("IT-002: POST /api/auth/login dengan kredensial valid harus 200 + token", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "admin@eduscale.id",
            password: "admin123"
        });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body).toHaveProperty("user");
        expect(res.body.message).toBe("Login berhasil");
    });

    test("IT-003: POST /api/auth/login dengan password salah harus 401", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "admin@eduscale.id",
            password: "wrongpassword"
        });
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("message");
    });

    test("IT-004: POST /api/auth/login tanpa email/password harus 400", async () => {
        const res = await request(app).post("/api/auth/login").send({});
        expect(res.status).toBe(400);
    });

    test("IT-005: POST /api/auth/register dengan data valid harus 201", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Guru Baru",
            email: "guru.baru@eduscale.id",
            password: "password123",
            role_id: 2
        });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("user");
    });

    test("IT-006: POST /api/auth/register dengan email duplikat harus 400", async () => {
        await request(app).post("/api/auth/register").send({
            name: "User Duplikat",
            email: "duplikat@test.com",
            password: "pass123",
            role_id: 2
        });
        const res = await request(app).post("/api/auth/register").send({
            name: "User Duplikat 2",
            email: "duplikat@test.com",
            password: "pass123",
            role_id: 2
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toContain("sudah digunakan");
    });

    test("IT-007: GET /api/auth/profile tanpa token harus 401", async () => {
        const res = await request(app).get("/api/auth/profile");
        expect(res.status).toBe(401);
    });

    test("IT-008: GET /api/auth/profile dengan token valid harus 200", async () => {
        const token = await getAuthToken();
        const res = await request(app).get("/api/auth/profile").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
    });
});

// --- STUDENTS ---
describe("IT-03: Student Endpoints", () => {
    let authToken;
    beforeAll(async () => {
        authToken = await getAuthToken();
    });

    test("IT-009: GET /api/students tanpa token harus 401", async () => {
        const res = await request(app).get("/api/students");
        expect(res.status).toBe(401);
    });

    test("IT-010: GET /api/students dengan token valid harus 200 + data array", async () => {
        const res = await request(app)
            .get("/api/students")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body).toHaveProperty("total");
        expect(res.body).toHaveProperty("page");
        expect(res.body).toHaveProperty("totalPages");
    });

    test("IT-011: GET /api/students?search=Budi harus mengembalikan hasil yang relevan", async () => {
        const res = await request(app)
            .get("/api/students?search=Budi")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].name).toContain("Budi");
    });

    test("IT-012: GET /api/students/:id dengan ID valid harus 200", async () => {
        const res = await request(app)
            .get("/api/students/1")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
    });

    test("IT-013: GET /api/students/:id dengan ID tidak ada harus 404", async () => {
        const res = await request(app)
            .get("/api/students/9999")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toContain("tidak ditemukan");
    });

    test("IT-014: POST /api/students dengan data valid harus 201", async () => {
        const res = await request(app)
            .post("/api/students")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Siswa Baru", nis: "2024099", gender: "L", status: "Aktif" });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("student");
        expect(res.body.student.name).toBe("Siswa Baru");
    });

    test("IT-015: POST /api/students tanpa nama harus 400", async () => {
        const res = await request(app)
            .post("/api/students")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ nis: "2024100" });
        expect(res.status).toBe(400);
    });

    test("IT-016: PUT /api/students/:id dengan data valid harus 200", async () => {
        const res = await request(app)
            .put("/api/students/1")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Budi Santoso Updated" });
        expect(res.status).toBe(200);
        expect(res.body.student.name).toBe("Budi Santoso Updated");
    });

    test("IT-017: DELETE /api/students/:id yang ada harus 200", async () => {
        // Tambah dulu baru hapus
        const createRes = await request(app)
            .post("/api/students")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Siswa Hapus", nis: "9999" });
        const newId = createRes.body.student.id;

        const res = await request(app)
            .delete(`/api/students/${newId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain("berhasil");
    });

    test("IT-018: DELETE /api/students/:id yang tidak ada harus 404", async () => {
        const res = await request(app)
            .delete("/api/students/8888")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(404);
    });
});

// --- TEACHERS ---
describe("IT-04: Teacher Endpoints", () => {
    let authToken;
    beforeAll(async () => {
        authToken = await getAuthToken();
    });

    test("IT-019: GET /api/teachers harus 200 + data array", async () => {
        const res = await request(app)
            .get("/api/teachers")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("IT-020: GET /api/teachers/:id dengan ID valid harus 200", async () => {
        const res = await request(app)
            .get("/api/teachers/1")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
    });

    test("IT-021: GET /api/teachers/:id tidak ada harus 404", async () => {
        const res = await request(app)
            .get("/api/teachers/9999")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(404);
    });

    test("IT-022: POST /api/teachers dengan data valid harus 201", async () => {
        const res = await request(app)
            .post("/api/teachers")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ name: "Bu Sari", nip: "198506102010012002", specialization: "Bahasa Indonesia" });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("teacher");
    });
});

// --- DASHBOARD ---
describe("IT-05: Dashboard Endpoints", () => {
    let authToken;
    beforeAll(async () => {
        authToken = await getAuthToken();
    });

    test("IT-023: GET /api/dashboard/stats harus 200 + semua field statistik", async () => {
        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("totalStudents");
        expect(res.body).toHaveProperty("totalTeachers");
        expect(res.body).toHaveProperty("totalClasses");
        expect(res.body).toHaveProperty("activeBKCases");
        expect(res.body).toHaveProperty("journalsThisMonth");
    });

    test("IT-024: GET /api/dashboard/activities harus 200 + data array", async () => {
        const res = await request(app)
            .get("/api/dashboard/activities")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("IT-025: GET /api/dashboard/charts harus 200 + studentsPerClass + journalsPerMonth", async () => {
        const res = await request(app)
            .get("/api/dashboard/charts")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("studentsPerClass");
        expect(res.body).toHaveProperty("journalsPerMonth");
    });

    test("IT-026: GET /api/dashboard/stats tanpa token harus 401", async () => {
        const res = await request(app).get("/api/dashboard/stats");
        expect(res.status).toBe(401);
    });
});

// --- JWT SECURITY ---
describe("IT-06: JWT Security Integration", () => {
    test("IT-027: token yang dimanipulasi harus ditolak dengan 401", async () => {
        const validToken = await getAuthToken();
        const tamperedToken = validToken.slice(0, -5) + "xxxxx";
        const res = await request(app)
            .get("/api/students")
            .set("Authorization", `Bearer ${tamperedToken}`);
        expect(res.status).toBe(401);
    });

    test("IT-028: token JWT palsu (bukan format valid) harus ditolak dengan 401", async () => {
        const res = await request(app)
            .get("/api/students")
            .set("Authorization", "Bearer this.is.not.a.valid.jwt");
        expect(res.status).toBe(401);
    });

    test("IT-029: request tanpa header Authorization harus 401", async () => {
        const res = await request(app).get("/api/students");
        expect(res.status).toBe(401);
    });
});

// --- PAGINASI ---
describe("IT-07: Paginasi Integration", () => {
    let authToken;
    beforeAll(async () => {
        authToken = await getAuthToken();
    });

    test("IT-030: GET /api/students?page=1&limit=1 harus mengembalikan max 1 item", async () => {
        const res = await request(app)
            .get("/api/students?page=1&limit=1")
            .set("Authorization", `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeLessThanOrEqual(1);
        expect(res.body.page).toBe(1);
    });
});
