import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { newDocument, layerSchema } from "../src/lib/studio/schema";
import { studioPublicationSchema, isPublishedStudioAsset } from "../src/lib/studio/publication";

test("a public invitation serves only displayed template or authorised customer images", () => {
  const background = randomUUID(), oldDefaultPhoto = randomUUID(),
    customerPhoto = randomUUID(), stranger = randomUUID(), hidden = randomUUID();
  const photoLayer = layerSchema.parse({
    id:randomUUID(), kind:"image", field:"photo", label:"Couple photo",
    editable:true, assetId:oldDefaultPhoto,
    x:100,y:160,width:300,height:400,
  });
  const hiddenLayer = layerSchema.parse({
    id:randomUUID(), kind:"image", field:"custom", label:"Private detail",
    hidden:true, assetId:hidden,
    x:400,y:160,width:200,height:200,
  });
  const doc = {...newDocument(),backgroundAssetId:background,layers:[photoLayer,hiddenLayer]};
  const values = {[photoLayer.id]:`/api/assets/${customerPhoto}`};
  assert.equal(isPublishedStudioAsset(doc,values,background),true);
  assert.equal(isPublishedStudioAsset(doc,values,customerPhoto),true);
  assert.equal(isPublishedStudioAsset(doc,values,oldDefaultPhoto),false);
  assert.equal(isPublishedStudioAsset(doc,values,hidden),false);
  assert.equal(isPublishedStudioAsset(doc,values,stranger),false);
  assert.equal(isPublishedStudioAsset(doc,{},oldDefaultPhoto),true);
});
test("public snapshot schema rejects malformed, untrusted or mutable revision payloads",()=>{
  const layerId=randomUUID();
  const snapshot=studioPublicationSchema.parse({
    kind:"studio-card", version:1,values:{[layerId]:"शुभ विवाह"},
  });
  assert.equal(snapshot.version,1);
  assert.equal(snapshot.values[layerId],"शुभ विवाह");
  assert.throws(()=>studioPublicationSchema.parse({kind:"studio-card",version:0,values:{}}));
  assert.throws(()=>studioPublicationSchema.parse({kind:"studio-card",version:1,values:{unknown:"tamper"}}));
  assert.throws(()=>studioPublicationSchema.parse({kind:"studio-card",version:1,values:{},secret:"should-not-appear"}));
});
