-- Existing paid bookings retain policy 1. Only new quotes opt in to policy 2.
ALTER TABLE "booking_quotes" ADD COLUMN "overtime_policy_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "bookings" ADD COLUMN "overtime_policy_version" INTEGER NOT NULL DEFAULT 1;
