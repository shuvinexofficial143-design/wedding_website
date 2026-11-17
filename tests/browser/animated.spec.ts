import { test,expect,request as requests } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import path from "node:path";
const origin="http://localhost:3000";
function fixtureDB(){return new DatabaseSync(process.env.DATABASE_PATH||path.join(process.cwd(),"data","e2e.sqlite"));}
async function adminRequest(){
 const client=await requests.newContext({baseURL:origin,extraHTTPHeaders:{origin}});
 const email="animated-admin-"+randomUUID()+"@example.test";
 expect((await client.post("/api/auth",{data:{action:"register",email,password:"Test-admin-only-password-2026!"}})).status()).toBe(200);
 const db=fixtureDB();
 try {
  db.prepare("UPDATE users SET email='retired-'||id||'@example.test',role='customer' WHERE email='admin@example.test'").run();
  db.prepare("UPDATE users SET email='admin@example.test',role='admin' WHERE email=?").run(email);
 }finally{db.close();}
 return client;
}
test.afterEach(()=>{
  // Restore the shared CI fixture's reserved admin email after this test.
  // Other legacy tests assign the same address to their own isolated users.
  const db=fixtureDB();
  try {
    db.prepare("UPDATE users SET email='animated-retired-'||id||'@example.test',role='customer' WHERE email='admin@example.test'").run();
  }finally{db.close();}
});
test("animated admin-only Canva registry, verified order queue, independent copy, delivery and mobile UI",async({page,request,browser})=>{
 test.setTimeout(150000);
 expect((await request.get("/api/admin/animated")).status()).toBe(403);
 expect((await request.get("/api/admin/animated/orders")).status()).toBe(403);
 const admin=await adminRequest();
 const originalCanva="https://www.canva.com/design/ORIGINALTESTID/edit?utm_source=qa";
 const copyCanva="https://www.canva.com/design/ORDER_COPY_1/edit";
 const style="ANI-"+randomUUID().slice(0,8).toUpperCase(),name="Animated QA "+randomUUID().slice(0,6);
 const created=await admin.post("/api/admin/animated",{data:{styleNumber:style,name,category:"wedding",
  pricePaise:64900,thumbnailUrl:"https://images.example.test/invitation.jpg",
  youtubeUrl:"https://youtu.be/dQw4w9WgXcQ",canvaUrl:originalCanva}});
 expect(created.status()).toBe(201);
 const {id:templateId}=await created.json();
 const saved=await admin.get("/api/admin/animated/"+templateId);
 expect(saved.status()).toBe(200);
 expect((await saved.json()).template.canva_url).toBe(originalCanva);
 const privateDenied=await request.get("/api/admin/animated/"+templateId);
 expect(privateDenied.status()).toBe(403);
 expect((await request.get("/products/"+templateId)).status()).toBe(404);
 expect((await admin.patch("/api/admin/animated/"+templateId,{
  data:{action:"published",revision:1}
 })).status()).toBe(200);
 const publicProduct=await (await request.get("/products/"+templateId)).text();
 expect(publicProduct).toContain(name);
 expect(publicProduct).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
 expect(publicProduct).not.toContain(originalCanva);
 expect(publicProduct).not.toContain("ORIGINALTESTID");
 const listing=await (await request.get("/catalog?category=animated")).text();
 expect(listing).toContain(name);
 expect(listing).not.toContain(originalCanva);
 const checkout=await request.get("/checkout/"+templateId,{maxRedirects:0});
 expect(checkout.status()).toBe(307);
 const buyer="animated-buyer-"+randomUUID()+"@example.test";
 expect((await page.request.post("/api/auth",{headers:{origin},data:{action:"register",email:buyer,password:"Test-customer-password-2026!"}})).status()).toBe(200);
 expect((await page.request.get("/api/admin/animated")).status()).toBe(403);
 const ordered=await page.request.post("/api/orders",{headers:{origin},data:{productId:templateId,phone:"9876543210"}});
 expect(ordered.status()).toBe(200);
 const {id:orderId}=await ordered.json();
 const db=fixtureDB();
 try {
  const order=db.prepare("SELECT amount,status FROM orders WHERE id=?").get(orderId) as {amount:number;status:string};
  expect(order.amount).toBe(64900);expect(order.status).toBe("pending");
  const row=db.prepare("SELECT original_canva_url,template_style,paid_at FROM animated_order_jobs WHERE order_id=?").get(orderId) as {original_canva_url:string;template_style:string;paid_at:number|null};
  expect(row.template_style).toBe(style);
  expect(row.original_canva_url).toBe(originalCanva);
  expect(row.paid_at).toBeNull();
  expect((await page.request.get("/api/orders/"+orderId+"/animated")).status()).toBe(403);
  expect((await admin.get("/api/admin/animated/orders/"+orderId)).status()).toBe(404);
  expect((await page.request.patch("/api/orders/"+orderId+"/animated",{
   headers:{origin},data:{revision:0,details:{}}
  })).status()).toBe(403);
  db.prepare("UPDATE orders SET status='paid',payment_id=? WHERE id=?").run("fixture-"+orderId,orderId);
  db.prepare("UPDATE animated_order_jobs SET paid_at=? WHERE order_id=?").run(Date.now()-60000,orderId);
  const adminPaid=await admin.get("/api/admin/animated/orders/"+orderId);
  expect(adminPaid.status()).toBe(200);
  expect((await adminPaid.json()).job.original_canva_url).toBe(originalCanva);
  const privateList=(await (await admin.get("/api/admin/animated/orders")).json()).orders;
  expect(privateList.some((j:{order_id:string})=>j.order_id===orderId)).toBe(true);
  expect((await request.get("/api/admin/animated/orders/"+orderId)).status()).toBe(403);
  const before=await page.request.get("/api/orders/"+orderId+"/animated");
  expect(before.status()).toBe(200);
  expect(JSON.stringify(await before.json())).not.toContain("canva.com");
  const details={partnerA:"काव्या",partnerB:"Rahul",date:"2027-02-21",time:"18:00",venue:"Rose Hall",
   address:"Jaipur",story:"An intimate celebration",cardMessage:"Join our family",
   photo:"",maps:"",gallery:[]};
  const customerSave=await page.request.patch("/api/orders/"+orderId+"/animated",{headers:{origin},
    data:{revision:0,details}});
  expect(customerSave.status()).toBe(200);
  expect((await page.request.patch("/api/orders/"+orderId+"/animated",{headers:{origin},
    data:{revision:0,details}})).status()).toBe(409);
  const sameOriginal=await admin.patch("/api/admin/animated/orders/"+orderId,{data:{action:"copy",revision:0,editingCopyUrl:originalCanva}});
  expect(sameOriginal.status()).toBe(400);
  const copy=await admin.patch("/api/admin/animated/orders/"+orderId,{data:{action:"copy",revision:0,editingCopyUrl:copyCanva}});
  expect(copy.status()).toBe(200);
  const start=await admin.patch("/api/admin/animated/orders/"+orderId,{data:{action:"editing",revision:1}});
  expect(start.status()).toBe(200);
  const finished=await admin.patch("/api/admin/animated/orders/"+orderId,{data:{action:"delivered",revision:2,deliveryUrl:"https://delivery.example.test/our-invitation"}});
  expect(finished.status()).toBe(200);
  expect((await db.prepare("SELECT fulfillment FROM orders WHERE id=?").get(orderId) as {fulfillment:string}).fulfillment).toBe("delivered");
  const customer=await (await page.request.get("/api/orders/"+orderId+"/animated")).json();
  expect(customer.deliveryUrl).toBe("https://delivery.example.test/our-invitation");
  expect(JSON.stringify(customer)).not.toContain("canva.com");
  const adminMobile=await browser.newContext({viewport:{width:390,height:844}});
  try {
    const mobile=await adminMobile.newPage();
    // Log in through the real browser form instead of assuming API request
    // storageState cookies are reusable in a separate Chromium context.
    await mobile.goto(origin+"/login?next=/admin/animated/orders/"+orderId);
    await mobile.getByLabel("Email",{exact:true}).fill("admin@example.test");
    await mobile.getByLabel(/Password/).fill("Test-admin-only-password-2026!");
    await mobile.locator("form").getByRole("button",{name:"Sign in"}).click();
    await expect(mobile).toHaveURL(new RegExp("/admin/animated/orders/"+orderId));
    await mobile.waitForLoadState("domcontentloaded");
    await expect(mobile.getByRole("link",{name:/Open Canva Template/})).toBeVisible();
    await expect(mobile.getByRole("button",{name:"Copy Customer Details"})).toBeVisible();
    await expect(mobile.getByRole("link",{name:"WhatsApp Customer"})).toBeVisible();
    expect(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await mobile.screenshot({path:"test-results/animated-admin-mobile.png",fullPage:true});
  }finally{await adminMobile.close();}
 }finally{db.close();await admin.dispose();}
});
