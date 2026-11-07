# Day-1-Subway-Surfers-Muhammad Triarso Pascal

## Identitas
**Nama Lengkap:** Muhammad Triarso Pascal

## Deskripsi Repository
Repository ini dibuat sebagai tempat penyimpanan dan dokumentasi tugas selama mengikuti kegiatan workshop "Building with AI, Managing Change with GitHub"

## Tujuan Repository
Penyusunan repository ini bertujuan untuk memanfaatkan platform GitHub sebagai media penyimpanan, pengelolaan file secara terstruktur, dan publikasi dokumentasi proyek (khususnya proyek *Student Task Planner*)

### Rangkuman Materi
Materi hari ini berfokus pada dua topik utama: pemanfaatan AI melalui *Prompt Engineering* dan manajemen perubahan kode menggunakan Git dan GitHub
*   **Prompt Engineering:** Prompt adalah instruksi yang diberikan kepada model AI untuk mendapatkan hasil tertentu. Prompt yang baik harus dirancang secara spesifik dengan struktur yang terdiri dari *Role*, *Task*, *Context*, dan *Format*. Teknik ini menguntungkan karena dapat meningkatkan performa model AI, mengurangi bias, serta memberikan kontrol dan prediktabilitas yang lebih baik.
*   **Git vs GitHub:** Git merupakan *version control system* terdistribusi untuk melacak dan mengelola perubahan kode secara lokal. Sementara itu, GitHub adalah platform berbasis web untuk menyimpan repository Git secara *online* agar mempermudah kolaborasi.
*   **Git Workflow:** Alur kerja Git terdiri dari *Working Directory* (tempat memodifikasi file), *Staging Area* (tempat menyimpan informasi perubahan yang akan dimasukkan), dan *Git directory / Repository* (tempat Git menyimpan metadata dan database proyek).
*   **Otentikasi SSH:** Untuk menghubungkan Git lokal dengan GitHub secara aman, digunakan protokol SSH dengan algoritma Ed25519 (`ssh-keygen -t ed25519`) yang kemudian ditambahkan ke *SSH agent* dan pengaturan GitHub.

### Pengetahuan Baru & Poin Penting
*   Pemberian konteks (*Context*) dan penentuan peran (*Role*) pada AI terbukti memberikan hasil *coding* yang lebih akurat, seperti pada studi kasus pembuatan aplikasi web *Student Task Planner*.
*   Perintah dasar Git mencakup `git init` (memulai repo), `git add` (memindahkan file ke *staging area*), `git commit -m` (menyimpan file ke repo), dan `git push` (mendorong cabang saat ini ke *remote*).
*   Jika terjadi kesalahan eksekusi perintah, terminal Git dapat digunakan untuk melacak riwayat perubahan secara menyeluruh sebelum *file* benar-benar dipublikasikan ke GitHub.

### Pendapat Pribadi tentang Day 1
Sesi Day 1 sangat praktikal karena langsung menjembatani cara menggunakan AI generatif untuk menulis kode (melalui *prompt* yang terstruktur) dengan cara mengelola dan menyimpan kode tersebut layaknya alur kerja *developer* profesional menggunakan Git. Proyek penugasan *Student Task Planner* juga sangat relevan untuk menerapkan teori secara langsung.