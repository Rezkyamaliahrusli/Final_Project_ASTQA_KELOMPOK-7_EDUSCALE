# EduScale — Sistem Manajemen Sekolah Berbasis Web

**Final Project – Advanced Software Testing and Quality Assurance (ASTQA)**

---

## Deskripsi Proyek

EduScale adalah sistem manajemen sekolah berbasis web fullstack (React + Express.js + PostgreSQL) yang dirancang dengan prinsip *Scalable System Design*. Sistem ini mengintegrasikan pengelolaan data akademik, kesiswaan, jurnal mengajar, dan bimbingan konseling dalam satu platform terpadu dengan autentikasi JWT dan kontrol akses berbasis role (RBAC).

---

## Anggota Kelompok 7

| No | Nama | NIM | Peran |
|----|------|-----|-------|
| 1 | Rezky Amaliah Rusli | 105841120223 | Frontend Development (React), UI/UX Design |
| 2 | Musdalipa | 105841121623 | Backend Development (Express.js), Database Design (PostgreSQL + Sequelize) |
| 3 | Nurdian | 105841118923 | Modul BK, Testing & QA, Dokumentasi |
| 4 | Wafiq Azizah | 105841120923 | Security & Access Control (JWT, RBAC) |

---

## Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + Vite + TailwindCSS |
| Backend | Express.js 5 + Node.js 18+ |
| Database | PostgreSQL 15 + Sequelize ORM |
| Auth | JWT + bcrypt |
| Testing | Jest + Supertest, Playwright, Postman/Newman, k6 |

---

## Modul Utama

1. **Autentikasi & RBAC** — Login JWT dengan 7 role (Admin, Kepala Sekolah, Guru, Guru BK, Wali Kelas, Siswa, Orang Tua)
2. **Dashboard Analytics** — Statistik dan grafik data sekolah secara real-time
3. **Data Kesiswaan** — Pengelolaan data siswa dan kelas
4. **Jurnal Mengajar** — Pencatatan aktivitas pembelajaran oleh guru
5. **BK (Bimbingan Konseling)** — Pencatatan konseling, pelanggaran, dan prestasi siswa
6. **Manajemen Pengguna** — Pengelolaan akun, role, dan audit log

---

## Hasil Pengujian (QA Summary)

| Level Pengujian | Tool | Total TC | PASS | % |
|-----------------|------|----------|------|---|
| Unit Testing | Jest | 55 | 55 | 100% |
| Integration Testing | Jest + Supertest | 30 | 30 | 100% |
| System Testing | Jest + Supertest | 22 | 22 | 100% |
| Black-Box (EP & BVA) | Jest + Supertest | 65 | 65 | 100% |
| **Total Otomatis** | **Jest** | **172** | **172** | **100%** |
| Acceptance Testing (UAT) | Manual Browser | 19 | Manual | — |
| API Automation | Postman/Newman | 28 req | — | Ready |
| UI E2E Automation | Playwright | 26 | — | Ready |

---

## Cara Menjalankan

```bash
# Backend
cd eduscale-backend && npm install && npm run dev
# → http://localhost:5000

# Frontend
cd eduscale-frontend && npm install && npm run dev
# → http://localhost:5173

# Seed data awal
cd eduscale-backend && node src/seeders/createUsers.js

# Jalankan semua automated tests
cd eduscale-backend && npx jest --forceExit
```

**Akun demo:** `admin@eduscale.com` / `admin123`

---

## Struktur Repositori

```
├── 01_Documents/                    # SRS & SDD
├── 02_Test_Plans_and_Reports/       # Master Test Plan, EP/BVA Matrix, Defect Log
├── 03_Test_Scripts_and_Automation/  # Jest, Playwright, Postman/Newman
├── eduscale-backend/                # Source code backend + tests
├── eduscale-frontend/               # Source code frontend
└── tests/                           # Load test (k6) & E2E (Playwright)
```

---

## Video Dokumentasi

🎬 YouTube: https://youtu.be/aXGByl2K4io

Reels IG : https://www.instagram.com/reel/DbuuT_JNrvM/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==
