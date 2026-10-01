// Measured from the approved 1224 x 1285 reference. Exclude its outer wallpaper.
// Widgy's 1600 x 1600 editor stretches to the device's 1134 x 1182 large widget.
export const REFERENCE = {x:45, y:47, width:1135, height:1184};
export const COLORS = {lime:'#c5ff0a', bar:'#c8ff32', white:'#f4f7fa', muted:'#aeb7c6', card:'#091116', rim:'#35434e'};
export const HERO = {x:22, y:154, width:1090, height:540, radius:30};
export const DAY_BAR = {x:214,y:759,width:707,height:8};
export const STEPS_RING = {x:603,y:849,width:142,height:142,radius:63,stroke:16,goal:10000};
export const BOXES = {
  6110:[54,390,480,145],
  6191:[57,529,42,42],
  6112:[55,591,200,46],6113:[55,628,140,58],6114:[210,628,320,58],
  6121:[109,716,100,50],6122:[460,713,151,52],6123:[626,716,76,48],80205:[626,716,76,48],6124:[941,716,98,50],
  6131:[223,847,123,106],6132:[223,927,133,70],6133:[451,856,93,64],6134:[451,922,93,64],
  6193:[645,881,58,79],6141:[774,844,160,108],6142:[774,932,160,65],6143:[974,856,132,66],6144:[974,922,132,66],
  5012:[66,1080,57,57],5013:[149,1088,95,44],5015:[328,1083,46,50],5016:[398,1088,144,44],
  5017:[604,1080,65,50],5018:[700,1088,140,44],6195:[903,1081,48,56],5020:[985,1088,128,44],
  5021:[24,1056,246,121],5022:[270,1056,293,121],5023:[563,1056,291,121],5024:[854,1056,257,121],
};

// Technical production asset: glass, rims and static ornaments only.
// All live text, weather artwork, time, progress and navigation remain native.
export function chromeSVG() {
  const {width:w,height:h}=REFERENCE;
  const horizon=(cx,cy)=>`<g transform="translate(${cx} ${cy})" fill="${COLORS.lime}" stroke="${COLORS.lime}" stroke-width="4" stroke-linecap="round">
    <path d="M-12 3 A12 12 0 0 1 12 3Z" stroke="none"/>
    <path d="M-27 12H27 M-23 1H-19 M23 1H19 M0-20V-14 M-15-15L-11-11 M15-15L11-11" fill="none"/>
  </g>`;
  const arrow=(cx,cy,dir)=>`<g transform="translate(${cx} ${cy}) scale(1 ${dir})" fill="none" stroke="${COLORS.white}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle r="21"/><path d="M0 10V-10M-8-2L0-10 8-2"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="glass" x2=".25" y2="1"><stop stop-color="#15212a"/><stop offset=".43" stop-color="#101b23"/><stop offset="1" stop-color="#080f14"/></linearGradient>
    <linearGradient id="rim" x2=".8" y2="1"><stop stop-color="#607788"/><stop offset=".28" stop-color="#3f4e5c"/><stop offset=".7" stop-color="#34424e"/><stop offset="1" stop-color="#5a6674"/></linearGradient>
    <linearGradient id="ring" x2="1" y2="1"><stop stop-color="#526371"/><stop offset="1" stop-color="#293640"/></linearGradient>
    <radialGradient id="bloom"><stop stop-color="${COLORS.lime}" stop-opacity=".15"/><stop offset="1" stop-color="${COLORS.lime}" stop-opacity="0"/></radialGradient>
    <mask id="window"><rect width="${w}" height="${h}" fill="white"/><rect x="22" y="154" width="1090" height="540" rx="30" fill="black"/></mask>
  </defs>
  <g mask="url(#window)"><rect width="${w}" height="${h}" fill="url(#glass)"/>
    <ellipse cx="93" cy="1110" rx="63" ry="64" fill="url(#bloom)"/>
    <rect x="3" y="3" width="1129" height="1178" rx="83" fill="none" stroke="url(#rim)" stroke-width="2.5"/>
    <rect x="5" y="5" width="1125" height="1174" rx="81" fill="none" stroke="#c0d8e7" stroke-opacity=".07" stroke-width="1"/>
    <rect x="23" y="808" width="535" height="221" rx="30" fill="${COLORS.card}" stroke="${COLORS.rim}" stroke-width="1.8"/>
    <rect x="577" y="808" width="535" height="221" rx="30" fill="${COLORS.card}" stroke="${COLORS.rim}" stroke-width="1.8"/>
    <g stroke="#44525e" stroke-width="1.5" opacity=".75"><path d="M31 793H1102M25 1049H1108M358 855V989M942 855V989M270 1077V1148M563 1077V1148M854 1077V1148"/></g>
    <rect x="214" y="759" width="707" height="8" rx="4" fill="#44535f"/>
    <circle cx="674" cy="920" r="63" fill="none" stroke="url(#ring)" stroke-width="16"/>
    ${horizon(64,749)}${horizon(1069,749)}${arrow(410,889,1)}${arrow(410,954,-1)}
  </g>
  <rect x="22" y="154" width="1090" height="540" rx="30" fill="none" stroke="#465763" stroke-width="2"/>
  <path d="M55 588H540" stroke="#566470" stroke-opacity=".55" stroke-width="1.4"/>
  </svg>`;
}
