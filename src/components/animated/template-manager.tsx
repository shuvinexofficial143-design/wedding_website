"use client";
/* eslint-disable @next/next/no-img-element */
import {uploadAsset} from "@/lib/upload-client";
import {parseYouTubeId} from "@/lib/animated/youtube";
import {AnimatedVideoPreview} from "./video-preview";
import {useEffect,useState} from "react";
type Template={id:string;style_number:string;name:string;category:string;price_paise:number;thumbnail_url:string;youtube_video_id:string;canva_url:string;status:string;revision:number};
type Input={styleNumber:string;name:string;category:string;pricePaise:number;thumbnailUrl:string;youtubeUrl:string;canvaUrl:string};
const empty:Input={styleNumber:"",name:"",category:"wedding",pricePaise:59900,thumbnailUrl:"",youtubeUrl:"",canvaUrl:""};
export function AnimatedTemplateManager(){
 const [items,setItems]=useState<Template[]>([]),[selected,setSelected]=useState<Template|null>(null);
 const [form,setForm]=useState<Input>(empty),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [uploadProgress,setUploadProgress]=useState<number|null>(null);
 let videoId="";try{videoId=parseYouTubeId(form.youtubeUrl);}catch{}
 const load=async()=>{
  const r=await fetch("/api/admin/animated",{cache:"no-store"}),data=await r.json();
  if(!r.ok)throw new Error(data.error||"Unable to read templates");
  setItems(data.templates);
 };
 useEffect(()=>{
   let active=true;
   void fetch("/api/admin/animated",{cache:"no-store"}).then(async r=>{
      const data=await r.json();if(!r.ok)throw new Error(data.error||"Unable to read templates");
      if(active)setItems(data.templates);
   }).catch(e=>{if(active)setMessage(e.message)});
   return ()=>{active=false};
 },[]);
 function edit(row:Template){
  setSelected(row);setMessage("");
  setForm({styleNumber:row.style_number,name:row.name,category:row.category,pricePaise:row.price_paise,
   thumbnailUrl:row.thumbnail_url,youtubeUrl:"https://www.youtube.com/watch?v="+row.youtube_video_id,canvaUrl:row.canva_url});
 }
 async function request(url:string,method:"POST"|"PATCH",payload:object){
  setBusy(true);setMessage("");
  try{
   const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await r.json();if(!r.ok)throw new Error(data.error||"Save failed");
   await load();setMessage("Saved successfully. Published designs become visible in the shared catalog.");
   setSelected(prev=>prev?.id===data.id?{...prev,...data}:prev);
   if(method==="POST")setForm(empty);
  }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}
 }
 return <div className="animated-admin-grid">
  <div className="animated-panel">
   <h2>{selected?"Edit animated template":"Add animated invitation"}</h2>
   <form className="form" onSubmit={e=>{e.preventDefault();void request(selected?"/api/admin/animated/"+selected.id:"/api/admin/animated",selected?"PATCH":"POST",selected?{action:"save",revision:selected.revision,template:form}:form);}}>
    <label>Unique template ID / style number<input required maxLength={40} placeholder="ANI-WED-001" value={form.styleNumber} onChange={e=>setForm({...form,styleNumber:e.target.value.toUpperCase()})}/></label>
    <label>Name<input required maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
    <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
     {["wedding","engagement","anniversary","birthday","other"].map(x=><option key={x} value={x}>{x}</option>)}
    </select></label>
    <label>Price (₹)<input type="number" required min="1" step="1" value={form.pricePaise/100} onChange={e=>setForm({...form,pricePaise:Math.round(Number(e.target.value)*100)})}/></label>
    <label>Upload thumbnail from computer<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async e=>{
      const file=e.target.files?.[0];if(!file)return;setBusy(true);setMessage('Uploading thumbnail…');
      try{const asset=await uploadAsset(file,'thumbnail',setUploadProgress);setForm(f=>({...f,thumbnailUrl:asset.url}));setMessage('Thumbnail uploaded. Save the template to attach it.');}
      catch(error){setMessage((error as Error).message)}finally{setBusy(false);setUploadProgress(null);e.target.value='';}
    }}/></label>
    {uploadProgress!==null&&<progress aria-label="Thumbnail upload progress" max={100} value={uploadProgress}/>}
    {form.thumbnailUrl&&<img src={form.thumbnailUrl} alt="Template thumbnail preview" style={{maxWidth:'100%',maxHeight:240,objectFit:'contain'}}/>}
    <label>Public thumbnail HTTPS URL<input type="text" required placeholder="https://…" value={form.thumbnailUrl} onChange={e=>setForm({...form,thumbnailUrl:e.target.value})}/></label>
    <label>YouTube Unlisted Video URL<input type="url" required placeholder="https://youtu.be/…" value={form.youtubeUrl} onChange={e=>setForm({...form,youtubeUrl:e.target.value})}/></label>
    {videoId&&<AnimatedVideoPreview videoId={videoId} title={form.name||"Template"}/>}
    <label>PRIVATE Canva editable original URL<input type="url" required placeholder="https://www.canva.com/design/…/edit" value={form.canvaUrl} onChange={e=>setForm({...form,canvaUrl:e.target.value})}/></label>
    <p><small>The Canva URL remains inside admin-only database reads. Never use a public Canva share-link here.</small></p>
    <div className="actions"><button className="button" disabled={busy}>{busy?"Saving…":selected?"Save template changes":"Add draft template"}</button>
     {selected&&<button type="button" className="button" onClick={()=>{setSelected(null);setForm(empty);}}>Create another</button>}</div>
   </form>
   {selected&&<div className="actions"><button className="button" disabled={busy} onClick={()=>void request("/api/admin/animated/"+selected.id,"PATCH",{action:selected.status==="published"?"unpublished":"published",revision:selected.revision})}>{selected.status==="published"?"Unpublish":"Publish"}</button></div>}
   <p role="status">{message}</p>
  </div>
  <div className="animated-panel"><h2>Saved designs ({items.length})</h2>
   <div className="animated-list">{items.map(item=><article key={item.id} className="animated-item">
     <div className="animated-order-line"><h3>{item.name}</h3><span className="animated-status">{item.status}</span></div>
     <p>{item.style_number} · {item.category} · ₹{item.price_paise/100}</p>
     <p><small>Internal ID: {item.id}</small></p>
     <div className="actions"><button type="button" className="button" onClick={()=>edit(item)}>Edit template</button>
      <button type="button" className="button" disabled={busy} onClick={()=>void request('/api/admin/animated/'+item.id,'PATCH',{action:item.status==='published'?'unpublished':'published',revision:item.revision})}>{item.status==='published'?'Unpublish design':'Publish design'}</button>
      {item.status==="published"&&<a href={"/products/"+item.id} target="_blank" rel="noopener noreferrer" className="text-link">Public preview ↗</a>}</div>
   </article>)}</div>
  </div>
 </div>;
}
