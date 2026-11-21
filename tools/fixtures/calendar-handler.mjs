import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {BridgeError,privateHeaders} from '../../lib/calendar-bridge/security.js';
import {icalEvents,monthWindow,renderDots} from '../../lib/calendar-bridge/dots.js';
import {calendarGrid} from '../../lib/calendar-bridge/calendar-grid.js';
import {monthProviderWindow,monthViewEntry} from '../../lib/calendar-bridge/month-provider-window.js';
import {yearProviderWindow,yearPreparedDaysFor,createYearRangeReader} from '../../lib/calendar-bridge/year-provider-window.js';
import {createResilientEvents} from '../../lib/calendar-bridge/resilient-events.js';
import {createProviderCache} from '../../lib/calendar-bridge/provider-cache.js';
import {createAnnualProviderCache} from '../../lib/calendar-bridge/annual-provider-cache.js';
import {preparedDaysFor} from '../../lib/calendar-bridge/prepared-days.js';
import {widgetSnapshot} from '../../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../../lib/calendar-bridge/widgy-fields.js';
import {homeAgenda,homeAgendaFields} from '../../lib/calendar-bridge/home-agenda.js';

const currentSource=readFileSync(new URL('../../api/calendar-widget.js',import.meta.url),'utf8');

// Use the real calendar readers and caches with an isolated clock, provider and store.
export function calendarHandler({now,remote,background,readEvents,unseal,renderDots,info=()=>{}},source=currentSource) {
  class Clock extends Date {
    constructor(...args){super(...(args.length?args:[now()]));}
    static now(){return now();}
  }
  const cacheOptions={now,remote,background};
  const code=source.replace(/^import .*;\n/gm,'')
    .replace('export default async function handler','async function handler')
    .replace('export function clientMaxAge','function clientMaxAge');
  return vm.runInNewContext(code+'\nhandler',{
    Date:Clock,URL,performance,createHash,BridgeError,privateHeaders,console:{info},
    origin:()=> 'https://example.invalid',monthWindow,calendarGrid,monthProviderWindow,monthViewEntry,
    yearProviderWindow,yearPreparedDaysFor,readYearRange:createYearRangeReader({now}),
    cachedEvents:createProviderCache(cacheOptions),cachedAnnualEvents:createAnnualProviderCache(cacheOptions),
    resilientEvents:createResilientEvents({...cacheOptions,read:readEvents}),
    preparedDaysFor,widgetSnapshot,widgyFields,homeAgenda,homeAgendaFields,
    unseal,readEvents,renderDots
  });
}

// Independent month-only render for comparison with the handler's shared annual data.
export function referenceMonthPng(ics,offset,now,color) {
  const window=monthWindow({offset,zone:'Asia/Jerusalem',now:new Date(now)});
  const source={provider:'icloud',id:'fixture',color};
  return renderDots(icalEvents([{data:ics}],source,window),window,{bounds:'grid'});
}
