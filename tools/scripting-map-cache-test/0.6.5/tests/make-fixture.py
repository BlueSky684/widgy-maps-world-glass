from pathlib import Path
import random, struct, zlib
width, height = 2400, 1131
rng = random.Random(53)
raw = b"".join(b"\0" + rng.randbytes(width) for _ in range(height))
def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)
image = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
Path(__file__).with_name("test-fixture.png").write_bytes(image)
print("Generated synthetic grayscale PNG:", len(image), "bytes")
