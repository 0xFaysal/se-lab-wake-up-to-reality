-- AlterTable
ALTER TABLE "user_legal_acceptances"
ADD COLUMN "acceptance_source" "legal_acceptance_source" NOT NULL DEFAULT 'REGISTRATION';

ALTER TABLE "user_legal_acceptances"
ALTER COLUMN "acceptance_source" DROP DEFAULT;
