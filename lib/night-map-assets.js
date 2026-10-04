// Literal paths let deployment tracing include only the current map assets.
// Keep both source masters for the validated fallback when the generated cache
// is absent or invalid, and both fonts for city labels and coordinates.
export const NIGHT_MAP_ASSETS=Object.freeze({
  'Terrain_Master_3306x1558.png':new URL('../assets/earth/Terrain_Master_3306x1558.png',import.meta.url),
  'Night_Lights_Master_3306x1558.png':new URL('../assets/earth/Night_Lights_Master_3306x1558.png',import.meta.url),
  'Widget_Asset_Contract.json':new URL('../assets/earth/Widget_Asset_Contract.json',import.meta.url),
  'render-cache-r6.bin.gz':new URL('../assets/earth/render-cache-r6.bin.gz',import.meta.url),
  'BarlowCondensed-Regular.ttf':new URL('../assets/earth/BarlowCondensed-Regular.ttf',import.meta.url),
  'BarlowCondensed-Medium.ttf':new URL('../assets/earth/BarlowCondensed-Medium.ttf',import.meta.url),
});
export function nightMapAsset(name){
  if(!Object.hasOwn(NIGHT_MAP_ASSETS,name))throw Error('Unexpected night-map asset');
  return NIGHT_MAP_ASSETS[name];
}
