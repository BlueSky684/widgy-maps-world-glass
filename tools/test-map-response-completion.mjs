import assert from 'node:assert/strict';
import {EventEmitter,once} from 'node:events';
import http from 'node:http';
import {observeMapResponseCompletion} from '../lib/map-response-completion.js';

// Real Node HTTP response events, not just a simulated finish notification.
const reports=[],body=Buffer.from('synthetic response body');
let closeObserved;
const closed=new Promise(resolve=>{closeObserved=resolve;});
const server=http.createServer((req,res)=>{
  observeMapResponseCompletion(res,(phase,details)=>{
    reports.push({test:req.url,phase,...details});
    if(req.url==='/abort')closeObserved();
  });
  res.setHeader('Content-Type','application/octet-stream');
  if(req.url==='/abort')res.write(body); // Client disconnects before res.end().
  else if(req.url==='/304'){res.statusCode=304;res.end();}
  else if(req.method==='HEAD'){res.statusCode=200;res.end();}
  else res.end(body);
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const port=server.address().port;
async function request(path,method='GET'){
 return new Promise((resolve,reject)=>{
  const request=http.request({host:'127.0.0.1',port,path,method},res=>{
   const chunks=[];
   res.on('data',b=>chunks.push(b));res.on('error',reject);
   res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(chunks)}));
  });request.on('error',reject);request.end();
 });
}
try{
 assert((await request('/full')).body.equals(body));
 assert.equal((await request('/304')).body.length,0);
 assert.equal((await request('/head','HEAD')).body.length,0);
 await new Promise((resolve,reject)=>{
  const request=http.get({host:'127.0.0.1',port,path:'/abort'},res=>{
   res.once('data',()=>{res.destroy();resolve();});res.on('error',reject);
  });request.on('error',reject);
 });
 await closed;
 for(const path of ['/full','/304','/head']){
  const entries=reports.filter(r=>r.test===path);assert.equal(entries.length,1);
  assert.equal(entries[0].phase,'finished');assert.equal(entries[0].headersSent,true);
  assert.equal(entries[0].writableEnded,true);assert.equal(entries[0].writableFinished,true);
 }
 const early=reports.filter(r=>r.test==='/abort');assert.equal(early.length,1);
 assert.equal(early[0].phase,'closed_early');assert.equal(early[0].headersSent,true);
 assert.equal(early[0].writableEnded,false);assert.equal(early[0].writableFinished,false);
 const logs=[];
 const res=Object.assign(new EventEmitter(),{statusCode:200,headersSent:false,writableEnded:false,writableFinished:false,
   body:'PRIVATE_BODY',headers:{secret:'PRIVATE_SECRET'}});
 observeMapResponseCompletion(res,(phase,details)=>logs.push({phase,...details}));
 res.emit('close');res.emit('finish');assert.equal(logs.length,1);
 assert.equal(logs[0].phase,'closed_early');assert.equal(logs[0].headersSent,false);
 assert(!JSON.stringify(logs).includes('PRIVATE'));
 const flushed=Object.assign(new EventEmitter(),{writableFinished:true});
 observeMapResponseCompletion(flushed,(phase,details)=>logs.push({phase,...details}));
 flushed.emit('close');assert.equal(logs[1].phase,'closed_after_flush');assert.equal(logs[1].status,null);
 assert.doesNotThrow(()=>observeMapResponseCompletion({},()=>{throw Error('unsupported response');}));
 const brokenLogger=new EventEmitter();observeMapResponseCompletion(brokenLogger,()=>{throw Error('logger unavailable');});
 assert.doesNotThrow(()=>brokenLogger.emit('finish'));
 console.log(JSON.stringify({pass:true,realHTTP:['complete GET','HEAD','304','client disconnect'],normalCloseNotMisclassified:true,
   earlyCloseBeforeHeaders:true,singleTerminalRecord:true,noRequestOrImageContentLogged:true,phoneDeliveryNotEstablished:true}));
}finally{
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
