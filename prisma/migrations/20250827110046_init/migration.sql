-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('MAHASISWA', 'PETUGAS', 'EKSTERNAL');

-- CreateEnum
CREATE TYPE "public"."StatusPeminjaman" AS ENUM ('DIPROSES', 'DISETUJUI', 'DITOLAK', 'PERLU_REVISI');

-- CreateEnum
CREATE TYPE "public"."StatusBooking" AS ENUM ('TERSEDIA', 'TERBOOKED');

-- CreateEnum
CREATE TYPE "public"."StatusPembayaran" AS ENUM ('BELUM_BAYAR', 'SUDAH_BAYAR', 'VERIFIKASI');

-- CreateEnum
CREATE TYPE "public"."JenisNotifikasi" AS ENUM ('DISETUJUI', 'DITOLAK', 'REVISI', 'PEMBAYARAN');

-- CreateEnum
CREATE TYPE "public"."TipePengguna" AS ENUM ('MAHASISWA', 'EKSTERNAL');

-- CreateTable
CREATE TABLE "public"."pengguna" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "ssoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fasilitas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fasilitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jadwal_fasilitas" (
    "id" TEXT NOT NULL,
    "fasilitasId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "waktuMulai" TIME NOT NULL,
    "waktuSelesai" TIME NOT NULL,
    "statusBooking" "public"."StatusBooking" NOT NULL DEFAULT 'TERSEDIA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jadwal_fasilitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."peminjaman" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fasilitasId" TEXT NOT NULL,
    "tglMulai" DATE NOT NULL,
    "tglSelesai" DATE NOT NULL,
    "tujuan" TEXT NOT NULL,
    "keterangan" TEXT,
    "status" "public"."StatusPeminjaman" NOT NULL DEFAULT 'DIPROSES',
    "alasanTolak" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peminjaman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."surat_permohonan" (
    "id" TEXT NOT NULL,
    "peminjamanId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "tanggalTerbit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surat_permohonan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sip" (
    "id" TEXT NOT NULL,
    "peminjamanId" TEXT NOT NULL,
    "noSurat" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "tanggalTerbit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tagihan" (
    "id" TEXT NOT NULL,
    "peminjamanId" TEXT NOT NULL,
    "biaya" DECIMAL(10,2) NOT NULL,
    "statusPembayaran" "public"."StatusPembayaran" NOT NULL DEFAULT 'BELUM_BAYAR',
    "buktiTransferUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tagihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifikasi" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jenis" "public"."JenisNotifikasi" NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "tujuan" TEXT NOT NULL,
    "waktuKirim" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusDibaca" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."panduan" (
    "id" TEXT NOT NULL,
    "tipePengguna" "public"."TipePengguna" NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panduan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "peminjamanId" TEXT,
    "aksi" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "statusLama" TEXT,
    "statusBaru" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_email_key" ON "public"."pengguna"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_fasilitas_fasilitasId_tanggal_waktuMulai_waktuSelesa_key" ON "public"."jadwal_fasilitas"("fasilitasId", "tanggal", "waktuMulai", "waktuSelesai");

-- CreateIndex
CREATE UNIQUE INDEX "surat_permohonan_peminjamanId_key" ON "public"."surat_permohonan"("peminjamanId");

-- CreateIndex
CREATE UNIQUE INDEX "sip_peminjamanId_key" ON "public"."sip"("peminjamanId");

-- CreateIndex
CREATE UNIQUE INDEX "sip_noSurat_key" ON "public"."sip"("noSurat");

-- CreateIndex
CREATE UNIQUE INDEX "tagihan_peminjamanId_key" ON "public"."tagihan"("peminjamanId");

-- AddForeignKey
ALTER TABLE "public"."jadwal_fasilitas" ADD CONSTRAINT "jadwal_fasilitas_fasilitasId_fkey" FOREIGN KEY ("fasilitasId") REFERENCES "public"."fasilitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."peminjaman" ADD CONSTRAINT "peminjaman_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."peminjaman" ADD CONSTRAINT "peminjaman_fasilitasId_fkey" FOREIGN KEY ("fasilitasId") REFERENCES "public"."fasilitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."surat_permohonan" ADD CONSTRAINT "surat_permohonan_peminjamanId_fkey" FOREIGN KEY ("peminjamanId") REFERENCES "public"."peminjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sip" ADD CONSTRAINT "sip_peminjamanId_fkey" FOREIGN KEY ("peminjamanId") REFERENCES "public"."peminjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tagihan" ADD CONSTRAINT "tagihan_peminjamanId_fkey" FOREIGN KEY ("peminjamanId") REFERENCES "public"."peminjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifikasi" ADD CONSTRAINT "notifikasi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_log" ADD CONSTRAINT "audit_log_peminjamanId_fkey" FOREIGN KEY ("peminjamanId") REFERENCES "public"."peminjaman"("id") ON DELETE SET NULL ON UPDATE CASCADE;
