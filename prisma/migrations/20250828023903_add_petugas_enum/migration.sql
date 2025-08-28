-- AlterEnum
ALTER TYPE "public"."TipePengguna" ADD VALUE 'PETUGAS';

-- AlterTable
ALTER TABLE "public"."peminjaman" ALTER COLUMN "tglMulai" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "tglSelesai" SET DATA TYPE TIMESTAMP(3);
