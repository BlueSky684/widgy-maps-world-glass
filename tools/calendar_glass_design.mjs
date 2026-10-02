// Calendar R2, approved 2026-10-02. Coordinates use the Home R12 reference.
export const CANVAS = {width:1135,height:1184};
export const AGENDA = {x:644,y:248,width:466,height:779,rowTop:403,rowStep:149};
export const MONTH = {x:24,y:248,width:602,height:779,grid:[48,423,554,560]};
export const PALETTE = {white:'#f4f7fa',muted:'#aeb7c6',lime:'#c5ff0a',panel:'#091218',rim:'#33454f',week:'#1d2a32',blue:'#46a8ef',purple:'#b67ade',amber:'#eab14b',green:'#9acf68'};
export function calendarChromeSVG() {
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1135" height="1184" viewBox="0 0 1135 1184">
 <defs><linearGradient id="glass" x2=".25" y2="1"><stop stop-color="#15212a"/><stop offset=".43" stop-color="#101b23"/><stop offset="1" stop-color="#080f14"/></linearGradient><linearGradient id="rim" x2=".8" y2="1"><stop stop-color="#607788"/><stop offset=".28" stop-color="#3f4e5c"/><stop offset=".7" stop-color="#34424e"/><stop offset="1" stop-color="#5a6674"/></linearGradient></defs>
 <rect width="1135" height="1184" fill="url(#glass)"/>
 <rect x="3" y="3" width="1129" height="1178" rx="83" fill="none" stroke="url(#rim)" stroke-width="2.5"/>
 <rect x="5" y="5" width="1125" height="1174" rx="81" fill="none" stroke="#c0d8e7" stroke-opacity=".07"/>
 <rect x="24" y="154" width="1086" height="75" rx="29" fill="#0b151c" stroke="#425864" stroke-width="1.8"/>
 <g fill="#091218" stroke="#33454f" stroke-width="1.6"><rect x="24" y="248" width="602" height="779" rx="30"/><rect x="644" y="248" width="466" height="779" rx="30"/></g>
 <path d="M48 423H602" stroke="#26363f" stroke-width=".8"/>
 <path d="M668 363H1085" stroke="#33454f" stroke-width="1"/>
 <path d="M25 1049H1108M270 1077V1148M563 1077V1148M854 1077V1148" stroke="#44525e" stroke-opacity=".75" stroke-width="1.5"/>
 </svg>`;
}
