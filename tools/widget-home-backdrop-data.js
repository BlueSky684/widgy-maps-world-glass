// Public, immutable image only. Private calendar exports stay in the browser.
// No image resizing/re-encoding: verify the approved PNG, then encode its bytes.
const BACKDROP_SHA256='5c9b260d11c401d1800a69a9ef75fbcb60536c58ccf03aa6b967c1171c169ca5';
export async function loadHomeBackdropDataURL(fetcher=fetch){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetcher(new URL('../assets/home-glass/Home_Glass_Chrome_C8.png',import.meta.url),{
      credentials:'omit',cache:'force-cache',signal:controller.signal
    });
    if(!response.ok)throw Error('backdrop_image_failed');
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.length!==61975)throw Error('backdrop_image_failed');
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
    if(hash!==BACKDROP_SHA256)throw Error('backdrop_image_failed');
    let binary='';
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return 'data:image/png;base64,'+btoa(binary);
  }catch{
    throw Error('backdrop_image_failed');
  }finally{
    clearTimeout(timeout);
  }
}
