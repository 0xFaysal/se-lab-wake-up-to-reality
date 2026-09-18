-- AlterTable
ALTER TABLE "platform_fee_rules" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "provider_payout_methods" ALTER COLUMN "updated_at" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "parking_right_amendments_requested_by_user_id_status_created_id" RENAME TO "parking_right_amendments_requested_by_user_id_status_create_idx";

-- RenameIndex
ALTER INDEX "parking_right_claim_batches_provider_user_id_status_created_at_" RENAME TO "parking_right_claim_batches_provider_user_id_status_created_idx";
