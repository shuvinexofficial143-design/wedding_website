import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { products } from "../src/lib/catalog";
import { Invite } from "../src/components/invite";

const themes = [
  ["royal-gold-wedding", "royal-gold", "royal-crest"],
  ["floral-pink-wedding", "floral-pink", "floral-spray-art"],
  ["traditional-indian-wedding", "traditional-indian", "indian-toran"],
] as const;

test("old catalog products remain registered", () => {
  const existing = ["gulmohar", "royal-noor", "olive-vows", "moonlit",
    "petal-dance", "olive-motion", "palace-story", "garden-story", "cinematic-love"];
  for (const id of existing) assert.ok(products.some(p => p.id === id));
  assert.equal(new Set(products.map(p => p.id)).size, products.length);
});

test("each premium card shows unique artwork and edited wedding details", () => {
  for (const [id, theme, artwork] of themes) {
    const product = products.find(p => p.id === id);
    assert.ok(product);
    assert.equal(product.category, "cards");
    assert.equal(product.theme, theme);
    const markup = renderToStaticMarkup(createElement(Invite, {
      theme,
      names: ["Kavya", "Rohan"],
      date: "2028-04-11 · 14:45",
      venue: "The Lake Palace, Udaipur",
      photo: "",
    }));
    for (const expected of [artwork, "Kavya", "Rohan",
      "11 April 2028", "2:45 PM IST", "The Lake Palace, Udaipur"]) {
      assert.ok(markup.includes(expected), theme + " missing " + expected);
    }
  }
});
