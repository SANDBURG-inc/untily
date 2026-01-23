-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LogoType" AS ENUM ('DEFAULT', 'DOCUMENT_BOX');

-- CreateEnum
CREATE TYPE "DocumentBoxStatus" AS ENUM ('OPEN', 'CLOSED', 'OPEN_SOMEONE', 'CLOSED_EXPIRED', 'OPEN_RESUME');

-- CreateEnum
CREATE TYPE "RemindType" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BETA', 'BASIC', 'PRO');

-- CreateEnum
CREATE TYPE "ReminderTimeUnit" AS ENUM ('DAY', 'WEEK');

-- CreateEnum
CREATE TYPE "SubmitterStatus" AS ENUM ('PENDING', 'SUBMITTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'EMAIL', 'TEL', 'DATE', 'TIME', 'CHECKBOX', 'RADIO', 'DROPDOWN');

-- CreateTable
CREATE TABLE "Logo" (
    "logoId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "type" "LogoType" NOT NULL DEFAULT 'DEFAULT',
    "documentBoxId" TEXT,

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
    "hasSubmitter" BOOLEAN,
    "status" "DocumentBoxStatus" NOT NULL DEFAULT 'OPEN',
    "formFieldsAboveDocuments" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DocumentBox_pkey" PRIMARY KEY ("documentBoxId")
);

-- CreateTable
CREATE TABLE "RequiredDocument" (
    "requiredDocumentId" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentDescription" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowMultipleFiles" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "documentBoxId" TEXT NOT NULL,
    "templates" JSONB DEFAULT '[]',
    "templateZipKey" TEXT,

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
    "isChecked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Submitter_pkey" PRIMARY KEY ("submitterId")
);

-- CreateTable
CREATE TABLE "SubmittedDocument" (
    "submittedDocumentId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
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
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'BETA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ReminderSchedule" (
    "id" TEXT NOT NULL,
    "documentBoxId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timeValue" INTEGER NOT NULL,
    "timeUnit" "ReminderTimeUnit" NOT NULL,
    "sendTime" TEXT NOT NULL,
    "channel" "RemindType" NOT NULL DEFAULT 'EMAIL',
    "templateId" TEXT,
    "greetingHtml" TEXT,
    "footerHtml" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "formFieldId" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" "FormFieldType" NOT NULL,
    "placeholder" TEXT,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB DEFAULT '[]',
    "hasOtherOption" BOOLEAN NOT NULL DEFAULT false,
    "validation" JSONB,
    "documentBoxId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("formFieldId")
);

-- CreateTable
CREATE TABLE "FormFieldResponse" (
    "formFieldResponseId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formFieldId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,

    CONSTRAINT "FormFieldResponse_pkey" PRIMARY KEY ("formFieldResponseId")
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL,
    "documentBoxId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "RemindType" NOT NULL,
    "isAuto" BOOLEAN NOT NULL,
    "sentAfterDeadline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderRecipient" (
    "id" TEXT NOT NULL,
    "reminderLogId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,

    CONSTRAINT "ReminderRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemindTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "greetingHtml" TEXT NOT NULL,
    "footerHtml" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemindTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentBoxTemplateConfig" (
    "id" TEXT NOT NULL,
    "documentBoxId" TEXT NOT NULL,
    "lastTemplateId" TEXT,
    "lastGreetingHtml" TEXT,
    "lastFooterHtml" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentBoxTemplateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResubmissionLog" (
    "resubmissionLogId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "resubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResubmissionLog_pkey" PRIMARY KEY ("resubmissionLogId")
);

-- CreateIndex
CREATE INDEX "Logo_userId_idx" ON "Logo"("userId");

-- CreateIndex
CREATE INDEX "Logo_documentBoxId_idx" ON "Logo"("documentBoxId");

-- CreateIndex
CREATE UNIQUE INDEX "Logo_userId_type_documentBoxId_key" ON "Logo"("userId", "type", "documentBoxId");

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
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- CreateIndex
CREATE INDEX "User_authUserId_idx" ON "User"("authUserId");

-- CreateIndex
CREATE INDEX "ReminderSchedule_documentBoxId_idx" ON "ReminderSchedule"("documentBoxId");

-- CreateIndex
CREATE INDEX "ReminderSchedule_sendTime_idx" ON "ReminderSchedule"("sendTime");

-- CreateIndex
CREATE INDEX "FormField_documentBoxId_idx" ON "FormField"("documentBoxId");

-- CreateIndex
CREATE INDEX "FormFieldResponse_submitterId_idx" ON "FormFieldResponse"("submitterId");

-- CreateIndex
CREATE INDEX "FormFieldResponse_formFieldId_idx" ON "FormFieldResponse"("formFieldId");

-- CreateIndex
CREATE UNIQUE INDEX "FormFieldResponse_formFieldId_submitterId_key" ON "FormFieldResponse"("formFieldId", "submitterId");

-- CreateIndex
CREATE INDEX "ReminderRecipient_reminderLogId_idx" ON "ReminderRecipient"("reminderLogId");

-- CreateIndex
CREATE INDEX "ReminderRecipient_submitterId_idx" ON "ReminderRecipient"("submitterId");

-- CreateIndex
CREATE INDEX "RemindTemplate_userId_idx" ON "RemindTemplate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentBoxTemplateConfig_documentBoxId_key" ON "DocumentBoxTemplateConfig"("documentBoxId");

-- CreateIndex
CREATE INDEX "ResubmissionLog_submitterId_idx" ON "ResubmissionLog"("submitterId");

-- AddForeignKey
ALTER TABLE "Logo" ADD CONSTRAINT "Logo_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "ReminderSchedule" ADD CONSTRAINT "ReminderSchedule_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldResponse" ADD CONSTRAINT "FormFieldResponse_formFieldId_fkey" FOREIGN KEY ("formFieldId") REFERENCES "FormField"("formFieldId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldResponse" ADD CONSTRAINT "FormFieldResponse_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter"("submitterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderRecipient" ADD CONSTRAINT "ReminderRecipient_reminderLogId_fkey" FOREIGN KEY ("reminderLogId") REFERENCES "ReminderLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderRecipient" ADD CONSTRAINT "ReminderRecipient_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter"("submitterId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentBoxTemplateConfig" ADD CONSTRAINT "DocumentBoxTemplateConfig_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "DocumentBox"("documentBoxId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResubmissionLog" ADD CONSTRAINT "ResubmissionLog_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Submitter"("submitterId") ON DELETE CASCADE ON UPDATE CASCADE;

