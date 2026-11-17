import {
  newDocument,
  layerSchema,
  type Layer,
  type CardDocument,
} from "../studio/schema";
import { presetFrames, type MotionPreset, type MotionTrack } from "./timeline";
/** Original geometric compositions: no external assets or copied artwork. IDs remain stable across seed runs. */
export function animatedTemplates() {
  return [
    "Royal Palace Entrance",
    "Romantic Rose Garden",
    "Luxury Golden Envelope",
    "Traditional Indian Wedding",
    "Modern Minimal Luxury",
    "Elegant Nikah Invitation",
  ].map((name, index) => {
    const colors = [
      ["#301a26", "#f9e8bd", "#c9a55c"],
      ["#f7e9ee", "#713347", "#ba7180"],
      ["#142f36", "#f8ecd1", "#c9a55c"],
      ["#7a2e3a", "#fff2d8", "#eeac45"],
      ["#fff9f4", "#2b1c1f", "#c9a55c"],
      ["#103e35", "#fff8e3", "#c9a55c"],
    ][index];
    const [bg, ink, gold] = colors;
    const layers: Layer[] = [],
      tracks: MotionTrack[] = [];
    let n = 0;
    const add = (
      input: Partial<Layer> & {
        kind: Layer["kind"];
        label: string;
        x: number;
        y: number;
        width: number;
        height: number;
      },
      motion?: MotionPreset,
      start = 0,
      duration = 1200,
    ) => {
      const id = `a100000${index}-0000-4000-8000-${String(++n).padStart(12, "0")}`;
      const l = layerSchema.parse({
        id,
        color: ink,
        fontFamily: "Georgia",
        fontSize: 42,
        fill: gold,
        borderColor: gold,
        zIndex: n,
        ...input,
      });
      layers.push(l);
      if (motion)
        tracks.push({
          layerId: id,
          start,
          duration,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          frames: presetFrames(motion),
        });
      return l;
    };
    const shape = (
      label: string,
      x: number,
      y: number,
      w: number,
      h: number,
      fill: string,
      extra: Partial<Layer> = {},
      motion?: MotionPreset,
      start = 0,
    ) =>
      add(
        { kind: "shape", label, x, y, width: w, height: h, fill, ...extra },
        motion,
        start,
      );
    const text = (
      label: string,
      value: string,
      y: number,
      size: number,
      field: Layer["field"] = "custom",
      motion: MotionPreset = "rise",
      start = 1400,
    ) =>
      add(
        {
          kind: "text",
          label,
          value,
          field,
          editable: field !== "custom",
          x: 100,
          y,
          width: 800,
          height: size * 1.65,
          fontSize: size,
          maxLength: field.includes("partner") ? 90 : 240,
        },
        motion,
        start,
      );
    if (index === 0) {
      shape("Palace arch outer", 70, 50, 860, 1280, gold, { shape: "ellipse" });
      shape("Palace arch inner", 95, 80, 810, 1230, bg, { shape: "ellipse" });
      for (const x of [80, 870]) {
        shape("Carved column", x, 280, 50, 900, gold);
        for (let y = 320; y < 1150; y += 120)
          shape("Column inlay", x + 10, y, 30, 70, bg, { shape: "ellipse" });
      }
      text("Royal crest", "❦", 160, 80, "custom", "zoom", 900);
      text("Heading", "THE WEDDING CELEBRATION", 310, 26);
    } else if (index === 1) {
      for (let i = 0; i < 14; i++) {
        const side = i % 2;
        const x = side ? 810 + (i % 3) * 22 : 30 + (i % 3) * 24;
        const y = 80 + i * 85;
        shape(
          "Rose petal",
          x,
          y,
          65,
          110,
          i % 3 === 0 ? gold : "#dfafbd",
          { shape: "ellipse", rotation: side ? 35 : -35 },
          "petal",
          i * 180,
        );
        shape(
          "Garden leaf",
          side ? 745 : 115,
          y + 30,
          45,
          100,
          "#809b7b",
          { shape: "ellipse", rotation: side ? -25 : 25 },
          "turn",
          i * 70,
        );
      }
      text("Heading", "LOVE, IN FULL BLOOM", 220, 28, "custom", "fade");
      text("Floral ornament", "❦", 310, 70, "custom", "zoom");
    } else if (index === 2) {
      shape("Envelope back", 50, 250, 900, 1000, "#c9a55c");
      shape("Letter paper", 90, 290, 820, 930, "#fff9f4", {}, "rise", 400);
      shape(
        "Envelope fold left",
        40,
        850,
        460,
        380,
        "#b18c48",
        {},
        "slide-left",
        0,
      );
      shape(
        "Envelope fold right",
        500,
        850,
        460,
        380,
        "#d6b875",
        {},
        "slide-right",
        0,
      );
      shape(
        "Wax seal",
        410,
        1040,
        180,
        180,
        "#7a2e3a",
        { shape: "ellipse", borderWidth: 8, borderColor: "#c9a55c" },
        "turn",
        400,
      );
      text("Heading", "A LETTER OF LOVE", 330, 28, "custom", "fade", 1800);
    } else if (index === 3) {
      shape("Mandap canopy", 70, 120, 860, 140, gold);
      shape("Mandap roof", 120, 70, 760, 100, "#d77e2e");
      for (const x of [80, 870]) shape("Mandap column", x, 260, 50, 980, gold);
      for (let i = 0; i < 12; i++)
        for (let j = 0; j < 3; j++)
          shape(
            "Marigold garland",
            110 + i * 65,
            260 + j * 32 + (i % 3) * 18,
            30,
            30,
            j % 2 ? "#e27427" : "#f2b83f",
            { shape: "ellipse" },
            "zoom",
            i * 60 + j * 90,
          );
      for (const x of [150, 750]) {
        shape(
          "Diya bowl",
          x,
          1170,
          100,
          45,
          gold,
          { shape: "ellipse" },
          "rise",
          1200,
        );
        shape(
          "Diya flame",
          x + 35,
          1110,
          30,
          65,
          "#ffc969",
          { shape: "ellipse" },
          "fade",
          1500,
        );
      }
      text("Heading", "WITH OUR FAMILIES’ BLESSINGS", 380, 25);
    } else if (index === 4) {
      shape("Editorial gold rule", 80, 80, 20, 1240, gold, {}, "rise", 0);
      shape(
        "Editorial top rule",
        100,
        90,
        800,
        20,
        gold,
        {},
        "slide-left",
        100,
      );
      text(
        "Edition",
        "THE WEDDING EDITION",
        180,
        24,
        "custom",
        "slide-left",
        300,
      );
      text(
        "Date numeral",
        "01 / FOREVER",
        300,
        58,
        "custom",
        "slide-right",
        600,
      );
      shape(
        "Editorial footer rule",
        100,
        1260,
        800,
        20,
        gold,
        {},
        "slide-right",
        600,
      );
    } else {
      for (const [x, y, w, h] of [
        [60, 60, 880, 1280],
        [85, 85, 830, 1230],
      ])
        shape(
          "Geometric border",
          x,
          y,
          w,
          h,
          bg,
          { borderColor: gold, borderWidth: 4 },
          "fade",
          0,
        );
      for (const [x, y] of [
        [115, 150],
        [765, 150],
        [115, 1110],
        [765, 1110],
      ]) {
        shape(
          "Geometric star",
          x,
          y,
          110,
          110,
          gold,
          { rotation: 45 },
          "turn",
          300,
        );
        shape(
          "Geometric star inset",
          x + 15,
          y + 15,
          80,
          80,
          bg,
          { rotation: 45 },
          "zoom",
          700,
        );
      }
      text("Heading", "A CELEBRATION OF NIKAH", 320, 27, "custom", "fade", 800);
      text(
        "Blessing",
        "In the name of Allah, the Most Merciful",
        390,
        22,
        "custom",
        "fade",
        1100,
      );
    }
    const nameY = index === 4 ? 520 : 490;
    const nameColor = index === 2 ? "#2b1c1f" : ink;
    for (const [label, field, y, size, start] of [
      ["Bride name", "partnerA", nameY, 68, 1700],
      ["Ampersand", "custom", nameY + 125, 36, 2000],
      ["Groom name", "partnerB", nameY + 205, 68, 2300],
      ["Wedding date", "date", nameY + 365, 30, 2800],
      ["Wedding time", "time", nameY + 425, 25, 3000],
      ["Venue", "venue", nameY + 480, 25, 3200],
      ["Address", "address", nameY + 545, 20, 3400],
    ] as const) {
      const l = text(
        label,
        field === "custom" ? "&" : "",
        y,
        size,
        field,
        index === 4 ? "slide-left" : "rise",
        start,
      );
      l.color = nameColor;
    }
    text(
      "Invitation message",
      "We joyfully invite you to celebrate with us.",
      1110,
      23,
      "cardMessage",
      "fade",
      3700,
    );
    add(
      {
        kind: "image",
        label: "Couple photo",
        field: "photo",
        editable: true,
        x: 425,
        y: 1190,
        width: 150,
        height: 150,
        maxLength: 100,
      },
      "zoom",
      3900,
    );
    if (index === 0) {
      shape(
        "Palace left door",
        40,
        60,
        460,
        1280,
        "#503044",
        { zIndex: 990, borderColor: gold, borderWidth: 10 },
        "door-left",
        500,
      );
      shape(
        "Palace right door",
        500,
        60,
        460,
        1280,
        "#503044",
        { zIndex: 991, borderColor: gold, borderWidth: 10 },
        "door-right",
        500,
      );
    }
    const doc: CardDocument = {
      ...newDocument(),
      name,
      description: `An original ${name.toLowerCase()} with a personalised, shareable animated invitation. Browser animation; no MP4 export.`,
      category: "animated",
      pricePaise: 79900,
      backgroundColor: bg,
      tags: ["premium", "motion", `design-${index + 1}`],
      layers,
      animation: { version: 1, duration: 6000, tracks },
    };
    return {
      id: `motion-${index + 1}`,
      style: `MOTION-0${index + 1}`,
      document: doc,
    };
  });
}
