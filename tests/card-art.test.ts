import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cardTemplates, findArtworkTemplate } from "../src/lib/card-templates";
import { products } from "../src/lib/catalog";
import { Invite } from "../src/components/invite";

const expected = [
  "royal-golden-palace", "luxury-maroon-heritage", "pink-rose-floral",
  "white-gold-minimal", "traditional-hindu-wedding", "rajasthani-royal-wedding",
  "pastel-watercolor-floral", "elegant-muslim-nikah", "south-indian-traditional",
  "luxury-dark-emerald",
];
test("ten unique, original and published illustrated cards with physical vector artwork", () => {
  assert.equal(cardTemplates.length, 10);
  assert.deepEqual(new Set(cardTemplates.map(x => x.id)),new Set(expected));
  assert.equal(new Set(cardTemplates.map(x => x.artwork)).size,10);
  assert.equal(new Set(cardTemplates.map(x => x.layout)).size,10);
  for(const t of cardTemplates){
    assert.equal(t.category,"cards");
    assert.equal(t.published,true);
    assert.equal(t.textLayers.message.maxLength,140);
    assert.equal(t.textLayers.venue.maxLength,200);
    assert.equal(t.textLayers.address.maxLength,180);
    assert.ok(t.price > 0);
    assert.equal(findArtworkTemplate(t.theme)?.id,t.id);
    const art=path.join(process.cwd(),"public",t.artwork);
    assert.ok(existsSync(art),t.id+" art missing");
    const svg=readFileSync(art,"utf8");
    assert.match(svg,/<svg\b/);
    assert.ok(svg.length>4500,t.id+" artwork too small");
    const product=products.find(p=>p.id===t.id);
    assert.ok(product,t.id+" not in catalog");
    const html=renderToStaticMarkup(createElement(Invite,{
      theme:t.theme,names:["Ananya","Aarav"],date:"2028-04-11 · 14:45",
      venue:"The Royal Pavilion, Jaipur",address:"Palace Road, Rajasthan",message:"Please join our celebration.",
    }));
    assert.ok(html.includes("artwork-background"));
    assert.ok(html.includes(t.artwork));
    for(const str of ["Ananya","Aarav","11 April 2028","2:45 PM IST","The Royal Pavilion, Jaipur","Palace Road, Rajasthan","Please join our celebration."]){
      assert.ok(html.includes(str),t.id+" missing "+str);
    }
  }
});
test("legacy cards and other product categories remain registered",()=>{
  for(const id of ["royal-gold-wedding","floral-pink-wedding","traditional-indian-wedding",
    "gulmohar","royal-noor","olive-vows","moonlit","petal-dance","olive-motion",
    "palace-story","garden-story","cinematic-love"]){
    assert.ok(products.some(p=>p.id===id),id+" missing");
  }
  assert.equal(new Set(products.map(p=>p.id)).size,products.length);
});
