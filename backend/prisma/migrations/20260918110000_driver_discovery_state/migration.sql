CREATE TABLE "driver_favorite_properties" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "driver_favorite_properties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "driver_saved_locations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "driver_saved_locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "driver_search_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "radius_km" DECIMAL(5,2) NOT NULL,
    "vehicle_type" "vehicle_type" NOT NULL,
    "searched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "driver_search_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "driver_favorite_properties_user_id_property_id_key" ON "driver_favorite_properties"("user_id", "property_id");
CREATE INDEX "driver_favorite_properties_user_id_created_at_idx" ON "driver_favorite_properties"("user_id", "created_at" DESC);
CREATE UNIQUE INDEX "driver_saved_locations_user_id_label_key" ON "driver_saved_locations"("user_id", "label");
CREATE INDEX "driver_saved_locations_user_id_updated_at_idx" ON "driver_saved_locations"("user_id", "updated_at" DESC);
CREATE INDEX "driver_search_history_user_id_searched_at_idx" ON "driver_search_history"("user_id", "searched_at" DESC);

ALTER TABLE "driver_favorite_properties" ADD CONSTRAINT "driver_favorite_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_favorite_properties" ADD CONSTRAINT "driver_favorite_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_saved_locations" ADD CONSTRAINT "driver_saved_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_search_history" ADD CONSTRAINT "driver_search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
