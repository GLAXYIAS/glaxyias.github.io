#!/usr/bin/env python3
"""Build self-hosted Undead Corridor data files for every game mode."""

from __future__ import annotations

import argparse
import gzip
from pathlib import Path
import struct
import tempfile
import zlib

import UnityPy

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = REPO_ROOT / "Games/undead-corridor/Build/undead-corridor-v26041701.data.unityweb"
HEADER = b"UnityWebData1.0\x00"
LOCK_OVERLAYS = {"Game Locked Overlay", "Game Locked Label", "Loading Ad Overlay"}

# Every mode boots directly into its own settings scene, so the player gets a
# real loadout/settings screen and Start leads into the playable scene. The
# setup scenes' SettingsStartGame controller is disabled because its Start()
# waits on menu-only globals and otherwise leaves the scene stuck on black.
# Scene numbers come from the build's BuildSettings.scenes:
# 3 SceneModeTraining, 2 SceneSettingsCleanup, 4 SceneSettingsRooms,
# 5 SceneSettingsDefense, 6 SceneSettingsHospital, 7 SceneSettingsStreet,
# 8 SceneSettingsRescue, 9 SceneSettingsWaves.
MODES = {
    "training": ("level3", "Training", False),
    "cleanup": ("level2", "Cleanup", False),
    "rooms": ("level4", "Rooms", False),
    "defense": ("level5", "Defense", False),
    "hospital": ("level6", "Hospital", False),
    "street": ("level7", "Street", False),
    "rescue": ("level8", "Rescue", False),
    "waves": ("level9", "Waves", False),
}


def read_container(raw: bytes) -> list[list[str | bytes]]:
    if not raw.startswith(HEADER):
        raise SystemExit("not a UnityWebData container")
    header_size = struct.unpack_from("<i", raw, 16)[0]
    pos = 20
    entries: list[list[str | bytes]] = []
    while pos < header_size:
        offset, size, name_len = struct.unpack_from("<iii", raw, pos)
        pos += 12
        name = raw[pos : pos + name_len].decode("latin1")
        pos += name_len
        entries.append([name, raw[offset : offset + size]])
    return entries


def write_container(entries: list[list[str | bytes]]) -> bytes:
    header_size = 16 + 4 + sum(12 + len(str(name).encode("latin1")) for name, _ in entries)
    out = bytearray(HEADER)
    out += struct.pack("<i", header_size)
    offset = header_size
    for name, payload in entries:
        encoded = str(name).encode("latin1")
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


def hide_result(env: UnityPy.Environment, scene: str) -> None:
    for obj in env.objects:
        if obj.assets_file.name != scene or obj.type.name != "GameObject":
            continue
        try:
            game_object = obj.read()
            if game_object.m_Name == "Результат":
                game_object.m_IsActive = False
                obj.save_typetree(game_object)
        except Exception:
            pass


def disable_setup_controller(env: UnityPy.Environment, scene: str) -> None:
    """Stop a settings scene's menu-only controller from stalling startup."""
    scripts = {
        obj.path_id: obj.read().m_ClassName
        for obj in env.objects
        if obj.type.name == "MonoScript"
    }
    for obj in env.objects:
        if obj.assets_file.name != scene or obj.type.name != "MonoBehaviour":
            continue
        try:
            raw = bytearray(obj.get_raw_data())
            script_id = struct.unpack_from("<q", raw, 20)[0]
            if scripts.get(script_id) == "SettingsStartGame":
                raw[12] = 0  # m_Enabled
                obj.set_raw_data(bytes(raw))
        except Exception:
            pass


def extract_scene(raw_gzip: bytes, scene: str) -> bytes:
    """Return one scene serialized file from a UnityWebData build."""
    entries = read_container(gzip.decompress(raw_gzip))
    data_index = next(i for i, (name, _) in enumerate(entries) if str(name).endswith("data.unity3d"))
    with tempfile.TemporaryDirectory() as tmp:
        bundle_path = Path(tmp) / "data.unity3d"
        bundle_path.write_bytes(entries[data_index][1])
        env = UnityPy.load(str(bundle_path))
        if scene not in env.file.files:
            raise SystemExit(f"missing scene {scene!r} in bootstrap build")
        return env.file.files[scene].save()


def build_variant(raw_gzip: bytes, scene: str, boot: bool, bootstrap_scene: bytes) -> bytes:
    entries = read_container(gzip.decompress(raw_gzip))
    data_index = next(i for i, (name, _) in enumerate(entries) if str(name).endswith("data.unity3d"))
    with tempfile.TemporaryDirectory() as tmp:
        bundle_path = Path(tmp) / "data.unity3d"
        bundle_path.write_bytes(entries[data_index][1])
        env = UnityPy.load(str(bundle_path))
        bundle = env.file
        if scene not in bundle.files or "level0" not in bundle.files:
            raise SystemExit(f"missing scene {scene!r} in bundle")

        hide_result(env, scene)
        disable_setup_controller(env, scene)
        if boot:
            boot_path = Path(tmp) / "bootstrap-scene.bin"
            boot_path.write_bytes(bootstrap_scene)
            boot_env = UnityPy.load(str(boot_path))
            boot_file = boot_env.file
            for obj in boot_env.objects:
                if obj.type.name != "GameObject":
                    continue
                try:
                    game_object = obj.read()
                    if game_object.m_Name in LOCK_OVERLAYS:
                        game_object.m_IsActive = False
                        obj.save_typetree(game_object)
                except Exception:
                    pass
            boot_file.name = "level0"
            boot_file.flags = getattr(bundle.files["level1"], "flags", 4)
            bundle.files["level0"] = boot_file
            bundle.files["level1"] = bundle.files[scene]
        else:
            bundle.files["level0"] = bundle.files[scene]
        new_bundle = bundle.save(packer="original")

    entries[data_index][1] = new_bundle
    return gzip_with_original_header(raw_gzip, write_container(entries))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument(
        "--bootstrap-data",
        type=Path,
        required=True,
        help="original build containing the untouched SceneLoading scene",
    )
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument(
        "--only",
        choices=sorted(MODES),
        action="append",
        help="build only the selected mode(s); default is every mode",
    )
    args = parser.parse_args()

    raw = args.data.read_bytes()
    bootstrap_scene = extract_scene(args.bootstrap_data.read_bytes(), "level0")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    selected = args.only or list(MODES)
    for slug in selected:
        scene, label, boot = MODES[slug]
        output = args.out_dir / f"{slug}.data.unityweb"
        output.write_bytes(build_variant(raw, scene, boot, bootstrap_scene))
        print(f"{label:9} {scene:8} boot={boot!s:5} -> {output} ({output.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
