// Preserve full approved pixels; use stronger lossless PNG compression only
// when needed to stay below the function response-body budget.
export async function renderWidgyLiveMap(options){
 const {renderHomeMap}=await import('./home-map-day-night.js');
 let png=await renderHomeMap(options);
 if(png.length>4400000){
  const sharp=(await import('sharp')).default;
  png=await sharp(png).keepMetadata().png({compressionLevel:9,palette:false,adaptiveFiltering:true}).toBuffer();
 }
 if(png.length>4500000)throw Error('Lossless map exceeds response budget');
 return png;
}
