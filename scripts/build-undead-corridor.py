#!/usr/bin/env python3
"""Make the checked-in Undead Corridor WebGL data boot straight into training.

The original build starts on the AZ/CrazyGames SDK bootstrap scene, which locks
the game when it is served from any other host. The training scene already has
working controls. Put a copy of that scene at build index 0 and keep the real
training scene at its original index so its Start button resolves to the real
scene, not back to the bootstrap.
"""

from __future__ import annotations

import gzip
import os
from pathlib import Path
import struct
import tempfile
import zlib

import UnityPy

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = Path(
    os.environ.get(
        "UNDEAD_DATA_FILE",
        REPO_ROOT / "Games/undead-corridor/Build/undead-corridor-v26041701.data.unityweb",
    )
)
HEADER = b"UnityWebData1.0\x00"


def read_container(raw: bytes) -> list[tuple[str, bytes]]:
    if not raw.startswith(HEADER):
        raise SystemExit("not a UnityWebData container")
    header_size = struct.unpack_from("<i", raw, 16)[0]
    pos = 20
    entries: list[tuple[str, bytes]] = []
    while pos < header_size:
        offset, size, name_len = struct.unpack_from("<iii", raw, pos)
        pos += 12
        name = raw[pos : pos + name_len].decode("latin1")
        pos += name_len
        entries.append((name, raw[offset : offset + size]))
    return entries


def write_container(entries: list[tuple[str, bytes]]) -> bytes:
    header_size = 16 + 4 + sum(12 + len(name.encode("latin1")) for name, _ in entries)
    out = bytearray(HEADER)
    out += struct.pack("<i", header_size)
    offset = header_size
    for name, payload in entries:
        encoded = name.encode("latin1")
        out += struct.pack("<iii", offset, len(payload), len(encoded))
        out += encoded
        offset += len(payload)
    for _, payload in entries:
        out += payload
    return bytes(out)


def gzip_with_original_header(original: bytes, payload: bytes) -> bytes:
    flags = original[3]
    pos = 10
    if flags & 4:
        pos += 2 + struct.unpack_from("<H", original, pos)[0]
    if flags & 8:
        pos = original.index(b"\0", pos) + 1
    if flags & 16:
        pos = original.index(b"\0", pos) + 1
    if flags & 2:
        pos += 2

    compressor = zlib.compressobj(9, zlib.DEFLATED, -15)
    body = compressor.compress(payload) + compressor.flush()
    trailer = struct.pack("<II", zlib.crc32(payload) & 0xFFFFFFFF, len(payload) & 0xFFFFFFFF)
    return original[:pos] + body + trailer


def main() -> None:
    raw_gzip = DATA_FILE.read_bytes()
    entries = read_container(gzip.decompress(raw_gzip))

    data_name = next(name for name, _ in entries if name.endswith("data.unity3d"))
    data_index = next(i for i, (name, _) in enumerate(entries) if name == data_name)
    original_bundle = entries[data_index][1]

    with tempfile.TemporaryDirectory() as tmp:
        bundle_path = Path(tmp) / "data.unity3d"
        bundle_path.write_bytes(original_bundle)
        env = UnityPy.load(str(bundle_path))
        bundle = env.file

        if "level0" not in bundle.files or "level19" not in bundle.files:
            raise SystemExit("expected level0 and level19 in the Unity bundle")

        # Hide the training result overlay when the scene first opens.
        for obj in env.objects:
            if obj.assets_file.name == "level19" and obj.type.name == "GameObject":
                game_object = obj.read()
                if game_object.m_Name == "Результат":
                    game_object.m_IsActive = False
                    obj.save_typetree(game_object)

        # level0 becomes a copy of the training scene. level19 stays the real
        # training scene, so TrainingManager.sceneStart still resolves correctly.
        bundle.files["level0"] = bundle.files["level19"]
        new_bundle = bundle.save(packer="original")

    entries[data_index] = (data_name, new_bundle)
    new_gzip = gzip_with_original_header(raw_gzip, write_container(entries))

    if new_gzip == raw_gzip:
        print("data is unchanged")
        return

    DATA_FILE.write_bytes(new_gzip)
    print(f"wrote {DATA_FILE} ({len(new_gzip)} bytes)")


if __name__ == "__main__":
    main()
