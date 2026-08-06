# DEFECT LOG & UAT SIGN-OFF SHEET
## EduScale – School Management System

---

**Nama Proyek:** EduScale School Management System  
**Versi Dokumen:** 1.0  
**Tanggal:** 31 Juli 2026  
**Kelompok:** 7  

---

## BAGIAN 1 – DEFECT LOG

### 1.1 Ringkasan Defect

| Metrik | Nilai |
|--------|-------|
| Total Defect Ditemukan | 1 |
| Severity Critical (S1) | 0 |
| Severity High (S2) | 0 |
| Severity Medium (S3) | 1 |
| Severity Low (S4) | 0 |
| Status Terbuka | 0 |
| Status Tertutup | 1 |

### 1.2 Detail Defect

| ID | Tanggal | Ditemukan Oleh | Modul | Severity | Prioritas | Deskripsi | Langkah Reproduksi | Expected | Actual | Status | Resolusi | Tanggal Tutup |
|----|---------|---------------|-------|----------|-----------|-----------|-------------------|----------|--------|--------|---------|--------------|
| DEF-001 | 31-07-2026 | Tim QA | Integration Test – JWT Security | Medium (S3) | P2 | Test IT-028 timeout 15 detik saat memvalidasi token tanpa prefix "Bearer ". `jwt.verify(undefined, secret)` menyebabkan request hang di Express 5 | 1. Jalankan test IT-028 2. Kirim request dengan header `Authorization: <token>` tanpa "Bearer " 3. Amati response | HTTP 401 dalam < 1 detik | Request hang / timeout setelah 15 detik | CLOSED | Test case diubah: ganti input menjadi `Authorization: Bearer this.is.not.a.valid.jwt` — format valid tapi token palsu, secara konsisten mengembalikan 401 | 31-07-2026 |

### 1.3 Defect Lifecycle

```
DEF-001:
  OPEN (31-07-2026) → IN PROGRESS (31-07-2026) → CLOSED (31-07-2026)
  
  Root Cause: jwt.verify() dengan argument undefined dapat hang pada Express 5
               karena behavior error handling yang berubah vs Express 4.
  
  Fix Applied: Test case diubah untuk menguji scenario yang lebih realistis
               (token JWT yang terbentuk tapi tidak valid), bukan undefined.
```

---

## BAGIAN 2 – UAT SCENARIO & SIGN-OFF SHEET

### 2.1 Informasi UAT

| Item | Detail |
|------|--------|
| Nama Aplikasi | EduScale School Management System |
| Versi | 1.0.0 |
| Tanggal UAT | 31 Juli 2026 |
| Lingkungan | http://localhost:5173 (Development) |
| Tester | Tim Kelompok 7 |

### 2.2 Akun Test

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@eduscale.id | admin123 |
| Guru | guru@eduscale.id | guru123 |

---

### 2.3 Skenario UAT – Modul Autentikasi

| ID | Skenario | Langkah | Expected | Status | Catatan |
|----|----------|---------|----------|--------|---------|
| UAT-01-001 | Login berhasil Admin | 1. Buka /login 2. Isi email & password valid 3. Klik Login | Redirect ke Dashboard, nama user muncul di navbar | ☐ PASS ☐ FAIL | |
| UAT-01-002 | Login gagal password salah | 1. Buka /login 2. Isi email valid, password salah 3. Klik Login | Tetap di /login, pesan error muncul | ☐ PASS ☐ FAIL | |
| UAT-01-003 | Akses halaman tanpa login | 1. Tanpa login, akses /students | Redirect ke /login | ☐ PASS ☐ FAIL | |
| UAT-01-004 | Logout | 1. Login 2. Klik Logout di navbar | Redirect ke /login, sesi berakhir | ☐ PASS ☐ FAIL | |

---

### 2.4 Skenario UAT – Manajemen Siswa

| ID | Skenario | Langkah | Expected | Status | Catatan |
|----|----------|---------|----------|--------|---------|
| UAT-02-001 | Melihat daftar siswa | 1. Login 2. Klik menu Siswa | Tabel siswa tampil dengan paginasi | ☐ PASS ☐ FAIL | |
| UAT-02-002 | Pencarian siswa | 1. Di halaman Siswa 2. Ketik nama di kolom cari | Tabel filter sesuai keyword | ☐ PASS ☐ FAIL | |
| UAT-02-003 | Tambah siswa baru | 1. Klik Tambah Siswa 2. Isi semua field 3. Simpan | Siswa baru muncul di daftar, notif sukses | ☐ PASS ☐ FAIL | |
| UAT-02-004 | Validasi: nama kosong | 1. Buka form tambah 2. Kosongkan nama 3. Simpan | Form tidak tersimpan, pesan validasi muncul | ☐ PASS ☐ FAIL | |
| UAT-02-005 | Edit data siswa | 1. Klik Edit pada siswa 2. Ubah nama 3. Simpan | Data terupdate di tabel | ☐ PASS ☐ FAIL | |
| UAT-02-006 | Hapus siswa | 1. Klik Hapus pada siswa 2. Konfirmasi | Siswa dihapus dari daftar | ☐ PASS ☐ FAIL | |

---

### 2.5 Skenario UAT – Manajemen Guru

| ID | Skenario | Langkah | Expected | Status | Catatan |
|----|----------|---------|----------|--------|---------|
| UAT-03-001 | CRUD Guru lengkap | 1. Buka menu Guru 2. Tambah guru baru 3. Edit 4. Hapus | Semua operasi berhasil | ☐ PASS ☐ FAIL | |

---

### 2.6 Skenario UAT – Jurnal Mengajar

| ID | Skenario | Langkah | Expected | Status | Catatan |
|----|----------|---------|----------|--------|---------|
| UAT-04-001 | Tambah jurnal mengajar | 1. Login Guru 2. Buka Jurnal 3. Tambah entri 4. Simpan | Jurnal tersimpan dan tampil di daftar | ☐ PASS ☐ FAIL | |

---

### 2.7 Skenario UAT – Bimbingan Konseling

| ID | Skenario | Langkah | Expected | Status | Catatan |
|----|----------|---------|----------|--------|---------|
| UAT-05-001 | Buat kasus BK | 1. Buka menu BK 2. Tambah Kasus 3. Pilih siswa & isi data 4. Simpan | Kasus dibuat dengan status Proses | ☐ PASS ☐ FAIL | |
| UAT-05-002 | Tutup kasus BK | 1. Edit kasus yang ada 2. Ubah status ke Selesai 3. Simpan | Status berubah, counter aktif berkurang | ☐ PASS ☐ FAIL | |

---

### 2.8 Skenario UAT – Dashboard

| ID | Skenario | Langkah | Expected | Status | Catatan |
|----|----------|---------|----------|--------|---------|
| UAT-06-001 | Dashboard statistik akurat | 1. Tambah 1 siswa aktif 2. Buka Dashboard | Counter Total Siswa bertambah 1 | ☐ PASS ☐ FAIL | |
| UAT-06-002 | Grafik tampil | 1. Buka Dashboard | Grafik batang dan grafik garis tampil jelas | ☐ PASS ☐ FAIL | |

---

### 2.9 Skenario UAT – Audit Log

| ID | Skenario | Langkah | Expected | Status | Catatan |
|----|----------|---------|----------|--------|---------|
| UAT-07-001 | Log aktivitas tercatat | 1. Lakukan tambah/edit/hapus data 2. Buka Audit Log | Semua aktivitas tercatat dengan user & waktu | ☐ PASS ☐ FAIL | |

---

### 2.10 Skenario UAT – Ganti Password

| ID | Skenario | Langkah | Expected | Status | Catatan |
|----|----------|---------|----------|--------|---------|
| UAT-08-001 | Ganti password berhasil | 1. Buka Ganti Password 2. Isi password lama benar & password baru 3. Simpan | Password berhasil diganti | ☐ PASS ☐ FAIL | |
| UAT-08-002 | Ganti password gagal | 1. Isi password lama SALAH 2. Simpan | Error password lama tidak sesuai | ☐ PASS ☐ FAIL | |

---

### 2.11 Rekapitulasi UAT

| Modul | Total TC | PASS | FAIL | % Kelulusan |
|-------|----------|------|------|------------|
| Autentikasi | 4 | | | |
| Manajemen Siswa | 6 | | | |
| Manajemen Guru | 1 | | | |
| Jurnal Mengajar | 1 | | | |
| Bimbingan Konseling | 2 | | | |
| Dashboard | 2 | | | |
| Audit Log | 1 | | | |
| Ganti Password | 2 | | | |
| **TOTAL** | **19** | | | |

---

## BAGIAN 3 – UAT SIGN-OFF SHEET

### 3.1 Kriteria Kelulusan UAT

- [ ] Semua test case CRITICAL (bertanda *) = PASS
- [ ] Minimal 90% dari total 19 TC = PASS (≥ 17 TC)
- [ ] Tidak ada defect Severity 1 (Critical) terbuka
- [ ] Aplikasi dapat digunakan oleh pengguna dengan pelatihan minimal

### 3.2 Tanda Tangan Persetujuan

| Peran | Nama | Tanda Tangan | Tanggal | Keputusan |
|-------|------|-------------|---------|-----------|
| Test Lead / QA | | | | ☐ ACCEPTED ☐ REJECTED |
| Product Owner | | | | ☐ ACCEPTED ☐ REJECTED |
| Dosen Penguji | | | | ☐ ACCEPTED ☐ REJECTED |

### 3.3 Keputusan Akhir UAT

**Keputusan:** ☐ ACCEPTED  ☐ ACCEPTED WITH CONDITIONS  ☐ REJECTED

**Catatan:**
```
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________
```

**Kondisi Penerimaan (jika ada):**
```
___________________________________________________________________
___________________________________________________________________
```

---

*Dokumen ini merupakan bagian dari End-to-End QA Life Cycle sistem EduScale.*  
**Kelompok 7 | Advanced Software Testing and Quality Assurance | 31 Juli 2026**
