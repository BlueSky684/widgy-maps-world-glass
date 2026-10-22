"""Three credential-free Preview downloads, synthetic coordinates only.

This tests the public renderer/transport, NOT the authenticated native attachment
route or the iPhone network. It never reads an archive, key, env secret or GPS.
"""
import json, struct, time, zlib
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.parse import urlencode

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

origin = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app'
opener = build_opener(NoRedirect)
for sample in range(3):
    query = dict(lat='51.5', lon='-0.1', width='2400', city='SYNTHETIC TEST',
                 at='2026-10-22T08:50:00Z', presentation='glass', atlas='r6')
    started = time.perf_counter()
    try:
        request = Request(origin + '/api/night-map?' + urlencode(query))
        with opener.open(request, timeout=15) as response:
            headers_at = time.perf_counter()
            body = response.read(6*1024*1024+1)
            ended = time.perf_counter()
            assert response.status == 200 and 57 <= len(body) <= 6*1024*1024
            assert body[:8] == b'\x89PNG\r\n\x1a\n'
            assert struct.unpack_from('>II', body, 16) == (2400,1131)
            offset = 8
            while offset < len(body):
                size = struct.unpack_from('>I', body, offset)[0]
                stop = offset + 12 + size
                assert stop <= len(body)
                kind = body[offset+4:offset+8]
                data = body[offset+8:stop-4]
                assert zlib.crc32(kind+data) & 0xffffffff == struct.unpack_from('>I',body,stop-4)[0]
                offset = stop
            assert body[-8:-4] == b'IEND'
            declared = response.headers.get('Content-Length')
            if declared is not None: assert int(declared) == len(body)
            print(json.dumps(dict(sample=sample+1,status=200,bytes=len(body),pngCRCValid=True,
                dimensions='2400x1131',authenticatedNativeRoute=False,
                headersMs=round((headers_at-started)*1000),bodyMs=round((ended-headers_at)*1000),
                totalMs=round((ended-started)*1000),
                contentType=response.headers.get('Content-Type'),
                cacheControl=response.headers.get('Cache-Control'))), flush=True)
    except Exception as error:
        print(json.dumps(dict(sample=sample+1,failed=True,errorType=type(error).__name__,
                              elapsedMs=round((time.perf_counter()-started)*1000))), flush=True)
        raise SystemExit(1)
