export const SCHEMA_VERSION=4;
export function schemaSql(dialect:'postgres'|'sqlite') {const serial=dialect==='postgres'?'BIGSERIAL PRIMARY KEY':'INTEGER PRIMARY KEY AUTOINCREMENT';return `
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,created BIGINT NOT NULL,role TEXT NOT NULL DEFAULT 'customer');
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),product_id TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>=0),phone TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',payment_id TEXT UNIQUE,payment_session TEXT,details TEXT NOT NULL DEFAULT '{}',revision INTEGER NOT NULL DEFAULT 0,published TEXT,public_token TEXT UNIQUE,fulfillment TEXT NOT NULL DEFAULT 'awaiting_details',preview_url TEXT,final_url TEXT,video_path TEXT,created BIGINT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_product ON orders(user_id,product_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS audit(id ${serial},admin_id TEXT NOT NULL,order_id TEXT NOT NULL,action TEXT NOT NULL,created BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS rsvps(id TEXT PRIMARY KEY,order_id TEXT REFERENCES orders(id),name TEXT NOT NULL,attendance TEXT NOT NULL,guests INTEGER NOT NULL,created BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS card_templates(id TEXT PRIMARY KEY,style_number TEXT UNIQUE NOT NULL,status TEXT NOT NULL CHECK(status IN('draft','published','unpublished','archived')),head_version INTEGER NOT NULL DEFAULT 1,revision INTEGER NOT NULL DEFAULT 1,published_version INTEGER,sort_order INTEGER NOT NULL DEFAULT 0,featured INTEGER NOT NULL DEFAULT 0,created_by TEXT REFERENCES users(id),created BIGINT NOT NULL,updated BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS template_versions(template_id TEXT NOT NULL REFERENCES card_templates(id),version INTEGER NOT NULL,document TEXT NOT NULL,created_by TEXT REFERENCES users(id),created BIGINT NOT NULL,PRIMARY KEY(template_id,version));
CREATE TABLE IF NOT EXISTS purchased_products(order_id TEXT PRIMARY KEY REFERENCES orders(id),template_id TEXT NOT NULL,template_version INTEGER NOT NULL,created BIGINT NOT NULL,FOREIGN KEY(template_id,template_version) REFERENCES template_versions(template_id,version));
CREATE TABLE IF NOT EXISTS customer_card_edits(order_id TEXT PRIMARY KEY REFERENCES orders(id),values_json TEXT NOT NULL DEFAULT '{}',revision INTEGER NOT NULL DEFAULT 0,updated BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),provider TEXT NOT NULL DEFAULT 'cashfree-sandbox',status TEXT NOT NULL,amount INTEGER NOT NULL,currency TEXT NOT NULL CHECK(currency='INR'),created BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),purpose TEXT NOT NULL,object_key TEXT UNIQUE NOT NULL,sha256 TEXT NOT NULL,mime TEXT NOT NULL,size_bytes INTEGER NOT NULL,width INTEGER,height INTEGER,status TEXT NOT NULL DEFAULT 'pending',version INTEGER NOT NULL DEFAULT 1,created BIGINT NOT NULL,ready_at BIGINT,UNIQUE(owner_id,purpose,sha256));
CREATE TABLE IF NOT EXISTS asset_links(asset_id TEXT NOT NULL REFERENCES assets(id),scope TEXT NOT NULL,scope_id TEXT NOT NULL,PRIMARY KEY(asset_id,scope,scope_id));
CREATE TABLE IF NOT EXISTS admin_audit_logs(id TEXT PRIMARY KEY,admin_id TEXT NOT NULL REFERENCES users(id),entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,action TEXT NOT NULL,metadata TEXT NOT NULL DEFAULT '{}',created BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS wedding_website_orders(order_id TEXT PRIMARY KEY REFERENCES orders(id),requirements TEXT NOT NULL DEFAULT '{}',delivery_status TEXT NOT NULL DEFAULT 'awaiting_details',preview_url TEXT,final_url TEXT,updated BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS rsvp_details(rsvp_id TEXT PRIMARY KEY REFERENCES rsvps(id),order_id TEXT NOT NULL REFERENCES orders(id),event_id TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',request_key TEXT NOT NULL,updated BIGINT NOT NULL,UNIQUE(order_id,event_id,request_key));
CREATE INDEX IF NOT EXISTS orders_user_created ON orders(user_id,created);
CREATE INDEX IF NOT EXISTS rsvps_order ON rsvps(order_id);
CREATE INDEX IF NOT EXISTS assets_owner ON assets(owner_id,status);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS animated_templates(id TEXT PRIMARY KEY,style_number TEXT UNIQUE NOT NULL,name TEXT NOT NULL,category TEXT NOT NULL,price_paise INTEGER NOT NULL CHECK(price_paise>=0),thumbnail_url TEXT NOT NULL,youtube_video_id TEXT NOT NULL,canva_url TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','published','unpublished')),revision INTEGER NOT NULL DEFAULT 1,created_by TEXT REFERENCES users(id),created BIGINT NOT NULL,updated BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS animated_order_jobs(order_id TEXT PRIMARY KEY REFERENCES orders(id),template_id TEXT NOT NULL REFERENCES animated_templates(id),template_name TEXT NOT NULL,template_style TEXT NOT NULL,original_canva_url TEXT NOT NULL,youtube_video_id TEXT NOT NULL,editing_copy_url TEXT,delivery_url TEXT,paid_at BIGINT,started_at BIGINT,delivered_at BIGINT,revision INTEGER NOT NULL DEFAULT 0,created BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS animated_orders_paid_time ON animated_order_jobs(paid_at);
CREATE INDEX IF NOT EXISTS animated_templates_state ON animated_templates(status,created);
`;}
