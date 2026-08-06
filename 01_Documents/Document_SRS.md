# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## EduScale – Sistem Manajemen Sekolah Berbasis Web

---

**Nama Proyek:** EduScale School Management System  
**Versi Dokumen:** 1.0  
**Tanggal:** 31 Juli 2026  
**Kelompok:** 7  
**Mata Kuliah:** Scalable System Design – Final Project  

---

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Deskripsi Umum Sistem](#2-deskripsi-umum-sistem)
3. [Kebutuhan Fungsional](#3-kebutuhan-fungsional)
4. [Kebutuhan Non-Fungsional](#4-kebutuhan-non-fungsional)
5. [Batasan Sistem](#5-batasan-sistem)
6. [Use Case Diagram (Deskripsi Tekstual)](#6-use-case-diagram-deskripsi-tekstual)
7. [Antarmuka Pengguna](#7-antarmuka-pengguna)
8. [Asumsi dan Dependensi](#8-asumsi-dan-dependensi)

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen
Dokumen ini merupakan Spesifikasi Kebutuhan Perangkat Lunak (Software Requirements Specification) untuk sistem **EduScale**, sebuah aplikasi manajemen sekolah berbasis web yang scalable. Dokumen ini menjadi baseline pengujian dan acuan pengembangan seluruh fitur sistem.

### 1.2 Lingkup Produk
EduScale adalah platform manajemen akademik digital yang mengintegrasikan pengelolaan siswa, guru, kelas, mata pelajaran, jurnal mengajar, layanan bimbingan konseling (BK), serta pelaporan akademik dalam satu sistem terpadu berbasis web.

### 1.3 Definisi, Akronim, dan Singkatan

| Istilah | Penjelasan |
|---------|------------|
| SRS | Software Requirements Specification |
| SDD | Software Design Document |
| API | Application Programming Interface |
| JWT | JSON Web Token |
| BK | Bimbingan Konseling |
| NIS | Nomor Induk Siswa |
| NIP | Nomor Induk Pegawai |
| CRUD | Create, Read, Update, Delete |
| ORM | Object Relational Mapping |
| RBAC | Role-Based Access Control |

### 1.4 Referensi
- IEEE Std 830-1998: IEEE Recommended Practice for Software Requirements Specifications
- Express.js Documentation – https://expressjs.com
- Sequelize ORM Documentation – https://sequelize.org
- React.js Documentation – https://react.dev
- OWASP Top 10 Security Guidelines – https://owasp.org

### 1.5 Gambaran Dokumen
Dokumen ini disusun mengikuti struktur standar IEEE 830-1998 yang mencakup deskripsi umum, kebutuhan fungsional dan non-fungsional, batasan sistem, serta spesifikasi antarmuka pengguna.

---

## 2. Deskripsi Umum Sistem

### 2.1 Perspektif Produk
EduScale merupakan aplikasi web mandiri (standalone) yang terdiri atas dua komponen utama:
- **Backend REST API** – dibangun menggunakan Node.js + Express.js, terhubung ke database PostgreSQL melalui Sequelize ORM.
- **Frontend SPA** – dibangun menggunakan React.js + Vite + TailwindCSS, berkomunikasi dengan backend melalui HTTP REST API.

### 2.2 Fungsi Produk
Sistem EduScale menyediakan fungsi-fungsi utama berikut:
1. Autentikasi dan otorisasi pengguna berbasis role
2. Manajemen data siswa (tambah, ubah, hapus, impor, ekspor)
3. Manajemen data guru
4. Manajemen kelas dan tahun ajaran
5. Manajemen mata pelajaran
6. Jurnal mengajar harian guru
7. Layanan Bimbingan Konseling (kasus, konseling, pelanggaran, prestasi)
8. Dashboard analitik dengan grafik
9. Audit log aktivitas pengguna
10. Manajemen pengguna dan role akses

### 2.3 Karakteristik Pengguna

| Peran | Deskripsi | Akses |
|-------|-----------|-------|
| Admin | Administrator sekolah | Akses penuh ke seluruh modul |
| Guru | Tenaga pengajar | Akses baca data siswa/kelas, kelola jurnal mengajar sendiri |
| BK | Konselor | Akses modul BK, baca data siswa |

### 2.4 Batasan Operasi
- Sistem beroperasi melalui browser web modern (Chrome, Firefox, Edge, Safari terbaru)
- Koneksi internet diperlukan untuk mengakses sistem
- Database PostgreSQL harus tersedia dan terhubung
- Token JWT memiliki masa berlaku 1 hari (1d)

### 2.5 Asumsi dan Dependensi
- Server backend berjalan pada port default 5000
- Frontend berjalan pada port default 5173 (Vite development)
- Database PostgreSQL tersedia dan dikonfigurasi melalui variabel environment `.env`
- JWT_SECRET dikonfigurasi melalui variabel environment

---

## 3. Kebutuhan Fungsional

### 3.1 Modul Autentikasi

#### FR-AUTH-001: Registrasi Pengguna
- **Deskripsi:** Admin dapat membuat akun pengguna baru dengan nama, email, password, dan role.
- **Input:** name, email, password, role_id
- **Output:** Pesan sukses + data pengguna baru
- **Aturan Bisnis:**
  - Email harus unik dalam sistem
  - Password di-hash dengan bcrypt (10 salt rounds)
  - Role harus merupakan role yang valid

#### FR-AUTH-002: Login Pengguna
- **Deskripsi:** Pengguna dapat masuk ke sistem menggunakan email dan password.
- **Input:** email, password
- **Output:** JWT token + data pengguna (nama, email, role)
- **Aturan Bisnis:**
  - Email harus terdaftar
  - Password harus cocok dengan hash tersimpan
  - Token JWT berlaku selama 1 hari

#### FR-AUTH-003: Akses Profil
- **Deskripsi:** Pengguna yang terautentikasi dapat melihat profil diri sendiri.
- **Input:** JWT Bearer Token
- **Output:** Data profil pengguna dengan role

#### FR-AUTH-004: Ganti Password
- **Deskripsi:** Pengguna dapat mengganti password akun sendiri.
- **Input:** password lama, password baru
- **Output:** Pesan sukses

---

### 3.2 Modul Manajemen Siswa

#### FR-SISWA-001: Melihat Daftar Siswa
- **Deskripsi:** Pengguna terautentikasi dapat melihat daftar seluruh siswa.
- **Fitur:** Pencarian (nama/NIS), filter kelas, filter status, paginasi
- **Output:** Array data siswa + total + halaman

#### FR-SISWA-002: Melihat Detail Siswa
- **Deskripsi:** Pengguna dapat melihat detail lengkap satu siswa berdasarkan ID.
- **Output:** Data siswa beserta nama kelas

#### FR-SISWA-003: Tambah Siswa
- **Deskripsi:** Admin dapat menambahkan data siswa baru.
- **Input:** nis, name, gender, birth_place, birth_date, address, phone, parent_name, status, class_id
- **Akses:** Admin only
- **Output:** Data siswa baru + log aktivitas

#### FR-SISWA-004: Update Data Siswa
- **Deskripsi:** Admin dapat mengubah data siswa yang ada.
- **Akses:** Admin only
- **Output:** Data siswa terupdate + log aktivitas

#### FR-SISWA-005: Hapus Siswa
- **Deskripsi:** Admin dapat menghapus data siswa.
- **Akses:** Admin only
- **Output:** Pesan sukses + log aktivitas

#### FR-SISWA-006: Update Status Siswa
- **Deskripsi:** Admin dapat mengubah status siswa (Aktif/Lulus/Pindah/Keluar).
- **Akses:** Admin only

#### FR-SISWA-007: Import Data Siswa (Massal)
- **Deskripsi:** Admin dapat mengimpor data siswa dari file (JSON/CSV).
- **Akses:** Admin only

#### FR-SISWA-008: Export Data Siswa
- **Deskripsi:** Admin dapat mengekspor data siswa ke format CSV.
- **Akses:** Admin only

---

### 3.3 Modul Manajemen Guru

#### FR-GURU-001: Melihat Daftar Guru
- **Deskripsi:** Pengguna terautentikasi dapat melihat daftar seluruh guru.
- **Fitur:** Pencarian (nama/NIP), paginasi

#### FR-GURU-002: Tambah Guru
- **Deskripsi:** Admin dapat menambahkan data guru baru.
- **Input:** nip, name, gender, phone, address, specialization, status
- **Akses:** Admin only

#### FR-GURU-003: Update Data Guru
- **Deskripsi:** Admin dapat mengubah data guru.
- **Akses:** Admin only

#### FR-GURU-004: Hapus Guru
- **Deskripsi:** Admin dapat menghapus data guru.
- **Akses:** Admin only

---

### 3.4 Modul Manajemen Kelas

#### FR-KELAS-001: Melihat Daftar Kelas
- **Deskripsi:** Pengguna terautentikasi dapat melihat semua kelas.

#### FR-KELAS-002: Tambah Kelas
- **Deskripsi:** Admin dapat menambahkan kelas baru dengan wali kelas dan tahun ajaran.
- **Akses:** Admin only

#### FR-KELAS-003: Update Kelas
- **Deskripsi:** Admin dapat mengubah data kelas.
- **Akses:** Admin only

#### FR-KELAS-004: Hapus Kelas
- **Deskripsi:** Admin dapat menghapus kelas.
- **Akses:** Admin only

---

### 3.5 Modul Mata Pelajaran

#### FR-MAPEL-001: Melihat Daftar Mata Pelajaran
- **Deskripsi:** Pengguna terautentikasi dapat melihat daftar mata pelajaran.

#### FR-MAPEL-002: CRUD Mata Pelajaran
- **Deskripsi:** Admin dapat mengelola mata pelajaran (tambah, ubah, hapus).
- **Akses:** Admin only

---

### 3.6 Modul Jurnal Mengajar

#### FR-JURNAL-001: Melihat Daftar Jurnal
- **Deskripsi:** Pengguna terautentikasi dapat melihat jurnal mengajar.
- **Fitur:** Filter berdasarkan guru, kelas, mata pelajaran, semester, tanggal

#### FR-JURNAL-002: Tambah Jurnal Mengajar
- **Deskripsi:** Guru dapat menambahkan entri jurnal mengajar harian.
- **Input:** teacher_id, class_id, subject_id, semester_id, date, topic, description, attendance_count

#### FR-JURNAL-003: Update dan Hapus Jurnal
- **Deskripsi:** Guru/Admin dapat mengubah atau menghapus jurnal mengajar.

---

### 3.7 Modul Bimbingan Konseling (BK)

#### FR-BK-001: Manajemen Kasus BK
- **Deskripsi:** Pengelolaan kasus bimbingan siswa.
- **Input:** student_id, type, description, date, status
- **Status:** Proses / Selesai

#### FR-BK-002: Catatan Konseling
- **Deskripsi:** Pencatatan sesi konseling untuk setiap kasus BK.

#### FR-BK-003: Pelanggaran Siswa
- **Deskripsi:** Pencatatan pelanggaran yang dilakukan siswa.
- **Input:** student_id, type, description, date, points

#### FR-BK-004: Prestasi Siswa
- **Deskripsi:** Pencatatan prestasi atau penghargaan siswa.
- **Input:** student_id, type, title, level, date

---

### 3.8 Modul Dashboard

#### FR-DASHBOARD-001: Statistik Utama
- **Deskripsi:** Menampilkan statistik: total siswa aktif, total guru, total kelas, kasus BK aktif, jurnal bulan ini.

#### FR-DASHBOARD-002: Grafik Data
- **Deskripsi:** Menampilkan grafik jumlah siswa per kelas dan jurnal mengajar 6 bulan terakhir.

#### FR-DASHBOARD-003: Aktivitas Terbaru
- **Deskripsi:** Menampilkan 10 aktivitas terbaru dalam sistem.

---

### 3.9 Modul Audit Log

#### FR-LOG-001: Catat Aktivitas
- **Deskripsi:** Sistem secara otomatis mencatat setiap operasi penting (tambah/ubah/hapus) ke dalam log aktivitas.
- **Data dicatat:** user_id, action, description, timestamp

#### FR-LOG-002: Tampilkan Log
- **Deskripsi:** Admin dapat melihat semua log aktivitas dengan informasi pengguna.

---

### 3.10 Modul Manajemen Pengguna & Role

#### FR-USER-001: Melihat Daftar Pengguna
- **Akses:** Admin only

#### FR-USER-002: CRUD Pengguna
- **Deskripsi:** Admin dapat mengelola akun pengguna sistem.
- **Akses:** Admin only

#### FR-USER-003: Manajemen Role
- **Deskripsi:** Sistem mendukung role: Admin, Guru, BK.

---

### 3.11 Modul Tahun Ajaran

#### FR-TA-001: CRUD Tahun Ajaran
- **Deskripsi:** Admin dapat mengelola data tahun ajaran dan semester.
- **Akses:** Admin only

---

## 4. Kebutuhan Non-Fungsional

### 4.1 Performa (Performance)

| ID | Kebutuhan | Metrik |
|----|-----------|--------|
| NFR-PERF-001 | Waktu respons API untuk operasi baca | < 500ms (95th percentile) |
| NFR-PERF-002 | Waktu respons API untuk operasi tulis | < 1000ms (95th percentile) |
| NFR-PERF-003 | Dashboard load time | < 2 detik |
| NFR-PERF-004 | Kapasitas concurrent users | ≥ 50 pengguna simultan |
| NFR-PERF-005 | Request throughput | ≥ 100 request/detik |

### 4.2 Keamanan (Security)

| ID | Kebutuhan |
|----|-----------|
| NFR-SEC-001 | Semua endpoint (kecuali login/register) memerlukan JWT Bearer Token |
| NFR-SEC-002 | Password di-hash menggunakan bcrypt dengan salt ≥ 10 |
| NFR-SEC-003 | Token JWT memiliki expiry time (1 hari) |
| NFR-SEC-004 | Endpoint admin dilindungi middleware Role-Based Access Control |
| NFR-SEC-005 | Request body dibatasi maksimal 10MB untuk mencegah DoS |
| NFR-SEC-006 | CORS dikonfigurasi untuk membatasi origin yang diizinkan |

### 4.3 Kehandalan (Reliability)

| ID | Kebutuhan |
|----|-----------|
| NFR-REL-001 | Availability sistem ≥ 99% (non-maintenance) |
| NFR-REL-002 | Sistem menangani error database dengan pesan yang informatif |
| NFR-REL-003 | Semua error API mengembalikan HTTP status code yang sesuai |

### 4.4 Skalabilitas (Scalability)

| ID | Kebutuhan |
|----|-----------|
| NFR-SCAL-001 | Arsitektur RESTful memungkinkan horizontal scaling |
| NFR-SCAL-002 | Paginasi diterapkan pada semua endpoint list |
| NFR-SCAL-003 | Query database dioptimalkan dengan index |

### 4.5 Kegunaan (Usability)

| ID | Kebutuhan |
|----|-----------|
| NFR-USE-001 | Antarmuka responsif (mobile-friendly) dengan TailwindCSS |
| NFR-USE-002 | Navigasi intuitif menggunakan sidebar dan navbar |
| NFR-USE-003 | Pesan error dan sukses ditampilkan kepada pengguna |
| NFR-USE-004 | Loading state ditampilkan saat data sedang dimuat |

### 4.6 Pemeliharaan (Maintainability)

| ID | Kebutuhan |
|----|-----------|
| NFR-MAINT-001 | Arsitektur MVC digunakan pada backend (Model, Controller, Route) |
| NFR-MAINT-002 | Variabel environment dikelola melalui file `.env` |
| NFR-MAINT-003 | Kode dikelompokkan per modul fungsional |

---

## 5. Batasan Sistem

### 5.1 Batasan Perangkat Keras
- Server dengan RAM minimal 1GB untuk menjalankan Node.js + PostgreSQL
- Klien memerlukan browser modern dengan JavaScript diaktifkan

### 5.2 Batasan Perangkat Lunak
- Node.js versi ≥ 18.x
- PostgreSQL versi ≥ 13.x
- npm versi ≥ 9.x

### 5.3 Batasan Keamanan
- Sistem tidak mendukung autentikasi dua faktor (2FA)
- Tidak ada session server-side, hanya JWT stateless
- Tidak ada rate limiting bawaan (direkomendasikan untuk implementasi production)

---

## 6. Use Case Diagram (Deskripsi Tekstual)

### UC-01: Login ke Sistem
- **Aktor:** Admin, Guru, BK
- **Prasyarat:** Pengguna memiliki akun
- **Alur Normal:** Pengguna memasukkan email + password → Sistem memvalidasi → Sistem mengembalikan token JWT + redirect ke dashboard
- **Alur Alternatif:** Email/password salah → Sistem menampilkan pesan error

### UC-02: Kelola Data Siswa
- **Aktor:** Admin
- **Prasyarat:** Admin telah login
- **Alur Normal:** Admin mengakses menu Siswa → CRUD data siswa → Sistem menyimpan + mencatat ke log

### UC-03: Kelola Jurnal Mengajar
- **Aktor:** Guru
- **Prasyarat:** Guru telah login
- **Alur Normal:** Guru mengakses menu Jurnal → Tambah entri jurnal → Sistem menyimpan

### UC-04: Kelola Kasus BK
- **Aktor:** Admin, BK
- **Prasyarat:** Pengguna telah login
- **Alur Normal:** Konselor membuat kasus BK untuk siswa → Menambahkan catatan konseling → Update status kasus

### UC-05: Melihat Dashboard
- **Aktor:** Semua peran
- **Prasyarat:** Pengguna telah login
- **Alur Normal:** Pengguna membuka halaman utama → Sistem menampilkan statistik, grafik, dan aktivitas terbaru

---

## 7. Antarmuka Pengguna

### 7.1 Halaman Login
- Form email dan password
- Tombol login
- Penanganan error validasi

### 7.2 Layout Admin (Setelah Login)
- Sidebar navigasi: Dashboard, Siswa, Guru, Kelas, Mata Pelajaran, Jurnal, BK, Pengguna, Audit Log
- Navbar atas: nama pengguna + tombol logout
- Area konten utama

### 7.3 Halaman Dashboard
- 5 kartu statistik (Total Siswa, Guru, Kelas, Kasus BK Aktif, Jurnal Bulan Ini)
- Grafik batang: jumlah siswa per kelas
- Grafik garis: jurnal 6 bulan terakhir
- Tabel aktivitas terbaru

### 7.4 Halaman Data (Siswa/Guru/dll.)
- Tabel data dengan kolom informatif
- Fitur pencarian/filter
- Tombol Tambah, Edit, Hapus
- Paginasi

---

## 8. Asumsi dan Dependensi

### 8.1 Asumsi
- Pengguna memiliki akses internet yang stabil
- Browser klien mendukung JavaScript modern (ES2020+)
- Administrator telah mengkonfigurasi variabel environment dengan benar

### 8.2 Dependensi Eksternal

| Dependensi | Versi | Tujuan |
|-----------|-------|--------|
| express | ^5.2.1 | Framework web backend |
| sequelize | ^6.37.8 | ORM untuk PostgreSQL |
| bcrypt | ^6.0.0 | Hash password |
| jsonwebtoken | ^9.0.3 | Autentikasi JWT |
| pg | ^8.22.0 | Driver PostgreSQL |
| react | ^19.2.7 | Framework frontend |
| axios | ^1.18.1 | HTTP client frontend |
| tailwindcss | ^4.3.2 | CSS utility framework |
| chart.js | ^4.5.1 | Visualisasi grafik |

---

*Dokumen ini merupakan baseline yang digunakan sebagai acuan pengujian End-to-End Quality Assurance.*

**Versi:** 1.0 | **Tanggal:** 31 Juli 2026 | **Kelompok:** 7
