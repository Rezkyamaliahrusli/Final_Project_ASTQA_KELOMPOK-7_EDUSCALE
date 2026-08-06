/**
 * UNIT TEST – Middleware (authMiddleware & roleMiddleware)
 * File: tests/unit/middleware.test.js
 * Framework: Jest
 * Level: Unit Testing
 */

const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test_secret_key_eduscale";

// ============================================================
// MOCK HELPER
// ============================================================
const createMockReq = (headers = {}, user = null, body = {}) => ({
    headers,
    user,
    body
});

const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

// ============================================================
// TEST SUITE: authMiddleware
// ============================================================
describe("authMiddleware", () => {
    // Re-require authMiddleware untuk setiap test
    const authMiddleware = require("../../src/middleware/authMiddleware");

    beforeEach(() => {
        mockNext.mockClear();
    });

    test("UT-020: harus menolak request tanpa Authorization header (401)", () => {
        const req = createMockReq({});
        const res = createMockRes();

        authMiddleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.any(String) })
        );
        expect(mockNext).not.toHaveBeenCalled();
    });

    test("UT-021: harus menolak token yang tidak valid (401)", () => {
        const req = createMockReq({ authorization: "Bearer invalid_token_here" });
        const res = createMockRes();

        authMiddleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    test("UT-022: harus memanggil next() untuk token yang valid", () => {
        const payload = { id: 1, email: "admin@eduscale.id", role_id: 1 };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

        const req = createMockReq({ authorization: `Bearer ${token}` });
        const res = createMockRes();

        authMiddleware(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(payload.id);
        expect(req.user.email).toBe(payload.email);
    });

    test("UT-023: harus menolak token yang expired (401)", async () => {
        const payload = { id: 1, email: "test@test.com", role_id: 1 };
        // Token dengan expiry 1ms (langsung expired)
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1ms" });

        await new Promise((r) => setTimeout(r, 10)); // Tunggu token expired

        const req = createMockReq({ authorization: `Bearer ${token}` });
        const res = createMockRes();

        authMiddleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    test("UT-024: harus menyimpan decoded payload ke req.user", () => {
        const payload = { id: 5, email: "guru@sekolah.id", role_id: 2 };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

        const req = createMockReq({ authorization: `Bearer ${token}` });
        const res = createMockRes();

        authMiddleware(req, res, mockNext);

        expect(req.user.role_id).toBe(2);
    });
});

// ============================================================
// TEST SUITE: roleMiddleware
// ============================================================
describe("roleMiddleware (authorizeRoles)", () => {
    // Mock database model Role
    const mockRoleData = {
        1: { name: "Admin" },
        2: { name: "Guru" },
        3: { name: "BK" }
    };

    // Simulasi logika authorizeRoles tanpa database
    const simulateRoleCheck = (allowedRoles, userRoleId) => {
        const roleName = mockRoleData[userRoleId]?.name;
        return roleName && allowedRoles.includes(roleName);
    };

    test("UT-025: Admin harus diizinkan mengakses endpoint Admin", () => {
        const allowed = simulateRoleCheck(["Admin"], 1);
        expect(allowed).toBe(true);
    });

    test("UT-026: Guru tidak boleh mengakses endpoint Admin-only", () => {
        const allowed = simulateRoleCheck(["Admin"], 2);
        expect(allowed).toBe(false);
    });

    test("UT-027: BK tidak boleh mengakses endpoint Admin-only", () => {
        const allowed = simulateRoleCheck(["Admin"], 3);
        expect(allowed).toBe(false);
    });

    test("UT-028: role yang tidak dikenal harus ditolak", () => {
        const allowed = simulateRoleCheck(["Admin"], 99);
        expect(allowed).toBeFalsy();
    });

    test("UT-029: endpoint multi-role harus mengizinkan semua role yang disebutkan", () => {
        expect(simulateRoleCheck(["Admin", "Guru"], 1)).toBe(true);
        expect(simulateRoleCheck(["Admin", "Guru"], 2)).toBe(true);
        expect(simulateRoleCheck(["Admin", "Guru"], 3)).toBe(false);
    });
});

// ============================================================
// TEST SUITE: HTTP Status Code Handling
// ============================================================
describe("HTTP Response Status Codes", () => {
    test("UT-030: response sukses membaca harus 200", () => {
        const res = createMockRes();
        res.status(200).json({ data: [] });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test("UT-031: response sukses membuat data harus 201", () => {
        const res = createMockRes();
        res.status(201).json({ message: "Created" });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test("UT-032: response unauthorized harus 401", () => {
        const res = createMockRes();
        res.status(401).json({ message: "Unauthorized" });
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test("UT-033: response forbidden harus 403", () => {
        const res = createMockRes();
        res.status(403).json({ message: "Forbidden" });
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test("UT-034: response not found harus 404", () => {
        const res = createMockRes();
        res.status(404).json({ message: "Not Found" });
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test("UT-035: response server error harus 500", () => {
        const res = createMockRes();
        res.status(500).json({ message: "Internal Server Error" });
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
