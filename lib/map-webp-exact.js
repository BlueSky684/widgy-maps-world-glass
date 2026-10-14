// Isolated, opt-in transport encoding. The approved renderer keeps Sharp 0.34.5.
// This separate encoder provides WebP's exact transparent-RGB preservation.
import sharp from 'sharp-webp-exact';

export const WEBP_FORMAT = 'webp-exact-v1';

export async function encodeMapWebP(png) {
  return sharp(png)
    .keepIccProfile()
    .webp({lossless: true, exact: true, quality: 25, effort: 0})
    .toBuffer();
}
