/*
  Warnings:

  - You are about to drop the column `ssoId` on the `pengguna` table. All the data in the column will be lost.
  - Added the required column `tipePengguna` to the `pengguna` table without a default value. This is not possible if the table is not empty.

*/
-- First, add new columns with nullable constraint
ALTER TABLE "public"."pengguna" 
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiry" TIMESTAMP(3),
ADD COLUMN     "password" TEXT,
ADD COLUMN     "tipePengguna" "public"."TipePengguna";

-- Migrate existing ssoId to googleId
UPDATE "public"."pengguna" SET "googleId" = "ssoId" WHERE "ssoId" IS NOT NULL;

-- Set tipePengguna based on role
UPDATE "public"."pengguna" SET "tipePengguna" = 'MAHASISWA' WHERE "role" = 'MAHASISWA';
UPDATE "public"."pengguna" SET "tipePengguna" = 'EKSTERNAL' WHERE "role" = 'EKSTERNAL';
UPDATE "public"."pengguna" SET "tipePengguna" = 'EKSTERNAL' WHERE "role" = 'PETUGAS'; -- Petugas treated as eksternal for tipePengguna

-- Now make tipePengguna NOT NULL
ALTER TABLE "public"."pengguna" ALTER COLUMN "tipePengguna" SET NOT NULL;

-- Finally, drop the old ssoId column
ALTER TABLE "public"."pengguna" DROP COLUMN "ssoId";
