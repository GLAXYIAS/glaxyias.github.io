#!/usr/bin/env bash
# Download the two self-hostable MSN builds into the repo (run by CI).
set -eu
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

get() { # base out rel
  mkdir -p "$(dirname "$2/$3")"
  curl -fsSL --retry 3 --max-time 300 -A "$UA" -e "https://www.msn.com/" -o "$2/$3" "$1/$3"
  echo "$(wc -c <"$2/$3") $3"
}

Z="https://playgama.cdn.msnfun.com/9pj26p2hgv4v/v2"
ZD="site-live/Games/zombie-derby-2"
for f in index.html manifest.json \
  "Build/ZombieDerby2_PlayGama_2025_12_03_decompression_fallback_ON_MUSIC_DECOMPRESS.loader.js" \
  "Build/ZombieDerby2_PlayGama_2025_12_03_decompression_fallback_ON_MUSIC_DECOMPRESS.wasm.unityweb" \
  "Build/ZombieDerby2_PlayGama_2025_12_03_decompression_fallback_ON_MUSIC_DECOMPRESS.data.unityweb" \
  "Build/ZombieDerby2_PlayGama_2025_12_03_decompression_fallback_ON_MUSIC_DECOMPRESS.framework.js.unityweb"; do
  get "$Z" "$ZD" "$f"
done

R="https://codelab.situscms.com/game/ragdollarchers"
RD="site-live/Games/ragdoll-archers"
for f in index.html style.css logo.jpeg spinner.png vs/gameloader-helper.js \
  Build/v111.loader.js \
  Build/6697b6deba8b617c67b69c55dcd07cb1.data.unityweb \
  Build/b3397c29f6878557c1c614cbf9e196ea.wasm.unityweb \
  Build/0be3c3ee7115b26e1ae28e643afdf1f2.js.unityweb; do
  get "$R" "$RD" "$f"
done

# Same ad-free Playgama bridge the other Playgama game uses.
cp site-live/Games/car-destruction-king/playgama-bridge.js "$ZD/playgama-bridge.js"
echo "mirror complete"
