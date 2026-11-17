import { test, expect, type Page } from "@playwright/test";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
const origin = "http://localhost:3000";

async function admin(page: Page) {
  const email = `studio-${randomUUID()}@example.test`;
  const response = await page.request.post("/api/auth", {
    headers: { origin },
    data: { action: "register", email, password: "Browser-fixture-password-2026!" },
  });
  expect(response.status()).toBe(200);
  // Isolated Playwright SQLite fixture only; never accessible from application routes.
  const database = new DatabaseSync(process.env.DATABASE_PATH || path.join(process.cwd(), "data", "e2e.sqlite"));
  try {
    // Other isolated e2e specs may have provisioned the reserved address earlier.
    database.prepare("UPDATE users SET email='retired-'||id||'@example.test',role='customer' WHERE email='admin@example.test'").run();
    database.prepare("UPDATE users SET role='admin',email='admin@example.test' WHERE email=?").run(email);
  } finally { database.close(); }
}
async function addBride(page: Page) {
  await page.getByRole("button", {name: "+ Bride name"}).click();
  await expect(page.getByRole("button", {name: "Select partnerA"})).toBeVisible();
}
async function readLayerNumber(page: Page, field: string) {
  return Number(await page.getByRole("spinbutton", {name: field, exact: true}).inputValue());
}
test("admin designer: pointer move, resize, undo/redo, Hindi/English, local upload and reload", async ({page}) => {
  await admin(page);
  await page.goto("/admin/cards/new");
  await expect(page.getByText("Card Design Studio")).toBeVisible();
  await page.getByLabel("Card name").fill("Royal फूल Wedding");
  const style = "TEST-" + randomUUID().slice(0,8).toUpperCase();
  await page.getByLabel("Unique style number").fill(style);
  await addBride(page);
  await page.getByLabel("Default / custom text").fill("शुभ विवाह — Royal Wedding");
  await expect(page.locator(".layer-card")).toContainText("शुभ विवाह");
  const startX = await readLayerNumber(page, "x");
  const handle = page.getByRole("button", {name:"Select partnerA"});
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox();
  expect(box).toBeTruthy();
  const midX = box!.x + box!.width / 2;
  const midY = box!.y + box!.height / 2;
  await page.mouse.move(midX, midY);
  await page.mouse.down();
  await page.mouse.move(midX + 35, midY + 25, {steps:8});
  await page.mouse.up();
  await expect.poll(() => readLayerNumber(page,"x")).toBeGreaterThan(startX);
  const movedX = await readLayerNumber(page,"x");
  await page.getByRole("button",{name:"Undo"}).click();
  await expect.poll(() => readLayerNumber(page,"x")).toBe(startX);
  await page.getByRole("button",{name:"Redo"}).click();
  await expect.poll(() => readLayerNumber(page,"x")).toBe(movedX);
  const startWidth = await readLayerNumber(page,"width");
  const resize = page.locator(".studio-resize");
  const b = await resize.boundingBox();
  expect(b).toBeTruthy();
  await page.mouse.move(b!.x + b!.width/2,b!.y + b!.height/2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width/2 + 25,b!.y + b!.height/2 + 15,{steps:7});
  await page.mouse.up();
  await expect.poll(() => readLayerNumber(page,"width")).toBeGreaterThan(startWidth);
  const png = await sharp({create:{width:100,height:140,channels:3,background:"#b5d4d5"}}).png().toBuffer();
  await page.getByLabel("Background artwork").setInputFiles({name:"original-background.png",mimeType:"image/png",buffer:png});
  await expect(page.getByRole("status")).toContainText("Image validated and saved.",{timeout:20000});
  await expect(page.locator(".layer-card img[alt='Invitation background']")).toBeVisible();
  await page.getByRole("button",{name:"Save design"}).click();
  await expect(page.getByRole("status")).toContainText("Saved version 1",{timeout:20000});
  const url = page.url();
  expect(url).toMatch(/\/admin\/cards\/[0-9a-f-]+$/);
  await page.reload();
  await expect(page.getByLabel("Card name")).toHaveValue("Royal फूल Wedding");
  await expect(page.locator(".layer-card")).toContainText("शुभ विवाह");
  await expect(page.locator(".layer-card img[alt='Invitation background']")).toBeVisible();
  await page.screenshot({path:"test-results/studio-designer-desktop.png",fullPage:true});
});

test("admin designer: touch drag and mobile controls", async ({page}) => {
  await admin(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto("/admin/cards/new");
  await addBride(page);
  const handle = page.getByRole("button",{name:"Select partnerA"});
  await handle.scrollIntoViewIfNeeded();
  const start = await readLayerNumber(page,"x");
  const b = await handle.boundingBox(); expect(b).toBeTruthy();
  const x = b!.x + b!.width/2,y=b!.y+b!.height/2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
  await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:x+24,y:y+15}]});
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await expect.poll(() => readLayerNumber(page,"x")).toBeGreaterThan(start);
  await expect(page.getByRole("button",{name:"Save design"})).toBeVisible();
  await page.screenshot({path:"test-results/studio-designer-mobile.png",fullPage:true});
});

test("admin designer: authorization and malicious SVG upload blocked", async ({page,request}) => {
  const guest = await request.get("/admin/cards/new");
  expect([200,307]).toContain(guest.status());
  const forbidden = await page.request.post("/api/admin/cards",{
    headers:{origin},data:{styleNumber:"GUESS-001",document:{}},
  });
  expect(forbidden.status()).toBe(403);
  await admin(page);
  await page.goto("/admin/cards/new");
  await page.getByLabel("Background artwork").setInputFiles({
    name:"unsafe.svg",mimeType:"image/svg+xml",
    buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" onload="alert(1)"><rect width="500" height="700" fill="red"/></svg>'),
  });
  await expect(page.getByRole("status")).toContainText(/SVG contains active|Upload|File/, {timeout:20000});
  await expect(page.locator(".layer-card img[alt='Invitation background']")).toHaveCount(0);
});
