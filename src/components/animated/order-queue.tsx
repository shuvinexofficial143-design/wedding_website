"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
type Job={order_id:string;template_name:string;template_style:string;paid_at:number|null;started_at:number|null;delivered_at:number|null;phone:string;email:string;state:string;deadlineAt:number|null};
export function AnimatedOrderQueue(){
 const [jobs,setJobs]=useState<Job[]>([]),[status,setStatus]=useState("pending"),[search,setSearch]=useState("");
 const [now,setNow]=useState(Date.now()),[message,setMessage]=useState("");
 useEffect(()=>{let active=true;const load=async()=>{
  try{const r=await fetch("/api/admin/animated/orders",{cache:"no-store"});
   const d=await r.json();if(!r.ok)throw new Error(d.error);
   if(active)setJobs(d.orders);
  }catch(e){if(active)setMessage((e as Error).message)}
 };void load();const refresh=setInterval(load,30000),tick=setInterval(()=>setNow(Date.now()),1000);
 return ()=>{active=false;clearInterval(refresh);clearInterval(tick)};},[]);
 const state=(job:Job)=>job.delivered_at?"delivered":job.deadlineAt&&now>job.deadlineAt?"overdue":job.started_at?"editing":"pending";
 const time=(deadline:number|null)=>deadline===null?"Timer pending":(deadline<now?"Overdue by ":"Remaining ")+
   Math.floor(Math.abs(deadline-now)/60000)+":"+String(Math.floor(Math.abs(deadline-now)%60000/1000)).padStart(2,"0");
 const visible=jobs.filter(j=>(status==="all"||state(j)===status||status==="queue"&&state(j)!=="delivered")&&
  (!search||[j.order_id,j.email,j.phone,j.template_name,j.template_style].some(t=>t.toLowerCase().includes(search.toLowerCase()))));
 return <div className="animated-panel">
  <div className="animated-order-line"><h2>Paid orders ({jobs.length})</h2><p>Pending {jobs.filter(j=>state(j)!=="delivered").length} · Overdue {jobs.filter(j=>state(j)==="overdue").length}</p></div>
  <div className="animated-admin-grid">
   <label>Search order, phone, email or style<input placeholder="Search orders" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   <label>Filter<select value={status} onChange={e=>setStatus(e.target.value)}>
    {["queue","all","pending","editing","overdue","delivered"].map(x=><option key={x} value={x}>{x}</option>)}
   </select></label>
  </div>
  <p role="status">{message}</p>
  <div className="animated-list">{visible.map(j=><article className="animated-item" key={j.order_id}>
   <div className="animated-order-line"><div><h3>{j.template_name}</h3><p>{j.template_style} · {j.email} · {j.phone}</p><small>Order: {j.order_id}</small></div>
    <div><p className="animated-status">{state(j).toUpperCase()}</p><p className={"animated-timer "+(state(j)==="overdue"?"overdue":"")}>{time(j.deadlineAt)}</p></div></div>
   <Link className="button" href={"/admin/animated/orders/"+j.order_id}>Manage order ↗</Link>
  </article>)}</div>
  {!visible.length&&<p>No matching orders in this queue.</p>}
 </div>;
}
