import {createHash} from 'node:crypto';
import {MASK_LIVE,renderMaskPair} from '../lib/map-mask-live.js';
import {MASK_ALPHA,renderAlphaMaskPair} from '../lib/map-mask-alpha.js';

// Public solar data only. No terrain, GPS, geocoder, account or IP dependency.
// A given revision/epoch has deterministic bytes, including its bitmap stamp.
const revisions=new Map([
  [MASK_LIVE.revision,{render:renderMaskPair,cache:new Map()}],
  [MASK_ALPHA.revision,{render:renderAlphaMaskPair,cache:new Map()}]
]);
const allowed=new Set(['rev','part','t']);
function pair(epoch,revision){
  const {render,cache}=revisions.get(revision);
  if(cache.has(epoch))return {state:'HIT',pending:cache.get(epoch)};
  const pending=render(epoch).then(images=>Object.fromEntries(Object.entries(images).map(([part,png])=>
    [part,{png,etag:'"'+createHash('sha256').update(png).digest('hex')+'"'}])));
  cache.set(epoch,pending);
  while(cache.size>8)cache.delete(cache.keys().next().value);
  pending.catch(()=>{if(cache.get(epoch)===pending)cache.delete(epoch);});
  return {state:'MISS',pending};
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method&&!['GET','HEAD'].includes(req.method)){
    res.setHeader('Allow','GET, HEAD');return res.status(405).end();
  }
  const url=new URL(req.url,'https://mask.invalid'),q=url.searchParams,raw=q.get('t'),epoch=Number(raw),part=q.get('part'),revision=q.get('rev');
  if(q.size!==3||[...q.keys()].some(k=>!allowed.has(k))||!revisions.has(revision)||
    !['day','night'].includes(part)||!/^\d{13}$/.test(raw||'')||!Number.isSafeInteger(epoch)||
    epoch%MASK_LIVE.bucketMS!==0||epoch<Date.UTC(2020,0,1)||epoch>=Date.UTC(2100,0,1))
    return res.status(400).json({error:'Expected rev=live-1|alpha-1, part=day|night and a five-minute epoch t (2020–2099)'});
  try{
    const started=performance.now(),result=pair(epoch,revision),entry=(await result.pending)[part];
    const policy='public, max-age=86400, immutable';
    res.setHeader('Cache-Control',policy);
    res.setHeader('CDN-Cache-Control',policy);
    res.setHeader('Vercel-CDN-Cache-Control',policy);
    res.setHeader('Content-Type','image/png');res.setHeader('ETag',entry.etag);
    res.setHeader('X-Mask-Time',new Date(epoch).toISOString());
    res.setHeader('X-Mask-Part',part);res.setHeader('X-Mask-Revision',revision);
    res.setHeader('X-Mask-Cache',result.state);
    res.setHeader('Server-Timing',`mask;dur=${(performance.now()-started).toFixed(1)}`);
    const tags=String(req.headers?.['if-none-match']||'').split(',').map(v=>v.trim().replace(/^W\//,''));
    if(tags.includes(entry.etag)||tags.includes('*'))return res.status(304).end();
    return req.method==='HEAD'?res.status(200).end():res.status(200).send(entry.png);
  }catch(error){
    console.error('Solar mask render failed:',error.message);
    return res.status(500).json({error:'Solar mask unavailable'});
  }
}
