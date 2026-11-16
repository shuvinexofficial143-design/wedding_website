import {z} from 'zod';
const text=(max:number)=>z.string().trim().max(max);
export const detailsSchema=z.object({partnerA:text(70).min(1),partnerB:text(70).min(1),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),venue:text(200).min(1),story:text(2000).default(''),photo:z.string().max(1500000).regex(/^$|^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/).default(''),maps:text(500).refine(v=>!v||/^https:\/\/(www\.google\.com\/maps|maps\.google\.com\/|maps\.app\.goo\.gl\/)/.test(v),'Use a Google Maps HTTPS link').default(''),gallery:z.array(z.string().max(1500000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)).max(4).default([])});
export type Details=z.infer<typeof detailsSchema>;
export const defaultDetails:Details={partnerA:'Ananya',partnerB:'Aarav',date:'2027-02-21',time:'18:00',venue:'The Rose Palace · Jaipur',story:'',photo:'',maps:'',gallery:[]};
export async function readJson(request:Request,max=8_000_000){const body=await request.text();if(Buffer.byteLength(body)>max)throw new Error('Request is too large');return JSON.parse(body);}
