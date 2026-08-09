/*
  Warnings:

  - Added the required column `content_hash` to the `legal_documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "legal_documents" ADD COLUMN     "content_hash" VARCHAR(128) NOT NULL;
