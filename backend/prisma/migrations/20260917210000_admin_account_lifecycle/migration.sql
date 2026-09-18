-- Extend existing enums without rewriting historical rows.
ALTER TYPE "account_origin" ADD VALUE IF NOT EXISTS 'ADMIN_CREATED_USER';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'USER_CREATED_BY_ADMIN';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_USER_PROFILE_UPDATED';
ALTER TYPE "domain_audit_event_type" ADD VALUE IF NOT EXISTS 'ADMIN_ACCOUNT_SETUP_RESENT';
