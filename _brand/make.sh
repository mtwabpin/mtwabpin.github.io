#!/usr/bin/env bash
# Draws MTWABP In's art again (make.mjs), then the pictures made from it:
# the home-screen icons, the favicon and the share picture. Needs node,
# google-chrome and ImageMagick's magick.
#
#   _brand/make.sh
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
node make.mjs
img=../images
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Chrome photographs a page; ImageMagick keeps the sizes exact.
shoot() {
  google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=3000 --window-size="$2" --screenshot="$3" "file://$PWD/$1" >/dev/null 2>&1
}
cat > "$tmp/icon.html" <<EOF
<!doctype html><html><body style="margin:0;background:transparent"><img src="file://$PWD/$img/mtwabp-icon.svg" width="512" height="512"></body></html>
EOF
cat > "$tmp/leaf.html" <<EOF
<!doctype html><html><body style="margin:0;background:transparent"><img src="file://$PWD/$img/favicon.svg" width="512" height="512"></body></html>
EOF
google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000 \
  --window-size=512,512 --screenshot="$tmp/icon.png" "file://$tmp/icon.html" >/dev/null 2>&1
google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000 \
  --window-size=512,512 --screenshot="$tmp/leaf.png" "file://$tmp/leaf.html" >/dev/null 2>&1
magick "$tmp/icon.png" -resize 512x512 "$img/mtwabp-512.png"
magick "$tmp/icon.png" -resize 192x192 "$img/mtwabp-192.png"
magick "$tmp/icon.png" -resize 180x180 "$img/mtwabp-180.png"
magick "$tmp/leaf.png" -resize 32x32 "$img/favicon-32.png"
shoot share.html 1200,630 "$tmp/share.png"
magick "$tmp/share.png" -strip -quality 88 "$img/mtwabp-share.jpg"
echo "make.sh: wrote the icons, the favicon and images/mtwabp-share.jpg"
