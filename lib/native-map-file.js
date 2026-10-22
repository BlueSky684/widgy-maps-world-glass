// Opt-in binary handoff for Shortcuts. The opaque token binds a downloaded PNG
// to one request without changing a single image pixel or logging coordinates.
export const TRANSFER_KEY = 'WorldGlassTransfer';
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export function nativeFileToken(url, authorized) {
  if (!url.searchParams.has('native_file') && !url.searchParams.has('transfer_id')) return null;
  const one = name => url.searchParams.getAll(name);
  const flag = one('native_file'), ids = one('transfer_id');
  if (!authorized || flag.length !== 1 || flag[0] !== '1' || ids.length !== 1 || !uuid.test(ids[0]) ||
      one('width').length !== 1 || one('width')[0] !== '2400' || url.searchParams.has('format')) {
    throw Error('invalid_native_file');
  }
  return ids[0].toLowerCase();
}
export function tagNativePNG(png, token) {
  if (!uuid.test(token) || png.length < 57 || png.toString('hex', 0, 8) !== '89504e470d0a1a0a' ||
      png.readUInt32BE(16) !== 2400 || png.readUInt32BE(20) !== 1131 ||
      png.toString('ascii', png.length - 8, png.length - 4) !== 'IEND') throw Error('invalid_native_png');
  const data = Buffer.from(TRANSFER_KEY + '\0' + token.toLowerCase(), 'ascii');
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length, 0); chunk.write('tEXt', 4, 'ascii'); data.copy(chunk, 8);
  let crc = 0xffffffff;
  for (const b of chunk.subarray(4, chunk.length - 4)) {
    crc ^= b;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, chunk.length - 4);
  return Buffer.concat([png.subarray(0, png.length - 12), chunk, png.subarray(png.length - 12)]);
}
