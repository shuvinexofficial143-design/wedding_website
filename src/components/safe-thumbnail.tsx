"use client";
/* eslint-disable @next/next/no-img-element */
import {useState} from 'react';
export function SafeThumbnail({src,alt}:{src:string;alt:string}){const [failed,setFailed]=useState(false);return <img src={failed?'/brand/wedding-editorial-small.webp':src} alt={failed?'Wedding invitation artwork; preview image unavailable':alt} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>}
