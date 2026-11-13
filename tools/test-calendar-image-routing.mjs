import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/calendar-widget.js';

function response(){return {headers:{},code:200,setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(body){this.body=body;return this;},end(body){this.body=body;return this;}};}

test('existing dots refresh links retain the calendar authorization boundary',async()=>{
  for(const render of ['refresh-1','other-cache-key']){
    const res=response();
    await handler({method:'GET',url:'/api/calendar-widget?view=dots&bounds=grid&render='+render+'&token=invalid-local-test'},res);
    assert.equal(res.code,401);
    assert.equal(res.body.error,'unauthorized');
    assert.equal(res.headers['X-Calendar-Revision'],'flight-auto-v1');
    assert.equal(res.headers['X-Home-Time-Revision'],undefined);
  }
});

test('home time images still validate image inputs and calendar authorization',async()=>{
  const invalid=response();
  await handler({method:'GET',url:'/api/calendar-widget?context=home-v1&render=home-time-v1&row=5&token=invalid-local-test'},invalid);
  assert.equal(invalid.code,400);
  assert.equal(invalid.body.error,'invalid_time_request');
  const unauthenticated=response();
  await handler({method:'GET',url:'/api/calendar-widget?context=home-v1&render=home-time-v1&row=1&token=invalid-local-test'},unauthenticated);
  assert.equal(unauthenticated.code,401);
  assert.equal(unauthenticated.headers['X-Home-Time-Revision'],'image-v1');
});
