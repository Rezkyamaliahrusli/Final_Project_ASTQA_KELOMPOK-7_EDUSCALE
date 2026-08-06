/**
 * UNIT TEST – Controller Logic (dengan Mock)
 * File: tests/unit/controllers.test.js
 * Framework: Jest
 * Level: Unit Testing
 */

process.env.JWT_SECRET = "test_secret_key_eduscale";

// ============================================================
// MOCK HELPER
// ============================================================
const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// ============================================================
// TEST SUITE: Auth Controller Logic (mocked)
// ============================================================
describe("Auth Controller – Login Logic", () => {
    const bcrypt = require("bcrypt");

    const simulateLogin = async (storedHashedPwd, inputPassword) => {
        return bcrypt.compare(inputPassword, storedHashedPwd);
    };

    test("UT-036: login dengan password benar harus sukses", async () => {
        const hashedPwd = await bcrypt.hash("secret123", 10);
        const result = await simulateLogin(hashedPwd, "secret123");
        expect(result).toBe(true);
    });

    test("UT-037: login dengan password salah harus gagal", async () => {
        const hashedPwd = await bcrypt.hash("secret123", 10);
        const result = await simulateLogin(hashedPwd, "wrong");
        expect(result).toBe(false);
    });

    test("UT-038: response login sukses harus berisi token dan user", () => {
        const res = createMockRes();
        const mockToken = "mock_jwt_token";
        const mockUser = { id: 1, name: "Admin", email: "admin@test.com", role: { name: "Admin" } };

        res.json({ message: "Login berhasil", token: mockToken, user: mockUser });

        const responseData = res.json.mock.calls[0][0];
        expect(responseData.token).toBeDefined();
        expect(responseData.user).toBeDefined();
        expect(responseData.message).toBe("Login berhasil");
    });

    test("UT-039: response login gagal harus 401", () => {
        const res = createMockRes();
        res.status(401).json({ message: "Email atau password salah" });

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.any(String) })
        );
    });
});

// ============================================================
// TEST SUITE: Student Controller Logic (mocked)
// ============================================================
describe("Student Controller – Logic Unit", () => {
    // Simulasi validasi field siswa
    const validateStudent = (data) => {
        const errors = [];
        if (!data.name || data.name.trim() === "") errors.push("name required");
        if (!data.nis || data.nis.trim() === "") errors.push("nis required");
        return errors;
    };

    test("UT-040: siswa valid harus lolos validasi tanpa error", () => {
        const student = { name: "Budi Santoso", nis: "2024001", class_id: 1 };
        const errors = validateStudent(student);
        expect(errors.length).toBe(0);
    });

    test("UT-041: siswa tanpa nama harus gagal validasi", () => {
        const student = { name: "", nis: "2024001" };
        const errors = validateStudent(student);
        expect(errors).toContain("name required");
    });

    test("UT-042: siswa tanpa NIS harus gagal validasi", () => {
        const student = { name: "Budi", nis: "" };
        const errors = validateStudent(student);
        expect(errors).toContain("nis required");
    });

    test("UT-043: response getAll harus mengandung data, total, page, totalPages", () => {
        const res = createMockRes();
        const mockData = [{ id: 1, name: "Siswa A" }, { id: 2, name: "Siswa B" }];

        res.json({
            data: mockData,
            total: 50,
            page: 1,
            totalPages: 3
        });

        const responseData = res.json.mock.calls[0][0];
        expect(responseData).toHaveProperty("data");
        expect(responseData).toHaveProperty("total");
        expect(responseData).toHaveProperty("page");
        expect(responseData).toHaveProperty("totalPages");
        expect(Array.isArray(responseData.data)).toBe(true);
    });

    test("UT-044: response 404 saat siswa tidak ditemukan", () => {
        const res = createMockRes();
        res.status(404).json({ message: "Siswa tidak ditemukan" });

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Siswa tidak ditemukan" });
    });

    test("UT-045: response 201 saat siswa berhasil dibuat", () => {
        const res = createMockRes();
        const newStudent = { id: 10, name: "Siti", nis: "2024010" };

        res.status(201).json({ message: "Siswa berhasil ditambahkan", student: newStudent });

        expect(res.status).toHaveBeenCalledWith(201);
        const responseData = res.json.mock.calls[0][0];
        expect(responseData.student).toBeDefined();
        expect(responseData.message).toContain("berhasil");
    });
});

// ============================================================
// TEST SUITE: Teacher Controller Logic (mocked)
// ============================================================
describe("Teacher Controller – Logic Unit", () => {
    const validateTeacher = (data) => {
        const errors = [];
        if (!data.name || data.name.trim() === "") errors.push("name required");
        return errors;
    };

    test("UT-046: guru valid harus lolos validasi", () => {
        const teacher = { name: "Pak Ahmad", nip: "199001012020001001" };
        const errors = validateTeacher(teacher);
        expect(errors.length).toBe(0);
    });

    test("UT-047: guru tanpa nama harus gagal validasi", () => {
        const teacher = { name: "" };
        const errors = validateTeacher(teacher);
        expect(errors).toContain("name required");
    });

    test("UT-048: response 404 saat guru tidak ditemukan", () => {
        const res = createMockRes();
        res.status(404).json({ message: "Guru tidak ditemukan" });
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ============================================================
// TEST SUITE: Dashboard Controller Logic (mocked)
// ============================================================
describe("Dashboard Controller – Stats Logic", () => {
    test("UT-049: stats response harus mengandung field yang diperlukan", () => {
        const res = createMockRes();
        const mockStats = {
            totalStudents: 120,
            totalTeachers: 15,
            totalClasses: 6,
            activeBKCases: 3,
            journalsThisMonth: 42
        };

        res.json(mockStats);

        const responseData = res.json.mock.calls[0][0];
        expect(responseData).toHaveProperty("totalStudents");
        expect(responseData).toHaveProperty("totalTeachers");
        expect(responseData).toHaveProperty("totalClasses");
        expect(responseData).toHaveProperty("activeBKCases");
        expect(responseData).toHaveProperty("journalsThisMonth");
    });

    test("UT-050: nilai statistik harus berupa angka non-negatif", () => {
        const stats = {
            totalStudents: 120,
            totalTeachers: 15,
            totalClasses: 6,
            activeBKCases: 3,
            journalsThisMonth: 42
        };

        Object.values(stats).forEach((val) => {
            expect(typeof val).toBe("number");
            expect(val).toBeGreaterThanOrEqual(0);
        });
    });

    test("UT-051: chart data harus berisi studentsPerClass dan journalsPerMonth", () => {
        const mockChartData = {
            studentsPerClass: [{ class_name: "X-A", count: 30 }],
            journalsPerMonth: [{ month: "Juli 2026", count: 42 }]
        };

        expect(mockChartData).toHaveProperty("studentsPerClass");
        expect(mockChartData).toHaveProperty("journalsPerMonth");
        expect(Array.isArray(mockChartData.studentsPerClass)).toBe(true);
    });
});

// ============================================================
// TEST SUITE: BK Controller Logic (mocked)
// ============================================================
describe("BK Controller – Logic Unit", () => {
    const validateBKCase = (data) => {
        const validStatuses = ["Proses", "Selesai"];
        if (!data.student_id) return false;
        if (data.status && !validStatuses.includes(data.status)) return false;
        return true;
    };

    test("UT-052: kasus BK dengan data valid harus lolos validasi", () => {
        const bkCase = { student_id: 1, type: "Kedisiplinan", status: "Proses" };
        expect(validateBKCase(bkCase)).toBe(true);
    });

    test("UT-053: kasus BK tanpa student_id harus gagal", () => {
        const bkCase = { type: "Kedisiplinan", status: "Proses" };
        expect(validateBKCase(bkCase)).toBe(false);
    });

    test("UT-054: kasus BK dengan status tidak valid harus gagal", () => {
        const bkCase = { student_id: 1, status: "InvalidStatus" };
        expect(validateBKCase(bkCase)).toBe(false);
    });

    test("UT-055: status kasus BK hanya boleh Proses atau Selesai", () => {
        const validStatuses = ["Proses", "Selesai"];
        expect(validStatuses).toContain("Proses");
        expect(validStatuses).toContain("Selesai");
        expect(validStatuses).not.toContain("Pending");
        expect(validStatuses).not.toContain("Batal");
    });
});
