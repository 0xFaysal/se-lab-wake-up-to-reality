-- DropIndex
DROP INDEX "property_guard_assignments_created_by_user_id_idx";

-- AlterTable
ALTER TABLE "provider_guard_assignments" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
ALTER TABLE "provider_guard_assignments" RENAME CONSTRAINT "property_guard_assignments_pkey" TO "provider_guard_assignments_pkey";

-- RenameForeignKey
ALTER TABLE "properties" RENAME CONSTRAINT "properties_owner_user_id_fkey" TO "properties_created_by_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "provider_guard_assignments" RENAME CONSTRAINT "property_guard_assignments_created_by_user_id_fkey" TO "provider_guard_assignments_created_by_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "provider_guard_assignments" RENAME CONSTRAINT "property_guard_assignments_property_guard_membership_id_fkey" TO "provider_guard_assignments_property_guard_membership_id_fkey";

-- RenameForeignKey
ALTER TABLE "provider_guard_assignments" RENAME CONSTRAINT "property_guard_assignments_provider_membership_id_fkey" TO "provider_guard_assignments_provider_membership_id_fkey";

-- RenameForeignKey
ALTER TABLE "provider_manager_delegations" RENAME CONSTRAINT "provider_manager_delegations_grantor_provider_membership_id_fke" TO "provider_manager_delegations_grantor_provider_membership_i_fkey";

-- RenameIndex
ALTER INDEX "properties_owner_user_id_idx" RENAME TO "properties_created_by_user_id_idx";

-- RenameIndex
ALTER INDEX "property_building_manager_assignments_candidate_user_id_status_" RENAME TO "property_building_manager_assignments_candidate_user_id_sta_idx";

-- RenameIndex
ALTER INDEX "property_building_manager_votes_assignment_id_provider_membersh" RENAME TO "property_building_manager_votes_assignment_id_provider_memb_key";

-- RenameIndex
ALTER INDEX "property_providers_provider_user_id_status_verification_status_" RENAME TO "property_providers_provider_user_id_status_verification_sta_idx";

-- RenameIndex
ALTER INDEX "property_guard_assignments_property_guard_membership_id_status_" RENAME TO "provider_guard_assignments_property_guard_membership_id_sta_idx";

-- RenameIndex
ALTER INDEX "property_guard_assignments_provider_membership_id_status_idx" RENAME TO "provider_guard_assignments_provider_membership_id_status_idx";

-- RenameIndex
ALTER INDEX "provider_manager_delegation_permissions_permission_delegation_i" RENAME TO "provider_manager_delegation_permissions_permission_delegati_idx";

-- RenameIndex
ALTER INDEX "provider_manager_delegations_grantor_provider_membership_id_sta" RENAME TO "provider_manager_delegations_grantor_provider_membership_id_idx";

-- RenameIndex
ALTER INDEX "provider_manager_delegations_manager_user_id_status_property_id" RENAME TO "provider_manager_delegations_manager_user_id_status_propert_idx";
