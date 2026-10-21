const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module');
class SafeMapError extends Error {}
const source=stripTypeScriptTypes(fs.readFileSync(__dirname+'/../scheduler.ts','utf8'),{mode:'transform'})
  .replace(/^import .*\n/gm,'').replace(/\bexport /g,'');
function harness() {
  let requests=[], scheduled=[], removed=0, fail=false;
  const script={env:'index'};
  const notification={getAllPendingsOfCurrentScript:async()=>requests,
    removeAllPendingsOfCurrentScript:async()=>{removed++;requests=[]},
    schedule:async content=>{scheduled.push(content);requests=[{content}];if(fail)throw Error('uncertain registration')}};
  const context=vm.createContext({SafeMapError,api:n=>({Script:script,Notification:notification,
    TimeIntervalNotificationTrigger:class {constructor(v){Object.assign(this,v)}}})[n]});
  const recovery=stripTypeScriptTypes(fs.readFileSync(__dirname+'/../recovery.ts','utf8'),{mode:'transform'}).replace(/^import .*\n/gm,'').replace(/\bexport /g,'');
  context.isRecovery=vm.runInContext('(function(){'+recovery+';return isRecovery})()',context);
  vm.runInContext(source+'\nthis.result={startRecurring,stopRecurring,scheduleStatus,TICK_TITLE}',context);
  return {...context.result,script,get requests(){return requests},get scheduled(){return scheduled},get removed(){return removed},
    legacy(){requests=[{content:{title:context.result.TICK_TITLE,userInfo:{purpose:'world-glass-map-recurring',intervalMinutes:5}}}]},
    fail(){fail=true}};
}
(async()=>{
  const h=harness();assert.equal(h.removed,0);assert.equal(h.scheduled.length,0);
  h.legacy();assert.match(await h.scheduleStatus(),/תזמון קודם/);assert.equal(h.removed,0);
  await h.startRecurring(5);assert.equal(h.requests.length,1);
  assert.equal(h.scheduled[0].trigger.timeInterval,900);assert.equal(h.scheduled[0].trigger.repeats,true);
  assert.equal(h.scheduled[0].userInfo.intervalMinutes,15);assert.equal(h.scheduled[0].title,'World Glass Map Tick');
  console.log('PASS legacy 5-minute schedule is reported and replaced by one 15-minute tick');
  await h.startRecurring();assert.equal(h.requests.length,1);assert.equal(h.scheduled.at(-1).trigger.timeInterval,900);
  assert.match(await h.scheduleStatus(),/כל 15 דקות/);
  console.log('PASS repeated activation leaves exactly one 15-minute tick');
  await h.stopRecurring();assert.equal(h.requests.length,0);console.log('PASS stop cancels pending map ticks');
  h.fail();await assert.rejects(()=>h.startRecurring(),/בוטל/);assert.equal(h.requests.length,0);
  console.log('PASS uncertain registration is cleaned up');
  h.script.env='intent';const before=h.removed;await assert.rejects(()=>h.startRecurring(),/Scripting/);assert.equal(h.removed,before);
  console.log('PASS Shortcut environment cannot change scheduling');
  console.log('5 schedule checks passed; native notification delivery is not simulated.');
})().catch(e=>{console.error(e);process.exitCode=1});
