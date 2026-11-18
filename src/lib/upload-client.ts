export async function uploadAsset(file: File, purpose: string, progress?: (percent: number) => void) {
  const limit = (purpose === 'video' ? 50 : 10) * 1024 * 1024;
  if (!file.size || file.size > limit) throw new Error(`Maximum upload is ${limit / 1024 / 1024} MB`);
  progress?.(0);
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  const sha256 = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const init = await fetch('/api/assets', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({purpose,mime:file.type,size:file.size,sha256})});
  const data = await init.json();
  if (!init.ok) throw new Error(data.error || 'Unable to start upload');
  if (!data.ready) {
    await new Promise<void>((resolve,reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', data.url || `/api/assets/${data.id}/upload`);
      xhr.setRequestHeader('Content-Type',file.type);
      xhr.timeout = 10 * 60_000;
      xhr.upload.onprogress = e => {if(e.lengthComputable)progress?.(Math.min(95, Math.round(e.loaded/e.total*95)));};
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed; check storage CORS and retry.'));
      xhr.onerror = () => reject(new Error('Network upload failed. Retry.'));
      xhr.ontimeout = () => reject(new Error('Upload timed out. Retry.'));
      xhr.onabort = () => reject(new Error('Upload cancelled.'));
      xhr.send(file);
    });
    const complete = await fetch(`/api/assets/${data.id}/complete`,{method:'POST'});
    const result = await complete.json();
    if (!complete.ok) throw new Error(result.error || 'Upload validation failed');
  }
  progress?.(100);
  return {id:data.id as string,url:`/api/assets/${data.id}`};
}
