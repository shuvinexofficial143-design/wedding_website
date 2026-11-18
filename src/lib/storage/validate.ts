import sharp from 'sharp';import {createHash} from 'node:crypto';
export const maxImageBytes=10*1024*1024;export const maxVideoBytes=50*1024*1024;
export const hashBytes=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
export async function validateAsset(bytes:Buffer,mime:string,purpose:string){const video=purpose==='video';if(bytes.length===0||bytes.length>(video?maxVideoBytes:maxImageBytes))throw new Error('File size is not allowed');if(video){if(mime!=='video/mp4')throw new Error('A valid MP4 is required');validateMp4(bytes);return {bytes,mime,width:null,height:null};}
if(!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(mime))throw new Error('Unsupported image type');if(mime==='image/svg+xml'){if(purpose==='photo')throw new Error('SVG customer photos are not supported');const svg=bytes.toString('utf8');if(!/<svg[\s>]/i.test(svg)||/<\s*(script|foreignObject|iframe|object|embed|audio|video)|<!DOCTYPE|<!ENTITY|\bon\w+\s*=|javascript\s*:|@import|(?:href|src)\s*=\s*["'](?!#)|url\(\s*["']?(?!#)/i.test(svg))throw new Error('SVG contains active or external content');}
const image=sharp(bytes,{limitInputPixels:24000000,failOn:'error'});const meta=await image.metadata();if(!meta.width||!meta.height||meta.width>8000||meta.height>8000||meta.pages&&meta.pages>1)throw new Error('Image dimensions or animation are not supported');if(mime!=='image/svg+xml'&&({png:'image/png',jpeg:'image/jpeg',webp:'image/webp'} as Record<string,string>)[meta.format||'']!==mime)throw new Error('File bytes do not match declared type');const output=await image.rotate().png().toBuffer({resolveWithObject:true});if(output.data.length>maxImageBytes*2)throw new Error('Decoded image too large');return {bytes:output.data,mime:'image/png',width:output.info.width,height:output.info.height};}

/** Bound every ISO BMFF box before accepting media. Header-only and truncated uploads fail closed. */
export function validateMp4(bytes:Buffer) {
  const types=new Set<string>();let offset=0;
  while(offset<bytes.length){
    if(bytes.length-offset<8)throw new Error('Truncated MP4 box');
    let size=bytes.readUInt32BE(offset);const type=bytes.toString('ascii',offset+4,offset+8);let header=8;
    if(size===1){if(bytes.length-offset<16)throw new Error('Truncated MP4 box');const large=bytes.readBigUInt64BE(offset+8);if(large>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Invalid MP4 size');size=Number(large);header=16;}
    else if(size===0)size=bytes.length-offset;
    if(size<header||offset+size>bytes.length)throw new Error('Invalid MP4 box bounds');
    if(offset===0&&(type!=='ftyp'||size<16))throw new Error('MP4 file type missing');
    if(type==='moov'||type==='mdat'){if(size<=header)throw new Error('Empty MP4 media');}
    types.add(type);offset+=size;
  }
  if(!['ftyp','moov','mdat'].every(type=>types.has(type)))throw new Error('Complete MP4 metadata and media required');
}
