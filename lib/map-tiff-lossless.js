// Explicit native-decoder experiment; ordinary PNG requests never enter here.
// Keep the approved PNG's full dimensions, 8-bit RGBA samples and ICC bytes.
// Classic single-page strip-based TIFF, lossless LZW, unassociated alpha.
// This does not imply lower native memory use or proven Widgy stability.
import sharp from 'sharp';

export const TIFF_LOSSLESS_FORMAT = 'tiff-lossless-v1';

export async function encodeMapLosslessTIFF(png) {
  return sharp(png)
    .keepIccProfile()
    .tiff({compression: 'lzw', predictor: 'horizontal',
      pyramid: false, tile: false, bigtiff: false})
    .toBuffer();
}
