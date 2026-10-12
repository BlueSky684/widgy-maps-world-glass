// Isolated opt-in test sharing an existing diagnostic function slot.
import config from './map-stability-config.json' with {type:'json'};
import {createStabilityStore} from './map-stability-store.js';
import {createStabilityHandler} from './map-stability-handler.js';
export default createStabilityHandler({config,store:createStabilityStore()});
