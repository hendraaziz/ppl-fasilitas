/*
  Warnings:

  - You are about to alter the column `biaya` on the `tagihan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - Changed the type of `waktuMulai` on the `jadwal_fasilitas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `waktuSelesai` on the `jadwal_fasilitas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."fasilitas" ADD COLUMN     "tersedia" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."jadwal_fasilitas" ALTER COLUMN "tanggal" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "waktuMulai",
ADD COLUMN     "waktuMulai" TIMESTAMP(3) NOT NULL,
DROP COLUMN "waktuSelesai",
ADD COLUMN     "waktuSelesai" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."tagihan" ALTER COLUMN "biaya" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_fasilitas_fasilitasId_tanggal_waktuMulai_waktuSelesa_key" ON "public"."jadwal_fasilitas"("fasilitasId", "tanggal", "waktuMulai", "waktuSelesai");
