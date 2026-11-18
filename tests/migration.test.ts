import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {PGlite} from '@electric-sql/pglite';import {schemaSql} from '../src/lib/database/schema';import {importSnapshot} from '../src/lib/database/import-sqlite';import {postgresSql,type Connection} from '../src/lib/database/sql';
test('PostgreSQL migration preserves identity, ownership, paid status; dry-run and failure roll back',async()=>{const pg=new PGlite();await pg.exec(schemaSql('postgres'));const connection:Connection={query:async(sql,params)=>{const r=await pg.query<Record<string,unknown>>(sql,params);return {rows:r.rows,rowCount:r.affectedRows??r.rows.length};}};const sqlite=new DatabaseSync(':memory:');sqlite.exec(schemaSql('sqlite'));sqlite.prepare('INSERT INTO users(id,email,password,created) VALUES(?,?,?,?)').run('u1','customer@example.test','preserved-hash',1000);sqlite.prepare('INSERT INTO orders(id,user_id,product_id,amount,phone,status,payment_id,created) VALUES(?,?,?,?,?,?,?,?)').run('o1','u1','royal-golden-palace',49900,'9876543210','paid','cashfree-1',2000);const dry=await importSnapshot(sqlite,connection,true);assert.equal(dry.dryRun,true);assert.equal((await pg.query<{n:number}>('SELECT COUNT(*)::int AS n FROM users')).rows[0].n,0);await importSnapshot(sqlite,connection,false);const result=await pg.query<{status:string;user_id:string;payment_id:string}>('SELECT * FROM orders');assert.equal(result.rows[0].status,'paid');assert.equal(result.rows[0].user_id,'u1');assert.equal(result.rows[0].payment_id,'cashfree-1');await assert.rejects(importSnapshot(sqlite,connection,false),/not empty/);assert.equal((await pg.query<{n:number}>('SELECT COUNT(*)::int AS n FROM orders')).rows[0].n,1);sqlite.close();await pg.close();});
test('query parameter conversion never interpolates literal question marks',()=>{assert.equal(postgresSql("SELECT '?' AS label WHERE id=? AND email=?"),"SELECT '?' AS label WHERE id=$1 AND email=$2");});
test('SQLite import preserves multiple animated jobs and RSVP records including PostgreSQL bigint strings',async()=>{
 const pg=new PGlite();await pg.exec(schemaSql('postgres'));
 const connection:Connection={query:async(sql,params)=>{
  const r=await pg.query<Record<string,unknown>>(sql,params);
  // node-postgres returns BIGINT as strings by default, unlike PGlite.
  const rows=r.rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,['created','updated','paid_at','started_at','delivered_at','expires'].includes(k)&&typeof v==='number'?String(v):v])));
  return {rows,rowCount:r.affectedRows??r.rows.length};
 }};
 const source=new DatabaseSync(':memory:');source.exec(schemaSql('sqlite'));
 try{
  source.prepare("INSERT INTO users(id,email,password,created) VALUES('owner','migration@example.test','hash',100)").run();
  source.prepare("INSERT INTO animated_templates(id,style_number,name,category,price_paise,thumbnail_url,youtube_video_id,canva_url,created,updated) VALUES('template','ANI-ONE','Floral','wedding',50000,'https://example.test/a.png','dQw4w9WgXcQ','https://www.canva.com/design/MASTER/edit',100,100)").run();
  for(const n of [1,2]){
   const id='order'+n;
   source.prepare("INSERT INTO orders(id,user_id,product_id,amount,phone,status,payment_id,created) VALUES(?,'owner','template',50000,'9876543210','paid',?,100)").run(id,'payment'+n);
   source.prepare("INSERT INTO animated_order_jobs(order_id,template_id,template_name,template_style,original_canva_url,youtube_video_id,paid_at,created) VALUES(?,'template','Floral','ANI-ONE','https://www.canva.com/design/MASTER/edit','dQw4w9WgXcQ',200,100)").run(id);
   source.prepare("INSERT INTO rsvps(id,order_id,name,attendance,guests,created) VALUES(?,?,'Guest','yes',1,100)").run('rsvp'+n,id);
   source.prepare("INSERT INTO rsvp_details(rsvp_id,order_id,notes,request_key,updated) VALUES(?,?,?, ?,100)").run('rsvp'+n,id,'Note '+n,'request'+n);
  }
  await importSnapshot(source,connection,true);assert.equal((await pg.query<{n:number}>('SELECT COUNT(*)::int AS n FROM orders')).rows[0].n,0);
  await importSnapshot(source,connection,false);
  assert.equal((await pg.query('SELECT * FROM animated_order_jobs')).rows.length,2);
  assert.deepEqual((await pg.query<{notes:string}>('SELECT notes FROM rsvp_details ORDER BY rsvp_id')).rows.map(r=>r.notes),['Note 1','Note 2']);
 }finally{source.close();await pg.close();}
});
