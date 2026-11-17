"use client";
import {useState} from "react";
import type {Details} from "@/lib/validation";
import {AnimatedVideoPreview} from "./video-preview";
export function AnimatedCustomerDetails({orderId,name,videoId,initial,initialRevision,fulfillment,deliveryUrl}:{
  orderId:string;name:string;videoId:string;initial:Details;initialRevision:number;fulfillment:string;deliveryUrl:string|null;
}){
  const [values,setValues]=useState<Details>(initial),[revision,setRevision]=useState(initialRevision);
  const [busy,setBusy]=useState(false),[feedback,setFeedback]=useState("");
  const changed=(key:keyof Details,value:string)=>setValues(prev=>({...prev,[key]:value}));
  return <div className="animated-admin-grid">
    <div className="animated-panel">
      <h2>{name}</h2><AnimatedVideoPreview videoId={videoId} title={name}/>
      <p>Delivery progress: <strong>{fulfillment.replaceAll("_"," ")}</strong></p>
      {deliveryUrl&&<p><a className="button" href={deliveryUrl} target="_blank" rel="noopener noreferrer">Open completed invitation ↗</a></p>}
      <p>Your studio will personalise this video manually. Your design&apos;s private Canva file is never shared.</p>
    </div>
    <form className="animated-panel form" onSubmit={async e=>{
      e.preventDefault();setBusy(true);setFeedback("");
      try{
        const res=await fetch(`/api/orders/${orderId}/animated`,{method:"PATCH",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({revision,details:values})});
        const result=await res.json();
        if(!res.ok)throw new Error(result.error||"Save failed");
        setRevision(result.revision);setFeedback("Wedding details saved. Our team can now prepare your copy.");
      }catch(e){setFeedback((e as Error).message)}finally{setBusy(false)}
    }}>
      <h2>Details for your order</h2>
      <label>Partner one<input required maxLength={70} value={values.partnerA} onChange={e=>changed("partnerA",e.target.value)}/></label>
      <label>Partner two<input required maxLength={70} value={values.partnerB} onChange={e=>changed("partnerB",e.target.value)}/></label>
      <label>Wedding date<input type="date" required value={values.date} onChange={e=>changed("date",e.target.value)}/></label>
      <label>Time<input type="time" required value={values.time} onChange={e=>changed("time",e.target.value)}/></label>
      <label>Venue<input required maxLength={200} value={values.venue} onChange={e=>changed("venue",e.target.value)}/></label>
      <label>Address<textarea maxLength={180} value={values.address} onChange={e=>changed("address",e.target.value)}/></label>
      <label>Invitation message<textarea maxLength={140} value={values.cardMessage} onChange={e=>changed("cardMessage",e.target.value)}/></label>
      <label>Story / special request<textarea maxLength={2000} value={values.story} onChange={e=>changed("story",e.target.value)}/></label>
      <button disabled={busy||fulfillment==="delivered"} className="button">{busy?"Saving…":"Save wedding details"}</button>
      <p role="status">{feedback}</p>
    </form>
  </div>;
}
