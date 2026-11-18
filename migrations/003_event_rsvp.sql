-- Additive only. Do not run against hosted databases without explicit target approval.
BEGIN;
CREATE TABLE IF NOT EXISTS rsvp_details(
 rsvp_id TEXT PRIMARY KEY REFERENCES rsvps(id),
 order_id TEXT NOT NULL REFERENCES orders(id),
 event_id TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 request_key TEXT NOT NULL,
 updated BIGINT NOT NULL,
 UNIQUE(order_id,event_id,request_key)
);
INSERT INTO schema_migrations(version,applied_at) VALUES(3,(EXTRACT(EPOCH FROM clock_timestamp())*1000)::BIGINT) ON CONFLICT(version) DO NOTHING;
COMMIT;
