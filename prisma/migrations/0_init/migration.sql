-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."DocumentBoxStatus" AS ENUM ('OPEN', 'CLOSED', 'OPEN_SOMEONE', 'CLOSED_EXPIRED', 'OPEN_RESUME');

-- CreateEnum
CREATE TYPE "public"."FormFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'EMAIL', 'TEL', 'DATE', 'TIME', 'CHECKBOX', 'RADIO', 'DROPDOWN');

-- CreateEnum
CREATE TYPE "public"."LogoType" AS ENUM ('DEFAULT', 'DOCUMENT_BOX');

-- CreateEnum
CREATE TYPE "public"."RemindType" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."ReminderTimeUnit" AS ENUM ('DAY', 'WEEK');

-- CreateEnum
CREATE TYPE "public"."SubmitterStatus" AS ENUM ('PENDING', 'SUBMITTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('FREE', 'BETA', 'BASIC', 'PRO');

-- CreateTable
CREATE TABLE "public"."DocumentBox" (
    "documentBoxId" TEXT NOT NULL,
    "boxTitle" TEXT NOT NULL,
    "boxDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "hasSubmitter" BOOLEAN,
    "formFieldsAboveDocuments" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."DocumentBoxStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "DocumentBox_pkey" PRIMARY KEY ("documentBoxId")
);

-- CreateTable
CREATE TABLE "public"."DocumentBoxRemindType" (
    "documentBoxId" TEXT NOT NULL,
    "remindType" "public"."RemindType" NOT NULL,

    CONSTRAINT "DocumentBoxRemindType_pkey" PRIMARY KEY ("documentBoxId","remindType")
);

-- CreateTable
CREATE TABLE "public"."DocumentBoxTemplateConfig" (
    "id" TEXT NOT NULL,
    "documentBoxId" TEXT NOT NULL,
    "lastTemplateId" TEXT,
    "lastGreetingHtml" TEXT,
    "lastFooterHtml" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentBoxTemplateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FormField" (
    "formFieldId" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" "public"."FormFieldType" NOT NULL,
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
CREATE TABLE "public"."FormFieldResponse" (
    "formFieldResponseId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formFieldId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,

    CONSTRAINT "FormFieldResponse_pkey" PRIMARY KEY ("formFieldResponseId")
);

-- CreateTable
CREATE TABLE "public"."Logo" (
    "logoId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "documentBoxId" TEXT,
    "type" "public"."LogoType" NOT NULL DEFAULT 'DEFAULT',

    CONSTRAINT "Logo_pkey" PRIMARY KEY ("logoId")
);

-- CreateTable
CREATE TABLE "public"."RemindTemplate" (
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
CREATE TABLE "public"."ReminderLog" (
    "id" TEXT NOT NULL,
    "documentBoxId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "public"."RemindType" NOT NULL,
    "isAuto" BOOLEAN NOT NULL,
    "sentAfterDeadline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReminderRecipient" (
    "id" TEXT NOT NULL,
    "reminderLogId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,

    CONSTRAINT "ReminderRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReminderSchedule" (
    "id" TEXT NOT NULL,
    "documentBoxId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timeValue" INTEGER NOT NULL,
    "timeUnit" "public"."ReminderTimeUnit" NOT NULL,
    "sendTime" TEXT NOT NULL,
    "channel" "public"."RemindType" NOT NULL DEFAULT 'EMAIL',
    "templateId" TEXT,
    "greetingHtml" TEXT,
    "footerHtml" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RequiredDocument" (
    "requiredDocumentId" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentDescription" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "documentBoxId" TEXT NOT NULL,
    "allowMultipleFiles" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "templateZipKey" TEXT,
    "templates" JSONB DEFAULT '[]',

    CONSTRAINT "RequiredDocument_pkey" PRIMARY KEY ("requiredDocumentId")
);

-- CreateTable
CREATE TABLE "public"."ResubmissionLog" (
    "resubmissionLogId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "resubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResubmissionLog_pkey" PRIMARY KEY ("resubmissionLogId")
);

-- CreateTable
CREATE TABLE "public"."SubmittedDocument" (
    "submittedDocumentId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredDocumentId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,

    CONSTRAINT "SubmittedDocument_pkey" PRIMARY KEY ("submittedDocumentId")
);

-- CreateTable
CREATE TABLE "public"."Submitter" (
    "submitterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "documentBoxId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "public"."SubmitterStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "isChecked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Submitter_pkey" PRIMARY KEY ("submitterId")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "userId" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "subscriptionPlan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'BETA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "DocumentBox_userId_idx" ON "public"."DocumentBox"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentBoxTemplateConfig_documentBoxId_key" ON "public"."DocumentBoxTemplateConfig"("documentBoxId" ASC);

-- CreateIndex
CREATE INDEX "FormField_documentBoxId_idx" ON "public"."FormField"("documentBoxId" ASC);

-- CreateIndex
CREATE INDEX "FormFieldResponse_formFieldId_idx" ON "public"."FormFieldResponse"("formFieldId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FormFieldResponse_formFieldId_submitterId_key" ON "public"."FormFieldResponse"("formFieldId" ASC, "submitterId" ASC);

-- CreateIndex
CREATE INDEX "FormFieldResponse_submitterId_idx" ON "public"."FormFieldResponse"("submitterId" ASC);

-- CreateIndex
CREATE INDEX "Logo_documentBoxId_idx" ON "public"."Logo"("documentBoxId" ASC);

-- CreateIndex
CREATE INDEX "Logo_userId_idx" ON "public"."Logo"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Logo_userId_type_documentBoxId_key" ON "public"."Logo"("userId" ASC, "type" ASC, "documentBoxId" ASC);

-- CreateIndex
CREATE INDEX "RemindTemplate_userId_idx" ON "public"."RemindTemplate"("userId" ASC);

-- CreateIndex
CREATE INDEX "ReminderRecipient_reminderLogId_idx" ON "public"."ReminderRecipient"("reminderLogId" ASC);

-- CreateIndex
CREATE INDEX "ReminderRecipient_submitterId_idx" ON "public"."ReminderRecipient"("submitterId" ASC);

-- CreateIndex
CREATE INDEX "ReminderSchedule_documentBoxId_idx" ON "public"."ReminderSchedule"("documentBoxId" ASC);

-- CreateIndex
CREATE INDEX "ReminderSchedule_sendTime_idx" ON "public"."ReminderSchedule"("sendTime" ASC);

-- CreateIndex
CREATE INDEX "ResubmissionLog_submitterId_idx" ON "public"."ResubmissionLog"("submitterId" ASC);

-- CreateIndex
CREATE INDEX "SubmittedDocument_requiredDocumentId_idx" ON "public"."SubmittedDocument"("requiredDocumentId" ASC);

-- CreateIndex
CREATE INDEX "SubmittedDocument_submitterId_idx" ON "public"."SubmittedDocument"("submitterId" ASC);

-- CreateIndex
CREATE INDEX "Submitter_email_idx" ON "public"."Submitter"("email" ASC);

-- CreateIndex
CREATE INDEX "Submitter_userId_idx" ON "public"."Submitter"("userId" ASC);

-- CreateIndex
CREATE INDEX "User_authUserId_idx" ON "public"."User"("authUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "public"."User"("authUserId" ASC);

-- AddForeignKey
ALTER TABLE "public"."DocumentBoxRemindType" ADD CONSTRAINT "DocumentBoxRemindType_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "public"."DocumentBox"("documentBoxId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentBoxTemplateConfig" ADD CONSTRAINT "DocumentBoxTemplateConfig_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "public"."DocumentBox"("documentBoxId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FormField" ADD CONSTRAINT "FormField_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "public"."DocumentBox"("documentBoxId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FormFieldResponse" ADD CONSTRAINT "FormFieldResponse_formFieldId_fkey" FOREIGN KEY ("formFieldId") REFERENCES "public"."FormField"("formFieldId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FormFieldResponse" ADD CONSTRAINT "FormFieldResponse_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "public"."Submitter"("submitterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Logo" ADD CONSTRAINT "Logo_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "public"."DocumentBox"("documentBoxId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderLog" ADD CONSTRAINT "ReminderLog_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "public"."DocumentBox"("documentBoxId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderRecipient" ADD CONSTRAINT "ReminderRecipient_reminderLogId_fkey" FOREIGN KEY ("reminderLogId") REFERENCES "public"."ReminderLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderRecipient" ADD CONSTRAINT "ReminderRecipient_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "public"."Submitter"("submitterId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderSchedule" ADD CONSTRAINT "ReminderSchedule_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "public"."DocumentBox"("documentBoxId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequiredDocument" ADD CONSTRAINT "RequiredDocument_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "public"."DocumentBox"("documentBoxId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResubmissionLog" ADD CONSTRAINT "ResubmissionLog_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "public"."Submitter"("submitterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmittedDocument" ADD CONSTRAINT "SubmittedDocument_requiredDocumentId_fkey" FOREIGN KEY ("requiredDocumentId") REFERENCES "public"."RequiredDocument"("requiredDocumentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmittedDocument" ADD CONSTRAINT "SubmittedDocument_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "public"."Submitter"("submitterId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submitter" ADD CONSTRAINT "Submitter_documentBoxId_fkey" FOREIGN KEY ("documentBoxId") REFERENCES "public"."DocumentBox"("documentBoxId") ON DELETE RESTRICT ON UPDATE CASCADE;

