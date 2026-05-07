/*
  Warnings:

  - Added the required column `productName` to the `ImportBatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImportBatch" ADD COLUMN     "productName" TEXT NOT NULL;
