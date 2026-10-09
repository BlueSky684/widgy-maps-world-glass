const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
  const root=process.cwd(),expected=JSON.parse(fs.readFileSync('../outputs/Widgy_Weather_Premium_3.json'));
  const key=JSON.parse(fs.readFileSync('../outputs/weather-premium-copy-key.json')).key;
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+'/'))return res.writeHead(403).end();
    fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/json');res.end(b);});
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=process.env.TEST_ORIGIN||`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],viewport:{width:430,height:932},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.name));
    await page.goto(base+'/tools/widgy-weather-premium-copy.html#key='+key);
    await page.waitForFunction(()=>!document.querySelector('#copy').disabled);
    assert.equal(await page.locator('#multiline').isChecked(),true);
    await page.locator('#copy').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('הועתק'));
    const copied=await page.evaluate(()=>navigator.clipboard.readText());
    assert.deepEqual(JSON.parse(copied),expected);assert(copied.split('\n').length>1000);
    await page.screenshot({path:'work/weather-copy-verified.png',fullPage:true});
    await page.locator('#multiline').uncheck();await page.locator('#copy').click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),fs.readFileSync('../outputs/Widgy_Weather_Premium_3.json','utf8'));
    await page.goto(base+'/tools/widgy-weather-premium-copy.html');assert.equal(await page.locator('#copy').isDisabled(),true);
    await page.goto(base+'/tools/widgy-weather-premium-copy.html#key='+'A'.repeat(43));
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('לא נטען'));assert.equal(await page.locator('#copy').isDisabled(),true);
    assert.equal(errors.length,0);
    const result={passed:true,live:Boolean(process.env.TEST_ORIGIN),fullJSONRoundTrip:true,multilineDefault:true,compactToggle:true,missingKeyBlocked:true,wrongKeyBlocked:true,clipboardBytes:Buffer.byteLength(copied),lines:copied.split('\n').length,browserErrors:errors};
    fs.writeFileSync('work/weather-copy-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(String(error.message).replace(/#key=[^\s"']+/g,'#key=[redacted]'));process.exit(1);});
