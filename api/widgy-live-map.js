import {createLiveMapHandler} from '../lib/widgy-live-map.js';
// Keep the small metadata response independent of texture decoding and solar
// rendering. PNG work occurs only for a requested image that is not cached.
export default createLiveMapHandler({render:async options=>{
 const {renderWidgyLiveMap}=await import('../lib/render-widgy-live-map.js');
 return renderWidgyLiveMap(options);
}});
