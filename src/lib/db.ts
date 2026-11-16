import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
let database:DatabaseSync;
export function db(){if(!database){const file=process.env.DATABASE_PATH||path.join(process.cwd(),'data','wedding.sqlite');mkdirSync(path.dirname(file),{recursive:true,mode:0o700});database=new DatabaseSync(file);database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),product_id TEXT NOT NULL,amount INTEGER NOT NULL,phone TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',payment_id TEXT UNIQUE,payment_session TEXT,details TEXT NOT NULL DEFAULT '{}',revision INTEGER NOT NULL DEFAULT 0,published TEXT,public_token TEXT UNIQUE,fulfillment TEXT NOT NULL DEFAULT 'awaiting_details',preview_url TEXT,final_url TEXT,video_path TEXT,created INTEGER NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_product ON orders(user_id,product_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS rsvps(id TEXT PRIMARY KEY,order_id TEXT REFERENCES orders(id),name TEXT NOT NULL,attendance TEXT NOT NULL,guests INTEGER NOT NULL,created INTEGER NOT NULL);
`);}return database;}
export type User={id:string;email:string};
export type Order={id:string;user_id:string;product_id:string;amount:number;phone:string;status:string;payment_id:string|null;payment_session:string|null;details:string;revision:number;published:string|null;public_token:string|null;fulfillment:string;preview_url:string|null;final_url:string|null;video_path:string|null;created:number};
export function getOrder(id:string){return db().prepare('SELECT * FROM orders WHERE id=?').get(id) as Order|undefined;}
export function limit(key:string,max:number,windowMs:number){const now=Date.now();db().prepare('DELETE FROM limits WHERE expires < ?').run(now);const row=db().prepare('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').get(key,now+windowMs) as {count:number};return row.count<=max;}
