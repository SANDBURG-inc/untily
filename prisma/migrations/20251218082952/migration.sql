/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,documentBoxId]` on the table `Logo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LogoType" AS ENUM ('DEFAULT', 'DOCUMENT_BOX');

-- DropIndex
DROP INDEX "Logo_userId_key";

-- AlterTable
ALTER TABLE "Logo" ADD COLUMN     "documentBoxId" TEXT,
ADD COLUMN     "type" "LogoType" NOT NULL DEFAULT 'DEFAULT';

-- CreateIndex
CREATE INDEX "Logo_documentBoxId_idx" ON "Logo"("documentBoxId");

-- CreateIndex
CREATE UNIQUE INDEX "Logo_userId_type_documentBoxId_key" ON "Logo"("userId", "type", "documentBoxId");

-- AddForeignKey
ALTER TABLE "Logo" ADD CONSTRAINT "Logo_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE SET NULL ON UPDATE CASCADE;
