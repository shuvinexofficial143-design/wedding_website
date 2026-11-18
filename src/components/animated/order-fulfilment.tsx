"use client";
import {uploadAsset} from "@/lib/upload-client";
import {useEffect,useState} from "react";
type Job={
 order_id:string;template_name:string;template_style:string;email:string;phone:string;
 details:string;amount:number;fulfillment:string;payment_status:string;revision:number;
 original_canva_url:string;editing_copy_url:string|null;delivery_url:string|null;
 paid_at:number|null;started_at:number|null;delivered_at:number|null;
};
export function AnimatedOrderFulfilment({initial}:{initial:Job}){
 const [job,setJob]=useState(initial),[copy,setCopy]=useState(initial.editing_copy_url||"");
 const [deliveryAssetId,setDeliveryAssetId]=useState<string|undefined>(),[uploadProgress,setUploadProgress]=useState<number|null>(null);
 const [delivery,setDelivery]=useState(initial.delivery_url||"");
 const [siteOrigin,setSiteOrigin]=useState("");
 const [now,setNow]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{const timer=setInterval(()=>{setNow(Date.now());setSiteOrigin(window.location.origin);},1000);return()=>clearInterval(timer)},[]);
 const details=JSON.parse(job.details||"{}") as Record<string,unknown>;
 const detailLines=[
  "Order: "+job.order_id,"Design: "+job.template_name+" ("+job.template_style+")",
  "Customer: "+job.email,"Mobile: "+job.phone,
  "Partner one: "+(details.partnerA||"Not provided"),
  "Partner two: "+(details.partnerB||"Not provided"),
  "Date: "+(details.date||"Not provided"),"Time: "+(details.time||"Not provided"),
  "Venue: "+(details.venue||"Not provided"),
  "Address: "+(details.address||"Not provided"),
  "Invitation message: "+(details.cardMessage||""),
  "Special requests: "+(details.story||"")
 ].join("\n");
 const deadline=job.paid_at?job.paid_at+3600000:null;
 const delta=deadline===null || now===0 || !!job.delivered_at ? null : deadline-now;
 const format=job.delivered_at?"Delivered":deadline===null?"Awaiting verified payment timestamp":
   now===0?"Calculating delivery deadline…":
   (delta!<0?"Overdue by ":"Time left ")+Math.floor(Math.abs(delta!)/60000)+":"+
   String(Math.floor(Math.abs(delta!)%60000/1000)).padStart(2,"0");
 async function change(action:"copy"|"editing"|"delivered"){
  setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/admin/animated/orders/"+job.order_id,{method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,revision:job.revision,editingCopyUrl:copy||undefined,deliveryUrl:deliveryAssetId?undefined:delivery||undefined,deliveryAssetId})});
   const result=await r.json();if(!r.ok)throw new Error(result.error||"Unable to update");
   const fresh=await fetch("/api/admin/animated/orders/"+job.order_id,{cache:"no-store"});
   if(!fresh.ok)throw new Error("Updated; reload order to read latest details");
   const data=await fresh.json();setJob(data.job);setMessage("Order "+action+" saved.");
  }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}
 }
 const readyMessage=siteOrigin&&job.delivered_at&&job.delivery_url?' Your invitation is ready: '+(job.delivery_url.startsWith('/')?siteOrigin+job.delivery_url:job.delivery_url)+' . Sign in with your customer account to download.':'';
 const whatsapp="https://wa.me/91"+job.phone+"?text="+encodeURIComponent("Hello! Suhani Wedding Studio here regarding your "+job.template_name+" order "+job.order_id+"."+readyMessage);
 return <div className="animated-admin-grid">
  <section className="animated-panel">
   <h2>{job.template_name}</h2><p>{job.template_style} · ₹{job.amount/100} · {job.fulfillment.replaceAll("_"," ")}</p>
   <p className={"animated-timer "+(delta!==null&&delta<0?"overdue":"")}>{format}</p>
   <h3>Customer details</h3><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontFamily:"inherit"}}>{detailLines}</pre>
   <div className="actions"><button className="button" onClick={async()=>{
      try{await navigator.clipboard.writeText(detailLines);setMessage("Customer details copied");}
      catch{setMessage("Clipboard unavailable; copy from the customer details above.");}
    }}>Copy Customer Details</button>
    <a className="button" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp Customer</a></div>
  </section>
  <section className="animated-panel">
   <h2>Production workflow</h2>
   <p><strong>Step 1.</strong> Open the original Canva template. In Canva, choose File → Make a copy (or duplicate). Never change the original.</p>
   <a className="button" href={job.original_canva_url} target="_blank" rel="noopener noreferrer">Open Canva Template ↗</a>
   <p><strong>Step 2.</strong> Save the new order-specific copy URL here. Its URL must differ from the original.</p>
   <label>Editing copy URL<input type="url" placeholder="https://www.canva.com/design/.../edit" value={copy} onChange={e=>setCopy(e.target.value)}/></label>
   <div className="actions"><button className="button" disabled={busy} onClick={()=>void change("copy")}>Save Order Copy</button>
    {job.editing_copy_url&&<a className="text-link" href={job.editing_copy_url} target="_blank" rel="noopener noreferrer">Open this order&apos;s copy ↗</a>}</div>
   <p><strong>Step 3.</strong> Apply the copied wedding details to the order-specific Canva copy.</p>
   <button className="button" disabled={busy||!!job.started_at||!!job.delivered_at} onClick={()=>void change("editing")}>Mark Editing</button>
   <p><strong>Step 4.</strong> Upload the finished MP4 privately, or provide an existing final HTTPS delivery link. Then mark delivered.</p>
   <label>Upload final MP4 (maximum 50 MB)<input type="file" accept="video/mp4" disabled={busy||!!job.delivered_at||!job.started_at} onChange={async e=>{
    const file=e.target.files?.[0];if(!file)return;setBusy(true);setDeliveryAssetId(undefined);setMessage('Uploading private MP4…');
    try{const asset=await uploadAsset(file,'video',setUploadProgress);setDeliveryAssetId(asset.id);setMessage('Upload verified. Click Mark Delivered to release the file to this customer.');}
    catch(error){setMessage((error as Error).message)}finally{setBusy(false);setUploadProgress(null);e.target.value='';}
   }}/></label>
   {uploadProgress!==null&&<div><progress aria-label="MP4 upload progress" value={uploadProgress} max={100}/><span>{uploadProgress}% · validating before delivery</span></div>}
   {deliveryAssetId&&<p>Private MP4 is ready for delivery.</p>}
   <p>WhatsApp opens a prepared message for you to send manually. Opening it does not mark delivery.</p>
   <label>Final delivery URL<input type="url" placeholder="https://..." value={delivery} onChange={e=>setDelivery(e.target.value)}/></label>
   <button className="button" disabled={busy||!job.started_at||!!job.delivered_at} onClick={()=>void change("delivered")}>Mark Delivered</button>
   {job.delivered_at&&<p>Delivered ✓ <a href={job.delivery_url||"#"} rel="noopener noreferrer" target="_blank">Open delivered invitation</a></p>}
   <p role="status">{message}</p>
  </section>
 </div>;
}
