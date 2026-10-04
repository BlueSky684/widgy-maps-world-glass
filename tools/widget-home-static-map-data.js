// Public fixed-time fixture only. Copy the exact full-resolution PNG bytes;
// never fetch device GPS, a private export, or a live personalized map here.
const MAP_SHA256='c4ccdacd84dec137bd46c6061a4f5b69ed4d210e5cec0bc5e2d08865ffc17df9';
export async function loadHomeStaticMapDataURL(fetcher=fetch){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),30000);
  try{
    const response=await fetcher(new URL('../assets/diagnostics/Home_Map_Static_3306x1558.png',import.meta.url),{
      credentials:'omit',cache:'force-cache',signal:controller.signal
    });
    if(!response.ok)throw Error('static_map_image_failed');
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.length!==4075465)throw Error('static_map_image_failed');
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
    if(hash!==MAP_SHA256)throw Error('static_map_image_failed');
    let binary='';
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return 'data:image/png;base64,'+btoa(binary);
  }catch{
    throw Error('static_map_image_failed');
  }finally{
    clearTimeout(timeout);
  }
}
