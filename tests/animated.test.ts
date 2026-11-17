import test from "node:test";
import assert from "node:assert/strict";
import {animatedInput,parseYouTubeId,youtubeEmbed,canvaEditUrl,fulfilmentState} from "../src/lib/animated/repository";
import {schemaSql} from "../src/lib/database/schema";

test("YouTube unlisted watch, shorts and share URLs normalise to one safe embed ID",()=>{
 const id="dQw4w9WgXcQ";
 for(const link of ["https://youtu.be/"+id+"?si=abc","https://www.youtube.com/watch?v="+id,
   "https://m.youtube.com/watch?v="+id,"https://www.youtube.com/shorts/"+id])
  assert.equal(parseYouTubeId(link),id);
 assert.equal(youtubeEmbed(id),"https://www.youtube-nocookie.com/embed/"+id);
 for(const bad of ["http://youtu.be/"+id,"https://youtube.com.evil.test/watch?v="+id,
   "https://www.youtube.com/watch?v=bad","javascript:alert(1)"])
  assert.throws(()=>parseYouTubeId(bad));
});
test("animated template input rejects unsafe Canva hosts and wrong cost",()=>{
 const ok={styleNumber:"ANI-WED-010",name:"Floral Film",category:"wedding",pricePaise:59900,
  thumbnailUrl:"https://images.example.test/a.jpg",
  youtubeUrl:"https://youtu.be/dQw4w9WgXcQ",
  canvaUrl:"https://www.canva.com/design/ORIGINAL-ID/edit"};
 assert.equal(animatedInput.parse(ok).name,"Floral Film");
 for(const bad of ["https://canva.com.evil.test/design/ABC/edit",
   "javascript:alert(1)","https://www.canva.com/"])
  assert.equal(canvaEditUrl.safeParse(bad).success,false);
 assert.equal(animatedInput.safeParse({...ok,pricePaise:-1}).success,false);
 assert.equal(animatedInput.safeParse({...ok,canvaUrl:"https://evil.test/"}).success,false);
});
test("60 minute delivery clock starts at verified paid timestamp, not order creation",()=>{
 assert.equal(fulfilmentState({paid_at:null,started_at:null,delivered_at:null},3600000),"pending");
 assert.equal(fulfilmentState({paid_at:1000,started_at:null,delivered_at:null},1000+3599999),"pending");
 assert.equal(fulfilmentState({paid_at:1000,started_at:2000,delivered_at:null},1000+3599999),"editing");
 assert.equal(fulfilmentState({paid_at:1000,started_at:2000,delivered_at:null},1000+3600000),"overdue");
 assert.equal(fulfilmentState({paid_at:1000,started_at:2000,delivered_at:3000},1000+3600000),"delivered");
});
test("Neon migration adds only additive animated schema and never drops existing customer tables",()=>{
 const sql=schemaSql("postgres");
 for(const t of ["animated_templates","animated_order_jobs"])
  assert.match(sql,new RegExp("CREATE TABLE IF NOT EXISTS "+t));
 assert.doesNotMatch(sql,/\b(DROP|TRUNCATE|DELETE)\b/i);
});
