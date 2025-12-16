-- CreateEnum
CREATE TYPE "RemindType" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "SubmitterStatus" AS ENUM ('PENDING', 'SUBMITTED');

-- CreateTable
CREATE TABLE "Logo" (
    "logoId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Logo_pkey" PRIMARY KEY ("logoId")
);

-- CreateTable
CREATE TABLE "DocumentBox" (
    "documentBoxId" TEXT NOT NULL,
    "boxTitle" TEXT NOT NULL,
    "boxDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DocumentBox_pkey" PRIMARY KEY ("documentBoxId")
);

-- CreateTable
CREATE TABLE "RequiredDocument" (
    "requiredDocumentId" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentDescription" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "documentBoxId" TEXT NOT NULL,

    CONSTRAINT "RequiredDocument_pkey" PRIMARY KEY ("requiredDocumentId")
);

-- CreateTable
CREATE TABLE "Submitter" (
    "submitterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "documentBoxId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "SubmitterStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "Submitter_pkey" PRIMARY KEY ("submitterId")
);

-- CreateTable
CREATE TABLE "SubmittedDocument" (
    "submittedDocumentId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredDocumentId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,

    CONSTRAINT "SubmittedDocument_pkey" PRIMARY KEY ("submittedDocumentId")
);

-- CreateTable
CREATE TABLE "DocumentBoxRemindType" (
    "documentBoxId" TEXT NOT NULL,
    "remindType" "RemindType" NOT NULL,

    CONSTRAINT "DocumentBoxRemindType_pkey" PRIMARY KEY ("documentBoxId","remindType")
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL,
    "documentBoxId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "RemindType" NOT NULL,
    "isAuto" BOOLEAN NOT NULL,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderRecipient" (
    "id" TEXT NOT NULL,
    "reminderLogId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,

    CONSTRAINT "ReminderRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Logo_userId_key" ON "Logo"("userId");

-- CreateIndex
CREATE INDEX "Logo_userId_idx" ON "Logo"("userId");

-- CreateIndex
CREATE INDEX "DocumentBox_userId_idx" ON "DocumentBox"("userId");

-- CreateIndex
CREATE INDEX "Submitter_userId_idx" ON "Submitter"("userId");

-- CreateIndex
CREATE INDEX "Submitter_email_idx" ON "Submitter"("email");

-- CreateIndex
CREATE INDEX "SubmittedDocument_submitterId_idx" ON "SubmittedDocument"("submitterId");

-- CreateIndex
CREATE INDEX "SubmittedDocument_requiredDocumentId_idx" ON "SubmittedDocument"("requiredDocumentId");

-- CreateIndex
CREATE INDEX "ReminderRecipient_reminderLogId_idx" ON "ReminderRecipient"("reminderLogId");

-- CreateIndex
CREATE INDEX "ReminderRecipient_submitterId_idx" ON "ReminderRecipient"("submitterId");

-- AddForeignKey
ALTER TABLE "RequiredDocument" ADD CONSTRAINT "RequiredDocument_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submitter" ADD CONSTRAINT "Submitter_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmittedDocument" ADD CONSTRAINT "SubmittedDocument_requiredDocumentId_fkey" FOREIGN KEY ("requiredDocumentId") REFERENCES "RequiredDocument"("requiredDocumentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmittedDocument" ADD CONSTRAINT "SubmittedDocument_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter"("submitterId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentBoxRemindType" ADD CONSTRAINT "DocumentBoxRemindType_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderRecipient" ADD CONSTRAINT "ReminderRecipient_reminderLogId_fkey" FOREIGN KEY ("reminderLogId") REFERENCES "ReminderLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderRecipient" ADD CONSTRAINT "ReminderRecipient_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter"("submitterId") ON DELETE RESTRICT ON UPDATE CASCADE;
