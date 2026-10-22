"""Build an owner archive, retaining private config only from their prior ZIP."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("previous", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
with zipfile.ZipFile(args.previous) as old:
    private = old.read("private-config.json")
config = json.loads(private)
assert isinstance(config.get("mapAccessKey"), str) and len(config["mapAccessKey"]) >= 16
key = config["mapAccessKey"].encode()
files = sorted(p for p in args.source.iterdir() if p.is_file() and
               p.suffix in (".ts", ".tsx", ".json", ".md", ".txt") and
               not p.name.startswith("private-config"))
metadata = json.loads((args.source / "script.json").read_text())
assert metadata["name"] == "Map Cache Test" and metadata["runInApp"] is False
payload = {p.name: p.read_bytes() for p in files}
assert all(key not in data for data in payload.values()), "Credential in public source"
assert {"index.tsx", "intent.tsx", "menu.tsx", "native-transfer.ts", "setup.ts"} <= payload.keys()
payload["private-config.json"] = private
args.output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(args.output, "w", zipfile.ZIP_DEFLATED) as archive:
    for name, data in payload.items():
        entry = zipfile.ZipInfo(name, (2026, 10, 22, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o600 << 16
        archive.writestr(entry, data)
with zipfile.ZipFile(args.output) as archive:
    assert archive.testzip() is None
    assert set(archive.namelist()) == set(payload)
    assert all(archive.read(name) == data for name, data in payload.items())
print(json.dumps({"version": metadata["version"], "entries": len(payload),
                  "bytes": args.output.stat().st_size,
                  "sha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
                  "privateConfigPreserved": True}))
