-- Support Provider/Manager dispute scopes that join disputes through bookings and listings.
CREATE INDEX "bookings_listing_id_status_created_at_idx"
ON "bookings"("listing_id", "status", "created_at" DESC);

-- Support Guard operational queues scoped by both Property and Provider.
CREATE INDEX "bookings_property_id_provider_user_id_status_start_at_idx"
ON "bookings"("property_id", "provider_user_id", "status", "start_at");
