#!/usr/bin/env bash
# Renders the Android launcher, notification and splash PNGs from
# assets/svgs/android/*.svg and assets/svgs/addy-icon.svg.
# Needs rsvg-convert (brew install librsvg).
set -euo pipefail
cd "$(dirname "$0")/.."

src=assets/svgs/android
out=assets/images

rsvg-convert -w 1024 -h 1024 "$src/foreground.svg" -o "$out/android-icon-foreground.png"
rsvg-convert -w 1024 -h 1024 "$src/background.svg" -o "$out/android-icon-background.png"
rsvg-convert -w 1024 -h 1024 "$src/monochrome.svg" -o "$out/android-icon-monochrome.png"
rsvg-convert -w 96 -h 96 "$src/notification.svg" -o "$out/android-notification-icon.png"
# Splash: the iOS icon, rounded corners and all. Android 12+ crops the splash
# icon to a circle 2/3 of its width; padding the 320-unit icon to a 604-unit
# canvas keeps its rounded corners just inside that circle.
sed 's/width="320" height="320" viewBox="0 0 320 320"/width="1024" height="1024" viewBox="-142 -142 604 604"/' \
  assets/svgs/addy-icon.svg | rsvg-convert -w 1024 -h 1024 -o "$out/android-splash-icon.png"
