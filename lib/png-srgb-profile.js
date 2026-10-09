import sharp from 'sharp';

const signature=Buffer.from([137,80,78,71,13,10,26,10]);
let profileChunk;
function chunks(png){
  if(!Buffer.isBuffer(png)||!png.subarray(0,8).equals(signature))throw Error('Expected internal PNG');
  const out=[];
  for(let offset=8;offset<png.length;){
    if(offset+12>png.length)throw Error('Incomplete PNG chunk');
    const end=offset+12+png.readUInt32BE(offset);
    if(end>png.length)throw Error('Incomplete PNG chunk');
    out.push({type:png.toString('ascii',offset+4,offset+8),offset,end});offset=end;
  }
  return out;
}
async function approvedProfile(){
  if(!profileChunk){
    // Ask the same installed Sharp build for the same profile as before,
    // once on a tiny image, instead of transforming every full map pixel.
    profileChunk=sharp({create:{width:1,height:1,channels:3,background:'#000000'}})
      .withIccProfile('srgb').png().toBuffer().then(png=>{
        const profiles=chunks(png).filter(c=>c.type==='iCCP');
        if(profiles.length!==1)throw Error('Expected one sRGB profile');
        const c=profiles[0];return Buffer.from(png.subarray(c.offset,c.end));
      }).catch(error=>{profileChunk=undefined;throw error;});
  }
  return profileChunk;
}

// Internal renderer only: its composed 8-bit RGB(A) samples are already sRGB.
// This is not a colour converter and must not be used for arbitrary uploads.
// Preserve the original iCCP bytes and CRC before pHYs/IDAT (PNG specification).
export async function tagRenderedMapSRGB(png){
  const parts=chunks(png);
  if(parts[0]?.type!=='IHDR'||parts[0].end!==33||png[24]!==8||![2,6].includes(png[25])||
    parts.at(-1)?.type!=='IEND'||!parts.some(c=>c.type==='IDAT')||
    parts.some(c=>['iCCP','sRGB','cICP','gAMA','cHRM'].includes(c.type)))throw Error('Unexpected internal map PNG layout');
  return Buffer.concat([png.subarray(0,33),await approvedProfile(),png.subarray(33)]);
}
