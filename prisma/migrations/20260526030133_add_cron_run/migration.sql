-- CreateTable
CREATE TABLE "CronRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CronRun_claimedAt_idx" ON "CronRun"("claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CronRun_jobName_slot_key" ON "CronRun"("jobName", "slot");
