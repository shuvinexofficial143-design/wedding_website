import { test, expect, request as requests } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const origin = "http://localhost:3000";
function fixtureDb() {
  return new DatabaseSync(process.env.DATABASE_PATH || path.join(process.cwd(), "data", "e2e.sqlite"));
}
async function elevatedAdmin() {
  const client = await requests.newContext({baseURL:origin,extraHTTPHeaders:{origin}});
  const email = `new-admin-${randomUUID()}@example.test`;
  expect((await client.post("/api/auth", {data:{
    action:"register",email,password:"Test-admin-only-password-2026!",
  }})).status()).toBe(200);
  const db = fixtureDb();
  try {
    db.prepare("UPDATE users SET email='retired-'||id||'@example.test',role='customer' WHERE email='admin@example.test'").run();
    db.prepare("UPDATE users SET email='admin@example.test',role='admin' WHERE email=?").run(email);
  } finally { db.close(); }
  return client;
}
function design(name: string, brideId: string, lockedId: string) {
  return {
    name, description:"Original browser-tested studio artwork",
    category:"cards",pricePaise:45900,tags:["original"],
    width:1000,height:1400,safeInset:50,backgroundColor:"#fff7ec",
    backgroundAssetId:null,thumbnailAssetId:null,
    layers:[
      {id:brideId,kind:"text",label:"Bride Name",field:"partnerA",editable:true,
       value:"Original Bride",x:100,y:230,width:800,height:130,fontSize:66},
      {id:lockedId,kind:"text",label:"Fixed Blessing",field:"custom",editable:false,
       value:"With our blessings",x:100,y:530,width:800,height:100,fontSize:30},
    ],
  };
}
test("dynamic catalog, paid gates, version pinning and layer authorization", async ({page,request}) => {
  test.setTimeout(120000);
  const admin=await elevatedAdmin();
  const name="Studio Browser "+randomUUID().slice(0,8);
  const brideId=randomUUID(),lockedId=randomUUID();
  const first=design(name,brideId,lockedId);
  const style="QA-"+randomUUID().slice(0,8).toUpperCase();
  const create=await admin.post("/api/admin/cards",{data:{styleNumber:style,document:first}});
  expect(create.status()).toBe(200);
  const {id}=await create.json();
  expect((await request.get("/preview/"+id)).status()).toBe(404);
  expect((await request.get("/catalog")).text()).not.toContain(name);
  expect((await request.get("/api/admin/cards/"+id)).status()).toBe(403);
  const publish=await admin.patch("/api/admin/cards/"+id,{
    data:{action:"published",revision:1,sortOrder:0,featured:true},
  });
  expect(publish.status()).toBe(200);
  await page.goto("/catalog?category=cards");
  await expect(page.getByRole("heading",{name})).toBeVisible();
  expect((await request.get("/preview/"+id)).status()).toBe(200);
  const email="buyer-"+randomUUID()+"@example.test";
  const register=await page.request.post("/api/auth",{
    headers:{origin}, data:{action:"register",email,password:"Browser-buyer-password-2026!"},
  });
  expect(register.status()).toBe(200);
  const orderResponse=await page.request.post("/api/orders",{
    headers:{origin},data:{productId:id,phone:"9876543210"},
  });
  expect(orderResponse.status()).toBe(200);
  const {id:orderId}=await orderResponse.json();
  const db=fixtureDb();
  try {
    const pinned=db.prepare("SELECT template_version FROM purchased_products WHERE order_id=?").get(orderId) as {template_version:number};
    expect(pinned.template_version).toBe(1);
    const money=db.prepare("SELECT amount FROM orders WHERE id=?").get(orderId) as {amount:number};
    expect(money.amount).toBe(45900);
    expect((await page.request.get("/api/orders/"+orderId+"/card")).status()).toBe(403);
    await page.goto("/editor/"+orderId);
    await expect(page).toHaveURL(/checkout/);
    db.prepare("UPDATE orders SET status='paid',payment_id=? WHERE id=?").run("fixture-"+orderId,orderId);
    const initial=await page.request.get("/api/orders/"+orderId+"/card");
    expect(initial.status()).toBe(200);
    expect((await initial.json()).version).toBe(1);
    const locked=await page.request.patch("/api/orders/"+orderId+"/card",{
      headers:{origin},data:{revision:0,values:{[lockedId]:"Attempt to replace decoration"}},
    });
    expect(locked.status()).toBe(400);
    const unknown=await page.request.patch("/api/orders/"+orderId+"/card",{
      headers:{origin},data:{revision:0,values:{[randomUUID()]:"Unknown"}},
    });
    expect(unknown.status()).toBe(400);
    const writes=await Promise.all([
      page.request.patch("/api/orders/"+orderId+"/card",{
        headers:{origin},data:{revision:0,values:{[brideId]:"काव्या"}},
      }),
      page.request.patch("/api/orders/"+orderId+"/card",{
        headers:{origin},data:{revision:0,values:{[brideId]:"Revised"}},
      }),
    ]);
    expect(writes.map(r=>r.status()).sort()).toEqual([200,409]);
    await page.goto("/editor/"+orderId);
    await expect(page.getByText("Fixed Blessing",{exact:true})).toHaveCount(0);
    const bride=page.getByRole("textbox",{name:"Bride Name"});
    await expect(bride).toBeVisible();
    await bride.fill("माधवी & Rahul");
    await expect(page.locator(".layer-card")).toContainText("माधवी");
    await page.getByRole("button",{name:"Save details"}).click();
    await expect(page.getByRole("status")).toHaveText("All changes saved",{timeout:20000});
    await page.reload();
    await expect(page.getByRole("textbox",{name:"Bride Name"})).toHaveValue("माधवी & Rahul");
    expect(await page.locator(".layer-card").getAttribute("data-export-ready")).toBe("true");
    const pngEvent=page.waitForEvent("download",{timeout:60000});
    await page.getByRole("button",{name:"HD PNG"}).click();
    const png=await pngEvent;
    expect((await readFile(await png.path())).subarray(0,4).toString("hex")).toBe("89504e47");
    const pdfEvent=page.waitForEvent("download",{timeout:60000});
    await page.getByRole("button",{name:"PDF",exact:true}).click();
    const pdf=await pdfEvent;
    expect((await readFile(await pdf.path())).subarray(0,4).toString("hex")).toBe("25504446");
    await page.locator(".layer-card").screenshot({path:"test-results/studio-customer-edited.png"});
    const unpublish=await admin.patch("/api/admin/cards/"+id,{
      data:{action:"unpublished",revision:2,sortOrder:0,featured:false},
    });
    expect(unpublish.status()).toBe(200);
    expect((await request.get("/preview/"+id)).status()).toBe(404);
    await page.goto("/editor/"+orderId);
    await expect(page.getByRole("textbox",{name:"Bride Name"})).toHaveValue("माधवी & Rahul");
    const second=await admin.patch("/api/admin/cards/"+id,{
      data:{action:"save",revision:3,document:{...first,name:name+" Updated",
        layers:first.layers.map(l=>({...l,value:l.id===lockedId?"Updated fixed line":l.value}))}},
    });
    expect(second.status()).toBe(200);
    expect((await second.json()).version).toBe(2);
    const republish=await admin.patch("/api/admin/cards/"+id,{
      data:{action:"published",revision:4,sortOrder:0,featured:false},
    });
    expect(republish.status()).toBe(200);
    const pinnedAfter=await page.request.get("/api/orders/"+orderId+"/card");
    expect((await pinnedAfter.json()).document.name).toBe(name);
    const nextOrder=await page.request.post("/api/orders",{
      headers:{origin},data:{productId:id,phone:"9876543210"},
    });
    expect(nextOrder.status()).toBe(200);
    const newOrderId=(await nextOrder.json()).id;
    expect((db.prepare("SELECT template_version FROM purchased_products WHERE order_id=?").get(newOrderId) as {template_version:number}).template_version).toBe(2);
    expect((await request.get("/api/orders/"+orderId+"/card")).status()).toBe(401);
  } finally {
    db.close();await admin.dispose();
  }
});
