import {test,expect,request as requests} from '@playwright/test';
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import {mp4Fixture} from '../mp4-fixture';
const origin='http://localhost:3000';
test('fulfilment API: private uploaded media, concurrent pending checkout, failure rollback and owned delivery',async({request})=>{
 const admin=await requests.newContext({baseURL:origin,extraHTTPHeaders:{origin}}),buyer=await requests.newContext({baseURL:origin,extraHTTPHeaders:{origin}});
 const db=new DatabaseSync(process.env.DATABASE_PATH||path.join(process.cwd(),'data','e2e.sqlite'));
 try{
  const email='fulfil-admin-'+randomUUID()+'@example.test';
  expect((await admin.post('/api/auth',{data:{action:'register',email,password:'Api-fulfilment-test-2026!'}})).status()).toBe(200);
  db.prepare("UPDATE users SET email='retired-'||id||'@example.test',role='customer' WHERE email='admin@example.test'").run();
  db.prepare("UPDATE users SET email='admin@example.test',role='admin' WHERE email=?").run(email);
  expect((await buyer.post('/api/auth',{data:{action:'register',email:'fulfil-buyer-'+randomUUID()+'@example.test',password:'Api-fulfilment-test-2026!'}})).status()).toBe(200);
  const bytes=await sharp({create:{width:20,height:30,channels:3,background:'#a78f62'}}).png().toBuffer();
  async function upload(purpose:string,mime:string,buffer:Buffer){
   const init=await admin.post('/api/assets',{data:{purpose,mime,size:buffer.length,sha256:createHash('sha256').update(buffer).digest('hex')}});expect(init.status()).toBe(200);
   const asset=await init.json();expect((await admin.put('/api/assets/'+asset.id+'/upload',{headers:{'Content-Type':mime},data:buffer})).status()).toBe(200);
   const complete=await admin.post('/api/assets/'+asset.id+'/complete');return {id:asset.id,complete};
  }
  const thumb=await upload('thumbnail','image/png',bytes);expect(thumb.complete.status()).toBe(200);
  const body={styleNumber:'API-'+randomUUID().slice(0,8).toUpperCase(),name:'Private upload QA',category:'wedding',pricePaise:69900,thumbnailUrl:'/api/assets/'+thumb.id,youtubeUrl:'https://youtu.be/dQw4w9WgXcQ',canvaUrl:'https://www.canva.com/design/API_MASTER/edit'};
  const created=await admin.post('/api/admin/animated',{data:body});expect(created.status()).toBe(201);const {id}=await created.json();
  expect((await admin.post('/api/admin/animated',{data:body})).status()).toBe(400);
  expect((await request.get(body.thumbnailUrl)).status()).toBe(404);
  expect((await admin.patch('/api/admin/animated/'+id,{data:{action:'published',revision:1}})).status()).toBe(200);
  expect((await request.get(body.thumbnailUrl)).status()).toBe(200);
  const attempts=await Promise.all([1,2].map(()=>buyer.post('/api/orders',{data:{productId:id,phone:'9876543210'}})));
  for(const r of attempts)expect(r.status()).toBe(200);
  const order=(await attempts[0].json()).id;expect((await attempts[1].json()).id).toBe(order);
  expect((await admin.patch('/api/admin/animated/orders/'+order,{data:{action:'editing',revision:0}})).status()).toBe(400);
  // Isolated test fixture only: no assertion of an external Cashfree transaction.
  db.prepare("UPDATE orders SET status='paid',details=? WHERE id=?").run(JSON.stringify({partnerA:'काव्या',partnerB:'Rahul'}),order);
  db.prepare('UPDATE animated_order_jobs SET paid_at=? WHERE order_id=?').run(Date.now(),order);
  expect((await admin.patch('/api/admin/animated/orders/'+order,{data:{action:'copy',revision:0,editingCopyUrl:'https://www.canva.com/design/COPY_'+randomUUID().replaceAll('-','')+'/edit'}})).status()).toBe(200);
  expect((await admin.patch('/api/admin/animated/orders/'+order,{data:{action:'editing',revision:1}})).status()).toBe(200);
  const invalid=await upload('video','video/mp4',Buffer.from('not a real MP4'));
  expect(invalid.complete.status()).toBe(400);
  expect((await admin.patch('/api/admin/animated/orders/'+order,{data:{action:'delivered',revision:2,deliveryAssetId:invalid.id}})).status()).toBe(400);
  expect(db.prepare('SELECT delivered_at FROM animated_order_jobs WHERE order_id=?').get(order)!.delivered_at).toBeNull();
  const video=await upload('video','video/mp4',mp4Fixture);expect(video.complete.status()).toBe(200);
  expect((await admin.patch('/api/admin/animated/orders/'+order,{headers:{origin:'https://evil.test'},data:{action:'delivered',revision:2,deliveryAssetId:video.id}})).status()).toBe(403);
  expect((await admin.patch('/api/admin/animated/orders/'+order,{data:{action:'delivered',revision:2,deliveryAssetId:video.id}})).status()).toBe(200);
  expect((await request.get('/api/orders/'+order+'/video')).status()).toBe(401);
  expect((await buyer.get('/api/assets/'+video.id)).status()).toBe(404);
  const downloaded=await buyer.get('/api/orders/'+order+'/video');expect(downloaded.status()).toBe(200);expect(Buffer.from(await downloaded.body()).equals(mp4Fixture)).toBe(true);
  const response=await buyer.get('/api/orders/'+order+'/animated');expect(await response.text()).not.toContain('canva.com');
  expect((await admin.patch('/api/admin/animated/'+id,{data:{action:'unpublished',revision:2}})).status()).toBe(200);
  expect((await request.get(body.thumbnailUrl)).status()).toBe(404);expect((await buyer.get('/api/orders/'+order+'/video')).status()).toBe(200);
 }finally{db.prepare("UPDATE users SET email='retired-'||id||'@example.test',role='customer' WHERE email='admin@example.test'").run();db.close();await admin.dispose();await buyer.dispose();}
});
