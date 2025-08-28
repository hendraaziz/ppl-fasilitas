# Sistem Booking Fasilitas Kampus

Sistem manajemen dan pemesanan fasilitas kampus yang dibangun dengan Next.js dan PostgreSQL. Aplikasi ini memungkinkan mahasiswa, petugas, dan pengguna eksternal untuk memesan dan mengelola fasilitas kampus secara online.

## 🚀 Tech Stack

### Frontend
- **Next.js 15.5.2** - React framework dengan App Router
- **React 19.1.0** - Library UI
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling framework
- **Radix UI** - Komponen UI primitif
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Lucide React** - Icon library
- **React Query (TanStack)** - Data fetching dan caching

### Backend
- **Next.js API Routes** - Backend API
- **NextAuth.js v5** - Authentication
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **JWT (jsonwebtoken)** - Token management
- **Nodemailer** - Email service
- **Socket.io** - Real-time communication

### Development Tools
- **ESLint** - Code linting
- **tsx** - TypeScript execution
- **ExcelJS** - Excel file handling
- **Multer** - File upload handling

## ✨ Fitur Utama

### 🔐 Sistem Autentikasi
- Login dengan Google OAuth
- Login dengan kredensial (email/password)
- Verifikasi OTP untuk pengguna eksternal
- Role-based access control (Mahasiswa, Petugas, Eksternal)

### 👥 Manajemen Pengguna
- Registrasi pengguna baru
- Profil pengguna dengan foto
- Edit profil (nama, telepon, alamat, tanggal lahir)
- Manajemen role dan tipe pengguna

### 🏢 Manajemen Fasilitas
- CRUD fasilitas kampus
- Upload gambar fasilitas
- Status ketersediaan fasilitas
- Kapasitas dan deskripsi fasilitas
- Kategori fasilitas

### 📅 Sistem Booking
- Pemesanan fasilitas berdasarkan jadwal
- Kalender booking interaktif
- Status booking (Pending, Approved, Rejected, Cancelled)
- Riwayat booking pengguna
- Notifikasi booking

### 📊 Dashboard & Laporan
- Dashboard statistik untuk admin
- Laporan booking dalam format Excel
- Audit log sistem
- Real-time updates dengan Socket.io

### 📖 Sistem Panduan
- Panduan penggunaan untuk setiap role
- Tutorial step-by-step
- FAQ dan dokumentasi

## 🔄 Alur Aplikasi

### Alur Autentikasi
1. **Login** → Pilih metode login (Google/Kredensial)
2. **Verifikasi** → OTP untuk pengguna eksternal
3. **Dashboard** → Redirect berdasarkan role

### Alur Booking Fasilitas
1. **Browse Fasilitas** → Lihat daftar fasilitas tersedia
2. **Pilih Jadwal** → Pilih tanggal dan waktu
3. **Form Booking** → Isi detail pemesanan
4. **Submit** → Kirim permintaan booking
5. **Approval** → Menunggu persetujuan petugas
6. **Konfirmasi** → Notifikasi status booking

### Alur Manajemen (Petugas)
1. **Dashboard Admin** → Lihat statistik dan pending bookings
2. **Review Booking** → Approve/reject booking requests
3. **Kelola Fasilitas** → CRUD fasilitas
4. **Kelola Pengguna** → Manajemen user accounts
5. **Generate Laporan** → Export data ke Excel

## 🛠️ Instalasi & Setup

### Prerequisites
- Node.js (v18 atau lebih baru)
- PostgreSQL database
- npm atau yarn package manager
- Git

### 1. Clone Repository
```bash
git clone https://github.com/hendraaziz/ppl-fasilitas.git
cd fasilitas-booking
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` di root directory:

```env
# Database (Local PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/fasilitas_booking"

# Atau gunakan Cloud Database (Neon, Supabase, dll)
# DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# JWT Secret
JWT_SECRET="your-jwt-secret-key"

# Email Configuration (Optional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Upload Directory
UPLOAD_DIR="./public/uploads"
```

### 4. Setup Database

#### Buat Database PostgreSQL
```sql
CREATE DATABASE fasilitas_booking;
```

#### Jalankan Migrasi Prisma
```bash
npx prisma migrate dev
```

#### Seed Database dengan Data Awal
```bash
npm run db:seed
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📝 Data Seeding

Setelah menjalankan seeding, akan tersedia:

### Default Users
- **Admin**: `admin@ugm.ac.id` / `admin123`
- **Mahasiswa**: `mahasiswa@example.com` / `password123`
- **Petugas**: `petugas@example.com` / `password123`
- **Eksternal**: `eksternal@example.com` / `password123`

### Sample Data
- 4 pengguna dengan berbagai role
- 5 fasilitas kampus
- 155 slot jadwal untuk seminggu ke depan
- 6 data dummy peminjaman untuk Agustus 2025
- 2 panduan (untuk Mahasiswa dan Eksternal)

## 🚀 Production Deployment

### 1. Build Aplikasi
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

### 3. Environment Variables Production
Pastikan semua environment variables sudah diset dengan nilai production:
- `DATABASE_URL` → Production PostgreSQL URL
- `NEXTAUTH_URL` → Production domain
- `NEXTAUTH_SECRET` → Strong secret key
- Email dan OAuth credentials

## 📁 Struktur Project

```
fasilitas-booking/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility libraries
│   ├── types/             # TypeScript types
│   └── middleware.ts      # Next.js middleware
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts           # Database seeding
│   └── migrations/       # Database migrations
├── public/               # Static assets
└── package.json         # Dependencies
```

## 🔧 Scripts Tersedia

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:seed     # Seed database
npm run db:reset    # Reset dan seed database

# Code Quality
npm run lint        # Run ESLint
```

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Project ini menggunakan MIT License.

## 🆘 Troubleshooting

### Database Connection Issues
- Pastikan PostgreSQL berjalan
- Cek DATABASE_URL di `.env.local`
- Jalankan `npx prisma db push` jika ada masalah schema

### Authentication Issues
- Cek NEXTAUTH_SECRET dan NEXTAUTH_URL
- Pastikan Google OAuth credentials benar (jika digunakan)

### Build Issues
- Hapus `.next` folder dan `node_modules`
- Jalankan `npm install` dan `npm run build` lagi

### Seeding Issues
- Pastikan database kosong sebelum seeding
- Jalankan `npm run db:reset` untuk reset complete

## 📞 Support

Jika mengalami masalah, silakan buat issue di repository atau hubungi tim development.
