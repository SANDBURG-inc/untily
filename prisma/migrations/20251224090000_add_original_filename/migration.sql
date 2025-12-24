-- AlterTable: Add originalFilename column with data migration
ALTER TABLE "SubmittedDocument" ADD COLUMN "originalFilename" TEXT;

-- Copy existing filename values to originalFilename
UPDATE "SubmittedDocument" SET "originalFilename" = "filename" WHERE "originalFilename" IS NULL;

-- Set NOT NULL constraint
ALTER TABLE "SubmittedDocument" ALTER COLUMN "originalFilename" SET NOT NULL;
