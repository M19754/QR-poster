-- AlterTable Camp: add welcome text
ALTER TABLE "Camp" ADD COLUMN "welcomeText" TEXT;

-- AlterTable Group: add binding fields
ALTER TABLE "Group"
  ADD COLUMN "bindingToken"          TEXT,
  ADD COLUMN "bindingTokenVersion"   INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "showCheckPostOverview" BOOLEAN NOT NULL DEFAULT false;

-- Backfill bindingToken for existing groups using gen_random_uuid()
UPDATE "Group" SET "bindingToken" = gen_random_uuid()::text WHERE "bindingToken" IS NULL;

ALTER TABLE "Group" ALTER COLUMN "bindingToken" SET NOT NULL;
CREATE UNIQUE INDEX "Group_bindingToken_key" ON "Group"("bindingToken");

-- AlterTable TaskContent: add check post fields
ALTER TABLE "TaskContent"
  ADD COLUMN "isCheckPost"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "checkPostText"  TEXT;

-- CreateTable Hold
CREATE TABLE "Hold" (
    "id"        TEXT         NOT NULL,
    "groupId"   TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "sortOrder" INTEGER      NOT NULL DEFAULT 0,
    "active"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Hold_pkey" PRIMARY KEY ("id")
);

-- CreateTable ParticipantSession
CREATE TABLE "ParticipantSession" (
    "id"         TEXT         NOT NULL,
    "campId"     TEXT         NOT NULL,
    "groupId"    TEXT         NOT NULL,
    "holdId"     TEXT,
    "shortCode"  TEXT         NOT NULL,
    "boundAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParticipantSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable TaskCheckIn
CREATE TABLE "TaskCheckIn" (
    "id"        TEXT         NOT NULL,
    "taskId"    TEXT         NOT NULL,
    "groupId"   TEXT         NOT NULL,
    "holdId"    TEXT,
    "sessionId" TEXT         NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantSession_shortCode_key" ON "ParticipantSession"("shortCode");

-- AddForeignKey Hold → Group
ALTER TABLE "Hold" ADD CONSTRAINT "Hold_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ParticipantSession → Camp
ALTER TABLE "ParticipantSession" ADD CONSTRAINT "ParticipantSession_campId_fkey"
    FOREIGN KEY ("campId") REFERENCES "Camp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ParticipantSession → Group
ALTER TABLE "ParticipantSession" ADD CONSTRAINT "ParticipantSession_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ParticipantSession → Hold
ALTER TABLE "ParticipantSession" ADD CONSTRAINT "ParticipantSession_holdId_fkey"
    FOREIGN KEY ("holdId") REFERENCES "Hold"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey TaskCheckIn → Task
ALTER TABLE "TaskCheckIn" ADD CONSTRAINT "TaskCheckIn_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey TaskCheckIn → Group
ALTER TABLE "TaskCheckIn" ADD CONSTRAINT "TaskCheckIn_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey TaskCheckIn → Hold
ALTER TABLE "TaskCheckIn" ADD CONSTRAINT "TaskCheckIn_holdId_fkey"
    FOREIGN KEY ("holdId") REFERENCES "Hold"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey TaskCheckIn → ParticipantSession
ALTER TABLE "TaskCheckIn" ADD CONSTRAINT "TaskCheckIn_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "ParticipantSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
