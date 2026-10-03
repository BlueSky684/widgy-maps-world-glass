import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {ENGRAVING_R6} from './engraved-coasts.js';

const asset=name=>new URL(`../assets/earth/${name}`,import.meta.url);
export const PRECOMPUTED_PATH=asset('render-cache-r6.bin.gz');
const PIXELS=3306*1558;
export function precomputedKey(){
  const contract=JSON.parse(readFileSync(asset('Widget_Asset_Contract.json'),'utf8'));
  return createHash('sha256').update(JSON.stringify(['r6-raw-v1',
    contract.assets['Terrain_Master_3306x1558.png'].sha256,
    contract.assets['Night_Lights_Master_3306x1558.png'].sha256,ENGRAVING_R6])).digest();
}
let loaded,attempted=false;
export function precomputedMap(){
  if(attempted)return loaded;
  attempted=true;
  try{
    const bytes=gunzipSync(readFileSync(PRECOMPUTED_PATH),{maxOutputLength:32+PIXELS*12});
    if(bytes.length!==32+PIXELS*12 || !bytes.subarray(0,32).equals(precomputedKey()))return null;
    let at=32;
    const take=count=>{const result=bytes.subarray(at,at+count);at+=count;return result;};
    loaded={textures:{terrain:take(PIXELS*4),lights:take(PIXELS*4)},
      engraving:{ocean:take(PIXELS),rgb:take(PIXELS*3)}};
    return loaded;
  }catch{return null;} // A missing build artifact keeps the approved fallback.
}
export const precomputedState=()=>loaded?'HIT':'FALLBACK';
