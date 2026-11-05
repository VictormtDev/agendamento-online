-- Final guard against double booking. The use case already refuses overlapping
-- slots, but two concurrent requests can both pass that check before either
-- inserts; only the database can serialize them. Prisma cannot express exclusion
-- constraints in the schema, hence raw SQL.
--
-- btree_gist lets a GiST index compare plain equality ("providerId" WITH =)
-- alongside the range overlap operator (&&). '[)' makes ranges end-exclusive,
-- so back-to-back appointments do not conflict. Canceled appointments free the slot.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING gist (
    "providerId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE (status = 'SCHEDULED');
