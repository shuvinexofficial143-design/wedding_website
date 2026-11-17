import {AsyncLocalStorage} from 'node:async_hooks';import {DatabaseSync} from 'node:sqlite';import {mkdirSync} from 'node:fs';import path from 'node:path';import {postgresPool} from './database/postgres';import {schemaSql,SCHEMA_VERSION} from './database/schema';import {postgresSql,type SqlValue,type Row,type Connection} from './database/sql';
export type {SqlValue,Row};
let local:DatabaseSync;const transactionContext=new AsyncLocalStorage<Connection>();let localQueue:Promise<unknown>=Promise.resolve();
export function usingPostgres(){return !!process.env.DATABASE_URL;}
function sqlite(){if(!local){if(process.env.VERCEL)throw new Error('Persistent DATABASE_URL required on Vercel. SQLite fallback is disabled.');const file=process.env.DATABASE_PATH||path.join(process.cwd(),'data','wedding.sqlite');mkdirSync(path.dirname(file),{recursive:true,mode:0o700});local=new DatabaseSync(file);local.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');local.exec(schemaSql('sqlite'));const cols=local.prepare('PRAGMA table_info(users)').all() as {name:string}[];if(!cols.some(c=>c.name==='role'))local.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'");local.prepare('INSERT OR IGNORE INTO schema_migrations VALUES(?,?)').run(SCHEMA_VERSION,Date.now());}return local;}
function localQuery(sql:string,params:SqlValue[]=[]){const statement=sqlite().prepare(sql);if(/^\s*(SELECT|PRAGMA|WITH)/i.test(sql)||/\bRETURNING\b/i.test(sql)){const rows=statement.all(...params) as Row[];return {rows,rowCount:rows.length};}const r=statement.run(...params);return {rows:[],rowCount:Number(r.changes)};}
function exclusive<T>(fn:()=>Promise<T>):Promise<T>{const next=localQueue.then(fn,fn);localQueue=next.catch(()=>{});return next;}
async function query(sql:string,params:SqlValue[]=[]){const tx=transactionContext.getStore();if(tx)return tx.query(sql,params);if(usingPostgres())return postgresPool().query(postgresSql(sql),params);return exclusive(async()=>localQuery(sql,params));}
export function db(){
 return {prepare(sql:string){
  return {
   async get(...params:SqlValue[]){return (await query(sql,params)).rows[0];},
   async all(...params:SqlValue[]){return (await query(sql,params)).rows;},
   async run(...params:SqlValue[]){return {changes:(await query(sql,params)).rowCount||0};}
  };
 }};
}
export async function transaction<T>(fn:()=>Promise<T>):Promise<T>{if(transactionContext.getStore())return fn();if(usingPostgres()){const c=await postgresPool().connect();try{await c.query('BEGIN');const value=await transactionContext.run({query:(sql,params)=>c.query(postgresSql(sql),params)},fn);await c.query('COMMIT');return value;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}return exclusive(async()=>{sqlite().exec('BEGIN IMMEDIATE');try{const value=await transactionContext.run({query:async(sql,params)=>localQuery(sql,params)},fn);sqlite().exec('COMMIT');return value;}catch(e){sqlite().exec('ROLLBACK');throw e;}});}
export type User={id:string;email:string;role:string};
export type Order={id:string;user_id:string;product_id:string;amount:number;phone:string;status:string;payment_id:string|null;payment_session:string|null;details:string;revision:number;published:string|null;public_token:string|null;fulfillment:string;preview_url:string|null;final_url:string|null;video_path:string|null;created:number};
export async function getOrder(id:string){return await db().prepare('SELECT * FROM orders WHERE id=?').get(id) as Order|undefined;}
export async function limit(key:string,max:number,windowMs:number){const now=Date.now();await db().prepare('DELETE FROM limits WHERE expires < ?').run(now);const row=await db().prepare('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=limits.count+1 RETURNING count').get(key,now+windowMs) as {count:number};return row.count<=max;}
